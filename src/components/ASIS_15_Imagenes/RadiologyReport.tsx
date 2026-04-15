// @ts-nocheck
// ============================================================================
// Radiology Report Component - ASIS 15.0 - Display Radiologist Reports
// View detailed radiology reports with findings and recommendations
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  Download,
  Edit,
  FileText,
  User,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useRadiologyReport } from '@/hooks/useRadiologyReport';

interface RadiologyFinding {
  id: string;
  finding_type: string;
  location: string;
  size_mm?: number;
  description: string;
  severity_score: number;
  benign_likelihood: number;
  requires_followup: boolean;
  followup_interval_days?: number;
}

interface RadiologyReportProps {
  imagingOrderId: string;
  onReportEdited?: (reportId: string) => void;
}

const getSeverityColor = (
  score: number
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (score >= 4) return 'destructive';
  if (score >= 3) return 'secondary';
  return 'default';
};

const getSeverityLabel = (score: number): string => {
  const labels: Record<number, string> = {
    0: 'Normal',
    1: 'Cambio menor',
    2: 'Cambio moderado',
    3: 'Hallazgo significativo',
    4: 'Hallazgo crítico',
    5: 'Hallazgo de emergencia',
  };
  return labels[score] || `Severidad ${score}`;
};

const getStatusColor = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'final':
    case 'signed':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'pending_review':
      return 'outline';
    default:
      return 'secondary';
  }
};

export const RadiologyReport: React.FC<RadiologyReportProps> = ({
  imagingOrderId,
  onReportEdited,
}) => {
  const {
    report,
    findings,
    loading,
    error,
    fetchReport,
    downloadReport,
    requestEdits,
  } = useRadiologyReport();

  useEffect(() => {
    fetchReport(imagingOrderId);
  }, [imagingOrderId, fetchReport]);

  const criticalFindings = findings.filter((f) => f.severity_score >= 4);
  const followupFindings = findings.filter((f) => f.requires_followup);

  const handleDownloadPDF = async () => {
    try {
      await downloadReport(imagingOrderId);
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  const handleRequestEdits = async () => {
    try {
      await requestEdits(report?.id || '');
      onReportEdited?.(report?.id || '');
    } catch (err) {
      console.error('Error requesting edits:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Cargando reporte radiológico...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Reporte no disponible</AlertTitle>
            <AlertDescription>
              El reporte radiológico aún no está disponible. Por favor, contáctese
              con el departamento de radiología.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Critical Findings Alert */}
      {criticalFindings.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>⚠️ Hallazgos Críticos Detectados</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {criticalFindings.map((finding) => (
                <div key={finding.id} className="text-sm">
                  <strong>{finding.finding_type}</strong> en {finding.location}:{' '}
                  {finding.description}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reporte Radiológico
              </CardTitle>
              <CardDescription>
                {new Date(report.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardDescription>
            </div>
            <Badge variant={getStatusColor(report.report_status)}>
              {report.report_status === 'draft'
                ? 'Borrador'
                : report.report_status === 'pending_review'
                  ? 'Pendiente Revisión'
                  : report.report_status === 'final'
                    ? 'Final'
                    : 'Firmado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Radiologist Info */}
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Radiólogo</div>
                  <div className="font-semibold">
                    {report.radiologist_name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Fecha de Reporte</div>
                  <div className="font-semibold">
                    {new Date(report.report_date).toLocaleDateString(
                      'es-ES'
                    )}
                  </div>
                </div>
              </div>

              {report.signed_at && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-sm text-gray-600">Firmado por</div>
                      <div className="font-semibold">
                        {report.signed_by_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-600">Fecha Firma</div>
                      <div className="font-semibold">
                        {new Date(report.signed_at).toLocaleDateString(
                          'es-ES'
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>

            {report.report_status !== 'signed' && (
              <Button
                onClick={handleRequestEdits}
                variant="outline"
                size="sm"
              >
                <Edit className="mr-2 h-4 w-4" />
                Solicitar Cambios
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clinical History */}
      {report.clinical_history && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historia Clínica</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {report.clinical_history}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Technique */}
      {report.technique && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Técnica Utilizada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{report.technique}</p>
          </CardContent>
        </Card>
      )}

      {/* Prior Study Comparison */}
      {report.prior_study_comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparación con Estudios Previos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {report.prior_study_comparison}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hallazgos</CardTitle>
          <CardDescription>
            {findings.length} hallazgo{findings.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {findings.length > 0 ? (
            findings.map((finding) => (
              <div
                key={finding.id}
                className="rounded-lg border border-gray-200 p-3"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{finding.finding_type}</div>
                    <div className="text-sm text-gray-600">
                      Ubicación: {finding.location}
                      {finding.size_mm && ` • Tamaño: ${finding.size_mm}mm`}
                    </div>
                  </div>
                  <Badge variant={getSeverityColor(finding.severity_score)}>
                    {getSeverityLabel(finding.severity_score)}
                  </Badge>
                </div>

                <p className="mb-2 text-sm text-gray-700">
                  {finding.description}
                </p>

                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="text-gray-600">Probabilidad de benignidad:</span>
                    <div className="font-semibold">
                      {finding.benign_likelihood}%
                    </div>
                  </div>

                  {finding.requires_followup && (
                    <div>
                      <span className="text-gray-600">
                        Seguimiento recomendado:
                      </span>
                      <div className="font-semibold text-orange-600">
                        {finding.followup_interval_days} días
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600">No hay hallazgos específicos</p>
          )}
        </CardContent>
      </Card>

      {/* Impression */}
      <Card className="border-l-4 border-l-blue-600 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">Impresión</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm font-semibold text-gray-800">
            {report.impression}
          </p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-gray-700">
              {report.recommendations
                .split('\n')
                .filter((rec) => rec.trim())
                .map((rec, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    {rec.trim()}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Followup Plan */}
      {followupFindings.length > 0 && (
        <Card className="border-l-4 border-l-orange-600 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base text-orange-900">
              Plan de Seguimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {followupFindings.map((finding) => (
              <div key={finding.id} className="text-sm text-orange-800">
                <strong>{finding.finding_type}:</strong> Seguimiento en{' '}
                {finding.followup_interval_days} días
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RadiologyReport;
