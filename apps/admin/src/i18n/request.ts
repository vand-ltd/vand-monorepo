import { createRequestConfig } from "@org/i18n";
export default createRequestConfig(
  async (locale) => (await import(`../../messages/${locale}.json`)).default
);
