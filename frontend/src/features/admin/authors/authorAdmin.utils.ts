import { Author } from '@/services/courseService';

export const getAuthorInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'A';

export const sortAuthorsByUpdatedAt = (authors: Author[]) =>
  [...authors].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );

export const getLocalizedAuthorRole = (author: Author, language: string) =>
  language === 'fi' ? author.roleFi || author.roleEn : author.roleEn || author.roleFi;

export const getLocalizedAuthorBio = (author: Author, language: string) =>
  language === 'fi'
    ? author.biographyFi || author.biographyEn
    : author.biographyEn || author.biographyFi;
