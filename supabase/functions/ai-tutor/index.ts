import { serve } from 'https://deno.land/x/sift@0.8.1/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  try {
    const { userId, question } = await req.json();
    if (!userId || !question) return new Response('userId and question required', { status: 400 });
    if (!OPENAI_KEY) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { status: 503 });

    const { data: conv, error: convErr } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (convErr) return new Response(JSON.stringify({ error: convErr.message }), { status: 500 });

    const messages = [
      { role: 'system', content: 'You are a friendly maths tutor. Explain clearly, show working, keep it concise. Use LaTeX wrapped in $...$ or $$...$$.' },
      { role: 'user', content: question },
    ];

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages }),
    });
    const ai = await aiRes.json();
    const answer = ai.choices?.[0]?.message?.content ?? '';

    await supabase.from('ai_messages').insert([
      { conversation_id: conv.id, role: 'user', content: question },
      { conversation_id: conv.id, role: 'assistant', content: answer },
    ]);

    return new Response(JSON.stringify({ answer }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
