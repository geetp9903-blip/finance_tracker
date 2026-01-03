import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppLayout } from "@/components/AppLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prospera",
  description: "Prosper with clarity. Track your finances with style.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

import { SpeedInsights } from "@vercel/speed-insights/next";

import { getUser } from "@/lib/dal/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const username = user?.username;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AppLayout username={username}>
            {children}
          </AppLayout>
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
