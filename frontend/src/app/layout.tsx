import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { AuthProvider, I18nProvider } from "@/components/providers";
import { Navbar } from "@/components/navbar/Navbar";
import { ModalContainer } from "@/components/modal-container/ModalContainer";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "BG Defender - Cybersecurity E-Learning",
  description: "Learn cybersecurity online with BG Defender",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi" className="h-full antialiased">
      <body className={`${sourceSans.variable} min-h-full flex flex-col`}>
        <I18nProvider>
          <AuthProvider>
            <Navbar />
            {children}
            <ModalContainer />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
