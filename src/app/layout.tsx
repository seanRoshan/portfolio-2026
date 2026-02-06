import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/Providers"
import { GoogleAnalytics } from "@/components/GoogleAnalytics"
import { buildRootMetadata, getCachedSiteConfig } from "@/lib/seo"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export async function generateMetadata() {
  return buildRootMetadata()
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const config = await getCachedSiteConfig()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        {config?.googleAnalyticsId && <GoogleAnalytics gaId={config.googleAnalyticsId} />}
      </body>
    </html>
  )
}
