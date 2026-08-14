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

// Helper function to extract key terms from a query
function extractKeyTerms(query: string): string[] {
  // Split into words and filter meaningful terms
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2); // Keep words longer than 2 chars
  
  // Common stop words to exclude
  const stopWords = new Set(['the', 'and', 'for', 'with', 'are', 'from', 'that', 'this']);
  
  return words.filter(word => !stopWords.has(word));
}

// Helper function to identify concept groups and build a concept-aware query
function buildConceptAwareQuery(query: string): { 
  conceptQueries: string[], 
  primaryIndex: number | null,
  groupNames: string[]
} {
  const queryLower = query.toLowerCase();
  
  // Define concept groups with synonyms and priority
  const conceptGroups = [
    // Animal/veterinary concepts - PRIMARY (specific entity/subject)
    {
      name: 'animal',
      priority: 'primary', // Never drop this in fallback
      primary: ['dog', 'canine', 'veterinary', 'pet'],
      expanded: ['dogs', 'canines', 'feline', 'cat', 'cats', 'livestock', 'equine', 'bovine', 'animal']
    },
    // Skin/dermatology concepts - SECONDARY (domain-specific)
    {
      name: 'skin',
      priority: 'secondary',
      primary: ['skin', 'dermatology', 'dermatological', 'cutaneous', 'dermatitis'],
      expanded: ['lesion', 'lesions', 'rash', 'epidermis', 'dermis', 'melanoma']
    },
    // Disease/diagnosis concepts - GENERIC (broad medical term)
    {
      name: 'disease',
      priority: 'generic',
      primary: ['disease', 'diagnosis', 'diagnostic', 'condition', 'disorder'],
      expanded: ['pathology', 'syndrome', 'infection', 'illness']
    },
    // Deep learning/AI concepts - PRIMARY
    {
      name: 'deep_learning',
      priority: 'primary',
      primary: ['deep learning', 'machine learning', 'neural network', 'cnn', 'convolutional'],
      expanded: ['artificial intelligence', 'ai', 'deep', 'learning', 'model', 'classification']
    },
    // LLM/Tool concepts - PRIMARY
    {
      name: 'llm',
      priority: 'primary',
      primary: ['llm', 'large language model', 'tool use', 'tool-use', 'function calling'],
      expanded: ['agent', 'gpt', 'language model', 'api', 'tool']
    },
    // Agent/multi-agent concepts - PRIMARY
    {
      name: 'agent',
      priority: 'primary',
      primary: ['agent', 'multi-agent', 'multi agent', 'agentic'],
      expanded: ['agents', 'coordination', 'collaboration', 'distributed']
    },
    // Computer vision concepts - PRIMARY
    {
      name: 'computer_vision',
      priority: 'primary',
      primary: ['computer vision', 'image processing', 'visual'],
      expanded: ['vision', 'image', 'object detection', 'segmentation']
    },
    // Quantum computing concepts - PRIMARY
    {
      name: 'quantum',
      priority: 'primary',
      primary: ['quantum computing', 'quantum', 'qubit'],
      expanded: ['quantum algorithm', 'quantum circuit', 'superposition']
    }
  ];
  
  // Find which concept groups match the query
  const matchedGroups: { group: typeof conceptGroups[0], index: number }[] = [];
  
  conceptGroups.forEach((group, index) => {
    // Check if any primary term matches
    const primaryMatch = group.primary.some(term => queryLower.includes(term));
    if (primaryMatch) {
      matchedGroups.push({ group, index });
    }
  });
  
  // If no concept groups matched, extract individual terms
  if (matchedGroups.length === 0) {
    const terms = extractKeyTerms(query);
    return {
      conceptQueries: terms.map(term => `(ti:${term} OR abs:${term})`),
      primaryIndex: null,
      groupNames: []
    };
  }
  
  // Identify primary concept (entity/subject that must never be dropped)
  let primaryIndex: number | null = null;
  const primaryGroup = matchedGroups.find(mg => mg.group.priority === 'primary');
  if (primaryGroup) {
    primaryIndex = matchedGroups.indexOf(primaryGroup);
  }
  
  // Build query requiring concepts to appear together
  const conceptQueries = matchedGroups.map(({ group }) => {
    const termGroup = [...group.primary, ...group.expanded].map(term => {
      // Handle multi-word phrases
      if (term.includes(' ')) {
        return `ti:"${term}" OR abs:"${term}"`;
      }
      return `ti:${term} OR abs:${term}`;
    }).join(' OR ');
    return `(${termGroup})`;
  });
  
  const groupNames = matchedGroups.map(mg => mg.group.name);
  
  // Return concept queries with metadata
  return { conceptQueries, primaryIndex, groupNames };
}

// Helper function to rank papers by relevance and recency
function rankPapers(papers: ArxivPaper[], query: string): ArxivPaper[] {
  const queryLower = query.toLowerCase();
  const queryTerms = extractKeyTerms(query);
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  
  // Identify primary entity/subject terms that MUST be present
  const primaryTerms = ['dog', 'canine', 'canines', 'dogs', 'veterinary', 'pet', 
                        'feline', 'cat', 'cats', 'equine', 'bovine', 'livestock'];
  const hasPrimaryTerm = primaryTerms.some(term => queryLower.includes(term));
  
  const scoredPapers = papers.map(paper => {
    const titleLower = paper.title.toLowerCase();
    const abstractLower = paper.abstract.toLowerCase();
    const publishedDate = new Date(paper.published);
    
    let score = 0;
    
    // CRITICAL: If query has a primary entity term (like 'dog'), the paper MUST contain it
    if (hasPrimaryTerm) {
      const paperHasPrimary = primaryTerms.some(term => 
        titleLower.includes(term) || abstractLower.includes(term)
      );
      
      if (!paperHasPrimary) {
        // Paper doesn't contain the primary entity - heavily penalize
        score -= 1000;
      } else {
        // Bonus for having the primary term in title
        const titleHasPrimary = primaryTerms.some(term => titleLower.includes(term));
        if (titleHasPrimary) {
          score += 50;
        }
      }
    }
    
    // Exact phrase match in title (highest weight)
    if (titleLower.includes(queryLower)) {
      score += 100;
    }
    
    // Exact phrase match in abstract (high weight)
    if (abstractLower.includes(queryLower)) {
      score += 50;
    }
    
    // Individual term matches in title
    queryTerms.forEach(term => {
      if (titleLower.includes(term)) {
        score += 10;
      }
    });
    
    // Individual term matches in abstract
    queryTerms.forEach(term => {
      if (abstractLower.includes(term)) {
        score += 3;
      }
    });
    
    // Recency bonus (prefer last 5 years)
    if (publishedDate > fiveYearsAgo) {
      const yearsAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      score += Math.max(0, 20 - yearsAgo * 4); // Decay over 5 years
    }
    
    return { paper, score };
  });
  
  // Sort by score descending and filter out heavily penalized papers
  const filteredPapers = scoredPapers.filter(sp => sp.score > -500);
  filteredPapers.sort((a, b) => b.score - a.score);
  
  return filteredPapers.map(sp => sp.paper);
}

// Fetch papers with a given search query
async function fetchPapers(searchQuery: string, maxResults: number): Promise<ArxivPaper[]> {
  const arxivApiUrl = new URL("https://export.arxiv.org/api/query");
  arxivApiUrl.searchParams.set("search_query", searchQuery);
  arxivApiUrl.searchParams.set("start", "0");
  arxivApiUrl.searchParams.set("max_results", maxResults.toString());
  arxivApiUrl.searchParams.set("sortBy", "relevance");
  arxivApiUrl.searchParams.set("sortOrder", "descending");
  
  const response = await fetch(arxivApiUrl.toString(), {
    headers: {
      "User-Agent": "ArxivDigestAgent/1.0",
    },
  });
  
  if (!response.ok) {
    throw new Error(`arXiv API returned status ${response.status}`);
  }
  
  const xmlText = await response.text();
  return parseArxivXML(xmlText);
}

function parseArxivXML(xmlText: string): ArxivPaper[] {
  const papers: ArxivPaper[] = [];
  
  // Split by entry tags
  const entries = xmlText.split("<entry>");
  
  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    
    // Extract ID
    const idMatch = entry.match(/<id>(.*?)<\/id>/);
    const id = idMatch ? idMatch[1].trim() : "";
    
    // Extract title
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "";
    
    // Extract authors
    const authors: string[] = [];
    const authorMatches = entry.matchAll(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g);
    for (const match of authorMatches) {
      authors.push(match[1].trim());
    }
    
    // Extract abstract
    const abstractMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
    const abstract = abstractMatch ? abstractMatch[1].trim().replace(/\s+/g, " ") : "";
    
    // Extract published date
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    const published = publishedMatch ? publishedMatch[1].trim() : "";
    
    // Extract updated date
    const updatedMatch = entry.match(/<updated>(.*?)<\/updated>/);
    const updated = updatedMatch ? updatedMatch[1].trim() : "";
    
    // Extract categories
    const categories: string[] = [];
    const categoryMatches = entry.matchAll(/<category term="(.*?)".*?\/>/g);
    for (const match of categoryMatches) {
      categories.push(match[1]);
    }
    
    // Get arXiv URL
    const arxivUrl = id;
    
    if (id && title) {
      papers.push({
        id,
        title,
        authors,
        abstract,
        published,
        updated,
        categories,
        arxivUrl,
      });
    }
  }
  
  return papers;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    
    if (!query || query.trim() === "") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }
    
    let papers: ArxivPaper[] = [];
    
    // Helper to add delay between requests to avoid rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // STEP 1: Try concept-aware search (requires main concepts together)
    const { conceptQueries, primaryIndex, groupNames } = buildConceptAwareQuery(query);
    
    if (conceptQueries.length > 1) {
      // Multi-concept query: require all concepts (AND logic)
      const conceptSearchQuery = conceptQueries.join(' AND ');
      papers = await fetchPapers(conceptSearchQuery, 30);
      
      // If we got good results, rank and return
      if (papers.length >= 5) {
        papers = rankPapers(papers, query);
        papers = papers.slice(0, 15);
        
        return NextResponse.json({
          success: true,
          count: papers.length,
          papers,
        });
      }
      
      // STEP 2: Smart fallback - drop generic concepts, NEVER primary concepts
      if (papers.length < 5 && conceptQueries.length > 2) {
        await delay(1000); // Wait 1 second before next request
        
        // Build fallback by dropping least important concept
        // Priority: Keep primary concepts > Keep secondary > Drop generic
        let fallbackQueries: string[] = [];
        
        if (primaryIndex !== null) {
          // We have a primary concept - keep it and other important concepts
          // Drop generic concepts like "disease" that are too broad
          fallbackQueries = conceptQueries.filter((_, idx) => {
            // Always keep primary
            if (idx === primaryIndex) return true;
            
            // Drop generic concepts (like 'disease')
            const groupName = groupNames[idx];
            if (groupName === 'disease' && conceptQueries.length > 2) return false;
            
            // Keep everything else
            return true;
          });
        } else {
          // No primary identified - drop the last concept
          fallbackQueries = conceptQueries.slice(0, -1);
        }
        
        // Only try fallback if we actually removed something
        if (fallbackQueries.length < conceptQueries.length && fallbackQueries.length > 0) {
          const relaxedQuery = fallbackQueries.join(' AND ');
          const relaxedPapers = await fetchPapers(relaxedQuery, 30);
          
          // Combine and deduplicate
          const existingIds = new Set(papers.map(p => p.id));
          relaxedPapers.forEach(paper => {
            if (!existingIds.has(paper.id)) {
              papers.push(paper);
              existingIds.add(paper.id);
            }
          });
        }
        
        if (papers.length >= 5) {
          papers = rankPapers(papers, query);
          papers = papers.slice(0, 15);
          
          return NextResponse.json({
            success: true,
            count: papers.length,
            papers,
          });
        }
      }
    } else {
      // Single concept or fallback: use the concept query directly
      const singleConceptQuery = conceptQueries[0] || `ti:"${query}" OR abs:"${query}"`;
      papers = await fetchPapers(singleConceptQuery, 30);
    }
    
    // STEP 3: If still too few papers, try exact phrase search
    if (papers.length < 5) {
      await delay(1000); // Wait before next request
      
      const exactSearchQuery = `ti:"${query}" OR abs:"${query}"`;
      const exactPapers = await fetchPapers(exactSearchQuery, 15);
      
      const existingIds = new Set(papers.map(p => p.id));
      exactPapers.forEach(paper => {
        if (!existingIds.has(paper.id)) {
          papers.push(paper);
          existingIds.add(paper.id);
        }
      });
    }
    
    // Rank papers by relevance and recency
    if (papers.length > 0) {
      papers = rankPapers(papers, query);
      papers = papers.slice(0, 15);
    }
    
    return NextResponse.json({
      success: true,
      count: papers.length,
      papers,
    });
    
  } catch (error) {
    console.error("Error fetching from arXiv:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch papers from arXiv",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
