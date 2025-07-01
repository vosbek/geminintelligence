// app/api/tool/[id]/curate/route.ts - Endpoint to save curated data for a specific section
import { NextRequest, NextResponse } from 'next/server';
import { saveCuratedSection } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = params.id;
    const { section_name, curated_content } = await request.json();

    if (!section_name || !curated_content) {
      return NextResponse.json(
        { success: false, error: 'Missing section_name or curated_content' },
        { status: 400 }
      );
    }

    const result = await saveCuratedSection(toolId, section_name, curated_content);

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Curation save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save curated data' },
      { status: 500 }
    );
  }
} 