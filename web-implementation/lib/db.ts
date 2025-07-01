// lib/db.ts - PostgreSQL Database Connection
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'ai_database',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: false,
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
      t.github_url,
      t.status,
      t.run_status,
      t.last_run,
      -- Use the snapshot's description if available, otherwise the tool's description
      COALESCE(ts.basic_info->>'description', t.description) as description,
      -- The category and company name should come from the primary tool record
      t.category,
      t.company_name,
      ts.snapshot_date,
      ts.processing_status,
      CASE WHEN ts.basic_info IS NOT NULL THEN true ELSE false END as has_intelligence
    FROM ai_tools t
    INNER JOIN LATERAL (
      SELECT
        snapshot_date,
        processing_status,
        basic_info
      FROM tool_snapshots
      WHERE tool_id = t.id
      ORDER BY snapshot_date DESC
      LIMIT 1
    ) ts ON true
    ORDER BY ts.snapshot_date DESC NULLS LAST, t.name ASC
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

  const urlsResult = await query(`
    SELECT url, url_type FROM tool_urls WHERE tool_id = $1 ORDER BY url_type
  `, [toolId]);

  const snapshots = await query(`
    SELECT * FROM tool_snapshots 
    WHERE tool_id = $1 
    ORDER BY snapshot_date DESC
  `, [toolId]);

  if (snapshots.rows.length === 0) {
    return null;
  }

  // Find the most recent snapshot
  const latestSnapshot = snapshots.rows.reduce((latest, current) => {
    return new Date(current.snapshot_date) > new Date(latest.snapshot_date) ? current : latest;
  }, snapshots.rows[0]);

  const tool = toolResult.rows[0];

  // Ensure tool.resources is an array before concatenating
  if (!tool.resources) {
    tool.resources = [];
  }
  
  // Add the youtube videos to the resources
  if (latestSnapshot.community_metrics?.youtube_top_videos) {
    tool.resources = tool.resources.concat(
      latestSnapshot.community_metrics.youtube_top_videos.map((video: any) => ({
        url: video.url,
        url_type: 'YouTube Video',
        title: video.title,
      }))
    );
  }

  return {
    tool,
    snapshot: latestSnapshot,
    screenshots: screenshotsResult.rows,
    curated_data: curatedResult.rows,
    enterprise_position: enterpriseResult.rows[0] || null,
    urls: urlsResult.rows,
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

export async function saveCuratedSection(toolId: string, sectionName: string, curatedContent: any) {
  const sql = `
    INSERT INTO curated_data (tool_id, section_name, curated_content, last_updated)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (tool_id, section_name) 
    DO UPDATE SET 
      curated_content = EXCLUDED.curated_content,
      last_updated = NOW();
  `;
  const values = [toolId, sectionName, JSON.stringify(curatedContent)];
  return query(sql, values);
}

// ===== CURATOR FUNCTIONS =====

// Get all curated repositories  
export async function getCuratedRepositories(limit?: number, offset?: number) {
  let sql = `
    SELECT 
      cr.id,
      cr.repo_name as name,
      cr.repo_url as github_url,
      cr.description,
      cr.category,
      cr.developer_relevance_score,
      cr.utility_score,
      cr.final_score,
      cr.stars as star_count,
      cr.forks as fork_count,
      cr.last_commit_date,
      cr.language,
      cr.mcp_compatible,
      cr.installation_method,
      cr.analysis_date as discovered_at,
      cr_run.run_date
    FROM curated_repositories cr
    LEFT JOIN curation_runs cr_run ON cr.curation_period_start = cr_run.period_start
    ORDER BY cr.final_score DESC, cr.created_at DESC
  `;
  
  const params = [];
  if (limit) {
    sql += ` LIMIT $${params.length + 1}`;
    params.push(limit);
  }
  if (offset) {
    sql += ` OFFSET $${params.length + 1}`;
    params.push(offset);
  }
  
  const result = await query(sql, params);
  return result.rows;
}

// Get curator statistics
export async function getCuratorStats() {
  const totalRepos = await query('SELECT COUNT(*) as count FROM curated_repositories');
  const totalRuns = await query('SELECT COUNT(*) as count FROM curation_runs WHERE run_status = \'completed\'');
  const topCategory = await query(`
    SELECT category, COUNT(*) as count 
    FROM curated_repositories 
    GROUP BY category 
    ORDER BY count DESC 
    LIMIT 1
  `);
  const avgScore = await query('SELECT AVG(final_score) as avg_score FROM curated_repositories');
  const mcpCount = await query('SELECT COUNT(*) as count FROM curated_repositories WHERE mcp_compatible = true');
  
  return {
    totalRepositories: parseInt(totalRepos.rows[0].count),
    totalRuns: parseInt(totalRuns.rows[0].count),
    topCategory: topCategory.rows[0] || { category: 'N/A', count: 0 },
    averageScore: parseFloat(avgScore.rows[0].avg_score || 0),
    mcpCompatibleCount: parseInt(mcpCount.rows[0].count)
  };
}

// Get recent curation runs
export async function getRecentCurationRuns(limit = 10) {
  const result = await query(`
    SELECT * FROM curation_runs 
    ORDER BY run_date DESC 
    LIMIT $1
  `, [limit]);
  return result.rows;
}

// Get repositories by category
export async function getRepositoriesByCategory(category: string, limit = 20) {
  const result = await query(`
    SELECT 
      id,
      repo_name as name,
      repo_url as github_url,
      description,
      category,
      developer_relevance_score,
      utility_score,
      final_score,
      stars as star_count,
      forks as fork_count,
      last_commit_date,
      language,
      mcp_compatible,
      installation_method,
      analysis_date as discovered_at
    FROM curated_repositories 
    WHERE category = $1 
    ORDER BY final_score DESC 
    LIMIT $2
  `, [category, limit]);
  return result.rows;
}

// Get top repositories by score
export async function getTopRepositories(limit = 10) {
  const result = await query(`
    SELECT 
      id,
      repo_name as name,
      repo_url as github_url,
      description,
      category,
      developer_relevance_score,
      utility_score,
      final_score,
      stars as star_count,
      forks as fork_count,
      last_commit_date,
      language,
      mcp_compatible,
      installation_method,
      analysis_date as discovered_at
    FROM curated_repositories 
    ORDER BY final_score DESC 
    LIMIT $1
  `, [limit]);
  return result.rows;
}

// Search repositories
export async function searchRepositories(searchTerm: string, limit = 20) {
  const result = await query(`
    SELECT 
      id,
      repo_name as name,
      repo_url as github_url,
      description,
      category,
      developer_relevance_score,
      utility_score,
      final_score,
      stars as star_count,
      forks as fork_count,
      last_commit_date,
      language,
      mcp_compatible,
      installation_method,
      analysis_date as discovered_at
    FROM curated_repositories 
    WHERE 
      repo_name ILIKE $1 OR 
      description ILIKE $1 OR 
      category ILIKE $1
    ORDER BY final_score DESC 
    LIMIT $2
  `, [`%${searchTerm}%`, limit]);
  return result.rows;
}