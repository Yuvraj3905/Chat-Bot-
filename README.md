# AI Chat Bot

A modern, responsive chat interface built with Next.js, TypeScript, and Tailwind CSS. This application provides a clean and intuitive chat experience with features like message history, session management, and a responsive design that works across all devices.

## Features

- 💬 Real-time chat interface with message history
- 🌓 Light/Dark mode support
- 📱 Fully responsive design
- 🔄 Message retry and status indicators
- 📂 Session management (create, rename, delete)
- ✨ Modern UI with smooth animations
- ⌨️ Keyboard shortcuts for better UX
- 📝 Markdown support in messages

## Tech Stack

- **Frontend Framework**: [Next.js 13](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **State Management**: React Hooks
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/chat-bot.git
   cd chat-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update the environment variables in `.env.local` as needed.

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
/
├── app/                  # Next.js app router pages
│   └── page.tsx         # Main chat interface
├── components/          # Reusable UI components
│   ├── ui/              # Shadcn/ui components
│   └── ...              # Other components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── public/              # Static assets
└── styles/              # Global styles
```


## Features in Detail

### Chat Interface
- Real-time message streaming
- Message status indicators (sending/sent/failed)
- Message retry functionality
- Smooth scrolling behavior

### Session Management
- Create new chat sessions
- Rename existing sessions
- Delete sessions
- Persistent session storage using localStorage

### User Experience
- Responsive design for all screen sizes
- Keyboard shortcuts
- Loading states and animations
- Toast notifications


