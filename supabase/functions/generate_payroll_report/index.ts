// WEEK 11 ADMIN 1: Deno Edge Functions (Supabase)
// Function: generate_payroll_report
// Purpose: Generate payroll reports in PDF/Excel formats with XAF calculations
// Trigger: POST /api/v1/hr/payroll/export

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayrollReportRequest {
  period: string; // YYYY-MM format
  format: 'pdf' | 'excel' | 'csv';
  include_summary: boolean;
  include_breakdown: boolean;
}

// Format currency with XAF
const formatXAF = (amount: number): string => {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Generate CSV format payroll report
const generateCSVReport = (payrolls: any[], period: string): string => {
  const lines: string[] = [];

  // Header
  lines.push(`RAPPORT DE PAIE - ${period}`);
  lines.push(`Généré: ${new Date().toLocaleDateString('fr-CA')}`);
  lines.push('');

  // Column headers
  lines.push([
    'Numéro Employé',
    'Nom Complet',
    'Département',
    'Salaire Base (XAF)',
    'Bonus (XAF)',
    'Brut (XAF)',
    'Cotisations (XAF)',
    'Assurance Santé (XAF)',
    'Impôts (XAF)',
    'Total Retenues (XAF)',
    'Net à Payer (XAF)',
    'Statut',
  ].join(','));

  // Data rows
  payrolls.forEach((p) => {
    lines.push([
      p.staff_id,
      `"${p.staff_name}"`,
      `"${p.department}"`,
      p.base_salary_xaf.toFixed(2),
      (p.bonuses_xaf || 0).toFixed(2),
      p.gross_salary_xaf.toFixed(2),
      (p.social_security_xaf || 0).toFixed(2),
      (p.health_insurance_xaf || 0).toFixed(2),
      (p.income_tax_xaf || 0).toFixed(2),
      p.total_deductions_xaf.toFixed(2),
      p.net_salary_xaf.toFixed(2),
      p.status,
    ].join(','));
  });

  // Summary
  lines.push('');
  lines.push('RÉSUMÉ');
  const totalBase = payrolls.reduce((sum, p) => sum + (p.base_salary_xaf || 0), 0);
  const totalGross = payrolls.reduce((sum, p) => sum + (p.gross_salary_xaf || 0), 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + (p.total_deductions_xaf || 0), 0);
  const totalNet = payrolls.reduce((sum, p) => sum + (p.net_salary_xaf || 0), 0);

  lines.push(`Nombre d'employés,${payrolls.length}`);
  lines.push(`Salaire Total Base (XAF),${totalBase.toFixed(2)}`);
  lines.push(`Total Brut (XAF),${totalGross.toFixed(2)}`);
  lines.push(`Total Retenues (XAF),${totalDeductions.toFixed(2)}`);
  lines.push(`Total Net (XAF),${totalNet.toFixed(2)}`);
  lines.push(`Moyenne par Employé (XAF),${(totalNet / payrolls.length).toFixed(2)}`);

  return lines.join('\n');
};

// Generate HTML for PDF (can be converted with external service)
const generateHTMLReport = (payrolls: any[], period: string, summary: boolean): string => {
  const totalBase = payrolls.reduce((sum, p) => sum + (p.base_salary_xaf || 0), 0);
  const totalGross = payrolls.reduce((sum, p) => sum + (p.gross_salary_xaf || 0), 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + (p.total_deductions_xaf || 0), 0);
  const totalNet = payrolls.reduce((sum, p) => sum + (p.net_salary_xaf || 0), 0);

  let html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; color: #333; }
        .summary { margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .summary-item { padding: 10px; background: white; border-left: 4px solid #007bff; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #007bff; color: white; }
        tr:hover { background-color: #f5f5f5; }
        .total-row { font-weight: bold; background-color: #e9ecef; }
        .warning { color: #ff9800; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>RAPPORT DE PAIE</h1>
      <p style="text-align: center; color: #666;">Période: ${period}</p>
      <p style="text-align: center; color: #666;">Généré: ${new Date().toLocaleDateString('fr-CA')}</p>
  `;

  if (summary) {
    html += `
      <div class="summary">
        <h2>RÉSUMÉ EXÉCUTIF</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <strong>Nombre d'employés:</strong> ${payrolls.length}
          </div>
          <div class="summary-item">
            <strong>Masse Salariale Brute:</strong> ${formatXAF(totalGross)}
          </div>
          <div class="summary-item">
            <strong>Total Retenues:</strong> ${formatXAF(totalDeductions)}
          </div>
          <div class="summary-item">
            <strong>Total Net (à Payer):</strong> ${formatXAF(totalNet)}
          </div>
          <div class="summary-item">
            <strong>Moyenne par Employé:</strong> ${formatXAF(totalNet / payrolls.length)}
          </div>
          <div class="summary-item">
            <strong>Taux de Retenue:</strong> ${(((totalDeductions / totalGross) * 100).toFixed(2))}%
          </div>
        </div>
      </div>
    `;
  }

  html += `
    <table>
      <thead>
        <tr>
          <th>Employé</th>
          <th>Département</th>
          <th>Salaire Base (XAF)</th>
          <th>Bonus (XAF)</th>
          <th>Brut (XAF)</th>
          <th>Retenues (XAF)</th>
          <th>Net (XAF)</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
  `;

  payrolls.forEach((p) => {
    const statusBadge =
      p.status === 'paid'
        ? '<span style="color: green;">✓ Payé</span>'
        : '<span class="warning">○ En attente</span>';

    html += `
      <tr>
        <td>${p.staff_name}</td>
        <td>${p.department}</td>
        <td style="text-align: right;">${formatXAF(p.base_salary_xaf)}</td>
        <td style="text-align: right;">${formatXAF(p.bonuses_xaf || 0)}</td>
        <td style="text-align: right;">${formatXAF(p.gross_salary_xaf)}</td>
        <td style="text-align: right;">${formatXAF(p.total_deductions_xaf)}</td>
        <td style="text-align: right; font-weight: bold;">${formatXAF(p.net_salary_xaf)}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="2">TOTAL</td>
          <td style="text-align: right;">${formatXAF(totalBase)}</td>
          <td style="text-align: right;">-</td>
          <td style="text-align: right;">${formatXAF(totalGross)}</td>
          <td style="text-align: right;">${formatXAF(totalDeductions)}</td>
          <td style="text-align: right;">${formatXAF(totalNet)}</td>
          <td>-</td>
        </tr>
      </tfoot>
    </table>
  `;

  html += `
    <div class="footer">
      <p>Ce rapport a été généré automatiquement par le système de gestion des ressources humaines.</p>
      <p>Toutes les montants sont en francs CFA (XAF).</p>
      <p>Document confidentiel - À usage interne uniquement</p>
    </div>
  `;

  html += `
    </body>
    </html>
  `;

  return html;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { period, format, include_summary, include_breakdown } = await req.json() as PayrollReportRequest;

    // Validate input
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid period format. Use YYYY-MM',
          success: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!['pdf', 'excel', 'csv'].includes(format)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid format. Must be pdf, excel, or csv',
          success: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    );

    // Fetch payroll data for period
    const { data: payrolls, error: fetchError } = await supabase
      .from('payroll_processing')
      .select(`
        id,
        staff_id,
        staff:staff_records(full_name, department_id),
        payroll_period,
        base_salary_xaf,
        bonuses_xaf,
        gross_salary_xaf,
        total_deductions_xaf,
        net_salary_xaf,
        social_security_xaf,
        health_insurance_xaf,
        income_tax_xaf,
        status
      `)
      .eq('payroll_period', period);

    if (fetchError) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch payroll data',
          details: fetchError.message,
          success: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!payrolls || payrolls.length === 0) {
      return new Response(
        JSON.stringify({
          error: `No payroll data found for period ${period}`,
          success: false,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let reportContent = '';
    let contentType = '';
    let filename = '';

    if (format === 'csv') {
      reportContent = generateCSVReport(payrolls, period);
      contentType = 'text/csv';
      filename = `payroll_${period}.csv`;
    } else if (format === 'pdf' || format === 'excel') {
      const htmlContent = generateHTMLReport(payrolls, period, include_summary ?? true);
      reportContent = htmlContent;
      contentType = 'text/html';
      filename =
        format === 'pdf' ? `payroll_${period}.html` : `payroll_${period}_export.html`;
    }

    return new Response(reportContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Report generation failed',
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
