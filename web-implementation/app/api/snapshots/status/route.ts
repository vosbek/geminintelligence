// app/api/snapshots/status/route.ts - Get scraper status and progress
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get current session info
    const sessionResult = await query(`
      SELECT * FROM curation_sessions 
      ORDER BY started_at DESC 
      LIMIT 1
    `);
    
    // Get tool statuses
    const toolsResult = await query(`
      SELECT 
        id, name, run_status, last_run,
        CASE WHEN last_run > NOW() - INTERVAL '1 hour' THEN true ELSE false END as recently_updated
      FROM ai_tools 
      WHERE status = 'active'
      ORDER BY last_run DESC NULLS LAST
    `);
    
    // Get recent snapshots (last 24 hours)
    const recentSnapshotsResult = await query(`
      SELECT 
        ts.id, ts.tool_id, ts.snapshot_date, ts.review_status, ts.changes_detected,
        t.name as tool_name
      FROM tool_snapshots ts
      JOIN ai_tools t ON ts.tool_id = t.id
      WHERE ts.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY ts.created_at DESC
    `);
    
    // Calculate overall status
    const tools = toolsResult.rows;
    const runningTools = tools.filter(t => t.run_status === 'update').length;
    const completedTools = tools.filter(t => t.run_status === 'processed').length;
    const errorTools = tools.filter(t => t.run_status === 'error').length;
    
    const currentSession = sessionResult.rows[0] || null;
    const isRunning = runningTools > 0;
    
    return NextResponse.json({
      success: true,
      status: {
        isRunning,
        currentSession,
        progress: {
          total: tools.length,
          running: runningTools,
          completed: completedTools,
          errors: errorTools,
          percentage: tools.length > 0 ? Math.round((completedTools / tools.length) * 100) : 0
        },
        tools: tools.map(tool => ({
          id: tool.id,
          name: tool.name,
          status: tool.run_status,
          lastRun: tool.last_run,
          recentlyUpdated: tool.recently_updated
        })),
        recentSnapshots: recentSnapshotsResult.rows.map(snapshot => ({
          id: snapshot.id,
          toolId: snapshot.tool_id,
          toolName: snapshot.tool_name,
          date: snapshot.snapshot_date,
          reviewStatus: snapshot.review_status,
          hasChanges: snapshot.changes_detected
        }))
      }
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get scraper status: ' + error.message },
      { status: 500 }
    );
  }
}