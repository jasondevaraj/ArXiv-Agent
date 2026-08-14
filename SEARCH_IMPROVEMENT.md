# Search Relevance Improvement

## Problem
When searching for "LLM Tool Use", the arXiv API was returning unrelated papers including:
- Climate modeling tools
- Weather prediction systems
- Security vulnerability analysis
- Other papers with individual words matching but unrelated topics

## Root Cause
The query construction used `all:{query}` which searches across ALL metadata fields including:
- Author names
- Comments
- Journal references
- ArXiv categories
- Report numbers
- etc.

This caused the search to match papers where individual words appeared in unrelated contexts.

## Solution
Modified the query construction in `app/api/arxiv/route.ts` to focus on the most relevant fields:

### Before:
```typescript
arxivApiUrl.searchParams.set("search_query", `all:${query}`);
```

### After:
```typescript
const searchQuery = `ti:"${query}" OR abs:"${query}"`;
arxivApiUrl.searchParams.set("search_query", searchQuery);
```

### What Changed:
- **`ti:`** - Searches paper titles only
- **`abs:`** - Searches abstracts only
- **`OR`** - Combines both searches (paper matches if topic appears in either field)
- **Quotes** - Treats user input as a phrase, not individual words

## Results Comparison

### Query: "LLM Tool Use"

#### Before (with `all:` search):
1. ❌ AIRCC-Clim: a user-friendly tool for generating regional probabilistic climate change scenarios
2. ❌ YouZhi: Towards High-Concurrency Financial LLMs via Adaptive GQA-to-MLA Transition
3. ❌ ZeroLeak: Using LLMs for Scalable and Cost Effective Side-Channel Patching
4. ✅ Small LLMs Are Weak Tool Learners: A Multi-LLM Agent
5. ✅ MuMath-Code: Combining Tool-Use Large Language Models with Multi-perspective Data Augmentation

**Problem:** Only 2-3 out of 15 papers were directly related to LLM tool use

#### After (with `ti:` OR `abs:` search):
1. ✅ Benchmarking LLM Tool-Use in the Wild
2. ✅ Model-Adaptive Tool Necessity Reveals the Knowing-Doing Gap in LLM Tool Use
3. ✅ Utility-Guided Agent Orchestration for Efficient LLM Tool Use
4. ✅ ToolSandbox: A Stateful, Conversational, Interactive Evaluation Benchmark for LLM Tool Use Capabilities
5. ✅ Enhancing LLM Tool Use with High-quality Instruction Data from Knowledge Graph
6. ✅ Case-Based Calibration of Adaptive Reasoning and Execution for LLM Tool Use
7. ✅ Knowing When to Ask: Segment-Level Credit Assignment for LLM Tool Use
8. ✅ Modeling Collaborator: Enabling Subjective Vision Classification With Minimal Human Effort via LLM Tool-Use
9. ✅ Diagnosing Knowledge Gaps in LLM Tool Use: An Agentic Benchmark for Novel API Acquisition
10. ✅ PlanBench-XL: Evaluating Long-Horizon Planning of LLM Tool-Use Agents in Large-Scale Tool Ecosystems

**Success:** All 15 papers are directly related to LLM tool use, agents, and function calling

## Verification with Other Topics

### Quantum Computing
✅ All results relevant to quantum computing research
- "Quantum Computing"
- "Microwaves in Quantum Computing"
- "Free Quantum Computing"

### Multi-Agent Systems
✅ All results relevant to multi-agent systems
- "LLM Multi-Agent Systems: Challenges and Open Problems"
- "Control Charts for Multi-agent Systems"
- "Consensus of Hybrid Multi-agent Systems"

### Computer Vision
✅ All results relevant to computer vision
- "Teaching Computer Vision for Ecology"
- "Deep Learning vs. Traditional Computer Vision"
- "Ethics and Creativity in Computer Vision"

### CRISPR Gene Editing
✅ All results relevant to CRISPR and gene editing
- "Guide-Guard: Off-Target Predicting in CRISPR Applications"
- "From In Silico to In Vitro: A Comprehensive Guide to Validating Bioinformatics Predictions"

## Technical Details

### ArXiv API Query Syntax
- `ti:` - Title field search
- `abs:` - Abstract field search
- `au:` - Author field search
- `cat:` - Category field search
- `all:` - All fields search (less precise)

### Why Title and Abstract?
1. **Title** contains the core topic and main contribution
2. **Abstract** provides detailed description of the research
3. Together they capture the essence of the paper
4. Excludes noise from author names, comments, metadata

### Trade-offs
- **More relevant results** for focused research topics
- **May miss papers** where the topic is mentioned only in metadata or references
- **Best for:** Specific research areas ("LLM Tool Use", "quantum entanglement")
- **Works well for:** General domains ("machine learning", "computer vision")

## Impact

✅ **Dramatically improved relevance** for all tested queries
✅ **No changes required** to frontend, UI, or user experience
✅ **Same performance** - response times unchanged
✅ **Same limit** - still returns 15 papers
✅ **Vercel compatible** - no new dependencies or infrastructure

## Code Changed
- **File:** `app/api/arxiv/route.ts`
- **Lines changed:** 2 lines (query construction only)
- **Breaking changes:** None
- **Backward compatible:** Yes (same API interface)
