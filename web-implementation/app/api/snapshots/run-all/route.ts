// app/api/snapshots/run-all/route.ts - Trigger full weekly scraper run
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { query } from '@/lib/db';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting weekly intelligence run...');
    
    // Create a new curation session
    const sessionResult = await query(`
      INSERT INTO curation_sessions (session_date, session_notes)
      VALUES (CURRENT_DATE, 'Weekly automated intelligence run')
      RETURNING id
    `);
    const sessionId = sessionResult.rows[0].id;
    
    // Get all active tools that need scraping
    const toolsResult = await query(`
      SELECT id, name FROM ai_tools 
      WHERE status = 'active' 
      ORDER BY name
    `);
    const tools = toolsResult.rows;
    
    if (tools.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active tools found to scrape' 
      });
    }
    
    // Start the scraper process in the background
    // Note: This assumes your scraper is in the parent directory
    const scraperCommand = `cd .. && python -m src.main --all-tools`;
    
    console.log(`📊 Running scrapers for ${tools.length} tools...`);
    console.log(`Command: ${scraperCommand}`);
    
    // Execute scraper asynchronously
    const scraperProcess = execAsync(scraperCommand, {
      cwd: process.cwd(),
      timeout: 30 * 60 * 1000, // 30 minute timeout
    });
    
    // Don't wait for completion, return immediately with session info
    scraperProcess.then((result) => {
      console.log('✅ Scraper completed successfully');
      console.log('Output:', result.stdout);
      
      // Update session as completed
      query(`
        UPDATE curation_sessions 
        SET completed_at = CURRENT_TIMESTAMP, 
            tools_reviewed = $1
        WHERE id = $2
      `, [tools.length, sessionId]);
      
    }).catch((error) => {
      console.error('❌ Scraper failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Update session with error
      query(`
        UPDATE curation_sessions 
        SET session_notes = $1
        WHERE id = $2
      `, [`Error: ${errorMessage}`, sessionId]);
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Started scraping ${tools.length} tools`,
      sessionId: sessionId,
      toolsCount: tools.length,
      tools: tools.map(t => ({ id: t.id, name: t.name }))
    });
    
  } catch (error) {
    console.error('Weekly run error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to start weekly run: ' + errorMessage },
      { status: 500 }
    );
  }
}