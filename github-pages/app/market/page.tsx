import Navigation from '@/components/layout/Navigation'
import MarketOverview from '@/components/dashboard/MarketOverview'
import FundingAnalysis from '@/components/dashboard/FundingAnalysis'

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-executive-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl executive-heading mb-4">Market Intelligence</h1>
          <p className="text-lg executive-text max-w-3xl mx-auto">
            Comprehensive analysis of the AI developer tools market, including funding trends, 
            valuations, and competitive landscape.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-3xl executive-heading mb-8">Market Overview</h2>
            <MarketOverview />
          </section>

          <section>
            <h2 className="text-3xl executive-heading mb-8">Investment Analysis</h2>
            <FundingAnalysis />
          </section>
        </div>
      </div>
    </div>
  )
}