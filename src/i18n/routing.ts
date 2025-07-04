import { defineRouting } from "next-intl/routing";
import { I18N_CONFIG } from "./config";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: I18N_CONFIG.locales,

  // Used when no locale matches
  defaultLocale: I18N_CONFIG.defaultLocale,
});
