import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agarkar Athletics | High-Performance Fitness Subscriptions",
  description:
    "Engineered fitness training subscriptions, flexible partial payments, and institutional athletic management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
