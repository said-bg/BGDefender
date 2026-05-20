import type { Metadata } from 'next';
import { headers } from 'next/headers';
import AppFooter from '@/components/footer/AppFooter';
import { AuthProvider, I18nProvider } from '@/components/providers';
import { Navbar } from '@/components/navbar/Navbar';
import { ModalContainer } from '@/components/modal-container/ModalContainer';
import {
  buildRouteMetadata,
  DEFAULT_LOCALE,
  normalizeLocale,
} from '@/lib/locale';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const locale = normalizeLocale(headerList.get('x-current-locale') ?? DEFAULT_LOCALE);
  const pathname = headerList.get('x-current-path') ?? `/${locale}`;

  return {
    ...buildRouteMetadata(locale, pathname),
    icons: {
      icon: [
        {
          url: '/assets/images/bgdefender.jpeg',
          type: 'image/jpeg',
        },
      ],
      shortcut: ['/assets/images/bgdefender.jpeg'],
      apple: ['/assets/images/bgdefender.jpeg'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const locale = normalizeLocale(headerList.get('x-current-locale') ?? DEFAULT_LOCALE);

  return (
    <html lang={locale}>
      <body>
        <I18nProvider initialLanguage={locale}>
          <AuthProvider>
            <Navbar />
            {children}
            <AppFooter />
            <ModalContainer />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
