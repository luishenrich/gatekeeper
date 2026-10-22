import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata = {
  title: "Gatekeeper",
  description: "Community application vetting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
