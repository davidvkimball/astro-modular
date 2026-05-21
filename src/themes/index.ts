
// Import custom theme if it exists
let customTheme = null;
try {
  // Try to load the custom theme directly
  const custom = require('./custom/custom');
  customTheme = custom.customTheme;
} catch (error) {
  // Custom theme not found, that's okay - use a fallback
  customTheme = {
    primary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617"
    },
    highlight: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a"
    }
  };
}

// Theme color definitions
export const themes = {
  minimal: {
    primary: {
      50: '#fafafa',
      100: '#f5f5f5', 
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#212121',
      950: '#1a1a1a',
    },
    highlight: {
      50: '#f0f7f9',
      100: '#e1eff3',
      200: '#c3dfe7',
      300: '#a5cfdb',
      400: '#87bfcf',
      500: '#708794',
      600: '#5a6d77',
      700: '#43535a',
      800: '#2d383c',
      900: '#161d1f',
    }
  },
  oxygen: {
    primary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    highlight: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    }
  },
  atom: {
    primary: {
      50: '#fafafa',
      100: '#eaeaeb',
      200: '#dbdbdc',
      300: '#d8d8d9',
      400: '#8e8e90',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#282c34',
      900: '#21252c',
      950: '#181a1f',
    },
    highlight: {
      50: '#e6f3ff',
      100: '#cce7ff',
      200: '#99cfff',
      300: '#66b7ff',
      400: '#578af2',
      500: '#3d74e2',
      600: '#1a92ff',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    }
  },
  ayu: {
    primary: {
      50: '#fefefe',
      100: '#fcfcfc',
      200: '#f8f8f8',
      300: '#f0f0f0',
      400: '#d5d5d5',
      500: '#a8a8a8',
      600: '#7a7a7a',
      700: '#545454',
      800: '#2f2f2f',
      900: '#1f1f1f',
      950: '#0f1419',
    },
    highlight: {
      50: '#fff4e6',
      100: '#ffe8cc',
      200: '#ffd199',
      300: '#ffba66',
      400: '#ff9933',
      500: '#e6913d',
      600: '#cc7a2e',
      700: '#b36624',
      800: '#99521a',
      900: '#804010',
    }
  },
  catppuccin: {
    primary: {
      50: '#faf4ed',
      100: '#f2e9e1',
      200: '#e9d8d0',
      300: '#ddbea9',
      400: '#a6a9b8',
      500: '#7f849c',
      600: '#6c7086',
      700: '#585b70',
      800: '#313244',
      900: '#1e1e2e',
      950: '#181825',
    },
    highlight: {
      50: '#fcf0ee',
      100: '#f7ddd8',
      200: '#efbbb1',
      300: '#e7998a',
      400: '#df7763',
      500: '#dcb6af',
      600: '#c49a8f',
      700: '#ad7e6f',
      800: '#95624f',
      900: '#7d462f',
    }
  },
  dracula: {
    primary: {
      50: '#ffffff',
      100: '#faf8ff',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#6272a4',
      600: '#44475a',
      700: '#3d4050',
      800: '#282a37',
      900: '#21222c',
      950: '#191a21',
    },
    highlight: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#a474e6',
      700: '#8b5cf6',
      800: '#7c3aed',
      900: '#6d28d9',
    }
  },
  'charcoal': {
    primary: {
      50: '#ffffff',
      100: '#ffffff',
      200: '#f8f8f8',
      300: '#e0e0e0',
      400: '#c0c0c0',
      500: '#808080',
      600: '#606060',
      700: '#404040',
      800: '#202020',
      900: '#000000',
      950: '#000000',
    },
    highlight: {
      50: '#ffffff',
      100: '#f0f0f0',
      200: '#e0e0e0',
      300: '#d0d0d0',
      400: '#c0c0c0',
      500: '#808080',
      600: '#606060',
      700: '#404040',
      800: '#202020',
      900: '#000000',
    }
  },
  everforest: {
    primary: {
      50: '#fdf6e3',
      100: '#f4f4f1',
      200: '#efebd4',
      300: '#e6e2cc',
      400: '#d3c6aa',
      500: '#a89984',
      600: '#859289',
      700: '#7a8478',
      800: '#4f5b58',
      900: '#343f44',
      950: '#2d353b',
    },
    highlight: {
      50: '#f0f9f0',
      100: '#dcf2dc',
      200: '#b8e6b8',
      300: '#9dd9bd',
      400: '#83c092',
      500: '#a7c080',
      600: '#87a987',
      700: '#6d926d',
      800: '#5a7a5a',
      900: '#4a6635',
    }
  },
  flexoki: {
    primary: {
      50: '#fffcf0',
      100: '#f2f0e5',
      200: '#e6e4d9',
      300: '#dad8ce',
      400: '#cecdc3',
      500: '#b7b5ac',
      600: '#9c9a91',
      700: '#878681',
      800: '#575653',
      900: '#1c1b1a',
      950: '#100f0f',
    },
    highlight: {
      50: '#e6f7f6',
      100: '#cceeec',
      200: '#99ddd9',
      300: '#66ccc6',
      400: '#4dbdb5',
      500: '#319089',
      600: '#287a74',
      700: '#1f655f',
      800: '#16504a',
      900: '#0d3b35',
    }
  },
  gruvbox: {
    primary: {
      50: '#fbf1c7',
      100: '#f2e5bc',
      200: '#ebdbb2',
      300: '#d5c4a1',
      400: '#bdae93',
      500: '#a89984',
      600: '#928374',
      700: '#7c6f64',
      800: '#504945',
      900: '#3c3836',
      950: '#1d2021',
    },
    highlight: {
      50: '#fef2e6',
      100: '#fde2cc',
      200: '#fbc599',
      300: '#f9a866',
      400: '#f78b33',
      500: '#d79921',
      600: '#b8821c',
      700: '#996b17',
      800: '#7a5412',
      900: '#5b3d0d',
    }
  },
  macos: {
    primary: {
      50: '#ffffff',
      100: '#f9f9f9',
      200: '#f0f0f0',
      300: '#e0e0e0',
      400: '#c0c0c0',
      500: '#a0a0a0',
      600: '#808080',
      700: '#606060',
      800: '#404040',
      900: '#1e1e1e',
      950: '#141414',
    },
    highlight: {
      50: '#e6f3ff',
      100: '#cce7ff',
      200: '#99cfff',
      300: '#66b7ff',
      400: '#339fff',
      500: '#007aff',
      600: '#0056cc',
      700: '#004299',
      800: '#002e66',
      900: '#001a33',
    }
  },
  nord: {
    primary: {
      50: '#eceff4',
      100: '#e5e9f0',
      200: '#d8dee9',
      300: '#c5d0e1',
      400: '#a3b5cc',
      500: '#81a1c1',
      600: '#668bb3',
      700: '#5e81ac',
      800: '#434c5e',
      900: '#3b4252',
      950: '#2e3440',
    },
    highlight: {
      50: '#e8f4f8',
      100: '#d1e9f2',
      200: '#a3d3e5',
      300: '#75bdd8',
      400: '#5e94b8',
      500: '#5e81ac',
      600: '#4c729c',
      700: '#3a5f7d',
      800: '#2e4c63',
      900: '#233a4a',
    }
  },
  'rose-pine': {
    primary: {
      50: '#faf4ed',
      100: '#f2e9e1',
      200: '#e9d8d0',
      300: '#ddbea9',
      400: '#c5a590',
      500: '#908caa',
      600: '#6e6a86',
      700: '#56526e',
      800: '#403d52',
      900: '#26233a',
      950: '#191724',
    },
    highlight: {
      50: '#fdf2f4',
      100: '#fbe5ea',
      200: '#f7cbd4',
      300: '#f3b1bf',
      400: '#ef97a9',
      500: '#eb6f92',
      600: '#d65577',
      700: '#c13b5c',
      800: '#ab2142',
      900: '#960727',
    }
  },
  sky: {
    primary: {
      50: '#f7f6f4',
      100: '#ededec',
      200: '#e8e7e4',
      300: '#dbdbda',
      400: '#aaa9a5',
      500: '#72706c',
      600: '#585d5f',
      700: '#4b5053',
      800: '#373c3f',
      900: '#2f3437',
      950: '#232729',
    },
    highlight: {
      50: '#e6f4f8',
      100: '#cce9f2',
      200: '#99d3e5',
      300: '#66bdd8',
      400: '#46aad0',
      500: '#2eaadc',
      600: '#2592c4',
      700: '#1c79ac',
      800: '#136194',
      900: '#0a487c',
    }
  },
  solarized: {
    primary: {
      50: '#fdf6e3',
      100: '#eee8d5',
      200: '#e4dcc1',
      300: '#d6ceaa',
      400: '#b8a882',
      500: '#93a1a1',
      600: '#839496',
      700: '#657b83',
      800: '#586e75',
      900: '#073642',
      950: '#002b36',
    },
    highlight: {
      50: '#e6f3ff',
      100: '#cce7ff',
      200: '#99cfff',
      300: '#66b7ff',
      400: '#339fff',
      500: '#268bd2',
      600: '#1e6fa8',
      700: '#16537e',
      800: '#0e3754',
      900: '#061b2a',
    }
  },
  things: {
    primary: {
      50: '#ffffff',
      100: '#f5f6f8',
      200: '#eef0f4',
      300: '#d8dadd',
      400: '#c1c3c6',
      500: '#a9abb0',
      600: '#7d7f84',
      700: '#6c6e70',
      800: '#45464a',
      900: '#24262a',
      950: '#17191c',
    },
    highlight: {
      50: '#e6f3ff',
      100: '#cce7ff',
      200: '#99cfff',
      300: '#66b7ff',
      400: '#4d95f7',
      500: '#1b61c2',
      600: '#1c88dd',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#172554',
    }
  },
  obsidian: {
    primary: {
      50: '#f5f5f5',
      100: '#e5e5e5',
      200: '#d4d4d4',
      300: '#a3a3a3',
      400: '#737373',
      500: '#525252',
      600: '#404040',
      700: '#262626',
      800: '#1e1e1e',
      900: '#171717',
      950: '#0a0a0a',
    },
    highlight: {
      50: '#f3f0ff',
      100: '#e9e2ff',
      200: '#d6c7ff',
      300: '#bba3ff',
      400: '#9c75ff',
      500: '#8257e7',
      600: '#7247cc',
      700: '#6238b0',
      800: '#522994',
      900: '#441f78',
    }
  },
  ...(customTheme ? { custom: customTheme } : {})
} as const;

// Valid theme names type
export type ThemeName = keyof typeof themes;

// Helper function to get theme
export function getTheme(themeName: ThemeName) {
  return themes[themeName];
}

// Get all theme names
export function getThemeNames(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}

// Check if a theme name is a custom theme (not in built-in themes)
export function isCustomTheme(themeName: string): boolean {
  const builtInThemes = [
    'minimal', 'oxygen', 'atom', 'ayu', 'catppuccin', 'charcoal', 'dracula', 
    'everforest', 'flexoki', 'gruvbox', 'macos', 'nord', 'obsidian', 
    'rose-pine', 'sky', 'solarized', 'things', 'custom'
  ];
  return !builtInThemes.includes(themeName);
}

// Load a custom theme by filename (for dynamic loading)
//
// Uses `import.meta.glob` with a static literal pattern so Vite can statically
// analyze and bundle every file in ./custom/ at build time. A runtime
// `await import(`./custom/${name}`)` works in dev but is fragile in prod
// builds, and (separately) the old implementation only looked for the
// `customTheme` export — files that export under a different name (e.g.
// `export const custom = {...}` from the Obsidian extractor) would silently
// return undefined. This matches the resolution logic in BaseLayout.astro.
const customThemeModules = import.meta.glob('./custom/*.ts', { eager: true }) as Record<string, Record<string, any>>;

export async function loadCustomTheme(themeName: string) {
  const mod = customThemeModules[`./custom/${themeName}.ts`];
  if (!mod) {
    console.warn(`Custom theme "${themeName}" not found in themes/custom/`);
    return null;
  }

  // Export-name fallback chain: customTheme → {filename}Theme → default →
  // any export with .primary + .highlight.
  if (mod.customTheme) return mod.customTheme;
  if (mod[`${themeName}Theme`]) return mod[`${themeName}Theme`];
  if (mod.default) return mod.default;
  const themeExport = Object.keys(mod).find(
    k => mod[k] && typeof mod[k] === 'object' && mod[k].primary && mod[k].highlight
  );
  if (themeExport) return mod[themeExport];

  console.warn(`Custom theme "${themeName}" was found but doesn't export a theme object with .primary and .highlight.`);
  return null;
}