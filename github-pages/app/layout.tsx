import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Intelligence Platform | Executive Dashboard',
  description: 'Comprehensive intelligence on AI developer tools and market trends for executive decision-making',
  keywords: 'AI tools, developer tools, market intelligence, executive dashboard, funding, valuations',
  authors: [{ name: 'AI Intelligence Platform' }],
  robots: 'index, follow',
  openGraph: {
    title: 'AI Intelligence Platform | Executive Dashboard',
    description: 'Comprehensive intelligence on AI developer tools and market trends',
    type: 'website',
    siteName: 'AI Intelligence Platform'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-executive-50 min-h-screen`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}