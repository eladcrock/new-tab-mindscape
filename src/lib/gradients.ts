// Curated Color Hunt-style gradients. Each tab picks one at random.
// Each entry includes a CSS gradient and a foreground color (light/dark) for contrast.

export type Gradient = {
  id: string;
  css: string;
  fg: "light" | "dark";
};

export const GRADIENTS: Gradient[] = [
  { id: "peach",    css: "linear-gradient(135deg, #FFD3A5 0%, #FD6585 100%)", fg: "dark" },
  { id: "mint",     css: "linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)", fg: "dark" },
  { id: "violet",   css: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)", fg: "light" },
  { id: "sunset",   css: "linear-gradient(135deg, #FA709A 0%, #FEE140 100%)", fg: "dark" },
  { id: "ocean",    css: "linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)", fg: "light" },
  { id: "forest",   css: "linear-gradient(135deg, #134E5E 0%, #71B280 100%)", fg: "light" },
  { id: "candy",    css: "linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%)", fg: "dark" },
  { id: "midnight", css: "linear-gradient(135deg, #0F2027 0%, #2C5364 100%)", fg: "light" },
  { id: "rose",     css: "linear-gradient(135deg, #FFC3A0 0%, #FFAFBD 100%)", fg: "dark" },
  { id: "aurora",   css: "linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)", fg: "dark" },
  { id: "plum",     css: "linear-gradient(135deg, #614385 0%, #516395 100%)", fg: "light" },
  { id: "ember",    css: "linear-gradient(135deg, #F12711 0%, #F5AF19 100%)", fg: "light" },
  { id: "lilac",    css: "linear-gradient(135deg, #C471F5 0%, #FA71CD 100%)", fg: "light" },
  { id: "sky",      css: "linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)", fg: "light" },
  { id: "sand",     css: "linear-gradient(135deg, #F6D365 0%, #FDA085 100%)", fg: "dark" },
  { id: "noir",     css: "linear-gradient(135deg, #232526 0%, #414345 100%)", fg: "light" },
];

export function randomGradient(exclude?: string): Gradient {
  const pool = exclude ? GRADIENTS.filter((g) => g.id !== exclude) : GRADIENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
