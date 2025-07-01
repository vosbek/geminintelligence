// app/api/tools/add-and-run/route.ts - Add new tool and run scraper
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { query } from '@/lib/db';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, github_url, category, company_name } = body;
    
    // Validate required fields
    if (!name || !description) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and description are required' 
      }, { status: 400 });
    }
    
    console.log(`➕ Adding new tool: ${name}`);
    
    // Insert new tool into database
    const toolResult = await query(`
      INSERT INTO ai_tools (name, description, github_url, category, company_name, status, run_status)
      VALUES ($1, $2, $3, $4, $5, 'active', 'update')
      RETURNING id
    `, [name, description, github_url || null, category || null, company_name || null]);
    
    const newToolId = toolResult.rows[0].id;
    
    console.log(`📊 Starting scraper for new tool: ${name} (ID: ${newToolId})`);
    
    // Start the scraper process for this new tool
    const scraperCommand = `cd .. && python -m src.main --tool-id ${newToolId}`;
    
    console.log(`Command: ${scraperCommand}`);
    
    // Execute scraper asynchronously
    const scraperProcess = execAsync(scraperCommand, {
      cwd: process.cwd(),
      timeout: 15 * 60 * 1000, // 15 minute timeout for new tool
    });
    
    // Don't wait for completion, return immediately
    scraperProcess.then(async (result) => {
      console.log(`✅ Scraper completed for new tool ${name}`);
      console.log('Output:', result.stdout);
      
      // Update tool status to processed
      await query(`
        UPDATE ai_tools 
        SET run_status = 'processed', last_run = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [newToolId]);
      
    }).catch(async (error) => {
      console.error(`❌ Scraper failed for new tool ${name}:`, error);
      
      // Update tool status to indicate error
      await query(`
        UPDATE ai_tools 
        SET run_status = 'error', last_run = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [newToolId]);
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Added ${name} and started intelligence gathering`,
      toolId: newToolId,
      toolName: name
    });
    
  } catch (error) {
    console.error('Add and run error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to add tool and start scraping: ' + errorMessage },
      { status: 500 }
    );
  }
}