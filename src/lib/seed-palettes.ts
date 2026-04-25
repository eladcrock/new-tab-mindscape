// Curated Color Hunt-style palettes used as fallback and for shuffling
export const SEED_PALETTES: string[][] = [
  ["#222831", "#393E46", "#00ADB5", "#EEEEEE"],
  ["#F8B195", "#F67280", "#C06C84", "#6C5B7B"],
  ["#264653", "#2A9D8F", "#E9C46A", "#F4A261"],
  ["#FFE5B4", "#FFB7B2", "#B5EAD7", "#C7CEEA"],
  ["#1A1A2E", "#16213E", "#0F3460", "#E94560"],
  ["#F6F4E6", "#F4EAD5", "#7A9D54", "#557A46"],
  ["#FAF3E0", "#EADBC8", "#DAC0A3", "#102C57"],
  ["#FFF8E7", "#FFD93D", "#FF6B6B", "#6BCB77"],
  ["#0F0F0F", "#232D3F", "#005B41", "#008170"],
  ["#FDF6EC", "#FFD0D0", "#FFAFAF", "#FF8989"],
  ["#EFE9D9", "#A4907C", "#8D7B68", "#4F4A45"],
  ["#0B2447", "#19376D", "#576CBC", "#A5D7E8"],
  ["#FFF5E0", "#FF6969", "#C70039", "#141E46"],
  ["#F0F0F0", "#FFA38F", "#FFD3B0", "#A87C7C"],
  ["#E3F4F4", "#D2E9E9", "#C4DFDF", "#F8F6F4"],
  ["#FBF8DD", "#F2BE22", "#F29727", "#F24C3D"],
  ["#212121", "#323232", "#0D7377", "#14FFEC"],
  ["#FFEEDD", "#FFD3B6", "#FFAAA5", "#FF8B94"],
  ["#22092C", "#872341", "#BE3144", "#F05941"],
  ["#F1F0E8", "#EEE0C9", "#ADBC9F", "#436850"],
  ["#FCF8E8", "#F8E1B6", "#7DB9B6", "#5C8984"],
  ["#FFFAE5", "#FFC436", "#0174BE", "#0C356A"],
  ["#FAEED1", "#DED0B6", "#BBAB8C", "#102C57"],
  ["#F1FADA", "#A0D8B3", "#79AC78", "#618264"],
  ["#FFF1DC", "#EAD8C0", "#A87C7C", "#1F1717"],
  ["#FFFAF4", "#F4DECB", "#A05C53", "#594545"],
  ["#FAF3F0", "#D6E4E5", "#EFF5F5", "#497174"],
  ["#FAF3F0", "#FFC3A1", "#FF9B9B", "#6E85B7"],
  ["#FFFBE9", "#E3CAA5", "#CEAB93", "#AD8B73"],
  ["#FFFDE7", "#FFD600", "#FF6F00", "#3E2723"],
];

export function randomSeedPalette(): string[] {
  return SEED_PALETTES[Math.floor(Math.random() * SEED_PALETTES.length)];
}
