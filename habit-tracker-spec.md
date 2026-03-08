# Habit Tracker — App Spec

## Overview
A clean, minimal habit tracker that runs entirely in the browser as a single React component. No backend, no AI — just a fast, satisfying tool for building daily habits. Data persists via `localStorage` so habits survive page refreshes.

---

## Core Features

### Habit Management
- Add a new habit with a name and an optional emoji icon
- Delete a habit
- Habits are stored in a list on the left or top of the UI

### Weekly Grid
- Shows the current week (Mon–Sun) as columns
- Each habit is a row
- Each cell is a toggleable checkbox — click to mark complete, click again to unmark
- Today's column is visually highlighted

### Streaks
- Each habit shows its current streak (consecutive days completed up to today)
- Show a 🔥 icon when streak is 3+ days

### Stats (simple)
- Completion rate for the current week per habit (e.g. "5/7")
- An overall week score at the top (e.g. "73% this week")

---

## UI / UX Details
- Dark mode by default, clean sans-serif font
- Subtle animations on checkbox toggle (scale + color pop)
- "Add habit" is a simple inline input at the bottom of the habit list
- Empty state message when no habits exist yet
- Mobile-friendly layout

---

## Data Model

```ts
type Habit = {
  id: string;           // uuid
  name: string;
  emoji: string;        // default "✅"
  createdAt: string;    // ISO date
};

type CompletionLog = {
  [habitId: string]: string[]; // array of ISO date strings (YYYY-MM-DD)
};
```

Both stored in `localStorage` under keys `habits` and `completions`.

---

## Tech Stack
- React (functional components + hooks)
- Tailwind CSS for styling
- No external dependencies beyond React + Tailwind
- Single `.jsx` file

---

## Out of Scope (keep it simple)
- No user accounts
- No notifications
- No monthly/yearly view
- No drag-to-reorder

---

# Claude Code Prompt

Use the spec below to build the app. Copy and paste this directly into Claude Code:

---

```
Build a habit tracker React app as a single self-contained JSX file called `HabitTracker.jsx`. Use Tailwind CSS for all styling. No external libraries beyond React and Tailwind.

Requirements:

**Data & Persistence**
- Store habits and completions in localStorage
- Habit shape: { id, name, emoji, createdAt }
- Completions shape: { [habitId]: ["YYYY-MM-DD", ...] }

**UI Layout**
- Dark background (#0f0f0f or similar)
- Header showing app title + overall week completion % (e.g. "73% this week")
- Main area: a weekly grid table
  - Rows = habits, Columns = Mon–Sun of the current week
  - Today's column highlighted with a subtle accent color
  - Each cell is a clickable toggle (empty circle → filled checkmark)
  - Smooth scale + color animation on toggle
- Left side of each row: emoji + habit name + current streak (🔥 if 3+ days)
- Right side of each row: "X/7" completion count for the week + a delete button
- Bottom: inline "Add habit" input with an emoji picker (just a text input for the emoji) and a name input. Submit on Enter or a + button.
- Empty state: centered message "No habits yet — add one below 👇"

**Logic**
- Streak = consecutive days completed going backwards from today
- Week = Monday to Sunday of the current calendar week
- Completing/uncompleting a day toggles that date in the completions array

**Code quality**
- Clean, readable component structure
- Use useLocalStorage custom hook for persistence
- Default export the main HabitTracker component
```
