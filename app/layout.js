import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Language Lite - Adapt Any Text to Your Reading Level",
  description: "Transform any text into your perfect reading level. AI-powered language learning tool that adapts content for beginners, intermediate, and advanced learners. Start learning with personalized texts today!",
  icons: {
    icon: [
      { url: '/language-lite-icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/language-lite-icon.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/language-lite-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/language-lite-icon.png',
  },
  keywords: "language learning, text adaptation, reading level, AI language tool, personalized learning, CEFR levels, vocabulary building",
  authors: [{ name: "Language Lite" }],
  creator: "Language Lite",
  publisher: "Language Lite",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://language-lite.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Language Lite - Adapt Any Text to Your Reading Level",
    description: "Transform any text into your perfect reading level. AI-powered language learning tool with personalized content adaptation.",
    url: "https://language-lite.com",
    siteName: "Language Lite",
    images: [
      {
        url: "https://language-lite.com/language-lite-icon.png",
        width: 512,
        height: 512,
        alt: "Language Lite - AI-Powered Text Adaptation for Language Learners",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Language Lite - Adapt Any Text to Your Reading Level",
    description: "Transform any text into your perfect reading level. AI-powered language learning tool with personalized content adaptation.",
    images: ["https://language-lite.com/language-lite-icon.png"],
    creator: "@languagelite",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
