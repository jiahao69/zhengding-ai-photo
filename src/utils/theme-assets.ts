const SUPPORTED_THEMES = ["zhengding", "changcheng"] as const;

type Theme = (typeof SUPPORTED_THEMES)[number];

const DEFAULT_THEME: Theme = "zhengding";

const THEME_QUERY_KEY = "theme";
const themeSet = new Set<Theme>(SUPPORTED_THEMES);
const imageModules = import.meta.glob(
  "../assets/images/*/*.{png,jpg,jpeg,webp,svg}",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

type AssetCatalog = Record<string, Record<string, string>>;

const assetCatalog = Object.entries(imageModules).reduce<AssetCatalog>(
  (catalog, [modulePath, assetUrl]) => {
    const matched = modulePath.match(/\/images\/([^/]+)\/([^/]+)$/);

    if (!matched) {
      return catalog;
    }

    const [, folderName, assetName] = matched;

    catalog[folderName] ??= {};
    catalog[folderName][assetName] = assetUrl;

    return catalog;
  },
  {},
);

const commonAssets = assetCatalog.common ?? {};
const defaultThemeAssets = assetCatalog[DEFAULT_THEME] ?? {};

export const resolveTheme = (themeValue?: string | null): Theme => {
  const normalizedTheme = themeValue?.trim().toLowerCase();

  if (normalizedTheme && themeSet.has(normalizedTheme as Theme)) {
    return normalizedTheme as Theme;
  }

  return DEFAULT_THEME;
};

export const getThemeFromSearch = (search = window.location.search) =>
  resolveTheme(new URLSearchParams(search).get(THEME_QUERY_KEY));

const currentTheme = getThemeFromSearch();

export const getThemeImage = (assetName: string, theme = currentTheme) => {
  const themedAssets = assetCatalog[theme] ?? {};

  return (
    themedAssets[assetName] ??
    commonAssets[assetName] ??
    defaultThemeAssets[assetName] ??
    ""
  );
};

export const getThemeImages = (assetNames: string[], theme = currentTheme) =>
  assetNames.map((assetName) => getThemeImage(assetName, theme));
