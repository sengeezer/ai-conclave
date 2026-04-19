# AI Conclave

> ⚠️ **Disclaimer**: This repository has been mostly vibe coded with AI.

A chat application to prompt multiple models at once

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsengeezer%2Fai-conclave&env=OPENROUTER_API_KEY&envDescription=Your%20OpenRouter%20API%20key&envLink=https%3A%2F%2Fopenrouter.ai%2Fkeys)

## Features

- **Multiple responses** - Each prompt is sent to multiple LLMs
- **Voting phase** - After all models respond, they then vote and rank each response from other models - 2 points for a top choice and 1 point for second choice. Winning response gets displayed
- **Adding more models** - The sidebar alows adding of extra models from OpenRouter
- **Stateless** - Nothing is stored on a server. All chats are kept in localStorage inside the browser.

## Tech Stack

- **Next.js 16** with App Router
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
cd ai-conclave
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


## License

MIT
