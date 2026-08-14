# ArXiv Digest Agent

From hundreds of papers to a few meaningful research themes.

## Overview

ArXiv Digest Agent is a sophisticated research productivity dashboard designed to help researchers quickly digest large volumes of academic papers from ArXiv by identifying and organizing them into meaningful insights.

Built with a professional, calm aesthetic using forest green and sage tones, the application provides an intelligent research discovery experience that stands out from generic AI tools.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vercel-ready** - Optimized for deployment

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Using the Application

1. Enter a research topic in the search box (e.g., "LLM Tool Use", "quantum computing", "CRISPR gene editing")
2. Click "Generate Digest" or press Enter
3. View the statistics dashboard showing:
   - Total papers found
   - Your research topic
   - Latest paper date
   - Number of unique sources
4. Browse the results showing:
   - Paper titles and authors
   - Publication dates
   - Expandable abstracts (click "Read more")
   - Research categories
   - Direct links to view papers on arXiv
5. Click "New Search" to reset and start over

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

## Project Structure

```
airxiv-agent/
├── app/
│   ├── api/
│   │   └── arxiv/
│   │       └── route.ts    # arXiv API backend route
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main homepage with API integration
│   └── globals.css         # Global styles with Tailwind
├── public/                 # Static assets
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Design System

### Color Palette
The application uses a sophisticated, calm color palette designed for research productivity:

- **Background:** Warm ivory (#faf9f7)
- **Cards:** Clean white (#ffffff)
- **Primary accent:** Deep forest green (#2d7053)
- **Secondary accent:** Muted sage (#7d9b7a)
- **Alert accent:** Muted terracotta (#c87856)
- **Text:** Dark charcoal (#2d3436) and gray (#636e72)

### Design Principles
- Professional research tool aesthetic
- Calm, intelligent color scheme
- No gradients, glassmorphism, or neon colors
- Solid colors with subtle shadows
- Excellent readability and accessibility
- Responsive across all devices

See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for complete design documentation.

## API Reference

### GET /api/arxiv

Fetches research papers from arXiv based on a search query.

**Query Parameters:**
- `query` (required): The research topic to search for

**Response:**
```json
{
  "success": true,
  "count": 15,
  "papers": [
    {
      "id": "http://arxiv.org/abs/2401.07324v3",
      "title": "Paper Title",
      "authors": ["Author 1", "Author 2"],
      "abstract": "Paper abstract...",
      "published": "2024-01-14T16:17:07Z",
      "updated": "2024-02-16T12:42:25Z",
      "categories": ["cs.AI", "cs.CL"],
      "arxivUrl": "http://arxiv.org/abs/2401.07324v3"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Features (Current)

- ✅ **Sophisticated research dashboard UI** with earth-tone color palette
- ✅ **Professional design** that stands out from generic AI tools
- ✅ Clean, modern interface with forest green and sage accents
- ✅ Large search input for research topics
- ✅ **Real arXiv API integration with intelligent search**
- ✅ **Highly relevant paper results** (searches titles and abstracts)
- ✅ **Live paper fetching and display**
- ✅ Statistics dashboard (papers found, latest date, sources)
- ✅ Collapsible paper abstracts with "Read more"
- ✅ Step-by-step loading indicators
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Polished error handling and empty states
- ✅ Ready for Vercel deployment
- ✅ **Hackathon-ready polish**

## Features (Planned)

- [ ] Theme extraction and processing
- [ ] Advanced filtering and sorting
- [ ] Paper clustering and visualization

## Deployment

This application is optimized for Vercel deployment:

```bash
# Deploy to Vercel
vercel
```

## License

MIT
