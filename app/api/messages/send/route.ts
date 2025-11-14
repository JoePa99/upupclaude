import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Force this route to use Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const { channelId, content, mentions } = await request.json();

    if (!channelId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Channel ID and content are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this channel
    const { data: membership } = await (supabase
      .from('channel_members') as any)
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this channel' },
        { status: 403 }
      );
    }

    // Insert message
    const { data: message, error: messageError } = await (supabase
      .from('messages') as any)
      .insert({
        channel_id: channelId,
        author_id: user.id,
        author_type: 'human',
        content: content.trim(),
        mentions: mentions || [],
        counts_toward_limit: mentions && mentions.length > 0,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Fetch author info separately (since author_id can reference users OR assistants)
    const { data: author } = await (supabase
      .from('users') as any)
      .select('id, name, email, avatar_url, role')
      .eq('id', user.id)
      .single();

    // Combine message with author info
    const completeMessage = {
      ...message,
      author: author,
    };

    // Trigger AI responses for mentioned assistants
    const aiTriggerResults = [];
    if (mentions && mentions.length > 0) {
      console.log('🔔 Triggering AI responses for', mentions.length, 'assistant(s):', mentions);

      // Get the base URL for server-to-server calls
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

      console.log('Using baseUrl:', baseUrl);

      // Trigger AI responses and collect results
      for (const assistantId of mentions) {
        try {
          console.log('  → Triggering AI response for assistant:', assistantId);
          const aiUrl = `${baseUrl}/api/ai/respond`;
          console.log('  → Calling URL:', aiUrl);

          const response = await fetch(aiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messageId: message.id,
              assistantId: assistantId,
              channelId: channelId,
              userMessage: content,
            }),
          });

          console.log('  → Response status:', response.status, response.statusText);

          // Get response text first to handle both JSON and HTML
          const responseText = await response.text();
          console.log('  → Response text preview:', responseText.substring(0, 200));

          if (!response.ok) {
            let errorData;
            try {
              errorData = JSON.parse(responseText);
            } catch {
              errorData = { error: 'Non-JSON response', responsePreview: responseText.substring(0, 200) };
            }
            console.error(`  ✗ AI response failed for ${assistantId}:`, errorData);
            aiTriggerResults.push({ assistantId, success: false, error: errorData });
          } else {
            let data;
            try {
              data = JSON.parse(responseText);
            } catch {
              console.error('  ✗ Success response but invalid JSON:', responseText.substring(0, 200));
              aiTriggerResults.push({ assistantId, success: false, error: 'Invalid JSON response' });
              continue;
            }
            console.log('  ✓ AI response triggered successfully for', assistantId);
            aiTriggerResults.push({ assistantId, success: true });
          }
        } catch (error: any) {
          console.error(`  ✗ Failed to trigger AI response for ${assistantId}:`, error);
          aiTriggerResults.push({ assistantId, success: false, error: error.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: completeMessage,
      aiTriggerResults: aiTriggerResults.length > 0 ? aiTriggerResults : undefined,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
