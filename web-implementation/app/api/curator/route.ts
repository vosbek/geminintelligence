import { NextRequest, NextResponse } from 'next/server';
import { getCuratorStats, getCuratedRepositories } from '@/lib/db';

// GET /api/curator - Get curator stats and recent repositories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get statistics and repositories in parallel
    const [stats, repositories] = await Promise.all([
      getCuratorStats(),
      getCuratedRepositories(limit, offset)
    ]);

    return NextResponse.json({
      stats,
      repositories,
      pagination: {
        limit,
        offset,
        hasMore: repositories.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching curator data:', error);
    return NextResponse.json({ error: 'Failed to fetch curator data' }, { status: 500 });
  }
}

// POST /api/curator - Run curator agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      minStars = 10, 
      daysBack = 7, 
      debug = false,
      lowerThresholds = false 
    } = body;

    // Import required modules for running curator
    const { spawn } = require('child_process');
    const path = require('path');

    // Build curator command
    const curatorPath = path.resolve(process.cwd(), '..', 'curator_agent.py');
    const args = [
      curatorPath,
      '--min-stars', minStars.toString(),
      '--days', daysBack.toString()
    ];

    if (debug) args.push('--debug');
    if (lowerThresholds) args.push('--lower-thresholds');

    return new Promise((resolve) => {
      const curatorProcess = spawn('python', args, {
        cwd: path.resolve(process.cwd(), '..'),
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      curatorProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      curatorProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      curatorProcess.on('close', (code: number) => {
        if (code === 0) {
          resolve(NextResponse.json({
            success: true,
            message: 'Curator completed successfully',
            output: output.slice(-1000), // Last 1000 chars
            params: { minStars, daysBack, debug, lowerThresholds }
          }));
        } else {
          resolve(NextResponse.json({
            success: false,
            error: 'Curator process failed',
            output: output.slice(-1000),
            errorOutput: errorOutput.slice(-1000),
            exitCode: code
          }, { status: 500 }));
        }
      });

      // Set timeout for long-running process
      setTimeout(() => {
        curatorProcess.kill();
        resolve(NextResponse.json({
          success: false,
          error: 'Curator process timed out after 5 minutes',
          output: output.slice(-1000)
        }, { status: 408 }));
      }, 5 * 60 * 1000); // 5 minutes
    });

  } catch (error) {
    console.error('Error running curator:', error);
    return NextResponse.json({ error: 'Failed to run curator' }, { status: 500 });
  }
} 