import { Geist, Geist_Mono, Silkscreen } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "SmartMove - Assistant Mobilité Intelligente",
  description: "Assistant conversationnel intelligent pour la mobilité régionale à Toulouse",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${silkscreen.variable} antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
