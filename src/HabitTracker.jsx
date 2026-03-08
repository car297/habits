import { useState, useCallback, useRef, useEffect } from "react";

// ── helpers ────────────────────────────────────────────────────────────────

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekDays(offsetWeeks = 0) {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7) + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatWeekLabel(weekDays) {
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(weekDays[0])} – ${fmt(weekDays[6])}`;
}

function calcStreak(completions) {
  const cursor = new Date();
  let streak = 0;
  while (completions.includes(toISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getLastNDays(n) {
  const days = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - n + 1);
  for (let i = 0; i < n; i++) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function fmtDate(isoOrTs) {
  return new Date(isoOrTs).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

// ── useLocalStorage ────────────────────────────────────────────────────────

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (updater) => {
      setValue((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [key]
  );

  return [value, set];
}

// ── CheckCell ──────────────────────────────────────────────────────────────

function CheckCell({ done, onToggle, isToday, isFuture }) {
  return (
    <td className={`text-center py-2 px-1 ${isToday ? "bg-indigo-50 dark:bg-indigo-950/60" : ""}`}>
      <button
        onClick={isFuture ? undefined : onToggle}
        disabled={isFuture}
        className={`
          w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto
          transition-all duration-150
          ${isFuture
            ? "border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-30"
            : done
              ? "bg-indigo-500 border-indigo-400 scale-110 text-white"
              : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 text-transparent"
          }
        `}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done ? "✓" : ""}
      </button>
    </td>
  );
}

// ── HabitRow ───────────────────────────────────────────────────────────────

function HabitRow({ habit, completions, weekDays, todayISO, onToggle, onDelete, onOpen }) {
  const habitCompletions = completions[habit.id] || [];
  const streak = calcStreak(habitCompletions);
  const weekCount = weekDays.filter((d) => habitCompletions.includes(toISO(d))).length;

  return (
    <tr className="border-b border-gray-200 dark:border-gray-800 group">
      <td className="py-3 px-3 whitespace-nowrap">
        <button
          onClick={() => onOpen(habit.id)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
        >
          <span className="text-xl">{habit.emoji}</span>
          <span className="text-gray-800 dark:text-gray-200 font-medium text-sm underline-offset-2 hover:underline">
            {habit.name}
          </span>
          {streak > 0 && (
            <span className="text-xs text-gray-500">
              {streak >= 3 ? "🔥" : "🗓️"} {streak}d
            </span>
          )}
        </button>
      </td>

      {weekDays.map((day) => {
        const iso = toISO(day);
        return (
          <CheckCell
            key={iso}
            done={habitCompletions.includes(iso)}
            isToday={iso === todayISO}
            isFuture={iso > todayISO}
            onToggle={() => onToggle(habit.id, iso)}
          />
        );
      })}

      <td className="py-3 px-3 text-right whitespace-nowrap">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{weekCount}/7</span>
        <button
          onClick={() => onDelete(habit.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all text-xs px-1"
          aria-label="Delete habit"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

// ── ActivityHeatmap ────────────────────────────────────────────────────────

function ActivityHeatmap({ completions }) {
  const days = getLastNDays(28);
  const todayISO = toISO(new Date());
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">Last 4 weeks</p>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => {
              const iso = toISO(day);
              const done = completions.includes(iso);
              const isToday = iso === todayISO;
              return (
                <div
                  key={iso}
                  title={iso}
                  className={`w-6 h-6 rounded-sm transition-colors ${
                    done
                      ? "bg-indigo-500"
                      : isToday
                        ? "bg-gray-300 dark:bg-gray-700 ring-1 ring-indigo-500"
                        : "bg-gray-200 dark:bg-gray-800"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1 text-xs text-gray-400 dark:text-gray-600">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div key={i} className="w-6 text-center">{d}</div>
        ))}
      </div>
    </div>
  );
}

// ── HabitDetail (drawer) ───────────────────────────────────────────────────

function HabitDetail({ habit, completions, journal, onClose, onAddEntry, onDeleteEntry, onRename }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(habit.name);
  const nameInputRef = useRef(null);
  const textareaRef = useRef(null);
  const habitCompletions = completions[habit.id] || [];
  const entries = (journal[habit.id] || []).slice().reverse();
  const streak = calcStreak(habitCompletions);
  const totalDone = habitCompletions.length;

  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        if (editingName) { setEditingName(false); setNameValue(habit.name); }
        else onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editingName, habit.name]);

  function commitRename() {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== habit.name) onRename(habit.id, trimmed);
    else setNameValue(habit.name);
    setEditingName(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onAddEntry(habit.id, { title: title.trim(), text: text.trim() });
    setText("");
    setTitle("");
    textareaRef.current?.focus();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden />

      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#141414] border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-2xl">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{habit.emoji}</span>
            <div>
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === "Enter") commitRename(); }}
                  className="bg-gray-100 dark:bg-gray-700 border border-indigo-500 rounded px-2 py-0.5 text-base font-semibold text-gray-900 dark:text-gray-100 focus:outline-none w-48"
                />
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="font-semibold text-gray-900 dark:text-gray-100 text-base hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors text-left group/name"
                  title="Click to rename"
                >
                  {habit.name}
                  <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-600 group-hover/name:text-gray-600 dark:group-hover/name:text-gray-400">✎</span>
                </button>
              )}
              <p className="text-xs text-gray-500">Since {fmtDate(habit.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-lg leading-none p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800/60 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-indigo-500 dark:text-indigo-400">
                {streak >= 3 ? "🔥" : streak}{streak >= 3 ? ` ${streak}` : ""}
              </div>
              <div className="text-xs text-gray-500 mt-1">day streak</div>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800/60 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{totalDone}</div>
              <div className="text-xs text-gray-500 mt-1">total days</div>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800/60 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{entries.length}</div>
              <div className="text-xs text-gray-500 mt-1">journal entries</div>
            </div>
          </div>

          {/* Heatmap */}
          <ActivityHeatmap completions={habitCompletions} />

          {/* Add journal entry */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Add Journal Entry
            </h3>
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a note, reflection, or anything…"
                rows={4}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 dark:text-gray-600">⌘↵ to save</span>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded px-4 py-1.5 text-sm font-semibold transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>

          {/* Journal entries list */}
          {entries.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Journal ({entries.length})
              </h3>
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3 group/entry"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        {entry.title && (
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{entry.title}</p>
                        )}
                        <p className="text-xs text-gray-500">{fmtDateTime(entry.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => onDeleteEntry(habit.id, entry.id)}
                        className="opacity-0 group-hover/entry:opacity-100 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all text-xs shrink-0"
                        aria-label="Delete entry"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-4">
              No journal entries yet. Write your first one above.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

// ── AddHabitRow ────────────────────────────────────────────────────────────

function AddHabitRow({ onAdd }) {
  const [emoji, setEmoji] = useState("✅");
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ emoji: emoji || "✅", name: trimmed });
    setName("");
    setEmoji("✅");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4 px-3">
      <input
        type="text"
        value={emoji}
        onChange={(e) => setEmoji(e.target.value)}
        maxLength={4}
        placeholder="✅"
        className="w-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1.5 text-center text-lg focus:outline-none focus:border-indigo-500"
        aria-label="Emoji"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add a habit…"
        className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        aria-label="Habit name"
      />
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1.5 text-sm font-semibold transition-colors"
      >
        +
      </button>
    </form>
  );
}

// ── HabitTracker ───────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HabitTracker() {
  const [habits, setHabits] = useLocalStorage("habits", []);
  const [completions, setCompletions] = useLocalStorage("completions", {});
  const [journal, setJournal] = useLocalStorage("journal", {});
  const [weekOffset, setWeekOffset] = useState(0);
  const [openHabitId, setOpenHabitId] = useState(null);
  const [dark, setDark] = useLocalStorage("darkMode", true);

  const todayISO = toISO(new Date());
  const weekDays = getWeekDays(weekOffset);
  const isCurrentWeek = weekOffset === 0;
  const openHabit = habits.find((h) => h.id === openHabitId) ?? null;

  const totalCells = habits.length * 7;
  const completedCells = habits.reduce((acc, h) => {
    const hc = completions[h.id] || [];
    return acc + weekDays.filter((d) => hc.includes(toISO(d))).length;
  }, 0);
  const weekScore = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : null;

  function handleToggle(habitId, iso) {
    setCompletions((prev) => {
      const existing = prev[habitId] || [];
      const updated = existing.includes(iso)
        ? existing.filter((d) => d !== iso)
        : [...existing, iso];
      return { ...prev, [habitId]: updated };
    });
  }

  function handleAdd({ emoji, name }) {
    setHabits((prev) => [
      ...prev,
      { id: uid(), name, emoji, createdAt: new Date().toISOString() },
    ]);
  }

  function handleDelete(habitId) {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setCompletions((prev) => { const n = { ...prev }; delete n[habitId]; return n; });
    setJournal((prev) => { const n = { ...prev }; delete n[habitId]; return n; });
    if (openHabitId === habitId) setOpenHabitId(null);
  }

  function handleAddEntry(habitId, { title, text }) {
    setJournal((prev) => ({
      ...prev,
      [habitId]: [
        ...(prev[habitId] || []),
        { id: uid(), title, text, createdAt: Date.now() },
      ],
    }));
  }

  function handleRename(habitId, newName) {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, name: newName } : h))
    );
  }

  function handleDeleteEntry(habitId, entryId) {
    setJournal((prev) => ({
      ...prev,
      [habitId]: (prev[habitId] || []).filter((e) => e.id !== entryId),
    }));
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 font-sans">
        {/* Header */}
        <header className="px-4 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Habit Tracker</h1>
          <div className="flex items-center gap-3">
            {weekScore !== null && (
              <span className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                {weekScore}%{isCurrentWeek ? " this week" : " that week"}
              </span>
            )}
            <button
              onClick={() => setDark((d) => !d)}
              className="text-lg leading-none p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-2 py-6">
          {/* Week navigation */}
          <div className="flex items-center justify-between px-3 mb-4">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              ← Prev
            </button>

            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatWeekLabel(weekDays)}
              </div>
              {!isCurrentWeek ? (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 mt-0.5"
                >
                  Back to today
                </button>
              ) : (
                <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Current week</div>
              )}
            </div>

            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              disabled={isCurrentWeek}
              className={`px-2 py-1 rounded transition-colors ${
                isCurrentWeek
                  ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              Next →
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 mt-20 text-base">
              No habits yet — add one below 👇
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2 px-3 text-left text-gray-500 font-medium text-xs">Habit</th>
                    {weekDays.map((day, i) => {
                      const iso = toISO(day);
                      const isToday = iso === todayISO;
                      return (
                        <th
                          key={iso}
                          className={`py-2 px-1 text-center text-xs font-medium w-10 ${
                            isToday
                              ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60"
                              : "text-gray-500"
                          }`}
                        >
                          <div>{DAY_LABELS[i]}</div>
                          <div className="text-gray-400 dark:text-gray-600 font-normal">{day.getDate()}</div>
                        </th>
                      );
                    })}
                    <th className="py-2 px-3 text-right text-gray-500 font-medium text-xs">Week</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit) => (
                    <HabitRow
                      key={habit.id}
                      habit={habit}
                      completions={completions}
                      weekDays={weekDays}
                      todayISO={todayISO}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onOpen={setOpenHabitId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AddHabitRow onAdd={handleAdd} />
        </main>

        {openHabit && (
          <HabitDetail
            habit={openHabit}
            completions={completions}
            journal={journal}
            onClose={() => setOpenHabitId(null)}
            onAddEntry={handleAddEntry}
            onDeleteEntry={handleDeleteEntry}
            onRename={handleRename}
          />
        )}
      </div>
    </div>
  );
}
