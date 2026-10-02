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

    const { sessionId, studentId, rollNo, status, remarks } = await req.json();

    if (!sessionId || !studentId || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId, studentId, status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseClient
      .from('attendance_records')
      .upsert(
        {
          session_id: sessionId,
          student_id: studentId,
          roll_no: rollNo,
          status,
          remarks: remarks || null,
          marked_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,student_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, record: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
