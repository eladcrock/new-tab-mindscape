// Local-only storage for anonymous users. Mirrors the cloud schemas.
import { STARTER_LENSES, type Lens } from "./starter-lenses";

const KEYS = {
  goals: "lenstab.goals",
  lenses: "lenstab.lenses",
  reflections: "lenstab.reflections",
  palettes: "lenstab.palettes",
  initialized: "lenstab.initialized",
};

export type LocalGoal = { id: string; title: string; description?: string; active: boolean; created_at: string };
export type LocalReflection = {
  id: string;
  lens_id: string | null;
  lens_name: string | null;
  question: string;
  answer: string | null;
  palette: string[];
  mood: string | null;
  created_at: string;
};
export type LocalPalette = { id: string; colors: string[]; name?: string; created_at: string };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureLocalSeed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.initialized)) return;
  write(KEYS.lenses, STARTER_LENSES);
  write(KEYS.goals, []);
  write(KEYS.reflections, []);
  write(KEYS.palettes, []);
  localStorage.setItem(KEYS.initialized, "1");
}

export const localStore = {
  getGoals: () => read<LocalGoal[]>(KEYS.goals, []),
  setGoals: (g: LocalGoal[]) => write(KEYS.goals, g),
  getLenses: () => read<Lens[]>(KEYS.lenses, STARTER_LENSES),
  setLenses: (l: Lens[]) => write(KEYS.lenses, l),
  getReflections: () => read<LocalReflection[]>(KEYS.reflections, []),
  addReflection: (r: LocalReflection) => {
    const all = read<LocalReflection[]>(KEYS.reflections, []);
    write(KEYS.reflections, [r, ...all].slice(0, 500));
  },
  updateReflection: (id: string, patch: Partial<LocalReflection>) => {
    const all = read<LocalReflection[]>(KEYS.reflections, []);
    write(KEYS.reflections, all.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  },
  getPalettes: () => read<LocalPalette[]>(KEYS.palettes, []),
  addPalette: (p: LocalPalette) => {
    const all = read<LocalPalette[]>(KEYS.palettes, []);
    write(KEYS.palettes, [p, ...all]);
  },
  removePalette: (id: string) => {
    write(KEYS.palettes, read<LocalPalette[]>(KEYS.palettes, []).filter((p) => p.id !== id));
  },
};

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
