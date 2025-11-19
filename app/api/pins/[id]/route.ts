import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/pins/[id]
 * Delete a specific pin
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    // Verify pin belongs to user
    const { data: pin } = await (supabase
      .from('pins') as any)
      .select('user_id')
      .eq('id', id)
      .single();

    if (!pin) {
      return NextResponse.json(
        { error: 'Pin not found' },
        { status: 404 }
      );
    }

    if (pin.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own pins' },
        { status: 403 }
      );
    }

    // Delete pin
    const { error: deleteError } = await (supabase
      .from('pins') as any)
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting pin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete pin' },
      { status: 500 }
    );
  }
}
