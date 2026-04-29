# Memoria

Memoria is a personal knowledge library for collecting, organizing, and reading documents in one place. It supports saved web pages, PDFs, and native notes, then layers AI-assisted summaries, tagging, and document chat on top of that content.

## What it does

- Save content from URLs, PDFs, and native notes
- Organize documents with folders and tags
- Search across your saved library
- Edit notes directly in a rich text editor
- Generate AI summaries and suggested metadata
- Chat with a document using its saved content as context
- Share public documents and folders
- Restore deleted items from trash

## Tech stack

- Frontend: React 19, TanStack Start, TanStack Router, Tailwind CSS
- Backend: Convex
- Authentication: `@convex-dev/auth` with password-based auth
- Editor: Tiptap
- AI: Vercel AI SDK with an OpenAI-compatible NVIDIA NIM endpoint
- Content extraction: Cheerio, Turndown, `unpdf`

## Requirements

- [Bun](https://bun.sh/)
- A Convex project
- An NVIDIA NIM API key if you want AI features enabled

## Getting started

1. Install dependencies:

```bash
bun install
```

1. Initialize or connect Convex if you have not already:

```bash
bunx convex init
```

1. Update the `.env.local` file with necessary environment variables.
2. Start Convex in one terminal:

```bash
bunx convex dev
```

1. Start the app in another terminal:

```bash
bun run dev
```

## How Memoria works

When you save a URL, Memoria fetches the page, extracts readable content, converts it to Markdown, and stores it in Convex. PDF links are detected automatically and text is extracted before saving.

Saved content can then be:

- grouped into folders
- tagged for retrieval
- searched by title and content
- summarized with AI
- opened in a document-specific chat
- shared publicly when needed

Native notes follow the same document model, which means they can live alongside imported content in the same library.

## AI features

If `NIM_API_KEY` is configured, Memoria can:

- generate document titles and tags after import
- create concise, detailed, or action-oriented summaries
- answer questions about a document using its stored content

If the key is not present, the core library features still work, but AI-dependent features will not.

