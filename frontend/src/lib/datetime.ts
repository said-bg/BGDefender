export const SITE_TIME_ZONE = 'Europe/Helsinki';

export const getLocaleTag = (language: string) =>
  language.startsWith('fi') ? 'fi-FI' : 'en-GB';

type DateFormatOptions = Intl.DateTimeFormatOptions;

const toDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatSiteDate = (
  value: string | Date,
  language: string,
  options: DateFormatOptions,
) => {
  const date = toDate(value);

  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat(getLocaleTag(language), {
    timeZone: SITE_TIME_ZONE,
    ...options,
  }).format(date);
};

