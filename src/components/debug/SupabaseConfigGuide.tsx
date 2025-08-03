import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  Copy,
  Clock,
  Database,
  Shield,
  Zap
} from 'lucide-react';

export const SupabaseConfigGuide: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const configurations = [
    {
      category: "🕐 Request Duration",
      priority: "CRÍTICO",
      path: "Settings → Configuration → Authentication → Max request duration",
      currentIssue: "Probablemente configurado a 10-15 segundos",
      recommendedValue: "60 segundos (60000ms)",
      reason: "Conexiones desde África necesitan más tiempo",
      impact: "ALTO - Resuelve timeouts principales"
    },
    {
      category: "🔗 Database Connections", 
      priority: "ALTO",
      path: "Settings → Database → Connection Configuration",
      currentIssue: "Posible agotamiento de conexiones",
      recommendedValue: "Verificar disponibilidad y aumentar si es necesario",
      reason: "Cada query abierta consume una conexión",
      impact: "MEDIO - Mejora estabilidad"
    },
    {
      category: "🔐 Access Token Expiry",
      priority: "MEDIO",
      path: "Settings → Configuration → Authentication → Access token expiry",
      currentIssue: "Puede estar expirando muy rápido",
      recommendedValue: "3600 segundos (1 hora) o más",
      reason: "Reduce necesidad de renovar tokens frecuentemente",
      impact: "MEDIO - Menos requests de auth"
    },
    {
      category: "🛡️ Bot Protection",
      priority: "MEDIO",
      path: "Settings → Configuration → Authentication → Bot and abuse protection",
      currentIssue: "Puede estar bloqueando requests lentos",
      recommendedValue: "Configurar allowlist para tu IP si es necesario",
      reason: "Requests lentos pueden parecer ataques",
      impact: "BAJO - Solo si estás siendo bloqueado"
    }
  ];

  const steps = [
    {
      step: 1,
      title: "Acceder a Configuración de Supabase",
      description: "Ve a tu proyecto en Supabase Dashboard",
      action: "https://app.supabase.com/projects → Tu Proyecto",
      icon: <ExternalLink className="h-4 w-4" />
    },
    {
      step: 2, 
      title: "Configuración de Autenticación",
      description: "Navega a la nueva ubicación de configuraciones",
      action: "Settings → Configuration → Authentication",
      icon: <Settings className="h-4 w-4" />
    },
    {
      step: 3,
      title: "Ajustar Max Request Duration",
      description: "Busca y modifica esta configuración crítica",
      action: "Max request duration: 60000 (60 segundos)",
      icon: <Clock className="h-4 w-4" />
    },
    {
      step: 4,
      title: "Verificar Database Settings",
      description: "Revisar configuraciones de base de datos",
      action: "Settings → Database → Connection limits",
      icon: <Database className="h-4 w-4" />
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Settings className="h-6 w-6" />
            Guía de Configuración Supabase para Guinea Ecuatorial
          </CardTitle>
          <p className="text-blue-700 text-sm">
            Configuraciones específicas para optimizar Supabase desde África
          </p>
        </CardHeader>
      </Card>

      {/* Quick Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Pasos Rápidos (5 minutos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step) => (
              <div key={step.step} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-blue-800">
                    {step.step}
                  </div>
                  {step.icon}
                </div>
                <h4 className="font-semibold text-sm mb-2">{step.title}</h4>
                <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-gray-100 p-1 rounded flex-1">{step.action}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(step.action, `step-${step.step}`)}
                    className="h-6 w-6 p-0"
                  >
                    {copiedSection === `step-${step.step}` ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuraciones Detalladas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {configurations.map((config, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{config.category}</h4>
                    <Badge 
                      variant={config.priority === 'CRÍTICO' ? 'destructive' : 
                              config.priority === 'ALTO' ? 'default' : 'secondary'}
                    >
                      {config.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Impacto: {config.impact.split(' - ')[0]}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">📍 Ubicación:</p>
                    <p className="text-gray-600 mb-3">{config.path}</p>
                    
                    <p className="font-medium text-gray-700 mb-1">❌ Problema Actual:</p>
                    <p className="text-red-600 mb-3">{config.currentIssue}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700 mb-1">✅ Valor Recomendado:</p>
                    <div className="flex items-center gap-2 mb-3">
                      <code className="bg-green-100 text-green-800 p-2 rounded flex-1">
                        {config.recommendedValue}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(config.recommendedValue, `config-${index}`)}
                        className="h-8 w-8 p-0"
                      >
                        {copiedSection === `config-${index}` ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    
                    <p className="font-medium text-gray-700 mb-1">💡 Razón:</p>
                    <p className="text-gray-600">{config.reason}</p>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                  <strong>Impacto:</strong> {config.impact}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Recommendations */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Shield className="h-5 w-5" />
            Recomendaciones Adicionales
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🌍 Optimización Geográfica:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Considera migrar a región EU (más cerca de África)</li>
                <li>• Frankfurt (eu-central-1) tiene mejor conectividad</li>
                <li>• Londres (eu-west-2) también es opción</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⚡ Optimización de Código:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Cache local más agresivo (ya implementado)</li>
                <li>• Datos mock automáticos (ya implementado)</li>
                <li>• Reintentos inteligentes (ya implementado)</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-100 rounded">
            <p className="text-sm">
              <strong>💰 Nota sobre planes:</strong> Si estás en plan gratuito, considera upgrade a Pro 
              para eliminar limitaciones de rendimiento y obtener soporte prioritario.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        <Button 
          size="lg"
          onClick={() => window.open('https://app.supabase.com/projects', '_blank')}
          className="bg-green-600 hover:bg-green-700"
        >
          <ExternalLink className="h-5 w-5 mr-2" />
          Abrir Supabase Dashboard
        </Button>
      </div>
    </div>
  );
};

export default SupabaseConfigGuide;
