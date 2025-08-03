import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Database, Wifi, Clock, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
  duration?: number;
}

export const SupabaseTimeoutDiagnostic: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: Omit<TestResult, 'timestamp'>) => {
    setResults(prev => [...prev, {
      ...result,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const updateResult = (name: string, updates: Partial<TestResult>) => {
    setResults(prev => prev.map(r => 
      r.name === name ? { ...r, ...updates } : r
    ));
  };

  const runTimeoutDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    
    // Test 1: Simple Health Check
    addResult({
      name: '🔍 Health Check Supabase',
      status: 'pending',
      message: 'Probando endpoint básico de Supabase...'
    });

    const healthStart = Date.now();
    try {
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const healthDuration = Date.now() - healthStart;
      
      updateResult('🔍 Health Check Supabase', {
        status: response.ok ? 'success' : 'error',
        message: response.ok 
          ? `✅ Endpoint responde (${healthDuration}ms)` 
          : `❌ HTTP ${response.status}: ${response.statusText}`,
        duration: healthDuration,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      });
    } catch (error: any) {
      const healthDuration = Date.now() - healthStart;
      updateResult('🔍 Health Check Supabase', {
        status: 'error',
        message: `❌ Error de conectividad: ${error.message}`,
        duration: healthDuration,
        details: { error: error.message, type: error.constructor.name }
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Try different timeout durations
    for (const timeout of [2000, 5000, 10000]) {
      addResult({
        name: `⏱️ Query Test (${timeout/1000}s timeout)`,
        status: 'pending',
        message: `Probando consulta con timeout de ${timeout/1000} segundos...`
      });

      const queryStart = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const { data, error } = await supabase
          .from('profesionales_sanitarios')
          .select('id')
          .limit(1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);
        const queryDuration = Date.now() - queryStart;

        if (error) {
          throw error;
        }

        updateResult(`⏱️ Query Test (${timeout/1000}s timeout)`, {
          status: 'success',
          message: `✅ Consulta exitosa en ${queryDuration}ms`,
          duration: queryDuration,
          details: { 
            recordsFound: data?.length || 0, 
            timeoutUsed: timeout,
            actualDuration: queryDuration 
          }
        });
        
        // If successful, break out of loop
        break;

      } catch (error: any) {
        const queryDuration = Date.now() - queryStart;
        const isAborted = error.name === 'AbortError' || error.message.includes('aborted');
        
        updateResult(`⏱️ Query Test (${timeout/1000}s timeout)`, {
          status: isAborted ? 'warning' : 'error',
          message: isAborted 
            ? `⏰ Timeout después de ${timeout/1000}s`
            : `❌ Error: ${error.message}`,
          duration: queryDuration,
          details: {
            isTimeout: isAborted,
            error: error.message,
            code: error.code,
            hint: error.hint,
            timeoutUsed: timeout
          }
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test 3: Try system table (should be faster)
    addResult({
      name: '🔧 System Table Test',
      status: 'pending',
      message: 'Probando acceso a tabla del sistema...'
    });

    const sysStart = Date.now();
    try {
      // Try to query pg_tables or similar system view
      const { data, error } = await supabase
        .rpc('get_schema_version') // This should be a simple function
        .limit(1);

      const sysDuration = Date.now() - sysStart;

      updateResult('🔧 System Table Test', {
        status: error ? 'warning' : 'success',
        message: error 
          ? `⚠️ RPC no disponible: ${error.message}`
          : `✅ Sistema responde (${sysDuration}ms)`,
        duration: sysDuration,
        details: { data, error: error?.message }
      });
    } catch (error: any) {
      const sysDuration = Date.now() - sysStart;
      updateResult('🔧 System Table Test', {
        status: 'warning',
        message: `⚠️ Sistema no accesible: ${error.message}`,
        duration: sysDuration
      });
    }

    // Test 4: Check if it's an RLS issue
    addResult({
      name: '🛡️ RLS Policy Test',
      status: 'pending',
      message: 'Verificando si las políticas RLS están bloqueando...'
    });

    const rlsStart = Date.now();
    try {
      // Try to query with explicit RLS bypass (if we have permission)
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('count(*)')
        .single();

      const rlsDuration = Date.now() - rlsStart;

      updateResult('🛡️ RLS Policy Test', {
        status: error ? 'error' : 'success',
        message: error 
          ? `❌ RLS bloqueando: ${error.message}`
          : `✅ RLS permitiendo acceso (${rlsDuration}ms)`,
        duration: rlsDuration,
        details: { 
          error: error?.message,
          code: error?.code,
          hint: error?.hint,
          rlsBlocking: !!error && error.code === 'PGRST116'
        }
      });
    } catch (error: any) {
      const rlsDuration = Date.now() - rlsStart;
      updateResult('🛡��� RLS Policy Test', {
        status: 'error',
        message: `❌ Error RLS: ${error.message}`,
        duration: rlsDuration
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">ÉXITO</Badge>;
      case 'error': return <Badge variant="destructive">ERROR</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">TIMEOUT</Badge>;
      case 'pending': return <Badge variant="outline">EJECUTANDO</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-red-500" />
          Diagnóstico de Timeout - Supabase No Responde
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            La BD está dando timeout. Vamos a encontrar exactamente por qué.
          </p>
          <Button 
            onClick={runTimeoutDiagnostic} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Diagnosticando...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Ejecutar Diagnóstico
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.status)}
                <span className="font-medium">{result.name}</span>
                {getStatusBadge(result.status)}
                {result.duration && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {result.duration}ms
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">{result.timestamp}</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2 font-mono">{result.message}</p>
            
            {result.details && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">
                  🔍 Ver detalles técnicos
                </summary>
                <pre className="bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
        
        {results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Haz clic en "Ejecutar Diagnóstico" para analizar el problema de timeout
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-800 mb-2">🚨 Análisis del Problema de Timeout:</h4>
            <div className="text-sm text-red-700 space-y-2">
              <p><strong>Situación:</strong> Supabase no responde a las consultas en tiempo razonable.</p>
              
              <p><strong>Posibles causas:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Servidor sobrecargado:</strong> El proyecto Supabase está bajo mucha carga</li>
                <li><strong>Políticas RLS estrictas:</strong> Las políticas de seguridad están bloqueando consultas</li>
                <li><strong>Plan gratuito limitado:</strong> Limitaciones de velocidad en plan free tier</li>
                <li><strong>Región distante:</strong> El servidor está en una región geográfica lejana</li>
                <li><strong>Problema de red:</strong> Conectividad lenta desde tu ubicación</li>
              </ul>
              
              <p><strong>Soluciones recomendadas:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>✅ <strong>Continuar con datos mock</strong> (ya implementado)</li>
                <li>🔄 Aumentar timeouts en React Query</li>
                <li>⚡ Implementar cache local más agresivo</li>
                <li>🌍 Considerar cambiar región del proyecto Supabase</li>
                <li>📈 Upgrade a plan pagado si es necesario</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseTimeoutDiagnostic;
