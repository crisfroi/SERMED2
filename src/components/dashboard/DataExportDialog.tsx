import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Image,
  Settings,
  Calendar,
  User,
  Building,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Tipos para la exportación
interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeRawData: boolean;
  includeSummary: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  title?: string;
  description?: string;
  sections: string[];
}

interface ExportData {
  results: any[];
  categories: any[];
  metadata: {
    exportDate: string;
    exportedBy: string;
    totalRecords: number;
    queryCount: number;
  };
}

// Hook para manejar exportaciones
export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const generatePDF = async (data: ExportData, options: ExportOptions) => {
    setExportProgress(25);
    
    // Simulación de generación de PDF
    // En producción, usarías una librería como jsPDF o Puppeteer
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${options.title || 'Reporte de Analytics'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .data-table th { background-color: #f5f5f5; font-weight: bold; }
        .summary-box { background: #f9f9f9; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0; }
        .chart-placeholder { background: #e9ecef; padding: 40px; text-align: center; margin: 20px 0; border: 1px dashed #6c757d; }
        .metadata { font-size: 12px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${options.title || 'Reporte de Analytics Avanzado'}</h1>
        <p><strong>Sistema de Profesionales Sanitarios - Guinea Ecuatorial</strong></p>
        <p>Generado el: ${new Date().toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        ${options.description ? `<p><em>${options.description}</em></p>` : ''}
    </div>

    ${options.includeSummary ? generateSummarySection(data) : ''}
    ${generateDataSections(data, options)}
    ${options.includeCharts ? generateChartsSection(data) : ''}
    
    <div class="metadata">
        <h3>Metadatos del Reporte</h3>
        <p><strong>Exportado por:</strong> ${data.metadata.exportedBy}</p>
        <p><strong>Fecha de exportación:</strong> ${data.metadata.exportDate}</p>
        <p><strong>Total de registros procesados:</strong> ${data.metadata.totalRecords.toLocaleString()}</p>
        <p><strong>Número de consultas:</strong> ${data.metadata.queryCount}</p>
        <p><strong>Formato:</strong> PDF</p>
    </div>
</body>
</html>`;

    setExportProgress(75);
    
    // Convertir a blob y descargar
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-analytics-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setExportProgress(100);
  };

  const generateExcel = async (data: ExportData, options: ExportOptions) => {
    setExportProgress(25);
    
    // Preparar datos para Excel
    const excelData = {
      metadata: data.metadata,
      summary: generateSummaryData(data),
      detailed_data: []
    };

    // Procesar cada resultado
    data.results.forEach((result, index) => {
      if (result.success && result.data) {
        const flatData = flattenObject(result.data, `Query_${index + 1}`);
        excelData.detailed_data.push(flatData);
      }
    });

    setExportProgress(50);

    // Generar CSV como aproximación a Excel
    const csvContent = generateCSV(excelData);
    
    setExportProgress(75);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-data-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setExportProgress(100);
  };

  const generateJSON = async (data: ExportData, options: ExportOptions) => {
    setExportProgress(50);
    
    const jsonData = {
      export_info: {
        title: options.title,
        description: options.description,
        export_date: new Date().toISOString(),
        exported_by: data.metadata.exportedBy,
        format: 'JSON',
        options: options
      },
      summary: generateSummaryData(data),
      results: data.results.map(result => ({
        query: result.query,
        success: result.success,
        timestamp: result.timestamp,
        data: result.data,
        error: result.error
      })),
      metadata: data.metadata
    };
    
    setExportProgress(75);
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setExportProgress(100);
  };

  const exportData = async (data: ExportData, options: ExportOptions) => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      switch (options.format) {
        case 'pdf':
          await generatePDF(data, options);
          break;
        case 'excel':
        case 'csv':
          await generateExcel(data, options);
          break;
        case 'json':
          await generateJSON(data, options);
          break;
        default:
          throw new Error('Formato no soportado');
      }

      toast({
        title: "Exportación completada",
        description: `Archivo ${options.format.toUpperCase()} generado exitosamente`,
      });

      // Reset progress después de un breve delay
      setTimeout(() => {
        setExportProgress(0);
        setIsExporting(false);
      }, 1000);

    } catch (error) {
      toast({
        title: "Error en la exportación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return {
    exportData,
    isExporting,
    exportProgress
  };
};

// Funciones auxiliares
const generateSummarySection = (data: ExportData) => {
  const totalProfessionals = data.results.reduce((total, result) => {
    if (result.data?.total_profesionales) {
      return total + result.data.total_profesionales;
    }
    if (result.data?.demograficas?.total_profesionales) {
      return total + result.data.demograficas.total_profesionales;
    }
    return total;
  }, 0);

  return `
    <div class="section">
        <h2>Resumen Ejecutivo</h2>
        <div class="summary-box">
            <p><strong>Total de Profesionales en el Sistema:</strong> ${totalProfessionals.toLocaleString()}</p>
            <p><strong>Número de Análisis Realizados:</strong> ${data.results.length}</p>
            <p><strong>Análisis Exitosos:</strong> ${data.results.filter(r => r.success).length}</p>
            <p><strong>Cobertura de Datos:</strong> ${((data.results.filter(r => r.success).length / data.results.length) * 100).toFixed(1)}%</p>
        </div>
    </div>
  `;
};

const generateDataSections = (data: ExportData, options: ExportOptions) => {
  return data.results.map((result, index) => {
    if (!result.success || !result.data) return '';
    
    return `
      <div class="section">
          <h2>Análisis ${index + 1}: ${result.query}</h2>
          <p><strong>Ejecutado:</strong> ${new Date(result.timestamp).toLocaleString('es-ES')}</p>
          ${generateDataTable(result.data, result.query)}
      </div>
    `;
  }).join('');
};

const generateDataTable = (data: any, query: string) => {
  if (!data || typeof data !== 'object') return '<p>No hay datos disponibles</p>';
  
  let tableHTML = '<table class="data-table"><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>';
  
  const flatData = flattenObject(data);
  Object.entries(flatData).forEach(([key, value]) => {
    tableHTML += `<tr><td>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td><td>${formatValue(value)}</td></tr>`;
  });
  
  tableHTML += '</tbody></table>';
  return tableHTML;
};

const generateChartsSection = (data: ExportData) => {
  return `
    <div class="section">
        <h2>Gráficos y Visualizaciones</h2>
        <div class="chart-placeholder">
            <p><strong>📊 Gráficos Interactivos</strong></p>
            <p>Los gráficos interactivos están disponibles en la interfaz web.</p>
            <p>Para obtener gráficos en el reporte, considere usar la funcionalidad de captura de pantalla.</p>
        </div>
    </div>
  `;
};

const generateSummaryData = (data: ExportData) => {
  return {
    total_queries: data.results.length,
    successful_queries: data.results.filter(r => r.success).length,
    total_records: data.metadata.totalRecords,
    export_date: data.metadata.exportDate,
    exported_by: data.metadata.exportedBy
  };
};

const flattenObject = (obj: any, prefix: string = ''): Record<string, any> => {
  const flattened: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  });
  
  return flattened;
};

const generateCSV = (data: any) => {
  const headers = ['Sección', 'Métrica', 'Valor'];
  let csvContent = headers.join(',') + '\n';
  
  // Agregar metadatos
  csvContent += `Metadatos,Total Consultas,${data.summary.total_queries}\n`;
  csvContent += `Metadatos,Consultas Exitosas,${data.summary.successful_queries}\n`;
  csvContent += `Metadatos,Total Registros,${data.summary.total_records}\n`;
  csvContent += `Metadatos,Fecha Exportación,${data.summary.export_date}\n`;
  csvContent += `Metadatos,Exportado Por,${data.summary.exported_by}\n`;
  
  // Agregar datos detallados
  data.detailed_data.forEach((item: any, index: number) => {
    Object.entries(item).forEach(([key, value]) => {
      csvContent += `Consulta ${index + 1},${key},"${value}"\n`;
    });
  });
  
  return csvContent;
};

const formatValue = (value: any): string => {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

// Componente principal de exportación
interface DataExportDialogProps {
  results: any[];
  categories: any[];
  trigger?: React.ReactNode;
}

export const DataExportDialog: React.FC<DataExportDialogProps> = ({ 
  results, 
  categories, 
  trigger 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeRawData: true,
    includeSummary: true,
    title: `Reporte Analytics - ${new Date().toLocaleDateString('es-ES')}`,
    description: '',
    sections: ['all']
  });

  const { exportData, isExporting, exportProgress } = useDataExport();
  const { user } = useAuth();

  const handleExport = async () => {
    const exportDataObj: ExportData = {
      results,
      categories,
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: user?.email || 'Usuario desconocido',
        totalRecords: results.reduce((total, result) => {
          if (result.data?.total_profesionales) return total + result.data.total_profesionales;
          return total + 1;
        }, 0),
        queryCount: results.length
      }
    };

    await exportData(exportDataObj, exportOptions);
    setIsOpen(false);
  };

  const availableSections = [
    { id: 'demographics', name: 'Demografía' },
    { id: 'professional_areas', name: 'Áreas Profesionales' },
    { id: 'education', name: 'Formación' },
    { id: 'work_centers', name: 'Centros de Trabajo' },
    { id: 'application_status', name: 'Estados de Solicitud' },
    { id: 'carnet_generation', name: 'Generación de Carnets' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Resultados del Análisis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato de exportación */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Formato de Exportación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={exportOptions.format === 'pdf' ? 'default' : 'outline'}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: 'pdf' }))}
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Report
                </Button>
                <Button
                  variant={exportOptions.format === 'excel' ? 'default' : 'outline'}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: 'excel' }))}
                  className="justify-start"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel/CSV
                </Button>
              </div>
              <Button
                variant={exportOptions.format === 'json' ? 'default' : 'outline'}
                onClick={() => setExportOptions(prev => ({ ...prev, format: 'json' }))}
                className="w-full justify-start"
              >
                <Settings className="h-4 w-4 mr-2" />
                JSON (Datos Raw)
              </Button>
            </CardContent>
          </Card>

          {/* Opciones de contenido */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contenido a Incluir</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSummary"
                    checked={exportOptions.includeSummary}
                    onCheckedChange={(checked) =>
                      setExportOptions(prev => ({ ...prev, includeSummary: checked as boolean }))
                    }
                  />
                  <Label htmlFor="includeSummary" className="text-sm font-medium">
                    Resumen Ejecutivo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeRawData"
                    checked={exportOptions.includeRawData}
                    onCheckedChange={(checked) =>
                      setExportOptions(prev => ({ ...prev, includeRawData: checked as boolean }))
                    }
                  />
                  <Label htmlFor="includeRawData" className="text-sm font-medium">
                    Datos Detallados
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={exportOptions.includeCharts}
                    onCheckedChange={(checked) =>
                      setExportOptions(prev => ({ ...prev, includeCharts: checked as boolean }))
                    }
                  />
                  <Label htmlFor="includeCharts" className="text-sm font-medium">
                    Referencias a Gráficos
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del reporte */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Información del Reporte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Título del Reporte
                </Label>
                <Input
                  id="title"
                  value={exportOptions.title}
                  onChange={(e) =>
                    setExportOptions(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Título del reporte..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción (Opcional)
                </Label>
                <Textarea
                  id="description"
                  value={exportOptions.description}
                  onChange={(e) =>
                    setExportOptions(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Descripción del análisis..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen de datos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Resumen de Datos a Exportar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span>Análisis: {results.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Exitosos: {results.filter(r => r.success).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span>Fecha: {new Date().toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-500" />
                  <span>Usuario: {user?.email?.split('@')[0] || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress bar durante exportación */}
          {isExporting && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Generando exportación...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || results.length === 0}
              className="min-w-32"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar {exportOptions.format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
