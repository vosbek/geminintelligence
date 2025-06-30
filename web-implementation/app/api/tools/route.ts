import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/tools - Get all tools
export async function GET() {
  try {
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
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'url', tu.url,
              'url_type', tu.url_type
            ) ORDER BY tu.id
          ) FILTER (WHERE tu.id IS NOT NULL), 
          '[]'::json
        ) as urls,
        ts.snapshot_date,
        ts.processing_status,
        CASE WHEN ts.basic_info IS NOT NULL THEN true ELSE false END as has_intelligence
      FROM ai_tools t
      LEFT JOIN tool_urls tu ON t.id = tu.tool_id
      LEFT JOIN LATERAL (
        SELECT snapshot_date, processing_status, basic_info FROM tool_snapshots 
        WHERE tool_id = t.id 
        ORDER BY snapshot_date DESC 
        LIMIT 1
      ) ts ON true
      GROUP BY t.id, ts.snapshot_date, ts.processing_status, ts.basic_info
      ORDER BY t.updated_at DESC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

// POST /api/tools - Add new tool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      github_url, 
      stock_symbol, 
      category, 
      company_name, 
      legal_company_name,
      urls = [] 
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 });
    }

    // Start transaction
    const client = await query('BEGIN');
    
    try {
      // Insert the tool
      const toolResult = await query(`
        INSERT INTO ai_tools (
          name, description, github_url, stock_symbol, category, 
          company_name, legal_company_name, run_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'update')
        RETURNING *
      `, [name, description, github_url, stock_symbol, category, company_name, legal_company_name]);

      const tool = toolResult.rows[0];

      // Insert URLs if provided
      if (urls && urls.length > 0) {
        for (const urlInfo of urls) {
          if (urlInfo.url && urlInfo.url_type) {
            await query(`
              INSERT INTO tool_urls (tool_id, url, url_type)
              VALUES ($1, $2, $3)
            `, [tool.id, urlInfo.url, urlInfo.url_type]);
          }
        }
      }

      // Commit transaction
      await query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        tool: tool,
        message: 'Tool added successfully. Set to run_status=update for next scraping run.' 
      });

    } catch (error) {
      // Rollback on error
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error adding tool:', error);
    return NextResponse.json({ error: 'Failed to add tool' }, { status: 500 });
  }
}