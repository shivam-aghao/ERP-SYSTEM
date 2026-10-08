// ==============================================================================
// SSGMCE COLLEGE ERP — SUPABASE EDGE FUNCTION: cleanup-expired-quizzes
// Safely cleans expired temporary scheduled tests from timetable_assessments
// Timezone: Asia/Kolkata (IST = UTC+5:30)
// Does NOT delete permanent academic records, curriculum tests, teachers, students, etc.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in environment variables.");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Current time in Asia/Kolkata (UTC+5:30)
    const nowUtc = new Date();
    const kolkataTime = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
    const todayStr = kolkataTime.toISOString().split("T")[0];
    const curHour = kolkataTime.getUTCHours();
    const curMin = kolkataTime.getUTCMinutes();
    const curTotalMins = curHour * 60 + curMin;

    // Fetch temporary scheduled tests
    const { data: tests, error } = await supabase
      .from("timetable_assessments")
      .select("*")
      .like("id", "test-%");

    if (error) throw error;

    const deletedIds: string[] = [];

    for (const test of (tests || [])) {
      if (!test.date || !test.end_time) continue;

      let isExpired = false;
      if (test.date < todayStr) {
        isExpired = true;
      } else if (test.date === todayStr) {
        const parts = test.end_time.split(":");
        const endH = parseInt(parts[0], 10) || 0;
        const endM = parseInt(parts[1], 10) || 0;
        const endMins = endH * 60 + endM;
        if (curTotalMins >= endMins) {
          isExpired = true;
        }
      }

      if (isExpired) {
        const { error: delErr } = await supabase
          .from("timetable_assessments")
          .delete()
          .eq("id", test.id);

        if (!delErr) {
          deletedIds.push(test.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned ${deletedIds.length} expired scheduled tests`,
        deletedIds,
        kolkataTime: kolkataTime.toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

