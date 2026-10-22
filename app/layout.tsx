import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
