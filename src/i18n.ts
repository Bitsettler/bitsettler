import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'fr', 'es'];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  try {
    return {
      messages: (await import(`../messages/${locale}.json`)).default
    };
  } catch (error) {
    // Fallback to English if the locale file doesn't exist
    return {
      messages: (await import(`../messages/en.json`)).default
    };
  }
});