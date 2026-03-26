import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider, I18nProvider } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import { ModalContainer } from "@/components/ModalContainer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
