import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vand.rw";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vand — Software solutions & products",
    template: "%s · Vand",
  },
  description:
    "Vand is a software company in Rwanda building custom software, web & mobile apps, and its own products — starting with Menyesha.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: "Vand",
    images: ["/vand.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.className} bg-white text-gray-900 dark:bg-[#0a0f16] dark:text-gray-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
