import { NextRequest, NextResponse } from 'next/server';
import { searchRepositories, getRepositoriesByCategory } from '@/lib/db';

// GET /api/curator/search - Search curated repositories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    let repositories = [];

    if (query) {
      repositories = await searchRepositories(query, limit);
    } else if (category) {
      repositories = await getRepositoriesByCategory(category, limit);
    } else {
      return NextResponse.json({ error: 'Either query (q) or category parameter is required' }, { status: 400 });
    }

    return NextResponse.json({
      repositories,
      searchParams: {
        query,
        category,
        limit
      }
    });
  } catch (error) {
    console.error('Error searching repositories:', error);
    return NextResponse.json({ error: 'Failed to search repositories' }, { status: 500 });
  }
} 