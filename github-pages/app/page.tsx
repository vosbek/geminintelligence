import { Suspense } from 'react'
import ExecutiveSummary from '@/components/dashboard/ExecutiveSummary'
import MarketOverview from '@/components/dashboard/MarketOverview'
import FundingAnalysis from '@/components/dashboard/FundingAnalysis'
import ToolShowcase from '@/components/dashboard/ToolShowcase'
import NewsHighlights from '@/components/dashboard/NewsHighlights'
import Navigation from '@/components/layout/Navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-executive-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="dashboard-header text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">
            AI Intelligence Platform
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Comprehensive market intelligence on AI developer tools. 
            Data-driven insights for strategic decision making.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Executive Summary */}
        <section className="mb-12">
          <Suspense fallback={<LoadingSpinner />}>
            <ExecutiveSummary />
          </Suspense>
        </section>

        {/* Market Overview */}
        <section className="mb-12">
          <h2 className="text-3xl executive-heading mb-8">Market Overview</h2>
          <Suspense fallback={<LoadingSpinner />}>
            <MarketOverview />
          </Suspense>
        </section>

        {/* Funding Analysis */}
        <section className="mb-12">
          <h2 className="text-3xl executive-heading mb-8">Investment & Funding</h2>
          <Suspense fallback={<LoadingSpinner />}>
            <FundingAnalysis />
          </Suspense>
        </section>

        {/* Tool Showcase */}
        <section className="mb-12">
          <h2 className="text-3xl executive-heading mb-8">Market Leaders</h2>
          <Suspense fallback={<LoadingSpinner />}>
            <ToolShowcase />
          </Suspense>
        </section>

        {/* News & Intelligence */}
        <section className="mb-12">
          <h2 className="text-3xl executive-heading mb-8">Recent Intelligence</h2>
          <Suspense fallback={<LoadingSpinner />}>
            <NewsHighlights />
          </Suspense>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-executive-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-executive-300">
            AI Intelligence Platform • Updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-executive-400 text-sm mt-2">
            Professional market intelligence for strategic decision making
          </p>
        </div>
      </footer>
    </div>
  )
}