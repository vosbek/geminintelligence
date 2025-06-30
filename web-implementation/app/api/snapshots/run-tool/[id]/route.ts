// app/api/snapshots/run-tool/[id]/route.ts - Trigger single tool scraper run
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { query } from '@/lib/db';

const execAsync = promisify(exec);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = params.id;
    
    // Get tool details
    const toolResult = await query('SELECT * FROM ai_tools WHERE id = $1', [toolId]);
    if (toolResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tool not found' 
      }, { status: 404 });
    }
    
    const tool = toolResult.rows[0];
    console.log(`🔄 Re-running scraper for tool: ${tool.name} (ID: ${toolId})`);
    
    // Update tool status to indicate it's being processed
    await query(`
      UPDATE ai_tools 
      SET run_status = 'update', last_run = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [toolId]);
    
    // Start the scraper process for this specific tool
    const scraperCommand = `cd .. && python3 -m src.main --tool-id ${toolId}`;
    
    console.log(`Command: ${scraperCommand}`);
    
    // Execute scraper asynchronously
    const scraperProcess = execAsync(scraperCommand, {
      cwd: process.cwd(),
      timeout: 10 * 60 * 1000, // 10 minute timeout for single tool
    });
    
    // Don't wait for completion, return immediately
    scraperProcess.then(async (result) => {
      console.log(`✅ Scraper completed for ${tool.name}`);
      console.log('Output:', result.stdout);
      
      // Update tool status to processed
      await query(`
        UPDATE ai_tools 
        SET run_status = 'processed', last_run = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [toolId]);
      
    }).catch(async (error) => {
      console.error(`❌ Scraper failed for ${tool.name}:`, error);
      
      // Update tool status to indicate error
      await query(`
        UPDATE ai_tools 
        SET run_status = 'error', last_run = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [toolId]);
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Started scraping ${tool.name}`,
      toolId: toolId,
      toolName: tool.name
    });
    
  } catch (error) {
    console.error('Single tool run error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to start tool scraping: ' + errorMessage },
      { status: 500 }
    );
  }
}