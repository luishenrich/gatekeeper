import "./globals.css";
import type { Metadata, Viewport } from "next";
import { EB_Garamond, Figtree, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";

const sans = Figtree({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = EB_Garamond({ subsets: ["latin"], variable: "--font-serif", display: "swap", style: ["normal", "italic"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Gatekeeper — Trust & safety for community builders", template: "Gatekeeper — %s" },
  description:
    "Open-source application vetting for community leads: rule-aware scoring, a cross-community blocklist shared by hash, and a keyboard-first review queue.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%231a1a1a'/%3E%3Cpath d='M16 6.5l7.5 2.8v5.6c0 4.8-3.2 8.6-7.5 10.6-4.3-2-7.5-5.8-7.5-10.6V9.3L16 6.5z' fill='%23F0D7FF'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: "Gatekeeper",
    description: "Open-source trust & safety for community builders. MIT.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#F9F8F0" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:font-medium focus:text-background"
        >
          Skip to content
        </a>
        {children}
        <Toaster position="bottom-right" closeButton toastOptions={{ style: { fontSize: "15px", borderRadius: "14px" } }} />
      </body>
    </html>
  );
}
