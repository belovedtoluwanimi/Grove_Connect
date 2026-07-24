import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const grotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // ✅ 900 REMOVED
  variable: "--font-bricolage-grotesque",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "Grove Connect",
  description: "Grove Connect Official Website",
  manifest: '/manifest.json',
  themeColor: '#050505',
  keywords: [
    "Grove Connect",
    "Web Development",
    "Software Development",
    "ICT Agency",
    "Nigeria",
  ],
  metadataBase: new URL("https://grove-connect.vercel.app/"),

  openGraph: {
    title: "Grove Connect",
    description: "Grove Connect is a Nigerian ICT agency specializing in web development, software engineering, UI/UX design, branding, and digital solutions for businesses.",
    url: "https://grove-connect.vercel.app/",
    siteName: "Grove Connect",
    images: [
      {
        url: "/favicon.ico",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Grove Connect",
    description: "Professional ICT solutions.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  applicationName: "Grove Connect",
creator: "Grove Connect",
publisher: "Grove Connect",
category: "Technology",

alternates: {
  canonical: "https://grove-connect.vercel.app",
},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sora.className} font-sans`}>
        {children}
      </body>
    </html>
  );
}
