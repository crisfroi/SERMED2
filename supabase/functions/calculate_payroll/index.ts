// WEEK 11 ADMIN 1: Deno Edge Functions (Supabase)
// Function: calculate_payroll
// Purpose: Calculate net salary in XAF with all deductions
// Trigger: POST /api/v1/hr/payroll/calculate

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { payroll_id, base_salary_xaf, bonuses_xaf, deductions_xaf, social_security_xaf, health_insurance_xaf, income_tax_xaf } = await req.json();

    // Validate input
    if (typeof base_salary_xaf !== 'number' || base_salary_xaf < 0) {
      return new Response(
        JSON.stringify({
          error: 'Invalid base_salary_xaf (must be non-negative number)',
          success: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate gross salary (base + bonuses)
    const gross_salary_xaf = base_salary_xaf + (bonuses_xaf || 0);

    // Calculate total deductions
    const total_deductions_xaf =
      (deductions_xaf || 0) +
      (social_security_xaf || 0) +
      (health_insurance_xaf || 0) +
      (income_tax_xaf || 0);

    // Calculate net salary
    const net_salary_xaf = Math.max(0, gross_salary_xaf - total_deductions_xaf);

    // Validate: net cannot exceed gross
    if (net_salary_xaf > gross_salary_xaf) {
      return new Response(
        JSON.stringify({
          error: 'Calculation error: net salary exceeds gross (deductions misconfigured)',
          success: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate percentages for audit
    const deduction_percent = gross_salary_xaf > 0 ? (total_deductions_xaf / gross_salary_xaf) * 100 : 0;

    // Build response
    const calculation_result = {
      payroll_id,
      base_salary_xaf: parseFloat(base_salary_xaf.toFixed(2)),
      bonuses_xaf: parseFloat((bonuses_xaf || 0).toFixed(2)),
      gross_salary_xaf: parseFloat(gross_salary_xaf.toFixed(2)),
      social_security_xaf: parseFloat((social_security_xaf || 0).toFixed(2)),
      health_insurance_xaf: parseFloat((health_insurance_xaf || 0).toFixed(2)),
      income_tax_xaf: parseFloat((income_tax_xaf || 0).toFixed(2)),
      deductions_xaf: parseFloat((deductions_xaf || 0).toFixed(2)),
      total_deductions_xaf: parseFloat(total_deductions_xaf.toFixed(2)),
      net_salary_xaf: parseFloat(net_salary_xaf.toFixed(2)),
      deduction_percent: parseFloat(deduction_percent.toFixed(2)),
      currency: 'XAF',
      calculated_at: new Date().toISOString(),
      success: true,
    };

    // Update database if payroll_id provided
    if (payroll_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_ANON_KEY') || ''
      );

      const { error: updateError } = await supabase
        .from('payroll_processing')
        .update({
          gross_salary_xaf: calculation_result.gross_salary_xaf,
          total_deductions_xaf: calculation_result.total_deductions_xaf,
          net_salary_xaf: calculation_result.net_salary_xaf,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payroll_id);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({
            error: 'Failed to update payroll record',
            details: updateError.message,
            calculation: calculation_result, // Still return calculation
            success: false,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(JSON.stringify(calculation_result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Calculation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Calculation failed',
        details: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
