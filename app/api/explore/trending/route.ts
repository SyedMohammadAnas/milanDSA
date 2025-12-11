import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get trending hashtags using the database function
    const { data, error } = await supabase.rpc('get_trending_hashtags', {
      limit_count: limit
    });

    if (error) {
      console.error('Trending hashtags error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trending hashtags' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trending: data || []
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

