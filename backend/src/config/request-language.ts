export type AppLanguage = 'en' | 'fi';

export const resolveLanguage = (acceptLanguage?: string): AppLanguage => {
  if (!acceptLanguage) {
    return 'en';
  }

  const langCode = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
  return langCode === 'fi' ? 'fi' : 'en';
};
