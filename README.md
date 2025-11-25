# AI Chat

A beautiful, modern AI chat application built with Next.js, Vercel AI SDK, and Open Router.

## Features

- **Real-time Streaming** - Responses stream in real-time as they're generated
- **Chat History** - Conversations are stored in localStorage for persistence
- **Multiple Conversations** - Create, switch between, and delete conversations
- **Dark/Light Mode** - System-aware theme with manual toggle
- **Responsive Design** - Works beautifully on desktop and mobile
- **Markdown Support** - AI responses render with markdown formatting

## Tech Stack

- **Next.js 15** with App Router
- **Vercel AI SDK v5** for streaming chat
- **Open Router** as the LLM provider (access to 100+ models)
- **shadcn/ui** for beautiful UI components
- **Tailwind CSS v4** for styling
- **localStorage** for chat persistence

## Getting Started

### Prerequisites

- Node.js 18+
- An [Open Router](https://openrouter.ai/) API key

### Installation

1. Clone the repository:

```bash
git clone <repo-url>
cd ai-multichat
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your Open Router API key:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Changing the Model

You can change the LLM model by editing `src/app/api/chat/route.ts`:

```typescript
const result = streamText({
  model: openrouter("openai/gpt-4o-mini"), // Change this to any Open Router model
  // ...
});
```

See [Open Router Models](https://openrouter.ai/docs#models) for available options.

## License

MIT
