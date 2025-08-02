import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientProviders } from "./client-providers"

// Enhanced font loading with display optimization
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"]
})

// Enhanced metadata with better SEO and social media support
export const metadata: Metadata = {
  title: {
    default: "AuthApp - Secure Authentication Platform",
    template: "%s | AuthApp"
  },
  description: "Modern full-stack authentication app with Next.js and Express.js. Secure login, registration, and user management with OAuth integration.",
  keywords: [
    "authentication",
    "login", 
    "register",
    "secure",
    "nextjs",
    "express",
    "oauth",
    "user management",
    "security",
    "web app"
  ],
  authors: [{ name: "AuthApp Team" }],
  creator: "AuthApp",
  publisher: "AuthApp",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AuthApp - Secure Authentication Platform',
    description: 'Modern full-stack authentication app with Next.js and Express.js',
    siteName: 'AuthApp',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AuthApp - Secure Authentication Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuthApp - Secure Authentication Platform',
    description: 'Modern full-stack authentication app with Next.js and Express.js',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

// Enhanced viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'light dark',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      dir="ltr" 
      suppressHydrationWarning
      className="scroll-smooth"
    >
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <ClientProviders>
          {children}
        </ClientProviders>
        
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                     bg-primary text-primary-foreground px-4 py-2 rounded-md z-50
                     focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>
      </body>
    </html>
  )
}
