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

    const { classCode, subjectCode } = await req.json();

    if (!classCode || !subjectCode) {
      return new Response(
        JSON.stringify({ error: 'classCode and subjectCode are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: students, error: studentErr } = await supabaseClient
      .from('students')
      .select('id, roll_no, roll_formatted, name, email')
      .eq('class_code', classCode)
      .order('roll_no', { ascending: true });

    if (studentErr) throw studentErr;

    const { data: sessions, error: sessionErr } = await supabaseClient
      .from('attendance_sessions')
      .select('id, lecture_date, lecture_time, status')
      .eq('class_code', classCode)
      .eq('subject_code', subjectCode)
      .eq('status', 'submitted');

    if (sessionErr) throw sessionErr;

    const totalSessions = sessions.length;

    const report = await Promise.all(
      students.map(async (student) => {
        const { data: records } = await supabaseClient
          .from('attendance_records')
          .select('status')
          .eq('student_id', student.id)
          .in('session_id', sessions.map((s) => s.id));

        const presentCount = (records ?? []).filter(
          (r) => r.status === 'present' || r.status === 'late'
        ).length;
        const rate = totalSessions > 0 ? ((presentCount / totalSessions) * 100).toFixed(2) : '0.00';

        return {
          ...student,
          totalLectures: totalSessions,
          attendedLectures: presentCount,
          attendanceRate: `${rate}%`,
          isDefaulter: parseFloat(rate) < 75.0,
        };
      })
    );

    return new Response(
      JSON.stringify({
        classCode,
        subjectCode,
        totalConductedLectures: totalSessions,
        totalEnrolledStudents: students.length,
        defaultersCount: report.filter((r) => r.isDefaulter).length,
        students: report,
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
