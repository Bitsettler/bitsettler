import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'fr', 'es'],

  // Used when no locale matches
  defaultLocale: 'en',
  
  // Optional: configure pathnames for each locale
  pathnames: {
    '/': '/',
    '/settlement': '/settlement',
    '/professions': '/professions',
    '/compendium': '/compendium'
  }
});

export const {Link, redirect, usePathname, useRouter} = routing;