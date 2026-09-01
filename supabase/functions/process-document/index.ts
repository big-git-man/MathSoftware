import { serve } from 'https://deno.land/x/sift@0.8.1/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  try {
    const { documentId } = await req.json();
    if (!documentId) return new Response('documentId required', { status: 400 });

    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('user_id, storage_bucket, storage_path, mime_type, document_type, topic_id')
      .eq('id', documentId)
      .single();
    if (docErr || !doc) return new Response(JSON.stringify({ error: docErr?.message }), { status: 404 });

    const { data: blob, error: dlErr } = await supabase.storage.from(doc.storage_bucket).download(doc.storage_path);
    if (dlErr || !blob) return new Response(JSON.stringify({ error: dlErr?.message }), { status: 500 });

    // Light text extraction. For images/PDFs without a vision provider, return a placeholder.
    // Hook up an OCR/vision model by reading blob text or calling an AI provider.
    let text = '';
    try { text = await blob.text(); } catch { text = ''; }

    let summary = '';
    let suggestedTags: string[] = [];
    let suggestedTopic: string | null = null;
    if (OPENAI_KEY && text) {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are a tutoring assistant. Return JSON: {"summary":...,"tags":[...],"topic_id":...}' },
            { role: 'user', content: text.slice(0, 15000) },
          ],
        }),
      });
      const ai = await aiRes.json().catch(() => ({}));
      const content = ai.choices?.[0]?.message?.content;
      try {
        const parsed = JSON.parse(content ?? '{}');
        summary = parsed.summary ?? '';
        suggestedTags = parsed.tags ?? [];
        suggestedTopic = parsed.topic_id ?? null;
      } catch { /* ignore */ }
    }

    await supabase
      .from('documents')
      .update({
        extracted_text: text,
        summary,
        tags: suggestedTags.length ? suggestedTags : undefined,
        topic_id: suggestedTopic ?? doc.topic_id,
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    return new Response(JSON.stringify({ ok: true, summary, tags: suggestedTags }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
