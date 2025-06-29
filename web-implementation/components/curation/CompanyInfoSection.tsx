'use client';
import { ToolDetailData } from '@/types/database';

export default function CompanyInfoSection({ data }: { data: ToolDetailData }) {
  const companyInfo = data.snapshot?.company_info;
  
  if (!companyInfo) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Company Information</h2>
        <div className="text-gray-500 text-center py-8">
          No company information available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Company Information</h2>
      
      {/* Company Basics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-3">Company Details</h3>
          <div className="space-y-2">
            {companyInfo.founding_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">Founded:</span>
                <span className="font-medium">{new Date(companyInfo.founding_date).getFullYear()}</span>
              </div>
            )}
            {companyInfo.valuation && (
              <div className="flex justify-between">
                <span className="text-gray-600">Valuation:</span>
                <span className="font-medium text-green-600">${companyInfo.valuation}</span>
              </div>
            )}
            {companyInfo.employee_count && (
              <div className="flex justify-between">
                <span className="text-gray-600">Employees:</span>
                <span className="font-medium">{companyInfo.employee_count.toLocaleString()}</span>
              </div>
            )}
            {companyInfo.headquarters_location && (
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{companyInfo.headquarters_location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-3">Market Info</h3>
          <div className="space-y-2">
            {companyInfo.market_cap && (
              <div className="flex justify-between">
                <span className="text-gray-600">Market Cap:</span>
                <span className="font-medium">{companyInfo.market_cap}</span>
              </div>
            )}
            {companyInfo.stock_price && (
              <div className="flex justify-between">
                <span className="text-gray-600">Stock Price:</span>
                <span className="font-medium">${companyInfo.stock_price}</span>
              </div>
            )}
            {companyInfo.news_mentions && (
              <div className="flex justify-between">
                <span className="text-gray-600">News Mentions:</span>
                <span className="font-medium">{companyInfo.news_mentions.toLocaleString()}</span>
              </div>
            )}
            {companyInfo.annual_recurring_revenue && (
              <div className="flex justify-between">
                <span className="text-gray-600">ARR:</span>
                <span className="font-medium text-blue-600">{companyInfo.annual_recurring_revenue}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Funding Information */}
      {companyInfo.funding_rounds && companyInfo.funding_rounds.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-4">Funding History</h3>
          <div className="space-y-3">
            {companyInfo.funding_rounds.map((round, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="font-medium text-gray-900">{round.round}</span>
                <span className="text-green-600 font-medium">${round.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key People */}
      {companyInfo.key_executives && companyInfo.key_executives.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-4">Key Executives</h3>
          <div className="space-y-2">
            {companyInfo.key_executives.map((executive, index) => (
              <div key={index} className="text-gray-700">
                {executive}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investors & Partners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companyInfo.major_investors && companyInfo.major_investors.length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-4">Major Investors</h3>
            <div className="space-y-2">
              {companyInfo.major_investors.map((investor, index) => (
                <div key={index} className="text-gray-700 text-sm">
                  {investor}
                </div>
              ))}
            </div>
          </div>
        )}

        {companyInfo.strategic_partnerships && companyInfo.strategic_partnerships.length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-4">Strategic Partnerships</h3>
            <div className="space-y-2">
              {companyInfo.strategic_partnerships.map((partnership, index) => (
                <div key={index} className="text-gray-700 text-sm">
                  {partnership}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Info */}
      {(companyInfo.business_model || companyInfo.company_stage) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companyInfo.business_model && (
              <div>
                <span className="text-gray-600 text-sm">Business Model:</span>
                <div className="font-medium">{companyInfo.business_model}</div>
              </div>
            )}
            {companyInfo.company_stage && (
              <div>
                <span className="text-gray-600 text-sm">Company Stage:</span>
                <div className="font-medium">{companyInfo.company_stage}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}