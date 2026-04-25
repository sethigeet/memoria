# Product Requirements Document (PRD): "Memoria" (Streamlined Knowledge Base)

## 1. Product Overview

**Product Name:** Memoria
**Product Vision:** A fast, focused workspace for capturing web articles, PDFs, and custom notes. It leverages AI to auto-organize content, generate on-demand summaries of varying lengths, and allows users to chat directly with individual documents.
**Core Loop:** 1. **Capture/Write:** Save links, upload PDFs, or write custom notes. 2. **Auto-Organize:** AI automatically generates a title and assigns tags. 3. **Understand:** Generate on-demand summaries (Concise, Detailed, etc.) and chat with the specific document. 4. **Retrieve & Share:** Find anything via global full-text search and share specific folders publicly.

## 2. Target Audience

- **Researchers & Writers:** Need to capture web sources, write custom thoughts, and easily retrieve them.
- **Students:** Need to save PDFs and web articles, summarize them, and ask questions to understand specific texts.
- **Teams/Communities:** Users who curate resources and need a frictionless way to share public reading lists (folders) with others.

---

## 3. Core Features & Functional Requirements

### 3.1. Ingestion & Custom Notes

- **Web Link Capture:** Paste a URL to scrape and extract clean text from articles/blogs.
- **PDF Upload:** Upload documents and extract the raw text.
- **Custom Notes:** A robust rich-text editor (Markdown support) for users to type out their own thoughts.

### 3.2. AI Processing (Auto & On-Demand)

- **Auto-Titling & Tagging:** Immediately upon saving a link or finishing a custom note, the AI runs in the background to generate a concise Title and assign relevant categorizing Tags.
- **On-Demand Summarization:** Users trigger summarization manually. They can select a style via a dropdown:
  - _Concise_ (1-paragraph TL;DR)
  - _Detailed_ (Comprehensive outline with bullet points)
  - _Action Items_ (Extracts tasks or directives)

### 3.3. Document-Specific Chat

- **Localized Context:** A chat interface that is strictly scoped to the _currently viewed document_.
- **Functionality:** Users can ask questions like "What does this article say about X?" and the AI answers using _only_ the text of that specific document. (No global RAG).

### 3.4. Organization, Search & Sharing

- **Folder System:** Users can organize notes and saved documents into traditional folders.
- **Public Folder Sharing:** Users can toggle a folder to "Public." This generates a unique URL that allows unauthenticated users to view the folder's contents and read the notes (read-only mode).
- **Global Search:** A fast, full-text search bar that queries titles, tags, and document content across the user's entire account.

---

## 4. UI/UX Specifications (Screenshot Mockups for AI Agent)

_When passing this to an AI Agent, instruct it to use Tailwind CSS or a modern UI library (like Shadcn/Radix) to build these layouts exactly as described below._

### [Screenshot Spec 1: The Main Dashboard / Library View]

- **Sidebar (Left, fixed, 250px width):**
  - Logo at the top.
  - `+ New Note` button (prominent).
  - `Global Search` input field.
  - **Folders List:** Scrollable list of user-created folders. Folders toggled as "Public" should have a small "Globe" icon next to them.
  - **Tags List:** Auto-generated tags for quick filtering.
- **Main Content Area (Right, fluid):**
  - **Top Bar:** "Paste Link or Upload PDF" input box with an "Add" button.
  - **List/Grid Layout:** Cards representing saved content or notes.
  - **Card Anatomy:** Title, Source type icon (Web, PDF, Note), Date, and pill-shaped tags.

### [Screenshot Spec 2: The Document / Note Detail View]

- **Split Screen Layout:**
  - **Left Pane (65% - The Content):** \* Top metadata: Auto-generated Title, Tags, and Folder location.
    - Rich-text editor (if a custom note) or clean reading view (if scraped article/PDF).
    - **Summary Section (Sticky Top):** A dropdown to select summary type (Concise, Detailed) and a "Generate Summary" button. Once generated, the summary appears in a visually distinct callout box above the main text.
  - **Right Pane (35% - The Chat):** \* Header: "Chat with this document".
    - Standard chat interface (message history, input field at the bottom).

### [Screenshot Spec 3: Public Shared Folder View]

- **Minimalist Read-Only UI:**
  - Removes sidebar and user-specific actions.
  - Header displays the Folder Name and "Curated by [User Name]".
  - Displays a clean list/grid of the documents inside.
  - Clicking a document opens a read-only version of the Document Detail View (Left pane only; Chat and Summarize buttons are hidden/disabled).

---

## 5. Technical Architecture & Tech Stack

Instruct the AI agent to initialize a **tanstack start (App Router)** repository using the following strict stack:

- **Language:** **TypeScript** (Strict mode enabled).
- **Frontend:** React, Tailwind CSS, Shadcn UI, Lucide Icons.
- **Backend & Database:** **Convex**
  - Will handle all relational data (Users, Folders, Documents, Tags).
  - Will utilize **Convex Search** (Full-text search indexing) for the global search feature (no vector database needed).
- **AI Layer:** **Vercel AI SDK** (`ai` and `@ai-sdk/openai`)
  - Use `useChat` for the document-specific chat interface.
  - Use `generateObject` with **Zod** schemas for the auto-titling and tagging to ensure strict JSON returns.
  - Use `streamText` for generating the on-demand summaries.
- **Authentication:** Clerk (using the official Clerk + Convex integration). Unauthenticated state must be handled specifically for the public folder routes.
