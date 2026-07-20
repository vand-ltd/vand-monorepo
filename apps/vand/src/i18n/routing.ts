import { createRouting } from "@org/i18n";

// 'as-needed' serves the default locale at "/" (200, no redirect) while other
// locales keep their prefix (/en, /fr). Keeps the homepage directly indexable.
export const routing = createRouting({ localePrefix: "as-needed" });
