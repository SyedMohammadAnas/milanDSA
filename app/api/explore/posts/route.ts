import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const searchHashtag = searchParams.get('hashtag');

    let query = supabase
      .from('explore_posts_manager')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by hashtag if provided
    if (searchHashtag) {
      query = query.contains('hashtags', [searchHashtag]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabase
      .from('explore_posts_manager')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      posts: data,
      total_count: count || 0
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

