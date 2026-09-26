import { GeistSans } from "geist/font/sans";
import { GeistPixelGrid, GeistPixelLine, GeistPixelSquare } from "geist/font/pixel";
import type { Metadata, Viewport } from "next";

import { CommandMenu } from "@/components/command-menu";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ScrollProgress } from "@/components/scroll-progress";
import { ThemeProvider } from "@/components/theme-provider";
import { profile, site } from "@/data/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${profile.name}` },
  description: site.description,
  authors: [{ name: profile.name, url: site.url }],
  openGraph: {
    title: site.title,
    description: site.description,
    url: site.url,
    siteName: profile.name,
    images: [{ url: profile.avatar, width: 512, height: 512, alt: profile.name }],
    type: "website",
  },
  twitter: { card: "summary", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#060607" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} ${GeistPixelLine.variable} antialiased`}
    >
      <body className="min-h-dvh overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ScrollProgress />
          <Header />
          <main className="mx-auto max-w-3xl">{children}</main>
          <Footer />
          <CommandMenu />
        </ThemeProvider>
      </body>
    </html>
  );
}
