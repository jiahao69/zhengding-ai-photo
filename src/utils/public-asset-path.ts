const normalizeBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

const stripLeadingSlash = (path: string) => path.replace(/^\/+/, "");

export const getPublicAssetPath = (path: string) =>
  `${normalizeBaseUrl(import.meta.env.BASE_URL)}${stripLeadingSlash(path)}`;
