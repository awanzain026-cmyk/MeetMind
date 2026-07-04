# MeetMind — AI Meeting Intelligence Agent

Transform any meeting transcript into action items, summaries, and follow-up emails using 5 specialized AI agents.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion v12
- **Icons:** Lucide React
- **AI:** Sodeom API (GPT-4o)

## Features

- **5 AI Agents** working in sequence:
  1. Transcript Processor — cleans and structures raw transcripts
  2. Action Item Extractor — identifies tasks, owners, and deadlines
  3. Sentiment & Tone Analyzer — detects emotional tone and engagement
  4. Meeting Summary Writer — generates structured executive summaries
  5. Follow-up Email Generator — drafts professional recap emails
- **Real-time streaming** — watch agents process via Server-Sent Events
- **Interactive results** — filterable action items, Kanban task board, editable email preview
- **Dark mode** — premium dark UI with glassmorphism design
- **Fully responsive** — mobile, tablet, desktop

## Setup

```bash
git clone <repo-url>
cd meetmind

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your SODEOM_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SODEOM_API_KEY` | Yes | Sodeom API key for AI agent LLM calls |
| `TAVILY_API_KEY` | No | Tavily API key (reserved for future use) |

## API Documentation

### `POST /api/analyze`

Analyze a meeting transcript using all 5 AI agents.

**Request body:**
```json
{
  "transcript": "Full meeting transcript text (min 50 words)",
  "title": "Optional meeting title",
  "depth": "quick | standard | deep"
}
```

**Response:** Server-Sent Events stream with events:
- `agent_start` — `{ agent: "transcript-processor" }`
- `agent_done` — `{ agent: "...", output: {...}, duration: 1234 }`
- `complete` — `{ ... MeetingAnalysis }`
- `error` — `{ message: "..." }`

### `GET /api/health`

**Response:** `{ status: "ok", timestamp, version: "1.0.0" }`

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    analyze/page.tsx      # Analysis dashboard
    api/
      analyze/route.ts    # Agent pipeline endpoint
      health/route.ts     # Health check
  components/
    ui/                   # Button, Card, Badge, Spinner, Toast, ErrorBoundary
    layout/               # Navbar, Footer
    sections/             # Hero, Features, HowItWorks, TranscriptInput
    agent/                # AgentCard, AgentProgress, ResultsPanel
  lib/
    types.ts              # TypeScript interfaces
    constants.ts          # Agent definitions, sample transcript
    utils.ts              # cn(), formatDuration(), etc.
    sodeom.ts             # Sodeom API client
    hooks/
      useAnalysis.ts      # SSE streaming hook
      useClipboard.ts     # Clipboard hook
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add SODEOM_API_KEY
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Manual Build

```bash
npm run build
npm start
```

## License

MIT
