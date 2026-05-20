import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE, localizePathname, normalizeLocale } from '@/lib/locale';

export default async function CoursesPage() {
  const headerList = await headers();
  const locale = normalizeLocale(headerList.get('x-current-locale') ?? DEFAULT_LOCALE);
  redirect(localizePathname('/', locale));
}
