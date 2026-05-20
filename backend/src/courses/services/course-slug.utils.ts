import { randomUUID } from 'crypto';

const COURSE_SLUG_FALLBACK_PREFIX = 'course';

export const slugifyCourseTitle = (title: string): string => {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length > 0) {
    return slug.slice(0, 220);
  }

  return `${COURSE_SLUG_FALLBACK_PREFIX}-${randomUUID().slice(0, 8)}`;
};

export const appendSlugSuffix = (baseSlug: string, suffix: number): string => {
  const suffixText = `-${suffix}`;
  const trimmedBase = baseSlug.slice(0, 220 - suffixText.length);
  return `${trimmedBase}${suffixText}`;
};
