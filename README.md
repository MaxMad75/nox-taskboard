# Nox Taskboard 📋

A real-time task board built with **Next.js** and **Convex**.

## Features

- Create, edit, delete tasks
- Status tracking: To Do → In Progress → Done
- Assign tasks to **Basti** or **Nox**
- Filter by status and assignee
- Real-time updates via Convex

## Setup

```bash
npm install
npx convex dev   # Creates Convex project + generates types
npm run dev       # Start Next.js dev server
```

Copy `.env.example` to `.env.local` and fill in your Convex URL (auto-set by `npx convex dev`).

## Tech Stack

- Next.js 16 + TypeScript
- Convex (real-time backend)
