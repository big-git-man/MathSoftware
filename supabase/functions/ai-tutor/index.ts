import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const admin = createClient(supabaseUrl, serviceKey);

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const userClient = createClient(supabaseUrl, token);
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { question, conversationId, documentId, topicId } = await req.json();
    if (!question) return new Response(JSON.stringify({ error: 'question required' }), { status: 400 });
    if (!OPENAI_KEY) return new Response(JSON.stringify({ error: 'AI service is not configured' }), { status: 503 });

    let conversation = null as { id: string } | null;
    if (conversationId) {
      const { data } = await admin.from('ai_conversations').select('id').eq('id', conversationId).eq('user_id', user.id).maybeSingle();
      conversation = data;
    }
    if (!conversation) {
      const { data, error } = await admin.from('ai_conversations').insert({
        user_id: user.id,
        document_id: documentId ?? null,
        topic_id: topicId ?? null,
        title: question.slice(0, 80),
        model: 'gpt-4o-mini',
      }).select('id').single();
      if (error || !data) return new Response(JSON.stringify({ error: error?.message ?? 'Conversation creation failed' }), { status: 500 });
      conversation = data;
    }

    const { data: history } = await admin
      .from('ai_messages')
      .select('role,content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    const messages = [
      { role: 'system', content: 'You are a friendly maths tutor. Explain clearly, show working, and guide the student rather than simply giving answers. Use LaTeX wrapped in $...$ or $$...$$.' },
      ...((history ?? []) as { role: 'user' | 'assistant'; content: string }[]),
      { role: 'user' as const, content: question },
    ];

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages }),
    });
    if (!aiRes.ok) return new Response(JSON.stringify({ error: await aiRes.text() }), { status: 502 });
    const ai = await aiRes.json();
    const answer = ai.choices?.[0]?.message?.content ?? '';
    if (!answer) return new Response(JSON.stringify({ error: 'AI returned no answer' }), { status: 502 });

    await admin.from('ai_messages').insert([
      { conversation_id: conversation.id, role: 'user', content: question },
      { conversation_id: conversation.id, role: 'assistant', content: answer },
    ]);
    await admin.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id);

    return new Response(JSON.stringify({ answer, conversationId: conversation.id }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { headers: { 'content-type': 'application/json' }, status: 500 });
  }
});
