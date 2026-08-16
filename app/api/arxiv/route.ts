import { NextRequest, NextResponse } from "next/server";

interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  published: string;
  updated: string;
  categories: string[];
  arxivUrl: string;
}

/*
 * ---------------------------------------------------------
 * SEARCH TERM PROCESSING
 * ---------------------------------------------------------
 */

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "using",
  "based",
  "into",
  "about",
  "through",
  "via",
  "study",
  "research",
  "paper",
  "papers",
  "work",
  "new",
  "novel",
  "an",
  "of",
  "in",
  "on",
  "to",
  "a",
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTerms(query: string): string[] {
  return normalizeText(query)
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/*
 * ---------------------------------------------------------
 * CONTROLLED SYNONYMS
 *
 * These are only used when the corresponding term is
 * actually present in the user's query.
 *
 * This prevents "disease" from turning into every disease.
 * ---------------------------------------------------------
 */

const SYNONYMS: Record<string, string[]> = {
  dog: ["dog", "dogs", "canine", "canines"],
  dogs: ["dog", "dogs", "canine", "canines"],
  canine: ["dog", "dogs", "canine", "canines"],
  canines: ["dog", "dogs", "canine", "canines"],

  cat: ["cat", "cats", "feline", "felines"],
  cats: ["cat", "cats", "feline", "felines"],
  feline: ["cat", "cats", "feline", "felines"],

  plant: ["plant", "plants", "crop", "crops", "botanical"],
  plants: ["plant", "plants", "crop", "crops", "botanical"],

  skin: ["skin", "cutaneous", "dermatological", "dermatology"],
  dermatology: ["skin", "cutaneous", "dermatological", "dermatology"],
  dermatological: ["skin", "cutaneous", "dermatological", "dermatology"],

  disease: ["disease", "diseases"],
  diseases: ["disease", "diseases"],

  diagnosis: ["diagnosis", "diagnostic", "diagnosing"],
  diagnostic: ["diagnosis", "diagnostic", "diagnosing"],

  classification: ["classification", "classifying", "classifier"],
  classify: ["classification", "classifying", "classifier"],

  detection: ["detection", "detecting", "detector"],

  segmentation: ["segmentation", "segmenting"],

  learning: ["learning"],
  "deep-learning": ["deep learning", "deep-learning"],
  "deep": ["deep learning", "deep-learning"],

  machine: ["machine learning", "machine-learning"],
  "machine-learning": ["machine learning", "machine-learning"],

  llm: ["llm", "large language model", "large-language-model"],
  agent: ["agent", "agents", "agentic"],
  agents: ["agent", "agents", "agentic"],

  multimodal: ["multimodal", "multi-modal"],

  transformer: ["transformer", "transformers"],

  vision: ["vision", "visual"],
};

/*
 * Only expand terms that have a safe, direct synonym.
 *
 * We intentionally DO NOT expand generic words such as:
 * disease -> pathology / syndrome / infection
 *
 * because that creates unrelated results.
 */
function getTermVariants(term: string): string[] {
  const normalized = term.toLowerCase();

  if (SYNONYMS[normalized]) {
    return SYNONYMS[normalized];
  }

  return [normalized];
}

/*
 * ---------------------------------------------------------
 * BUILD A GENERALIZED QUERY
 *
 * Example:
 *
 * "Dog Skin Disease"
 *
 * becomes approximately:
 *
 * (dog OR dogs OR canine OR canines)
 * AND
 * (skin OR cutaneous OR dermatological OR dermatology)
 * AND
 * (disease OR diseases)
 *
 * Every important user concept must remain present.
 *
 * We do NOT drop concepts just because arXiv returns
 * fewer papers.
 * ---------------------------------------------------------
 */

function buildSearchQuery(query: string): string {
  const terms = extractTerms(query);

  if (terms.length === 0) {
    return `ti:"${query}" OR abs:"${query}"`;
  }

  const groups = terms.map((term) => {
    const variants = getTermVariants(term);

    const variantQueries = variants.map((variant) => {
      if (variant.includes(" ")) {
        return `(ti:"${variant}" OR abs:"${variant}")`;
      }

      return `(ti:${variant} OR abs:${variant})`;
    });

    return `(${variantQueries.join(" OR ")})`;
  });

  return groups.join(" AND ");
}

/*
 * ---------------------------------------------------------
 * RELEVANCE SCORING
 *
 * Search results are ranked against the ACTUAL USER QUERY.
 *
 * A paper that doesn't contain the important query concepts
 * receives a strong penalty.
 * ---------------------------------------------------------
 */

function rankPapers(
  papers: ArxivPaper[],
  query: string
): ArxivPaper[] {
  const terms = extractTerms(query);
  const normalizedQuery = normalizeText(query);

  const scored = papers.map((paper) => {
    const title = normalizeText(paper.title);
    const abstract = normalizeText(paper.abstract);
    const combined = `${title} ${abstract}`;

    let score = 0;

    /*
     * Exact complete query
     */
    if (title.includes(normalizedQuery)) {
      score += 100;
    }

    if (abstract.includes(normalizedQuery)) {
      score += 50;
    }

    /*
     * Each original user concept matters.
     *
     * A paper should contain most of the actual query,
     * not merely the generic word "disease".
     */
    let matchedTerms = 0;

    for (const term of terms) {
      const variants = getTermVariants(term);

      const matched = variants.some((variant) => {
        const normalizedVariant = normalizeText(variant);
        return combined.includes(normalizedVariant);
      });

      if (matched) {
        matchedTerms++;

        if (title.includes(term)) {
          score += 20;
        } else {
          score += 8;
        }
      } else {
        /*
         * Missing a user-provided concept is a significant
         * relevance problem.
         */
        score -= 35;
      }
    }

    /*
     * Reward papers containing most/all requested concepts.
     */
    const coverage =
      terms.length > 0 ? matchedTerms / terms.length : 1;

    score += coverage * 50;

    /*
     * Recency is only a secondary ranking factor.
     * Relevance always comes first.
     */
    const publishedDate = new Date(paper.published);

    if (!Number.isNaN(publishedDate.getTime())) {
      const ageInYears =
        (Date.now() - publishedDate.getTime()) /
        (1000 * 60 * 60 * 24 * 365);

      if (ageInYears <= 1) {
        score += 12;
      } else if (ageInYears <= 3) {
        score += 8;
      } else if (ageInYears <= 5) {
        score += 4;
      }
    }

    return {
      paper,
      score,
      coverage,
    };
  });

  /*
   * Only keep papers that cover enough of the user's query.
   *
   * For a 3-term query, at least 2 concepts should appear.
   * For a 2-term query, both should appear.
   */
  const minimumCoverage =
    terms.length >= 3 ? 2 / terms.length : 1;

  const relevant = scored.filter(
    (item) => item.coverage >= minimumCoverage
  );

  relevant.sort((a, b) => b.score - a.score);

  return relevant.map((item) => item.paper);
}

/*
 * ---------------------------------------------------------
 * ARXIV API
 * ---------------------------------------------------------
 */

async function fetchPapers(
  searchQuery: string,
  maxResults: number
): Promise<ArxivPaper[]> {
  const url = new URL("https://export.arxiv.org/api/query");

  url.searchParams.set("search_query", searchQuery);
  url.searchParams.set("start", "0");
  url.searchParams.set("max_results", maxResults.toString());

  /*
   * Relevance is useful because the query itself already
   * contains the user's concepts.
   */
  url.searchParams.set("sortBy", "relevance");
  url.searchParams.set("sortOrder", "descending");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "ArxivDigestAgent/1.0",
    },

    /*
     * Prevent Next.js from serving an old cached response.
     */
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `arXiv API returned status ${response.status}`
    );
  }

  const xml = await response.text();

  return parseArxivXML(xml);
}

/*
 * ---------------------------------------------------------
 * XML PARSER
 * ---------------------------------------------------------
 */

function parseArxivXML(xmlText: string): ArxivPaper[] {
  const papers: ArxivPaper[] = [];

  const entries = xmlText.split("<entry>");

  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];

    const idMatch = entry.match(/<id>(.*?)<\/id>/);
    const id = idMatch ? idMatch[1].trim() : "";

    const titleMatch = entry.match(
      /<title>([\s\S]*?)<\/title>/
    );

    const title = titleMatch
      ? titleMatch[1].trim().replace(/\s+/g, " ")
      : "";

    const authors: string[] = [];

    const authorMatches = entry.matchAll(
      /<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g
    );

    for (const match of authorMatches) {
      authors.push(match[1].trim());
    }

    const abstractMatch = entry.match(
      /<summary>([\s\S]*?)<\/summary>/
    );

    const abstract = abstractMatch
      ? abstractMatch[1].trim().replace(/\s+/g, " ")
      : "";

    const publishedMatch = entry.match(
      /<published>(.*?)<\/published>/
    );

    const published = publishedMatch
      ? publishedMatch[1].trim()
      : "";

    const updatedMatch = entry.match(
      /<updated>(.*?)<\/updated>/
    );

    const updated = updatedMatch
      ? updatedMatch[1].trim()
      : "";

    const categories: string[] = [];

    const categoryMatches = entry.matchAll(
      /<category term="(.*?)".*?\/>/g
    );

    for (const match of categoryMatches) {
      categories.push(match[1]);
    }

    if (id && title) {
      papers.push({
        id,
        title,
        authors,
        abstract,
        published,
        updated,
        categories,
        arxivUrl: id,
      });
    }
  }

  return papers;
}

/*
 * ---------------------------------------------------------
 * API ROUTE
 * ---------------------------------------------------------
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    const query = searchParams.get("query");

    if (!query || query.trim() === "") {
      return NextResponse.json(
        {
          error: "Search query is required",
        },
        {
          status: 400,
        }
      );
    }

    const cleanQuery = query.trim();

    console.log(
      `[ArXiv Search] User query: "${cleanQuery}"`
    );

    /*
     * Build a query based directly on the user's terms.
     */
    const searchQuery =
      buildSearchQuery(cleanQuery);

    console.log(
      `[ArXiv Search] Generated query: ${searchQuery}`
    );

    /*
     * Fetch more than the UI displays.
     *
     * This gives the ranking system enough candidates
     * to select the most relevant 15.
     */
    let papers = await fetchPapers(
      searchQuery,
      40
    );

    console.log(
      `[ArXiv Search] Initial results: ${papers.length}`
    );

    /*
     * Rank against the actual query.
     */
    papers = rankPapers(
      papers,
      cleanQuery
    );

    /*
     * If the strict query returned very few papers,
     * perform ONE controlled phrase search.
     *
     * Importantly, we DO NOT search generic words such
     * as "disease" alone.
     */
    if (papers.length < 5) {
      const phraseQuery =
        `ti:"${cleanQuery}" OR abs:"${cleanQuery}"`;

      console.log(
        `[ArXiv Search] Phrase fallback: ${phraseQuery}`
      );

      try {
        const phrasePapers =
          await fetchPapers(
            phraseQuery,
            20
          );

        const existingIds =
          new Set(
            papers.map(
              (paper) => paper.id
            )
          );

        for (const paper of phrasePapers) {
          if (
            !existingIds.has(
              paper.id
            )
          ) {
            papers.push(paper);
            existingIds.add(paper.id);
          }
        }

        /*
         * Re-rank after merging.
         */
        papers = rankPapers(
          papers,
          cleanQuery
        );
      } catch (fallbackError) {
        console.error(
          "[ArXiv Search] Phrase fallback failed:",
          fallbackError
        );
      }
    }

    /*
     * Final limit for the UI.
     */
    papers = papers.slice(0, 15);

    console.log(
      `[ArXiv Search] Final results: ${papers.length}`
    );

    return NextResponse.json({
      success: true,
      count: papers.length,
      papers,
    });
  } catch (error) {
    console.error(
      "[ArXiv Search] Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch papers from arXiv",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}