import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const hashtags = JSON.parse(formData.get('hashtags') as string);
    const postedBy = formData.get('posted_by') as string;

    if (!image || !postedBy) {
      return NextResponse.json(
        { error: 'Image and posted_by are required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename
    const fileExt = image.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    // Upload image to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('explore_posts')
      .upload(filePath, image, {
        contentType: image.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('explore_posts')
      .getPublicUrl(filePath);

    // Insert post data into database (no position needed anymore)
    const { data: postData, error: insertError } = await supabase
      .from('explore_posts_manager')
      .insert({
        image_url: publicUrl,
        posted_by: postedBy,
        hashtags: hashtags
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      // Clean up uploaded image if database insert fails
      await supabase.storage.from('explore_posts').remove([filePath]);
      return NextResponse.json(
        { error: 'Failed to save post data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      post: postData
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
