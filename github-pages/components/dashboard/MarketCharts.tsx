'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface MarketData {
  overview: {
    categories: string[]
  }
  marketMetrics: {
    fundingByCategory: Record<string, number>
  }
  tools: Array<{
    category: string
  }>
}

export default function MarketCharts({ data }: { data: MarketData }) {
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#84cc16']

  // Prepare category distribution data
  const categoryData = data.overview.categories.map((category, index) => ({
    name: category.replace('_', ' '),
    value: data.tools.filter(tool => tool.category === category).length,
    color: COLORS[index % COLORS.length]
  }))

  // Prepare funding data
  const fundingData = Object.entries(data.marketMetrics.fundingByCategory).map(([category, amount]) => ({
    category: category.replace('_', ' '),
    funding: amount / 1000000 // Convert to millions
  }))

  return (
    <div className="chart-grid">
      {/* Category Distribution */}
      <div className="chart-container">
        <h3 className="text-xl executive-subheading mb-4">Tool Categories</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Funding by Category */}
      <div className="chart-container">
        <h3 className="text-xl executive-subheading mb-4">Funding by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fundingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}M`, 'Funding']} />
            <Bar dataKey="funding" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}