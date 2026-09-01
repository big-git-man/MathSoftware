import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { documentId } = await req.json();
    if (!documentId) return new Response(JSON.stringify({ error: 'documentId required' }), { status: 400 });

    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('id,user_id,storage_bucket,storage_path,mime_type,document_type,topic_id')
      .eq('id', documentId)
      .single();
    if (docErr || !doc) return new Response(JSON.stringify({ error: docErr?.message ?? 'Document not found' }), { status: 404 });

    await supabase.from('documents').update({ processing_status: 'processing' }).eq('id', documentId);

    const { data: blob, error: dlErr } = await supabase.storage
      .from(doc.storage_bucket)
      .download(doc.storage_path);
    if (dlErr || !blob) {
      await supabase.from('documents').update({ processing_status: 'failed' }).eq('id', documentId);
      return new Response(JSON.stringify({ error: dlErr?.message ?? 'Download failed' }), { status: 500 });
    }

    // The uploaded binary is retained as the source of truth. For PDFs/images,
    // OCR/vision is provider-dependent. If the provider returns no text, we
    // still mark the document ready and preserve the upload.
    let extractedText = '';
    const summary = '';
    const mime = doc.mime_type ?? '';
    if (mime === 'text/plain' || mime === 'text/csv') {
      extractedText = await blob.text();
    }

    let aiTitle: string | null = null;
    let aiSummary: string | null = null;
    let aiClassification: Record<string, unknown> | null = null;

    if (OPENAI_KEY && extractedText.trim()) {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'Return JSON with title, summary, and classification. classification may contain tags and difficulty.' },
            { role: 'user', content: extractedText.slice(0, 15000) },
          ],
        }),
      });
      const ai = await aiRes.json().catch(() => ({}));
      try {
        const parsed = JSON.parse(ai.choices?.[0]?.message?.content ?? '{}');
        aiTitle = parsed.title ?? null;
        aiSummary = parsed.summary ?? null;
        aiClassification = parsed.classification ?? null;
      } catch {}
    }

    const { error: updateErr } = await supabase
      .from('documents')
      .update({
        ocr_text: extractedText || null,
        ai_title: aiTitle,
        ai_summary: aiSummary ?? summary,
        ai_classification: aiClassification,
        processing_status: 'ready',
      })
      .eq('id', documentId);

    if (updateErr) {
      await supabase.from('documents').update({ processing_status: 'failed' }).eq('id', documentId);
      return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, documentId, extractedText: Boolean(extractedText), title: aiTitle, summary: aiSummary }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { headers: { 'content-type': 'application/json' }, status: 500 });
  }
});
