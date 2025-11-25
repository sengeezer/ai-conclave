# Quick Setup Guide

Follow these steps to get your AI chat application running:

## 1. Install Dependencies

```bash
npm install
```

## 2. Get Your Open Router API Key

1. Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key

## 3. Configure Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Then edit `.env` and add your API key:

```
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

## 4. Run the Development Server

```bash
npm run dev
```

## 5. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## Features to Try

- ✅ Click "New Chat" to start a conversation
- ✅ Type a message and press Enter to send
- ✅ Use Shift+Enter for multi-line messages
- ✅ Switch between different chat conversations
- ✅ Delete old conversations
- ✅ All chats are automatically saved to your browser's localStorage

## Troubleshooting

**API Key Issues**: Make sure your `.env` file is in the root directory and contains a valid Open Router API key.

**Port Already in Use**: If port 3000 is taken, Next.js will automatically use the next available port (3001, 3002, etc.)

**Chat Not Saving**: Check your browser's localStorage settings. Private/Incognito mode may prevent localStorage from working.

## Next Steps

- Customize the UI colors in `src/app/globals.css`
- Change the AI model in `src/app/api/chat/route.ts`
- Add more features like image support, voice input, etc.

Enjoy your AI chat application! 🚀

