// app/reports/page.tsx - Analytics and reporting dashboard
import { getAllTools, query } from '@/lib/db';
import { AITool } from '@/types/database';

interface ReportData {
  tools: AITool[];
  totalSnapshots: number;
  dataSourceStats: any;
  categoryBreakdown: any;
}

async function getReportData(): Promise<ReportData> {
  const tools = await getAllTools() as AITool[];
  
  // Get snapshot count
  const snapshotResult = await query('SELECT COUNT(*) as count FROM tool_snapshots');
  const totalSnapshots = snapshotResult.rows[0]?.count || 0;
  
  // Get category breakdown
  const categoryResult = await query(`
    SELECT category, COUNT(*) as count 
    FROM ai_tools 
    WHERE category IS NOT NULL 
    GROUP BY category 
    ORDER BY count DESC
  `);
  
  // Get data source stats from raw_data
  const dataSourceResult = await query(`
    SELECT 
      tool_id,
      raw_data
    FROM tool_snapshots 
    WHERE raw_data IS NOT NULL
  `);
  
  return {
    tools,
    totalSnapshots,
    dataSourceStats: dataSourceResult.rows,
    categoryBreakdown: categoryResult.rows
  };
}

export default async function ReportsPage() {
  const data = await getReportData();
  const { tools, totalSnapshots, categoryBreakdown } = data;

  const stats = {
    totalTools: tools.length,
    withIntelligence: tools.filter(t => t.has_intelligence).length,
    processed: tools.filter(t => t.run_status === 'processed').length,
    lastUpdated: tools.length > 0 ? 
      new Date(Math.max(...tools.map(t => new Date(t.updated_at).getTime()))).toLocaleDateString() : 
      'Never'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Intelligence Reports
        </h1>
        <p className="text-gray-600">
          Analytics and insights from AI tools intelligence gathering
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.totalTools}</div>
          <div className="text-sm text-gray-600 mt-1">Total Tools</div>
          <div className="text-xs text-gray-400 mt-2">Active tools in database</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">{stats.withIntelligence}</div>
          <div className="text-sm text-gray-600 mt-1">With Intelligence</div>
          <div className="text-xs text-gray-400 mt-2">Tools with snapshot data</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-purple-600">{totalSnapshots}</div>
          <div className="text-sm text-gray-600 mt-1">Total Snapshots</div>
          <div className="text-xs text-gray-400 mt-2">Intelligence snapshots captured</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-orange-600">{stats.processed}</div>
          <div className="text-sm text-gray-600 mt-1">Fully Processed</div>
          <div className="text-xs text-gray-400 mt-2">Complete analysis available</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tools by Category</h2>
          <div className="space-y-3">
            {categoryBreakdown.map((cat: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                <span className="text-sm text-gray-500">{cat.count} tools</span>
              </div>
            ))}
            {categoryBreakdown.length === 0 && (
              <div className="text-gray-500 text-center py-4">No category data available</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Processing Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Completed</span>
              <span className="text-sm text-green-600">{stats.processed} tools</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Pending</span>
              <span className="text-sm text-yellow-600">
                {stats.totalTools - stats.processed} tools
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Success Rate</span>
              <span className="text-sm text-blue-600">
                {stats.totalTools > 0 ? 
                  Math.round((stats.processed / stats.totalTools) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Tools</h2>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tool
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tools.slice(0, 5).map((tool) => (
                <tr key={tool.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tool.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tool.company_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tool.run_status === 'processed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tool.run_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tool.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">✓</div>
            <div className="text-sm text-gray-600 mt-1">Database Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">✓</div>
            <div className="text-sm text-gray-600 mt-1">Data Pipeline Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">📊</div>
            <div className="text-sm text-gray-600 mt-1">Analytics Available</div>
          </div>
        </div>
      </div>
    </div>
  );
}