import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { AuthProvider, I18nProvider } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import { ModalContainer } from "@/components/ModalContainer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html
      lang="fi"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
