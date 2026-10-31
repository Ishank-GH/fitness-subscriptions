import type { Metadata } from "next";
import { Archivo, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const fontDisplay = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ironvale",
  description:
    "Calibrated competition plates, power racks, and flexible membership installment plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
      >
        <body className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased selection:bg-foreground selection:text-background">
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}