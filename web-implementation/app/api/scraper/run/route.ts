import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// POST /api/scraper/run - Trigger Python scraper
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { toolId } = body;
    
    const projectRoot = path.resolve(process.cwd(), '..');
    const pythonScript = path.join(projectRoot, 'src', 'main.py');
    
    return new Promise<NextResponse>((resolve) => {
      // Run the Python scraper
      const pythonProcess = spawn('python3', [pythonScript], {
        cwd: projectRoot,
        env: { ...process.env },
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({ 
            success: true, 
            message: 'Scraping completed successfully',
            output: stdout
          }));
        } else {
          console.error('Python scraper failed:', stderr);
          resolve(NextResponse.json({ 
            success: false, 
            error: 'Scraping failed',
            details: stderr,
            code: code
          }, { status: 500 }));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python scraper:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        resolve(NextResponse.json({ 
          success: false, 
          error: 'Failed to start scraper',
          details: errorMessage
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Error triggering scraper:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to trigger scraper' 
    }, { status: 500 });
  }
}

// GET /api/scraper/run - Check scraper status
export async function GET(): Promise<NextResponse> {
  try {
    // Check if Python environment is available
    return new Promise<NextResponse>((resolve) => {
      const checkProcess = spawn('python3', ['--version'], {
        stdio: 'pipe'
      });

      let output = '';
      checkProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      checkProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      checkProcess.on('close', (code) => {
        const projectRoot = path.resolve(process.cwd(), '..');
        const pythonScript = path.join(projectRoot, 'src', 'main.py');
        
        resolve(NextResponse.json({
          python_available: code === 0,
          python_version: output.trim(),
          script_path: pythonScript,
          project_root: projectRoot
        }));
      });

      checkProcess.on('error', () => {
        resolve(NextResponse.json({
          python_available: false,
          error: 'Python not found'
        }));
      });
    });

  } catch (error) {
    return NextResponse.json({ 
      python_available: false, 
      error: 'Failed to check Python environment' 
    });
  }
}