import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/channels/[id]/assistants
 * Adds assistants to a channel
 */
export async function POST(
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

  const { id } = await params;

  try {
    const body = await request.json();
    const { assistantIds } = body;

    if (!assistantIds || !Array.isArray(assistantIds) || assistantIds.length === 0) {
      return NextResponse.json(
        { error: 'Assistant IDs are required' },
        { status: 400 }
      );
    }

    // Get user's workspace
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('workspace_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const workspaceId = userData.workspace_id;

    // Verify channel exists and belongs to user's workspace
    const { data: channel } = await (supabase
      .from('channels') as any)
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Verify all assistants exist in the workspace
    const { data: assistantsToAdd } = await (supabase
      .from('assistants') as any)
      .select('id')
      .eq('workspace_id', workspaceId)
      .in('id', assistantIds);

    if (!assistantsToAdd || assistantsToAdd.length !== assistantIds.length) {
      return NextResponse.json(
        { error: 'Some assistants not found in workspace' },
        { status: 400 }
      );
    }

    // Get existing assistants
    const { data: existingAssistants } = await (supabase
      .from('channel_assistants') as any)
      .select('assistant_id')
      .eq('channel_id', id);

    const existingAssistantIds = new Set(
      existingAssistants?.map((a: any) => a.assistant_id) || []
    );

    // Filter out assistants who are already in the channel
    const newAssistantIds = assistantIds.filter(
      (assistantId) => !existingAssistantIds.has(assistantId)
    );

    if (newAssistantIds.length === 0) {
      return NextResponse.json({
        message: 'All assistants are already in the channel',
        added: 0,
      });
    }

    // Add new assistants
    const assistantsToInsert = newAssistantIds.map((assistantId) => ({
      channel_id: id,
      assistant_id: assistantId,
    }));

    const { error: insertError } = await (supabase
      .from('channel_assistants') as any)
      .insert(assistantsToInsert);

    if (insertError) {
      console.error('Error adding assistants:', insertError);
      throw insertError;
    }

    console.log('✓ Added', newAssistantIds.length, 'assistants to channel:', id);

    return NextResponse.json({
      success: true,
      added: newAssistantIds.length,
    });
  } catch (error: any) {
    console.error('Error adding assistants:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add assistants' },
      { status: 500 }
    );
  }
}
