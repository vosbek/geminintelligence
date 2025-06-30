// lib/db.ts - PostgreSQL Database Connection
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'ai_database',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export { pool };

// Database query helper
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Get all tools with latest snapshot data
export async function getAllTools() {
  const result = await query(`
    SELECT 
      t.id,
      t.name,
      t.description,
      t.github_url,
      t.stock_symbol,
      t.category,
      t.company_name,
      t.legal_company_name,
      t.status,
      t.run_status,
      t.last_run,
      t.created_at,
      t.updated_at,
      ts.snapshot_date,
      ts.processing_status,
      CASE WHEN ts.basic_info IS NOT NULL THEN true ELSE false END as has_intelligence
    FROM ai_tools t
    LEFT JOIN LATERAL (
      SELECT snapshot_date, processing_status, basic_info FROM tool_snapshots 
      WHERE tool_id = t.id 
      ORDER BY snapshot_date DESC 
      LIMIT 1
    ) ts ON true
    ORDER BY t.updated_at DESC
  `);
  return result.rows;
}

// Get detailed tool data with latest snapshot
export async function getToolDetail(toolId: string) {
  const toolResult = await query('SELECT * FROM ai_tools WHERE id = $1', [toolId]);
  
  if (toolResult.rows.length === 0) {
    return null;
  }

  const snapshotResult = await query(`
    SELECT * FROM tool_snapshots 
    WHERE tool_id = $1 
    ORDER BY snapshot_date DESC 
    LIMIT 1
  `, [toolId]);

  const screenshotsResult = await query(`
    SELECT * FROM tool_screenshots 
    WHERE tool_id = $1 
    ORDER BY uploaded_at DESC
  `, [toolId]);

  const curatedResult = await query(`
    SELECT * FROM curated_tool_data 
    WHERE tool_id = $1 
    ORDER BY updated_at DESC
  `, [toolId]);

  const enterpriseResult = await query(`
    SELECT * FROM enterprise_positioning 
    WHERE tool_id = $1 
    ORDER BY updated_at DESC
    LIMIT 1
  `, [toolId]);

  return {
    tool: toolResult.rows[0],
    snapshot: snapshotResult.rows[0] || null,
    screenshots: screenshotsResult.rows,
    curated_data: curatedResult.rows,
    enterprise_position: enterpriseResult.rows[0] || null,
  };
}

// Save curated data
export async function saveCuratedData(toolId: string, sectionName: string, content: any, notes?: string) {
  return await query(`
    INSERT INTO curated_tool_data (tool_id, section_name, curated_content, curator_notes)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (tool_id, section_name) 
    DO UPDATE SET 
      curated_content = EXCLUDED.curated_content,
      curator_notes = EXCLUDED.curator_notes,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [toolId, sectionName, JSON.stringify(content), notes]);
}

// Save enterprise positioning
export async function saveEnterprisePosition(toolId: string, data: any) {
  return await query(`
    INSERT INTO enterprise_positioning (
      tool_id, market_position, competitive_advantages, 
      target_enterprises, implementation_complexity, strategic_notes
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (tool_id)
    DO UPDATE SET 
      market_position = EXCLUDED.market_position,
      competitive_advantages = EXCLUDED.competitive_advantages,
      target_enterprises = EXCLUDED.target_enterprises,
      implementation_complexity = EXCLUDED.implementation_complexity,
      strategic_notes = EXCLUDED.strategic_notes,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [
    toolId,
    data.market_position,
    data.competitive_advantages,
    data.target_enterprises,
    data.implementation_complexity,
    data.strategic_notes
  ]);
}

// Save screenshot
export async function saveScreenshot(toolId: string, filename: string, originalName: string, filePath: string, description?: string) {
  return await query(`
    INSERT INTO tool_screenshots (tool_id, filename, original_name, file_path, description)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [toolId, filename, originalName, filePath, description]);
}

// Auto-populate enterprise position from existing intelligence data
export async function generateEnterprisePosition(toolId: string) {
  // Get the snapshot data
  const snapshotResult = await query(`
    SELECT basic_info, technical_details, company_info, community_metrics 
    FROM tool_snapshots 
    WHERE tool_id = $1 
    ORDER BY snapshot_date DESC 
    LIMIT 1
  `, [toolId]);

  if (snapshotResult.rows.length === 0) {
    return null;
  }

  const snapshot = snapshotResult.rows[0];
  const { basic_info, technical_details, company_info, community_metrics } = snapshot;

  // Extract enterprise-relevant data
  const marketPosition = technical_details?.market_positioning || 
    basic_info?.description || 
    "AI-powered development tool targeting enterprise environments";

  const competitiveAdvantages = [
    ...(technical_details?.unique_differentiators || []),
    ...(technical_details?.pros_and_cons?.pros || [])
  ].join(', ') || "Advanced AI capabilities, enterprise-grade security, scalable architecture";

  const targetEnterprises = `Suitable for ${community_metrics?.list_of_companies_using_tool?.length || 0} enterprise customers including: ${
    community_metrics?.list_of_companies_using_tool?.slice(0, 5)?.join(', ') || 'Fortune 500 companies'
  }`;

  const implementationComplexity = [
    technical_details?.enterprise_capabilities ? "Enterprise administration features available" : "",
    technical_details?.security_features?.length ? `Security: ${technical_details.security_features.join(', ')}` : "",
    technical_details?.integration_capabilities?.length ? `Integrations: ${technical_details.integration_capabilities.slice(0, 3).join(', ')}` : "",
    technical_details?.pros_and_cons?.cons?.length ? `Considerations: ${technical_details.pros_and_cons.cons.slice(0, 2).join(', ')}` : ""
  ].filter(Boolean).join('. ') || "Standard enterprise deployment with typical integration requirements";

  const strategicNotes = [
    company_info?.valuation ? `High-value company (${company_info.valuation} valuation)` : "",
    company_info?.funding_rounds?.length ? `Well-funded (${company_info.funding_rounds.length} funding rounds)` : "",
    community_metrics?.github_stars ? `Strong community adoption (${community_metrics.github_stars.toLocaleString()} GitHub stars)` : "",
    community_metrics?.testimonials?.length ? `Positive testimonials from ${community_metrics.testimonials.length} sources` : "",
    technical_details?.update_frequency ? `Active development: ${technical_details.update_frequency}` : ""
  ].filter(Boolean).join('. ') || "Strategic tool for AI-powered development workflows";

  // Save the auto-generated enterprise position
  return await saveEnterprisePosition(toolId, {
    market_position: marketPosition,
    competitive_advantages: competitiveAdvantages,
    target_enterprises: targetEnterprises,
    implementation_complexity: implementationComplexity,
    strategic_notes: strategicNotes
  });
}