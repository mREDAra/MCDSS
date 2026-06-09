import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Use service role key to bypass RLS for inserting logs
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    const { email, country, desired_program, budget, language_preference, priority_profile } = await req.json()

    // 1. Insert Student Lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('student_leads')
      .insert({ email, country, desired_program, budget, language_preference, priority_profile })
      .select()
      .single()

    if (leadError) throw leadError

    // 2. Query Data
    const { data: universities } = await supabaseAdmin.from('universities').select('*')
    const { data: programs } = await supabaseAdmin.from('program_options').select('*').ilike('program_name', `%${desired_program}%`)
    const { data: recognitions } = await supabaseAdmin.from('country_recognitions').select('*').eq('country_name', country)

    const recognitionMap = {}
    if (recognitions) {
      recognitions.forEach(r => {
        recognitionMap[r.university_id] = r.recognition_status
      })
    }

    const uniMap = {}
    if (universities) {
      universities.forEach(u => {
        uniMap[u.id] = u
      })
    }

    // 3. Scoring Logic
    let w_budget, w_lang, w_recog, w_rank
    const isOther = country === 'Other'

    if (isOther) {
      if (priority_profile === 'Balanced Option') { w_budget = 0.50; w_lang = 0.30; w_recog = 0; w_rank = 0.20; }
      else if (priority_profile === 'Affordable Option') { w_budget = 0.70; w_lang = 0.20; w_recog = 0; w_rank = 0.10; }
      else { w_budget = 0.20; w_lang = 0.20; w_recog = 0; w_rank = 0.60; } // Ranked Option
    } else {
      if (priority_profile === 'Balanced Option') { w_budget = 0.35; w_lang = 0.20; w_recog = 0.30; w_rank = 0.15; }
      else if (priority_profile === 'Affordable Option') { w_budget = 0.55; w_lang = 0.15; w_recog = 0.20; w_rank = 0.10; }
      else { w_budget = 0.20; w_lang = 0.15; w_recog = 0.50; w_rank = 0.15; } // Recognized & Ranked
    }

    const evaluatedPrograms = []

    for (const p of programs) {
      const uni = uniMap[p.university_id]
      if (!uni) continue

      // Budget Score
      let budgetScore = 0
      const tuition = p.cash_payment_tuition_usd
      if (tuition <= budget) {
        budgetScore = 100
      } else {
        budgetScore = Math.max(0, 100 - (((tuition - budget) / budget) * 100))
      }

      // Language Score
      let langScore = 0
      if (language_preference === 'No Preference') {
        langScore = 100
      } else if (p.language === language_preference) {
        langScore = 100 // Exact match
      } else if (p.language && p.language.includes(language_preference)) {
        langScore = 50 // Partial match
      }

      // Hard Language Filter: If it does not match the preference at all, skip it.
      if (langScore === 0) continue;

      // Recognition Score
      let recogScore: any = 0
      if (isOther) {
        recogScore = 'N/A' // Not Applied
      } else {
        const status = recognitionMap[p.university_id]
        if (status === 'recognized') recogScore = 100
        else if (status === 'needs_manual_verification') recogScore = 50
        else recogScore = 0
      }

      // Ranking Score
      const rankScore = uni.ranking_score || 0

      // Final Score
      const effectiveRecogScore = typeof recogScore === 'number' ? recogScore : 0
      const finalScore = (budgetScore * w_budget) + (langScore * w_lang) + (effectiveRecogScore * w_recog) + (rankScore * w_rank)

      evaluatedPrograms.push({
        program: p,
        university: uni,
        recognition_status: isOther ? 'N/A' : (recognitionMap[p.university_id] || 'not_recognized'),
        scores: { 
          budgetScore, 
          langScore, 
          recogScore, 
          rankScore, 
          finalScore,
          weights: { w_budget, w_lang, w_recog, w_rank }
        }
      })
    }

    evaluatedPrograms.sort((a, b) => b.scores.finalScore - a.scores.finalScore)

    // Assign labels (Simplified logic for top 4)
    const topResults = evaluatedPrograms.slice(0, 4)
    if (topResults.length > 0) topResults[0].label = 'Best Match'
    if (topResults.length > 1) {
        // Find affordable
        const affordable = topResults.find(r => r.program.cash_payment_tuition_usd <= budget && !r.label)
        if (affordable) affordable.label = 'Affordable Option'
    }
    
    // Fallback assignment for any remaining
    const labels = ['Balanced Option', 'Recognized & Ranked Option', 'Alternative Option']
    let labelIdx = 0
    for (const r of topResults) {
        if (!r.label) {
            r.label = isOther && labels[labelIdx] === 'Recognized & Ranked Option' ? 'Ranked Option' : labels[labelIdx]
            labelIdx++
        }
    }

    // Insert Logs
    const logs = topResults.map(r => ({
      student_lead_id: lead.id,
      recommended_program_id: r.program.id,
      final_score: r.scores.finalScore,
      recommendation_label: r.label || 'Recommended',
      score_breakdown: r.scores
    }))

    if (logs.length > 0) {
      await supabaseAdmin.from('recommendation_logs').insert(logs)
    }

    return new Response(JSON.stringify(topResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
