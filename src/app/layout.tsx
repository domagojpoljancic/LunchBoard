import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { ActionToastProvider } from "@/components/ActionToast";
import { TimezoneCapture } from "@/components/TimezoneCapture";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "LunchBoard",
  description: "Plan the lunches you will actually cook.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${outfit.variable} antialiased`}>
        <ActionToastProvider>
          <TimezoneCapture />
          {children}
        </ActionToastProvider>
      </body>
    </html>
  );
}
