import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionId, records } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (records && Array.isArray(records) && records.length > 0) {
      const formatted = records.map((r) => ({
        session_id: sessionId,
        student_id: r.studentId,
        roll_no: r.rollNo,
        status: r.status,
        remarks: r.remarks || null,
        marked_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabaseClient
        .from('attendance_records')
        .upsert(formatted, { onConflict: 'session_id,student_id' });

      if (upsertErr) throw upsertErr;
    }

    const { data: updatedSession, error: updateErr } = await supabaseClient
      .from('attendance_sessions')
      .update({
        status: 'submitted',
        is_draft_saved: false,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attendance session submitted successfully',
        session: updatedSession,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
