// app/api/tool/[id]/enterprise/route.ts - Enterprise position API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { saveEnterprisePosition } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = params.id;
    const body = await request.json();
    
    const {
      market_position,
      competitive_advantages,
      target_enterprises,
      implementation_complexity,
      strategic_notes
    } = body;

    const result = await saveEnterprisePosition(toolId, {
      market_position,
      competitive_advantages,
      target_enterprises,
      implementation_complexity,
      strategic_notes
    });

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Enterprise position save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save enterprise position' },
      { status: 500 }
    );
  }
}