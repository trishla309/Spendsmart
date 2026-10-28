// SpendSmart Settings & Theme Utilities

export type CurrencySymbol = "$" | "₹" | "€" | "£";
export type PaymentMethod = "Online" | "Cash";

export type AppThemeId =
  // ☀️ Bright & Pastel Themes
  | "sakura-day"
  | "matcha-garden"
  | "sunshine-peach"
  | "lavender-milk"
  | "ocean-breeze"
  // 🌙 Pretty & Luminous Dark Themes
  | "cosmic-twilight"
  | "midnight-sakura"
  | "emerald-zen"
  | "sunset-mirage"
  | "obsidian-luxe"
  // Backward compatibility
  | "dark"
  | "light";

export interface ThemeOption {
  id: AppThemeId;
  name: string;
  type: "light" | "dark";
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
  // 1. 🌸 Sakura Day (Bright & Pastel Light)
  {
    id: "sakura-day",
    name: "Sakura Day",
    type: "light",
    tagline: "Cherry blossom pink & soft quartz",
    emoji: "🌸",
    bgPreview: "#FFF5F8",
    cardPreview: "#FFFFFF",
    borderPreview: "#FBCFE8",
    accentColor: "#EC4899",
    accentGlow: "rgba(236, 72, 153, 0.25)",
    palette: ["#FFF5F8", "#FFFFFF", "#F43F5E", "#EC4899"],
  },
  // 2. 🍵 Matcha Garden (Bright & Pastel Light)
  {
    id: "matcha-garden",
    name: "Matcha Garden",
    type: "light",
    tagline: "Calming pastel sage & pistachio",
    emoji: "🍵",
    bgPreview: "#F4F7F4",
    cardPreview: "#FFFFFF",
    borderPreview: "#D1E7DD",
    accentColor: "#10B981",
    accentGlow: "rgba(16, 185, 129, 0.25)",
    palette: ["#F4F7F4", "#FFFFFF", "#10B981", "#D97706"],
  },
  // 3. ☀️ Sunshine Peach (Bright & Pastel Light)
  {
    id: "sunshine-peach",
    name: "Sunshine Peach",
    type: "light",
    tagline: "Warm vanilla cream & apricot glow",
    emoji: "☀️",
    bgPreview: "#FFF9F2",
    cardPreview: "#FFFFFF",
    borderPreview: "#FED7AA",
    accentColor: "#F97316",
    accentGlow: "rgba(249, 115, 22, 0.25)",
    palette: ["#FFF9F2", "#FFFFFF", "#F97316", "#F59E0B"],
  },
  // 4. 💜 Lavender Milk (Bright & Pastel Light)
  {
    id: "lavender-milk",
    name: "Lavender Milk",
    type: "light",
    tagline: "Dreamy pastel lilac & sweet periwinkle",
    emoji: "💜",
    bgPreview: "#FAF6FE",
    cardPreview: "#FFFFFF",
    borderPreview: "#E9D5FF",
    accentColor: "#8B5CF6",
    accentGlow: "rgba(139, 92, 246, 0.25)",
    palette: ["#FAF6FE", "#FFFFFF", "#8B5CF6", "#C084FC"],
  },
  // 5. 🌊 Ocean Breeze (Bright & Pastel Light)
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    type: "light",
    tagline: "Crisp azure aqua & seafoam teal",
    emoji: "🌊",
    bgPreview: "#F0F8FF",
    cardPreview: "#FFFFFF",
    borderPreview: "#BAE6FD",
    accentColor: "#0284C7",
    accentGlow: "rgba(2, 132, 199, 0.25)",
    palette: ["#F0F8FF", "#FFFFFF", "#0284C7", "#06B6D4"],
  },
  // 6. 🌌 Cosmic Twilight (Pretty Dark)
  {
    id: "cosmic-twilight",
    name: "Cosmic Twilight",
    type: "dark",
    tagline: "Deep velvet plum & glowing lilac",
    emoji: "🌌",
    bgPreview: "#0D0B18",
    cardPreview: "#161329",
    borderPreview: "#3B2D64",
    accentColor: "#8B5CF6",
    accentGlow: "rgba(139, 92, 246, 0.35)",
    palette: ["#0D0B18", "#161329", "#8B5CF6", "#EC4899"],
  },
  // 7. 🌺 Midnight Sakura (Pretty Dark)
  {
    id: "midnight-sakura",
    name: "Midnight Sakura",
    type: "dark",
    tagline: "Velvet black-cherry & neon rose",
    emoji: "🌺",
    bgPreview: "#150D15",
    cardPreview: "#20121E",
    borderPreview: "#4C2442",
    accentColor: "#F43F5E",
    accentGlow: "rgba(244, 63, 94, 0.35)",
    palette: ["#150D15", "#20121E", "#F43F5E", "#FB7185"],
  },
  // 8. 🌿 Emerald Zen (Pretty Dark)
  {
    id: "emerald-zen",
    name: "Emerald Zen",
    type: "dark",
    tagline: "Deep pine obsidian & neon mint",
    emoji: "🌿",
    bgPreview: "#07120C",
    cardPreview: "#0E2015",
    borderPreview: "#1B432C",
    accentColor: "#10B981",
    accentGlow: "rgba(16, 185, 129, 0.35)",
    palette: ["#07120C", "#0E2015", "#10B981", "#34D399"],
  },
  // 9. 🌅 Sunset Mirage (Pretty Dark)
  {
    id: "sunset-mirage",
    name: "Sunset Mirage",
    type: "dark",
    tagline: "Dark roasted espresso & amber glow",
    emoji: "🌅",
    bgPreview: "#140C0A",
    cardPreview: "#1F130E",
    borderPreview: "#452516",
    accentColor: "#F97316",
    accentGlow: "rgba(249, 115, 22, 0.35)",
    palette: ["#140C0A", "#1F130E", "#F97316", "#FBBF24"],
  },
  // 10. 🖤 Obsidian Luxe (Classic Dark Fintech)
  {
    id: "obsidian-luxe",
    name: "Obsidian Luxe",
    type: "dark",
    tagline: "Stealth titanium carbon & mint",
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
    if (theme === "light") theme = "sakura-day";
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
  if (theme === "light") resolvedTheme = "sakura-day";

  const themeMeta = THEME_OPTIONS.find((t) => t.id === resolvedTheme) || THEME_OPTIONS[9];
  const isLight = themeMeta.type === "light";

  // Set data-theme on html element for custom property selectors
  root.setAttribute("data-theme", resolvedTheme);

  if (isLight) {
    root.classList.add("light-mode");
    root.style.colorScheme = "light";
  } else {
    root.classList.remove("light-mode");
    root.style.colorScheme = "dark";
  }

  // Set dynamic CSS accent variables
  root.style.setProperty("--theme-accent-color", themeMeta.accentColor);
  root.style.setProperty("--theme-accent-glow", themeMeta.accentGlow);
};

// Initialize theme on script load
if (typeof window !== "undefined") {
  applyTheme(getSettings().theme);
}
