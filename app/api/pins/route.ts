import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/pins?userId=xxx
 * Fetch all pins for a user
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;

    // Verify user is requesting their own pins or is admin
    if (userId !== user.id) {
      // TODO: Add admin check if needed
      return NextResponse.json(
        { error: 'You can only access your own pins' },
        { status: 403 }
      );
    }

    // Fetch pins
    const { data: pins, error: pinsError } = await (supabase
      .from('pins') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (pinsError) throw pinsError;

    return NextResponse.json(pins || []);
  } catch (error: any) {
    console.error('Error fetching pins:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pins
 * Create a new pin
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message_id, content, content_type, collection, tags, metadata } = body;

    if (!content || !content_type) {
      return NextResponse.json(
        { error: 'Content and content_type are required' },
        { status: 400 }
      );
    }

    // Create pin
    const { data: pin, error: pinError } = await (supabase
      .from('pins') as any)
      .insert({
        user_id: user.id,
        message_id,
        content,
        content_type,
        collection: collection || 'Quick Pins',
        tags: tags || [],
        metadata: metadata || {},
      })
      .select()
      .single();

    if (pinError) throw pinError;

    return NextResponse.json(pin, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create pin' },
      { status: 500 }
    );
  }
}
