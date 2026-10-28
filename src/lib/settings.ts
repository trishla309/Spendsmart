// SpendSmart Settings & Theme Utilities

export type CurrencySymbol = "$" | "₹" | "€" | "£";
export type PaymentMethod = "Online" | "Cash";

export type AppThemeId =
  // 🎨 Curated Editorial & Balanced Themes (from user palettes)
  | "bordo-pine"
  | "violet-dusk"
  | "velvet-burgundy"
  | "espresso-mint"
  | "shaded-spruce"
  // 🌙 Deep Velvety Moods
  | "cosmic-twilight"
  | "midnight-sakura"
  | "emerald-zen"
  | "sunset-mirage"
  | "obsidian-luxe"
  // Backward compatibility
  | "dark"
  | "light"
  | "sakura-day"
  | "matcha-garden"
  | "sunshine-peach"
  | "lavender-milk"
  | "ocean-breeze";

export interface ThemeOption {
  id: AppThemeId;
  name: string;
  category: "curated" | "mood";
  tagline: string;
  emoji: string;
  bgPreview: string;
  cardPreview: string;
  borderPreview: string;
  accentColor: string;
  accentGlow: string;
  palette: string[]; // 4 complementary preview colors
}

export const THEME_OPTIONS: ThemeOption[] = [
  // 1. 🍷 Bordo Atelier (Image 1: Bordo #6C151E, Green #0F3D3A, Cream #F5DABF)
  {
    id: "bordo-pine",
    name: "Bordo Atelier",
    category: "curated",
    tagline: "Deep pine evergreen, bordeaux & warm champagne cream",
    emoji: "🍷",
    bgPreview: "#091A18",
    cardPreview: "#122624",
    borderPreview: "#6C151E",
    accentColor: "#F5DABF",
    accentGlow: "rgba(245, 218, 191, 0.28)",
    palette: ["#091A18", "#0F3D3A", "#6C151E", "#F5DABF"],
  },
  // 2. 🔮 Violet Dusk (Image 2: Violet #502D55, Mauve #935073, Warm Cream #F6DBC0, Vanilla #F8F4E9)
  {
    id: "violet-dusk",
    name: "Violet Dusk",
    category: "curated",
    tagline: "Moody twilight violet, mauve orchid & soft vanilla",
    emoji: "🔮",
    bgPreview: "#170D1A",
    cardPreview: "#251429",
    borderPreview: "#502D55",
    accentColor: "#935073",
    accentGlow: "rgba(147, 80, 115, 0.35)",
    palette: ["#502D55", "#935073", "#F6DBC0", "#F8F4E9"],
  },
  // 3. 🎩 Velvet Burgundy (Image 3: Black #000000, Burgundy #6D001A, Silk White #FFFFFF)
  {
    id: "velvet-burgundy",
    name: "Velvet Burgundy",
    category: "curated",
    tagline: "Stealth carbon noir, royal burgundy & pure silk white",
    emoji: "🎩",
    bgPreview: "#0E090B",
    cardPreview: "#190F14",
    borderPreview: "#6D001A",
    accentColor: "#A60D30",
    accentGlow: "rgba(166, 13, 48, 0.35)",
    palette: ["#0E090B", "#190F14", "#6D001A", "#FFFFFF"],
  },
  // 4. ☕ Espresso & Aero Mint (Image 4: Black Coffee #322B2B, Aero Blue #CCFFE2)
  {
    id: "espresso-mint",
    name: "Espresso & Aero Mint",
    category: "curated",
    tagline: "Warm roasted dark coffee & fresh pastel aero mint",
    emoji: "☕",
    bgPreview: "#1C1616",
    cardPreview: "#272020",
    borderPreview: "#473D3D",
    accentColor: "#2FD48D",
    accentGlow: "rgba(47, 212, 141, 0.35)",
    palette: ["#1C1616", "#322B2B", "#473D3D", "#CCFFE2"],
  },
  // 5. 🌊 Shaded Spruce (Image 5: Shaded Spruce #005E6D, Lavender Blush #FFF5F4)
  {
    id: "shaded-spruce",
    name: "Shaded Spruce",
    category: "curated",
    tagline: "Deep oceanic spruce teal & porcelain blush",
    emoji: "🌊",
    bgPreview: "#051E24",
    cardPreview: "#0A2B33",
    borderPreview: "#005E6D",
    accentColor: "#008FA5",
    accentGlow: "rgba(0, 143, 165, 0.35)",
    palette: ["#051E24", "#0A2B33", "#005E6D", "#FFF5F4"],
  },
  // 6. 🌌 Cosmic Twilight (Deep Mood)
  {
    id: "cosmic-twilight",
    name: "Cosmic Twilight",
    category: "mood",
    tagline: "Deep velvet plum & glowing lilac",
    emoji: "🌌",
    bgPreview: "#0D0B18",
    cardPreview: "#161329",
    borderPreview: "#3B2D64",
    accentColor: "#8B5CF6",
    accentGlow: "rgba(139, 92, 246, 0.35)",
    palette: ["#0D0B18", "#161329", "#8B5CF6", "#EC4899"],
  },
  // 7. 🌺 Midnight Sakura (Deep Mood)
  {
    id: "midnight-sakura",
    name: "Midnight Sakura",
    category: "mood",
    tagline: "Velvet black-cherry & neon rose",
    emoji: "🌺",
    bgPreview: "#150D15",
    cardPreview: "#20121E",
    borderPreview: "#4C2442",
    accentColor: "#F43F5E",
    accentGlow: "rgba(244, 63, 94, 0.35)",
    palette: ["#150D15", "#20121E", "#F43F5E", "#FB7185"],
  },
  // 8. 🌿 Emerald Zen (Deep Mood)
  {
    id: "emerald-zen",
    name: "Emerald Zen",
    category: "mood",
    tagline: "Deep pine obsidian & neon mint",
    emoji: "🌿",
    bgPreview: "#07120C",
    cardPreview: "#0E2015",
    borderPreview: "#1B432C",
    accentColor: "#10B981",
    accentGlow: "rgba(16, 185, 129, 0.35)",
    palette: ["#07120C", "#0E2015", "#10B981", "#34D399"],
  },
  // 9. 🌅 Sunset Mirage (Deep Mood)
  {
    id: "sunset-mirage",
    name: "Sunset Mirage",
    category: "mood",
    tagline: "Dark roasted espresso & amber glow",
    emoji: "🌅",
    bgPreview: "#140C0A",
    cardPreview: "#1F130E",
    borderPreview: "#452516",
    accentColor: "#F97316",
    accentGlow: "rgba(249, 115, 22, 0.35)",
    palette: ["#140C0A", "#1F130E", "#F97316", "#FBBF24"],
  },
  // 10. 🖤 Obsidian Luxe (Stealth Classic)
  {
    id: "obsidian-luxe",
    name: "Obsidian Luxe",
    category: "mood",
    tagline: "Stealth titanium carbon & emerald",
    emoji: "🖤",
    bgPreview: "#08080A",
    cardPreview: "#121215",
    borderPreview: "#27272A",
    accentColor: "#10B981",
    accentGlow: "rgba(16, 185, 129, 0.3)",
    palette: ["#08080A", "#121215", "#10B981", "#06B6D4"],
  },
];

export interface AppSettings {
  theme: AppThemeId;
  currency: CurrencySymbol;
  dismissedReminderDate: string | null;
  defaultPaymentMethod: PaymentMethod;
}

const SETTINGS_KEY = "spendsmart_settings";

const defaultSettings: AppSettings = {
  theme: "obsidian-luxe",
  currency: "₹",
  dismissedReminderDate: null,
  defaultPaymentMethod: "Online",
};

export const getSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return defaultSettings;
  try {
    const parsed = JSON.parse(stored);
    let theme = parsed.theme || defaultSettings.theme;
    if (theme === "dark") theme = "obsidian-luxe";
    if (theme === "light" || ["sakura-day", "matcha-garden", "sunshine-peach", "lavender-milk", "ocean-breeze"].includes(theme)) {
      theme = "bordo-pine";
    }
    return { ...defaultSettings, ...parsed, theme };
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings: Partial<AppSettings>) => {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

  // Dispatch global settings change event
  window.dispatchEvent(new Event("spendsmart_settings_change"));

  // Apply theme class and data-theme attribute to root
  applyTheme(updated.theme);
};

export const applyTheme = (theme: AppThemeId) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Resolve legacy mappings
  let resolvedTheme = theme;
  if (theme === "dark") resolvedTheme = "obsidian-luxe";
  if (theme === "light" || ["sakura-day", "matcha-garden", "sunshine-peach", "lavender-milk", "ocean-breeze"].includes(theme)) {
    resolvedTheme = "bordo-pine";
  }

  const themeMeta = THEME_OPTIONS.find((t) => t.id === resolvedTheme) || THEME_OPTIONS[0];

  // Set data-theme on html element for custom property selectors
  root.setAttribute("data-theme", resolvedTheme);
  root.classList.remove("light-mode");
  root.style.colorScheme = "dark";

  // Set dynamic CSS accent variables
  root.style.setProperty("--theme-accent-color", themeMeta.accentColor);
  root.style.setProperty("--theme-accent-glow", themeMeta.accentGlow);
};

// Initialize theme on script load
if (typeof window !== "undefined") {
  applyTheme(getSettings().theme);
}
