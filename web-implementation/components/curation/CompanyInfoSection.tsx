'use client';
import { ToolDetailData } from '@/types/database';
import { useState } from 'react';
import EditableField from './EditableField';

export default function CompanyInfoSection({ data }: { data: ToolDetailData }) {
  const { tool, snapshot, curated_data } = data;
  const companyInfo = snapshot?.company_info;
  
  const curatedCompanyInfo = curated_data.find(c => c.section_name === 'company_info')?.curated_content;
  const displayData = curatedCompanyInfo || companyInfo;

  const [editMode, setEditMode] = useState(false);

  const handleSave = async (sectionData: any) => {
    try {
      const response = await fetch(`/api/tool/${tool.id}/curate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_name: 'company_info',
          curated_content: sectionData,
        }),
      });
      if (!response.ok) throw new Error('Failed to save');
      alert('Company info saved!');
      setEditMode(false);
      // You might want to refresh the page data here
    } catch (error) {
      console.error(error);
      alert('Error saving company info');
    }
  };
  
  if (!displayData) {
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
       <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Company Information</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            editMode
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {editMode ? 'Cancel' : 'Edit Section'}
        </button>
      </div>
      
      {/* Company Basics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-3">Company Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Founded:</span>
              {editMode ? (
                <EditableField
                  value={displayData.founding_date ? new Date(displayData.founding_date).getFullYear().toString() : ''}
                  type="text"
                  onSave={(value) => handleSave({ ...displayData, founding_date: `${value}-01-01` })}
                />
              ) : (
                <span className="font-medium">{displayData.founding_date ? new Date(displayData.founding_date).getFullYear() : 'N/A'}</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Valuation:</span>
               {editMode ? (
                <EditableField
                  value={displayData.valuation || ''}
                  type="text"
                  onSave={(value) => handleSave({ ...displayData, valuation: value })}
                />
              ) : (
                <span className="font-medium text-green-600">${displayData.valuation}</span>
              )}
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Employees:</span>
                {editMode ? (
                    <EditableField
                    value={displayData.employee_count?.toLocaleString() || ''}
                    type="text"
                    onSave={(value) => handleSave({ ...displayData, employee_count: Number(value.replace(/,/g, '')) })}
                    />
                ) : (
                    <span className="font-medium">{displayData.employee_count?.toLocaleString() || 'N/A'}</span>
                )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              {editMode ? (
                <EditableField
                  value={displayData.headquarters_location || ''}
                  type="text"
                  onSave={(value) => handleSave({ ...displayData, headquarters_location: value })}
                />
              ) : (
                <span className="font-medium">{displayData.headquarters_location}</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-3">Market Info</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
                <span className="text-gray-600">Market Cap:</span>
                {editMode ? <EditableField value={displayData.market_cap || ''} type="text" onSave={(value) => handleSave({ ...displayData, market_cap: value })} /> : <span className="font-medium">{displayData.market_cap || 'N/A'}</span>}
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Stock Price:</span>
                {editMode ? <EditableField value={displayData.stock_price || ''} type="text" onSave={(value) => handleSave({ ...displayData, stock_price: value })} /> : <span className="font-medium">${displayData.stock_price || 'N/A'}</span>}
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">News Mentions:</span>
                {editMode ? <EditableField value={displayData.news_mentions?.toLocaleString() || ''} type="text" onSave={(value) => handleSave({ ...displayData, news_mentions: Number(value.replace(/,/g, '')) })} /> : <span className="font-medium">{displayData.news_mentions?.toLocaleString() || 'N/A'}</span>}
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">ARR:</span>
                {editMode ? <EditableField value={displayData.annual_recurring_revenue || ''} type="text" onSave={(value) => handleSave({ ...displayData, annual_recurring_revenue: value })} /> : <span className="font-medium text-blue-600">{displayData.annual_recurring_revenue || 'N/A'}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Funding Information */}
      {editMode ? (
        <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-4">Funding History</h3>
            <EditableField type="array" value={displayData.funding_rounds?.map((r: any) => `${r.round}: $${r.amount}`) || []} onSave={(values: string[]) => {
                const funding_rounds = values.map(v => {
                    const [round, amount] = v.split(': $');
                    return { round, amount };
                });
                handleSave({ ...displayData, funding_rounds });
            }} />
        </div>
      ) : (
        displayData.funding_rounds && displayData.funding_rounds.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-4">Funding History</h3>
            <div className="space-y-3">
                {displayData.funding_rounds.map((round: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-900">{round.round}</span>
                    <span className="text-green-600 font-medium">${round.amount}</span>
                </div>
                ))}
            </div>
            </div>
        )
      )}

      {/* Key People */}
       {editMode ? (
        <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-4">Key Executives</h3>
            <EditableField type="array" value={displayData.key_executives || []} onSave={(values) => handleSave({ ...displayData, key_executives: values })} />
        </div>
       ) : (
        displayData.key_executives && displayData.key_executives.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-4">Key Executives</h3>
            <div className="space-y-2">
                {displayData.key_executives.map((executive: string, index: number) => (
                <div key={index} className="text-gray-700">
                    {executive}
                </div>
                ))}
            </div>
            </div>
        )
      )}

      {/* Investors & Partners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {editMode ? (
            <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-gray-900 mb-4">Major Investors</h3>
                <EditableField type="array" value={displayData.major_investors || []} onSave={(values) => handleSave({ ...displayData, major_investors: values })} />
            </div>
        ) : (
            displayData.major_investors && displayData.major_investors.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-gray-900 mb-4">Major Investors</h3>
                <div className="space-y-2">
                {displayData.major_investors.map((investor: string, index: number) => (
                    <div key={index} className="text-gray-700 text-sm">
                    {investor}
                    </div>
                ))}
                </div>
            </div>
            )
        )}

        {editMode ? (
            <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-gray-900 mb-4">Strategic Partnerships</h3>
                <EditableField type="array" value={displayData.strategic_partnerships || []} onSave={(values) => handleSave({ ...displayData, strategic_partnerships: values })} />
            </div>
        ) : (
            displayData.strategic_partnerships && displayData.strategic_partnerships.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium text-gray-900 mb-4">Strategic Partnerships</h3>
                <div className="space-y-2">
                {displayData.strategic_partnerships.map((partnership: string, index: number) => (
                    <div key={index} className="text-gray-700 text-sm">
                    {partnership}
                    </div>
                ))}
                </div>
            </div>
            )
        )}
      </div>

      {/* Additional Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <span className="text-gray-600 text-sm">Business Model:</span>
                {editMode ? <EditableField value={displayData.business_model || ''} type="textarea" onSave={(value) => handleSave({ ...displayData, business_model: value })} /> : <div className="font-medium">{displayData.business_model || 'N/A'}</div>}
            </div>
            <div>
                <span className="text-gray-600 text-sm">Company Stage:</span>
                {editMode ? <EditableField value={displayData.company_stage || ''} type="text" onSave={(value) => handleSave({ ...displayData, company_stage: value })} /> : <div className="font-medium">{displayData.company_stage || 'N/A'}</div>}
            </div>
        </div>
      </div>
    </div>
  );
}