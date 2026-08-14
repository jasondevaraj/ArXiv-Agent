"use client";

import { useState } from "react";

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  published: string;
  updated: string;
  categories: string[];
  arxivUrl: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  papers: Paper[];
  error?: string;
}

interface Theme {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  papers: Paper[];
  insights: string[];
  summary: string;
}

// Theme discovery function - query-aware keyword-based grouping
function discoverThemes(papers: Paper[]): Theme[] {
  if (papers.length === 0) return [];
  
  // Extract all significant terms from paper titles and abstracts
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'are', 'from', 'that', 'this', 'using', 'based',
    'approach', 'method', 'paper', 'study', 'work', 'research', 'novel', 'new',
    'via', 'through', 'into', 'about', 'their', 'these', 'those', 'such', 'been',
    'has', 'have', 'can', 'will', 'may', 'also', 'more', 'our', 'we'
  ]);
  
  // Count significant bigrams and trigrams from titles
  const ngramCounts = new Map<string, number>();
  
  papers.forEach(paper => {
    const titleWords = paper.title.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
    
    // Count bigrams
    for (let i = 0; i < titleWords.length - 1; i++) {
      const bigram = `${titleWords[i]} ${titleWords[i + 1]}`;
      ngramCounts.set(bigram, (ngramCounts.get(bigram) || 0) + 1);
    }
    
    // Count trigrams
    for (let i = 0; i < titleWords.length - 2; i++) {
      const trigram = `${titleWords[i]} ${titleWords[i + 1]} ${titleWords[i + 2]}`;
      ngramCounts.set(trigram, (ngramCounts.get(trigram) || 0) + 1);
    }
  });
  
  // Find top recurring themes (appearing in at least 2 papers)
  const potentialThemes = Array.from(ngramCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // Get top 6 potential themes
  
  // If no recurring patterns, extract single important terms
  if (potentialThemes.length === 0) {
    const singleTermCounts = new Map<string, number>();
    papers.forEach(paper => {
      const words = paper.title.toLowerCase()
        .replace(/[^\w\s-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4 && !stopWords.has(w));
      
      words.forEach(word => {
        singleTermCounts.set(word, (singleTermCounts.get(word) || 0) + 1);
      });
    });
    
    potentialThemes.push(...Array.from(singleTermCounts.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4));
  }
  
  // Create themes from discovered patterns
  const themes: Theme[] = potentialThemes.slice(0, 4).map(([pattern, _]) => {
    // Capitalize theme name
    const name = pattern.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Create search keywords from the pattern
    const keywords = pattern.split(' ').filter(w => w.length > 3);
    
    return {
      id: pattern.replace(/\s+/g, '-'),
      name: name,
      description: `Research exploring ${pattern} and related concepts`,
      keywords: [pattern, ...keywords],
      papers: [],
      insights: [],
      summary: ""
    };
  });
  
  // "Other" theme for papers that don't fit well
  const otherTheme: Theme = {
    id: "other",
    name: "Other Related Research",
    description: "Additional relevant papers and emerging research directions",
    keywords: [],
    papers: [],
    insights: [],
    summary: ""
  };
  
  // Assign each paper to the best matching theme
  papers.forEach(paper => {
    const text = `${paper.title} ${paper.abstract}`.toLowerCase();
    
    let bestThemeIndex = -1;
    let bestScore = 0;
    
    themes.forEach((theme, index) => {
      let score = 0;
      theme.keywords.forEach(keyword => {
        const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length * keyword.split(' ').length; // Weight by phrase length
        }
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestThemeIndex = index;
      }
    });
    
    // Assign to best theme if score > 0, otherwise to "other"
    if (bestThemeIndex >= 0 && bestScore > 0) {
      themes[bestThemeIndex].papers.push(paper);
    } else {
      otherTheme.papers.push(paper);
    }
  });
  
  // Filter out empty themes and add other if it has papers
  const result = themes.filter(t => t.papers.length > 0);
  if (otherTheme.papers.length > 0) {
    result.push(otherTheme);
  }
  
  // Generate insights and summary for each theme
  result.forEach(theme => {
    // Extract key terms from paper titles in this theme
    const titleWords = theme.papers.flatMap(p => 
      p.title.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !stopWords.has(w))
    );
    const wordFreq = new Map<string, number>();
    titleWords.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    
    // Generate simple insights
    theme.insights = [
      `Focus on ${theme.papers.length} paper${theme.papers.length > 1 ? 's' : ''} exploring ${theme.name.toLowerCase()}`,
      `Key research areas include ${topWords.slice(0, 3).join(', ')}`,
      `Recent work published in ${new Date(theme.papers[0].published).getFullYear()}`
    ];
    
    // Generate summary
    const recentPapers = theme.papers.slice(0, 2);
    theme.summary = `This theme encompasses ${theme.papers.length} paper${theme.papers.length > 1 ? 's' : ''} focused on ${theme.description.toLowerCase()}. Recent research includes work on ${recentPapers.map(p => p.title.toLowerCase().split('.')[0]).join(' and ')}.`;
  });
  
  // Sort by paper count
  return result.sort((a, b) => b.papers.length - a.papers.length);
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [error, setError] = useState("");
  const [searchedTopic, setSearchedTopic] = useState("");
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a research topic");
      return;
    }
    
    setIsGenerating(true);
    setError("");
    setPapers([]);
    setThemes([]);
    setSelectedTheme(null);
    setSearchedTopic(topic);
    setLoadingStep(0);
    setExpandedAbstracts(new Set());
    
    try {
      setLoadingStep(1);
      const response = await fetch(`/api/arxiv?query=${encodeURIComponent(topic)}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch papers");
      }
      
      setLoadingStep(2);
      
      const data: ApiResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
        setPapers([]);
        setThemes([]);
      } else if (data.papers.length === 0) {
        setError("No papers found for this topic. Try a different search query.");
        setPapers([]);
        setThemes([]);
      } else {
        setPapers(data.papers);
        setLoadingStep(3);
        
        // Discover themes from papers
        await new Promise(resolve => setTimeout(resolve, 800)); // Brief delay for UX
        setLoadingStep(4);
        
        const discoveredThemes = discoverThemes(data.papers);
        setThemes(discoveredThemes);
        setError("");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      setPapers([]);
      console.error("Error fetching papers:", err);
    } finally {
      setIsGenerating(false);
      setLoadingStep(0);
    }
  };

  const toggleAbstract = (paperId: string) => {
    const newExpanded = new Set(expandedAbstracts);
    if (newExpanded.has(paperId)) {
      newExpanded.delete(paperId);
    } else {
      newExpanded.add(paperId);
    }
    setExpandedAbstracts(newExpanded);
  };

  const getLatestPaperDate = () => {
    if (papers.length === 0) return "-";
    const latest = papers.reduce((max, paper) => {
      const date = new Date(paper.published);
      return date > max ? date : max;
    }, new Date(papers[0].published));
    return latest.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const getUniqueSources = () => {
    if (papers.length === 0) return 0;
    const categories = new Set<string>();
    papers.forEach(paper => {
      paper.categories.forEach(cat => categories.add(cat.split('.')[0]));
    });
    return categories.size;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e8e6e3' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold" style={{ color: '#2d3436' }}>
                ArXiv Digest Agent
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <button className="font-medium" style={{ color: '#2d7053' }}>
                Research
              </button>
              <button style={{ color: '#636e72' }}>
                About
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Hero/Search Section */}
        {papers.length === 0 && !isGenerating && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
            <div className="text-center mb-8">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-6" 
                   style={{ backgroundColor: '#7d9b7a', color: '#ffffff' }}>
                Research Discovery
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: '#2d3436' }}>
                Understand the research landscape, not just the papers.
              </h2>
              <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: '#636e72' }}>
                Search recent arXiv research and discover meaningful insights. 
                Enter a topic to explore the latest papers and emerging research directions.
              </p>
            </div>

            {/* Search Card */}
            <div className="rounded-lg shadow-md p-8" style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e3' }}>
              <label htmlFor="topic" className="block text-sm font-semibold mb-3" style={{ color: '#2d3436' }}>
                Research Topic
              </label>
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5" style={{ color: '#b2bec3' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. LLM Tool Use, multi-agent systems, computer vision"
                  className="w-full pl-12 pr-4 py-4 text-base rounded-lg outline-none transition"
                  style={{ 
                    border: '2px solid #e8e6e3',
                    backgroundColor: '#faf9f7',
                    color: '#2d3436'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2d7053'}
                  onBlur={(e) => e.target.style.borderColor = '#e8e6e3'}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleGenerate();
                    }
                  }}
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#2d7053',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#245d44')}
                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#2d7053')}
              >
                Generate Digest
              </button>
            </div>

            {/* Empty State */}
            <div className="text-center mt-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" 
                   style={{ backgroundColor: '#e8e6e3' }}>
                <svg className="w-8 h-8" style={{ color: '#7d9b7a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#2d3436' }}>
                Your research landscape starts here.
              </h3>
              <p style={{ color: '#636e72' }}>
                Enter a topic to discover recent papers and emerging research directions.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" 
                   style={{ backgroundColor: '#e8e6e3' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2d7053' }}></div>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#2d3436' }}>
                Analyzing Research Landscape
              </h3>
              <div className="max-w-xs mx-auto space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full transition ${loadingStep >= 1 ? 'opacity-100' : 'opacity-30'}`} 
                       style={{ backgroundColor: '#2d7053' }}></div>
                  <span className={`text-sm transition ${loadingStep >= 1 ? 'opacity-100' : 'opacity-50'}`} 
                        style={{ color: '#636e72' }}>
                    Searching arXiv
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full transition ${loadingStep >= 2 ? 'opacity-100' : 'opacity-30'}`} 
                       style={{ backgroundColor: '#2d7053' }}></div>
                  <span className={`text-sm transition ${loadingStep >= 2 ? 'opacity-100' : 'opacity-50'}`} 
                        style={{ color: '#636e72' }}>
                    Collecting papers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full transition ${loadingStep >= 3 ? 'opacity-100' : 'opacity-30'}`} 
                       style={{ backgroundColor: '#2d7053' }}></div>
                  <span className={`text-sm transition ${loadingStep >= 3 ? 'opacity-100' : 'opacity-50'}`} 
                        style={{ color: '#636e72' }}>
                    Discovering research themes
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full transition ${loadingStep >= 4 ? 'opacity-100' : 'opacity-30'}`} 
                       style={{ backgroundColor: '#2d7053' }}></div>
                  <span className={`text-sm transition ${loadingStep >= 4 ? 'opacity-100' : 'opacity-50'}`} 
                        style={{ color: '#636e72' }}>
                    Organizing papers into research directions
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
            <div className="rounded-lg p-6 border" style={{ backgroundColor: '#fff5f5', borderColor: '#feb2b2' }}>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0" style={{ color: '#c87856' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold mb-1" style={{ color: '#2d3436' }}>Unable to fetch papers</h4>
                  <p className="text-sm" style={{ color: '#636e72' }}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {!isGenerating && papers.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-lg p-4 border" style={{ backgroundColor: '#ffffff', borderColor: '#e8e6e3' }}>
                <div className="text-2xl font-bold mb-1" style={{ color: '#2d7053' }}>{papers.length}</div>
                <div className="text-xs font-medium uppercase tracking-wide" style={{ color: '#636e72' }}>Papers Found</div>
              </div>
              <div className="rounded-lg p-4 border" style={{ backgroundColor: '#ffffff', borderColor: '#e8e6e3' }}>
                <div className="text-sm font-semibold mb-1 truncate" style={{ color: '#2d7053' }}>{searchedTopic}</div>
                <div className="text-xs font-medium uppercase tracking-wide" style={{ color: '#636e72' }}>Research Topic</div>
              </div>
              <div className="rounded-lg p-4 border" style={{ backgroundColor: '#ffffff', borderColor: '#e8e6e3' }}>
                <div className="text-2xl font-bold mb-1" style={{ color: '#2d7053' }}>{getLatestPaperDate()}</div>
                <div className="text-xs font-medium uppercase tracking-wide" style={{ color: '#636e72' }}>Latest Paper</div>
              </div>
              <div className="rounded-lg p-4 border" style={{ backgroundColor: '#ffffff', borderColor: '#e8e6e3' }}>
                <div className="text-2xl font-bold mb-1" style={{ color: '#2d7053' }}>{getUniqueSources()}</div>
                <div className="text-xs font-medium uppercase tracking-wide" style={{ color: '#636e72' }}>Sources</div>
              </div>
            </div>

            {/* Research Themes Section */}
            {themes.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold" style={{ color: '#2d3436' }}>
                    Research Themes
                  </h2>
                  <span className="text-xs font-medium px-2 py-1 rounded" 
                        style={{ backgroundColor: '#e8e6e3', color: '#636e72' }}>
                    Prototype Theme Engine
                  </span>
                </div>
                <p className="text-sm mb-6" style={{ color: '#636e72' }}>
                  {papers.length} papers organized into meaningful research directions. 
                  <span className="text-xs ml-2" style={{ color: '#b2bec3' }}>
                    Research themes are currently identified from paper titles and abstracts. Semantic clustering with embeddings and HDBSCAN is planned for the full implementation.
                  </span>
                </p>

                {/* Theme Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {themes.slice(0, 4).map((theme) => (
                    <div
                      key={theme.id}
                      className="rounded-lg p-6 border transition"
                      style={{ backgroundColor: '#ffffff', borderColor: '#e8e6e3' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#7d9b7a';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e8e6e3';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Theme Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold flex-1" style={{ color: '#2d3436' }}>
                          {theme.name}
                        </h3>
                        <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: '#f0f4f0', color: '#2d7053' }}>
                          {theme.papers.length}
                        </span>
                      </div>

                      {/* Theme Description */}
                      <p className="text-sm mb-4 leading-relaxed" style={{ color: '#636e72' }}>
                        {theme.description}
                      </p>

                      {/* Representative Papers */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" 
                           style={{ color: '#7d9b7a' }}>
                          Representative Papers
                        </p>
                        <ul className="space-y-2">
                          {theme.papers.slice(0, 2).map((paper, idx) => (
                            <li key={paper.id} className="text-xs leading-snug" style={{ color: '#636e72' }}>
                              • {paper.title.length > 60 ? `${paper.title.substring(0, 60)}...` : paper.title}
                            </li>
                          ))}
                          {theme.papers.length > 2 && (
                            <li className="text-xs font-medium" style={{ color: '#7d9b7a' }}>
                              + {theme.papers.length - 2} more paper{theme.papers.length - 2 > 1 ? 's' : ''}
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Explore Button */}
                      <button
                        onClick={() => setSelectedTheme(theme)}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition"
                        style={{ backgroundColor: '#f0f4f0', color: '#2d7053' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e8e0'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f4f0'}
                      >
                        Explore Theme
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Research Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2d3436' }}>
                Research Results
              </h2>
              <button
                onClick={() => {
                  setPapers([]);
                  setSearchedTopic("");
                  setTopic("");
                }}
                className="text-sm font-medium px-4 py-2 rounded-lg transition"
                style={{ color: '#636e72', backgroundColor: '#e8e6e3' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d8d6d3'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e8e6e3'}
              >
                New Search
              </button>
            </div>

            {/* Papers Feed */}
            <div className="space-y-4">
              {papers.map((paper, index) => (
                <div
                  key={paper.id}
                  className="rounded-lg p-6 border transition"
                  style={{ backgroundColor: '#ffffff', borderColor: '#e8e6e3' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2d7053';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e8e6e3';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Paper Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-lg font-semibold leading-snug flex-1" style={{ color: '#2d3436' }}>
                      {paper.title}
                    </h3>
                    <span className="text-xs font-medium px-2 py-1 rounded" 
                          style={{ backgroundColor: '#e8e6e3', color: '#636e72' }}>
                      #{index + 1}
                    </span>
                  </div>

                  {/* Authors and Date */}
                  <div className="flex flex-wrap items-center gap-3 mb-4 text-sm" style={{ color: '#636e72' }}>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">
                        {paper.authors.slice(0, 3).join(", ")}
                        {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(paper.published).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Abstract */}
                  <div className="mb-4">
                    <p className="text-sm leading-relaxed" style={{ color: '#636e72' }}>
                      {expandedAbstracts.has(paper.id) 
                        ? paper.abstract 
                        : paper.abstract.length > 250
                        ? `${paper.abstract.substring(0, 250)}...`
                        : paper.abstract}
                    </p>
                    {paper.abstract.length > 250 && (
                      <button
                        onClick={() => toggleAbstract(paper.id)}
                        className="text-sm font-medium mt-2"
                        style={{ color: '#2d7053' }}
                      >
                        {expandedAbstracts.has(paper.id) ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {paper.categories.slice(0, 5).map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 text-xs font-medium rounded-full"
                        style={{ backgroundColor: '#f0f4f0', color: '#2d7053' }}
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  {/* Read Paper Button */}
                  <a
                    href={paper.arxivUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
                    style={{ backgroundColor: '#2d7053', color: '#ffffff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#245d44'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2d7053'}
                  >
                    Read Paper
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Theme Modal */}
      {selectedTheme && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSelectedTheme(null)}
        >
          <div 
            className="w-full max-w-4xl rounded-lg shadow-lg my-8"
            style={{ backgroundColor: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b p-6" style={{ borderColor: '#e8e6e3' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#2d3436' }}>
                    {selectedTheme.name}
                  </h2>
                  <p className="text-sm" style={{ color: '#636e72' }}>
                    Papers in this theme: <span className="font-semibold">{selectedTheme.papers.length}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTheme(null)}
                  className="p-2 rounded-lg transition"
                  style={{ color: '#636e72' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8e6e3'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
              {/* Research Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#2d3436' }}>
                  Research Summary
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#636e72' }}>
                  {selectedTheme.summary}
                </p>
              </div>

              {/* Key Insights */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#2d3436' }}>
                  Key Insights
                </h3>
                <ul className="space-y-2">
                  {selectedTheme.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: '#636e72' }}>
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#7d9b7a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related Papers */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#2d3436' }}>
                  Related Papers
                </h3>
                <div className="space-y-4">
                  {selectedTheme.papers.map((paper) => (
                    <div
                      key={paper.id}
                      className="rounded-lg p-4 border"
                      style={{ backgroundColor: '#faf9f7', borderColor: '#e8e6e3' }}
                    >
                      <h4 className="font-semibold mb-2 leading-snug" style={{ color: '#2d3436' }}>
                        {paper.title}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs" style={{ color: '#636e72' }}>
                        <span>
                          {paper.authors.slice(0, 2).join(", ")}
                          {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(paper.published).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <p className="text-xs mb-3 leading-relaxed" style={{ color: '#636e72' }}>
                        {paper.abstract.length > 200 
                          ? `${paper.abstract.substring(0, 200)}...` 
                          : paper.abstract}
                      </p>

                      <a
                        href={paper.arxivUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: '#2d7053' }}
                      >
                        Read Paper
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t mt-auto" style={{ backgroundColor: '#ffffff', borderColor: '#e8e6e3' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: '#636e72' }}>
              Built with Next.js • Powered by ArXiv API
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#7d9b7a' }}>
                Hackathon Project
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
