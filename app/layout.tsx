import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import TopNav from "@/components/TopNav";
import { matchesLeadToken } from "@/lib/auth/queue-admin";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Gatekeeper — Trust & safety for community builders", template: "Gatekeeper — %s" },
  description:
    "Open-source application vetting for community leads: rule-aware scoring, cross-community blocklist by hash, and a keyboard-first review queue.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230f172a'/%3E%3Cpath d='M16 6l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V9l8-3z' fill='none' stroke='white' stroke-width='2.4' stroke-linejoin='round'/%3E%3Cpath d='M12.5 16l2.5 2.5 4.5-5' fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: "Gatekeeper",
    description: "Open-source trust & safety for community builders. MIT.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const signedIn = matchesLeadToken(jar.get("gk_lead")?.value);

  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-white font-sans text-[17px] text-slate-900 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <TopNav signedIn={signedIn} />
        <div id="main" tabIndex={-1} className="outline-none">
          {children}
        </div>
        <Toaster position="bottom-left" richColors closeButton toastOptions={{ style: { fontSize: "16px" } }} />
      </body>
    </html>
  );
}
