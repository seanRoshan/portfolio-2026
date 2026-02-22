export interface FontOption {
  family: string
  category: 'sans-serif' | 'serif' | 'monospace' | 'display'
}

export const GOOGLE_FONTS: FontOption[] = [
  // Sans-Serif
  { family: 'Inter', category: 'sans-serif' },
  { family: 'Roboto', category: 'sans-serif' },
  { family: 'Open Sans', category: 'sans-serif' },
  { family: 'Lato', category: 'sans-serif' },
  { family: 'Source Sans 3', category: 'sans-serif' },
  { family: 'Nunito', category: 'sans-serif' },
  { family: 'Poppins', category: 'sans-serif' },
  { family: 'Montserrat', category: 'sans-serif' },
  { family: 'Raleway', category: 'sans-serif' },
  { family: 'Work Sans', category: 'sans-serif' },
  { family: 'DM Sans', category: 'sans-serif' },
  { family: 'IBM Plex Sans', category: 'sans-serif' },
  { family: 'Noto Sans', category: 'sans-serif' },
  { family: 'PT Sans', category: 'sans-serif' },
  { family: 'Barlow', category: 'sans-serif' },
  { family: 'Cabin', category: 'sans-serif' },
  { family: 'Karla', category: 'sans-serif' },
  { family: 'Rubik', category: 'sans-serif' },
  { family: 'Outfit', category: 'sans-serif' },
  { family: 'Plus Jakarta Sans', category: 'sans-serif' },
  { family: 'Figtree', category: 'sans-serif' },

  // Serif
  { family: 'Georgia', category: 'serif' },
  { family: 'EB Garamond', category: 'serif' },
  { family: 'Merriweather', category: 'serif' },
  { family: 'Playfair Display', category: 'serif' },
  { family: 'Lora', category: 'serif' },
  { family: 'Source Serif 4', category: 'serif' },
  { family: 'Libre Baskerville', category: 'serif' },
  { family: 'PT Serif', category: 'serif' },
  { family: 'Crimson Text', category: 'serif' },
  { family: 'Bitter', category: 'serif' },
  { family: 'IBM Plex Serif', category: 'serif' },
  { family: 'Noto Serif', category: 'serif' },
  { family: 'Cormorant Garamond', category: 'serif' },

  // Monospace
  { family: 'Source Code Pro', category: 'monospace' },
  { family: 'JetBrains Mono', category: 'monospace' },
  { family: 'Fira Code', category: 'monospace' },
  { family: 'IBM Plex Mono', category: 'monospace' },
  { family: 'Roboto Mono', category: 'monospace' },
  { family: 'Inconsolata', category: 'monospace' },
  { family: 'Space Mono', category: 'monospace' },
]

export function googleFontUrl(family: string): string {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700&display=swap`
}

export function fontFamilyCss(family: string, category: string = 'sans-serif'): string {
  return `"${family}", ${category}`
}

export function findFont(family: string): FontOption | undefined {
  return GOOGLE_FONTS.find((f) => f.family === family)
}
