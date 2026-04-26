// Lightweight client-side scoring + streak tracking for reflections.
// Stored locally per browser — no schema change required.
const KEY = "lenstab.reflection.streak.v1";

export type StreakState = {
  total: number;        // lifetime count of saved reflections
  points: number;       // accumulated points
  streak: number;       // consecutive-day streak
  lastDay: string | null; // YYYY-MM-DD of last save
};

const empty: StreakState = { total: 0, points: 0, streak: 0, lastDay: null };

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}

export function readStreak(): StreakState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

export type StreakReward = {
  state: StreakState;
  pointsEarned: number;
  streakBonus: number;
  milestone: string | null; // big celebration text when crossing a milestone
  encouragement: string;    // always present
};

const ENCOURAGEMENTS = [
  "Nicely done — momentum builds.",
  "That's another lens turned on the world.",
  "Showing up matters. Keep going.",
  "One more thread woven into the picture.",
  "Curiosity rewarded.",
  "Steady hands, steady mind.",
  "Small reflections compound.",
  "The work you do here adds up.",
];

function pickEncouragement(): string {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

export function recordReflection(): StreakReward {
  const state = readStreak();
  const today = todayStr();
  let streak = state.streak;
  let streakBonus = 0;

  if (state.lastDay === null) {
    streak = 1;
  } else {
    const gap = daysBetween(state.lastDay, today);
    if (gap === 0) {
      // same-day, streak unchanged
    } else if (gap === 1) {
      streak += 1;
      streakBonus = Math.min(streak, 10); // small bonus that grows with streak, capped
    } else {
      streak = 1; // reset
    }
  }

  const base = 10;
  const pointsEarned = base + streakBonus;

  const next: StreakState = {
    total: state.total + 1,
    points: state.points + pointsEarned,
    streak,
    lastDay: today,
  };

  let milestone: string | null = null;
  if (next.total === 1) milestone = "First reflection — you've started.";
  else if (next.total === 5) milestone = "5 reflections. A practice is forming.";
  else if (next.total === 10) milestone = "10 reflections — keep pulling threads.";
  else if (next.total === 25) milestone = "25 reflections. You're building a real archive of yourself.";
  else if (next.total === 50) milestone = "50 reflections. That's a body of work.";
  else if (next.total === 100) milestone = "100 reflections. Extraordinary consistency.";
  else if (streak > 1 && streak % 7 === 0) milestone = `${streak}-day streak 🔥`;
  else if (streak > 1 && [3, 5].includes(streak)) milestone = `${streak} days in a row.`;

  if (typeof window !== "undefined") {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  return {
    state: next,
    pointsEarned,
    streakBonus,
    milestone,
    encouragement: pickEncouragement(),
  };
}
