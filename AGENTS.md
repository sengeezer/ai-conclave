# AGENTS.md

## Commands
- Use `npm`, not `pnpm`/`yarn`; the repo is pinned by `package-lock.json`.
- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit` (`package.json` has no `typecheck` script)
- Production build: `npm run build`
- There is no test script, pre-commit config, or CI workflow in this repo right now.

## Structure
- This is a single Next.js App Router app under `src/app`, not a monorepo.
- `src/app/page.tsx` is thin; the real UI entrypoint is `src/components/chat/chat-container.tsx`.
- Path alias: `@/*` -> `src/*`.
- shadcn/ui primitives live in `src/components/ui/*`; app-specific chat UI lives in `src/components/chat/*`.

## API Wiring
- `src/app/api/chat/route.ts` is the single-model path. The client uses `TextStreamChatTransport`, so this route must keep returning `result.toTextStreamResponse()`.
- `src/app/api/chat/multi/route.ts` is the multi-model path. It returns JSON `VotingResult`, not a stream.
- `src/app/api/models/route.ts` fetches the OpenRouter model catalog and sets `revalidate = 3600`.

## Behavior Gotchas
- Single-model mode does not use the selected sidebar model. `/api/chat` is currently hardcoded to `openai/gpt-4o-mini`.
- Multi-model mode sends the prompt to every selected model in parallel, then runs a second voting pass where each successful model ranks the other responses.
- `ChatContainer` converts between AI SDK `UIMessage` objects and persisted `StoredMessage` objects. If message shape changes, update both conversion helpers there.
- Chat history is browser-only `localStorage` state in `src/lib/storage.ts` under key `ai-multichat-store`.
- Model pool/selection is separate `localStorage` state under key `ai_chat_model_selection` in `src/hooks/use-model-selection.ts`.
- If you change either persisted schema, add a migration path; the model selection hook already contains migration logic for older stored data.
- Initial model pool is `AVAILABLE_MODELS` in `src/types/models.ts`; default selected models are hardcoded in `src/hooks/use-model-selection.ts`.

## Env
- `OPENROUTER_API_KEY` is required for all server routes.
- Chat routes use `@ai-sdk/openai-compatible` against OpenRouter's `/api/v1` base URL.
- `/api/models` uses `@openrouter/sdk` directly instead of the AI SDK provider.

## Stack Preferences
- Prefer Next.js App Router, Vercel AI SDK, OpenRouter, and shadcn/ui. This was the only useful `.cursor` guidance in the repo and is now captured here.
