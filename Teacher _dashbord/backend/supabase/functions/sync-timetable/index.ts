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

    const { facultyId, entries, academicYear } = await req.json();

    if (!facultyId || !entries || !Array.isArray(entries)) {
      return new Response(
        JSON.stringify({ error: 'Missing facultyId or valid entries array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = entries.map((entry) => ({
      faculty_id: facultyId,
      day_of_week: entry.dayOfWeek,
      slot_index: entry.slotIndex,
      subject_code: entry.subjectCode,
      class_code: entry.classCode,
      room: entry.room,
      is_lab: entry.isLab || false,
      academic_year: academicYear || '2024-2025',
    }));

    const { data, error } = await supabaseClient
      .from('timetable')
      .upsert(payload, { onConflict: 'faculty_id,day_of_week,slot_index,academic_year' })
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Timetable synchronized successfully',
        syncedCount: data.length,
        entries: data,
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
