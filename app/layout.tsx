import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pyroshieldai.codewitheugene.top";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "PyroShield AI — Tactical Wildfire Defense & Evacuation Intelligence",
    template: "%s · PyroShield AI",
  },
  description:
    "Autonomous wildfire incident command: NASA FIRMS satellite telemetry, live wind vectors, and TypeSafe Jev System One semantic judgments that verify reports, score evacuation corridors, and arbitrate tactical dispatch in under a second.",
  applicationName: "PyroShield AI",
  keywords: ["wildfire", "evacuation", "incident command", "TypeSafe Jev", "NASA FIRMS", "Earth Forward", "NextStep Hacks 2026"],
  openGraph: {
    title: "PyroShield AI — Tactical Wildfire Defense",
    description: "Sub-second semantic incident intelligence for commanders and communities under threat.",
    url: APP_URL,
    siteName: "PyroShield AI",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "PyroShield AI", description: "Tactical wildfire defense powered by TypeSafe Jev." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to tactical command center
        </a>
        {children}
      </body>
    </html>
  );
}
