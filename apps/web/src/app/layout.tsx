import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DrishtiFlow (दृष्टि-फ़्लो) | Bharat Edge Vision Platform",
  description: "Turn existing cameras into configurable, event-aware safety and operations systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
