// app/page.tsx - Dashboard with tools overview
import { getAllTools } from '@/lib/db';
import ToolCard from '@/components/dashboard/ToolCard';
import { AITool } from '@/types/database';

export default async function Dashboard() {
  const tools = await getAllTools() as AITool[];

  const stats = {
    total: tools.length,
    withIntelligence: tools.filter(t => t.has_intelligence).length,
    processed: tools.filter(t => t.run_status === 'processed').length,
    lastUpdated: tools.length > 0 ? new Date(Math.max(...tools.map(t => new Date(t.updated_at).getTime()))).toLocaleDateString() : 'Never'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Tools Intelligence Dashboard
        </h1>
        <p className="text-gray-600">
          Review and curate AI developer tools intelligence data
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Tools</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{stats.withIntelligence}</div>
          <div className="text-sm text-gray-600">With Intelligence</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">{stats.processed}</div>
          <div className="text-sm text-gray-600">Processed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-600">{stats.lastUpdated}</div>
          <div className="text-sm text-gray-600">Last Updated</div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">AI Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {tools.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No AI tools found</div>
          <div className="text-gray-400 text-sm mt-2">
            Run the data collection pipeline to populate tools
          </div>
        </div>
      )}
    </div>
  );
}