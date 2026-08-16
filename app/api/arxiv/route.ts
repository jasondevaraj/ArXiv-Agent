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

/* =========================================================
   TEXT UTILITIES
   ========================================================= */

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "through",
  "using",
  "based",
  "about",
  "between",
  "within",
  "under",
  "over",
  "via",
  "from",
  "paper",
  "papers",
  "research",
  "study",
  "studies",
  "approach",
  "method",
  "methods",
  "system",
  "systems",
]);

/*
 * These are NOT topic-specific.
 *
 * They are only words that are usually too broad to determine
 * the subject of a research paper by themselves.
 */
const GENERIC_TERMS = new Set([
  "disease",
  "diseases",
  "diagnosis",
  "diagnostic",
  "classification",
  "detection",
  "analysis",
  "model",
  "models",
  "method",
  "methods",
  "system",
  "systems",
  "framework",
  "approach",
  "learning",
  "image",
  "images",
  "data",
  "study",
  "research",
  "prediction",
  "predictive",
  "recognition",
  "processing",
  "network",
  "networks",
  "algorithm",
  "algorithms",
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTerms(query: string): string[] {
  const normalized = normalizeText(query);

  return [
    ...new Set(
      normalized
        .split(/\s+/)
        .filter(
          (word) =>
            word.length > 1 &&
            !STOP_WORDS.has(word)
        )
    ),
  ];
}

/* =========================================================
   SAFE QUERY ESCAPING
   ========================================================= */

function escapeArxivPhrase(value: string): string {
  return value.replace(/"/g, "");
}

function buildTermQuery(term: string): string {
  const safeTerm =
    escapeArxivPhrase(term);

  if (safeTerm.includes(" ")) {
    return `(ti:"${safeTerm}" OR abs:"${safeTerm}")`;
  }

  return `(ti:${safeTerm} OR abs:${safeTerm})`;
}

/* =========================================================
   SEARCH STRATEGY
   =========================================================

   This is completely generic.

   Example:

   "Dog Skin Disease Classification"

   becomes:

   1. Exact phrase
   2. Dog + Skin + Disease + Classification
   3. Dog + Skin + Disease
   4. Dog + Skin + Classification
   5. Dog + Disease + Classification
   6. Skin + Disease + Classification
   7. strongest two-term combinations

   There is NO dog-specific code.

   The same logic works for:

   "Satellite Image Crop Detection"

   "Plant Disease"

   "LLM Tool Use"

   "Quantum Error Correction"

   "Solar Energy Forecasting"

   etc.
   ========================================================= */

function buildSearchStrategies(
  query: string
): string[] {
  const terms =
    extractTerms(query);

  const strategies: string[] = [];

  /*
   * Strategy 1:
   * Exact phrase.
   *
   * This gives the highest precision.
   */
  strategies.push(
    `ti:"${escapeArxivPhrase(
      query
    )}" OR abs:"${escapeArxivPhrase(
      query
    )}"`
  );

  if (terms.length === 0) {
    return strategies;
  }

  const termQueries =
    terms.map(buildTermQuery);

  /*
   * Strategy 2:
   * Require ALL user terms.
   *
   * This is the most important broad search.
   */
  if (termQueries.length > 1) {
    strategies.push(
      termQueries.join(" AND ")
    );
  } else {
    strategies.push(
      termQueries[0]
    );
  }

  /*
   * Strategy 3:
   * Remove one term at a time.
   *
   * This prevents zero results for legitimate
   * research topics while still keeping multiple
   * concepts together.
   */
  if (termQueries.length >= 3) {
    for (
      let removeIndex = 0;
      removeIndex < termQueries.length;
      removeIndex++
    ) {
      const reduced =
        termQueries.filter(
          (_, index) =>
            index !== removeIndex
        );

      if (reduced.length >= 2) {
        strategies.push(
          reduced.join(" AND ")
        );
      }
    }
  }

  /*
   * Strategy 4:
   * Strong two-term combinations.
   *
   * Never search an individual generic term.
   */
  if (termQueries.length >= 3) {
    for (
      let i = 0;
      i < termQueries.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < termQueries.length;
        j++
      ) {
        strategies.push(
          `${termQueries[i]} AND ${termQueries[j]}`
        );
      }
    }
  }

  return [
    ...new Set(strategies),
  ];
}

/* =========================================================
   TERM MATCHING
   ========================================================= */

function termMatchesPaper(
  paper: ArxivPaper,
  term: string
): {
  title: boolean;
  abstract: boolean;
} {
  const title =
    normalizeText(paper.title);

  const abstract =
    normalizeText(paper.abstract);

  const normalizedTerm =
    normalizeText(term);

  return {
    title:
      title.includes(
        normalizedTerm
      ),

    abstract:
      abstract.includes(
        normalizedTerm
      ),
  };
}

/* =========================================================
   RELEVANCE SCORING
   =========================================================

   The score is based ONLY on the user's query.

   No hard-coded topic categories.

   Higher score:

   - Exact phrase in title
   - More query terms matched
   - Query terms appearing in title
   - Query terms appearing close together
   - Complete concept coverage

   Lower score:

   - Only generic terms matched
   - Only one concept matched from a
     multi-concept query
   ========================================================= */

function rankPapers(
  papers: ArxivPaper[],
  query: string
): ArxivPaper[] {
  const terms =
    extractTerms(query);

  const normalizedQuery =
    normalizeText(query);

  const scored = papers.map(
    (paper) => {
      const title =
        normalizeText(
          paper.title
        );

      const abstract =
        normalizeText(
          paper.abstract
        );

      let score = 0;

      let matchedTerms = 0;

      let matchedSpecificTerms = 0;

      let titleMatches = 0;

      /*
       * Exact phrase matches.
       */
      if (
        title.includes(
          normalizedQuery
        )
      ) {
        score += 250;
      }

      if (
        abstract.includes(
          normalizedQuery
        )
      ) {
        score += 100;
      }

      /*
       * Check every user term.
       */
      for (const term of terms) {
        const match =
          termMatchesPaper(
            paper,
            term
          );

        if (
          match.title ||
          match.abstract
        ) {
          matchedTerms++;
        }

        if (match.title) {
          titleMatches++;
          score += 45;
        } else if (
          match.abstract
        ) {
          score += 15;
        }

        /*
         * Specific terms are more important
         * than generic research vocabulary.
         */
        if (
          !GENERIC_TERMS.has(
            term
          ) &&
          (match.title ||
            match.abstract)
        ) {
          matchedSpecificTerms++;
          score += 30;
        }
      }

      /*
       * Concept coverage.
       */
      const coverage =
        terms.length > 0
          ? matchedTerms /
            terms.length
          : 0;

      score +=
        coverage * 150;

      /*
       * Complete query coverage gets a
       * strong bonus.
       */
      if (
        matchedTerms ===
        terms.length
      ) {
        score += 200;
      }

      /*
       * Specific concept coverage.
       */
      if (
        terms.length > 1 &&
        matchedSpecificTerms > 0
      ) {
        score +=
          matchedSpecificTerms * 40;
      }

      /*
       * Title coverage bonus.
       */
      score +=
        titleMatches * 20;

      /*
       * Mild recency preference.
       *
       * Relevance remains much more important
       * than date.
       */
      const published =
        new Date(
          paper.published
        );

      if (
        !Number.isNaN(
          published.getTime()
        )
      ) {
        const age =
          (Date.now() -
            published.getTime()) /
          (1000 *
            60 *
            60 *
            24 *
            365);

        if (age <= 1) {
          score += 15;
        } else if (age <= 3) {
          score += 10;
        } else if (age <= 5) {
          score += 5;
        }
      }

      return {
        paper,
        score,
        matchedTerms,
        matchedSpecificTerms,
      };
    }
  );

  /*
   * ======================================================
   * GENERIC RELEVANCE FILTER
   * ======================================================
   *
   * This is the important part.
   *
   * It does NOT know anything about dogs,
   * plants, satellites, LLMs, etc.
   *
   * It only looks at how many of the user's
   * own terms the paper contains.
   */

  const filtered =
    scored.filter(
      (item) => {
        /*
         * One-word query:
         *
         * The paper must contain that word.
         */
        if (
          terms.length === 1
        ) {
          return (
            item.matchedTerms >= 1
          );
        }

        /*
         * Two-word query:
         *
         * BOTH concepts must appear.
         *
         * Example:
         *
         * Plant Disease
         *
         * requires:
         * Plant + Disease
         */
        if (
          terms.length === 2
        ) {
          return (
            item.matchedTerms === 2
          );
        }

        /*
         * Three or more terms:
         *
         * Prefer papers containing
         * almost all concepts.
         *
         * At least 70% of the query
         * concepts must match.
         */
        const requiredTerms =
          Math.max(
            2,
            Math.ceil(
              terms.length * 0.7
            )
          );

        return (
          item.matchedTerms >=
          requiredTerms
        );
      }
    );

  /*
   * Sort by relevance.
   */
  filtered.sort(
    (a, b) =>
      b.score - a.score
  );

  return filtered.map(
    (item) => item.paper
  );
}

/* =========================================================
   ARXIV API
   ========================================================= */

async function fetchPapers(
  searchQuery: string,
  maxResults: number
): Promise<ArxivPaper[]> {
  const url =
    new URL(
      "https://export.arxiv.org/api/query"
    );

  url.searchParams.set(
    "search_query",
    searchQuery
  );

  url.searchParams.set(
    "start",
    "0"
  );

  url.searchParams.set(
    "max_results",
    maxResults.toString()
  );

  url.searchParams.set(
    "sortBy",
    "relevance"
  );

  url.searchParams.set(
    "sortOrder",
    "descending"
  );

  const response =
    await fetch(
      url.toString(),
      {
        headers: {
          "User-Agent":
            "ArxivDigestAgent/1.0",
        },

        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      `arXiv API returned status ${response.status}`
    );
  }

  const xml =
    await response.text();

  return parseArxivXML(xml);
}

/* =========================================================
   XML PARSER
   ========================================================= */

function parseArxivXML(
  xmlText: string
): ArxivPaper[] {
  const papers: ArxivPaper[] =
    [];

  const entries =
    xmlText.split("<entry>");

  for (
    let i = 1;
    i < entries.length;
    i++
  ) {
    const entry =
      entries[i];

    const idMatch =
      entry.match(
        /<id>(.*?)<\/id>/
      );

    const id =
      idMatch
        ? idMatch[1].trim()
        : "";

    const titleMatch =
      entry.match(
        /<title>([\s\S]*?)<\/title>/
      );

    const title =
      titleMatch
        ? titleMatch[1]
            .trim()
            .replace(/\s+/g, " ")
        : "";

    const authors: string[] =
      [];

    const authorMatches =
      entry.matchAll(
        /<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g
      );

    for (
      const match of authorMatches
    ) {
      authors.push(
        match[1].trim()
      );
    }

    const abstractMatch =
      entry.match(
        /<summary>([\s\S]*?)<\/summary>/
      );

    const abstract =
      abstractMatch
        ? abstractMatch[1]
            .trim()
            .replace(/\s+/g, " ")
        : "";

    const publishedMatch =
      entry.match(
        /<published>(.*?)<\/published>/
      );

    const published =
      publishedMatch
        ? publishedMatch[1].trim()
        : "";

    const updatedMatch =
      entry.match(
        /<updated>(.*?)<\/updated>/
      );

    const updated =
      updatedMatch
        ? updatedMatch[1].trim()
        : "";

    const categories: string[] =
      [];

    const categoryMatches =
      entry.matchAll(
        /<category term="(.*?)".*?\/>/g
      );

    for (
      const match of categoryMatches
    ) {
      categories.push(
        match[1]
      );
    }

    if (
      id &&
      title
    ) {
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

/* =========================================================
   GET /api/arxiv
   ========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    const query =
      searchParams.get(
        "query"
      );

    if (
      !query ||
      query.trim() === ""
    ) {
      return NextResponse.json(
        {
          error:
            "Search query is required",
        },
        {
          status: 400,
        }
      );
    }

    const cleanQuery =
      query.trim();

    console.log(
      `[ArXiv] User query: ${cleanQuery}`
    );

    /*
     * Generate generic search strategies.
     */
    const strategies =
      buildSearchStrategies(
        cleanQuery
      );

    console.log(
      "[ArXiv] Strategies:",
      strategies
    );

    /*
     * Store unique papers from
     * all search attempts.
     */
    const paperMap =
      new Map<
        string,
        ArxivPaper
      >();

    /*
     * Execute searches sequentially
     * to avoid arXiv rate limiting.
     */
    for (
      let i = 0;
      i < strategies.length;
      i++
    ) {
      try {
        const results =
          await fetchPapers(
            strategies[i],
            30
          );

        for (
          const paper of results
        ) {
          if (
            !paperMap.has(
              paper.id
            )
          ) {
            paperMap.set(
              paper.id,
              paper
            );
          }
        }

        /*
         * We already have enough
         * candidates for ranking.
         */
        if (
          paperMap.size >= 80
        ) {
          break;
        }

        /*
         * Protect arXiv API from
         * rapid repeated requests.
         */
        if (
          i <
          strategies.length - 1
        ) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                800
              )
          );
        }
      } catch (error) {
        console.error(
          `[ArXiv] Search strategy ${
            i + 1
          } failed:`,
          error
        );
      }
    }

    /*
     * Convert candidate map to array.
     */
    const candidates =
      Array.from(
        paperMap.values()
      );

    console.log(
      `[ArXiv] Candidates collected: ${candidates.length}`
    );

    /*
     * Rank and filter using ONLY
     * the user's query.
     */
    const ranked =
      rankPapers(
        candidates,
        cleanQuery
      );

    /*
     * Return the best 15.
     */
    const papers =
      ranked.slice(
        0,
        15
      );

    console.log(
      `[ArXiv] Final relevant papers: ${papers.length}`
    );

    return NextResponse.json({
      success: true,
      count: papers.length,
      papers,
    });
  } catch (error) {
    console.error(
      "[ArXiv] Error:",
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