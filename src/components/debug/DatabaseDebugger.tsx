import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Database, Wifi } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

export const DatabaseDebugger: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [skipAuth, setSkipAuth] = useState(false);

  const addResult = (result: Omit<TestResult, 'timestamp'>) => {
    setResults(prev => [...prev, {
      ...result,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    // Test 1: Client Configuration
    addResult({
      name: 'Configuración del Cliente',
      status: 'pending',
      message: 'Verificando configuración de Supabase...'
    });

    try {
      const url = supabase.supabaseUrl;
      const key = supabase.supabaseKey;
      
      if (!url || !key) {
        throw new Error('Faltan credenciales de Supabase');
      }

      setResults(prev => prev.map(r => 
        r.name === 'Configuración del Cliente' 
          ? { 
              ...r, 
              status: 'success', 
              message: 'Configuración válida',
              details: {
                url: url.substring(0, 40) + '...',
                keyLength: key.length,
                hasUrl: !!url,
                hasKey: !!key
              }
            }
          : r
      ));
    } catch (error: any) {
      setResults(prev => prev.map(r => 
        r.name === 'Configuración del Cliente' 
          ? { ...r, status: 'error', message: error.message }
          : r
      ));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Network Connectivity
    addResult({
      name: 'Conectividad de Red',
      status: 'pending',
      message: 'Probando conectividad con Supabase...'
    });

    try {
      const startTime = Date.now();
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      setResults(prev => prev.map(r => 
        r.name === 'Conectividad de Red' 
          ? { 
              ...r, 
              status: response.ok ? 'success' : 'error', 
              message: response.ok ? `Conectividad OK (${responseTime}ms)` : `HTTP ${response.status}: ${response.statusText}`,
              details: {
                status: response.status,
                statusText: response.statusText,
                responseTime,
                url: `${supabase.supabaseUrl}/rest/v1/`
              }
            }
          : r
      ));
    } catch (error: any) {
      setResults(prev => prev.map(r => 
        r.name === 'Conectividad de Red' 
          ? { 
              ...r, 
              status: 'error', 
              message: `Error de red: ${error.message}`,
              details: {
                type: error.constructor.name,
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3)
              }
            }
          : r
      ));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Authentication Check (with timeout)
    addResult({
      name: 'Estado de Autenticación',
      status: 'pending',
      message: 'Verificando estado de autenticación (timeout 5s)...'
    });

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout después de 5 segundos')), 5000)
      );

      // Race between auth check and timeout
      const authPromise = supabase.auth.getSession();

      const result = await Promise.race([authPromise, timeoutPromise]) as any;

      if (result && typeof result === 'object' && 'data' in result) {
        const { data: sessionData, error: sessionError } = result;

        setResults(prev => prev.map(r =>
          r.name === 'Estado de Autenticación'
            ? {
                ...r,
                status: sessionError ? 'error' : (sessionData.session ? 'success' : 'warning'),
                message: sessionError
                  ? `Error de autenticación: ${sessionError.message}`
                  : sessionData.session
                    ? `Usuario autenticado: ${sessionData.session.user?.email}`
                    : 'No hay usuario autenticado (modo anónimo funcional)',
                details: {
                  hasSession: !!sessionData.session,
                  user: sessionData.session?.user?.email || 'Anónimo',
                  expiresAt: sessionData.session?.expires_at,
                  error: sessionError?.message
                }
              }
            : r
        ));
      }
    } catch (error: any) {
      const isTimeout = error.message.includes('Timeout');
      setResults(prev => prev.map(r =>
        r.name === 'Estado de Autenticación'
          ? {
              ...r,
              status: isTimeout ? 'warning' : 'error',
              message: isTimeout
                ? 'Timeout en autenticación - probablemente el módulo auth está colgado. Continuando con modo anónimo.'
                : `Error: ${error.message}`,
              details: {
                isTimeout,
                error: error.message,
                recommendation: isTimeout ? 'La app puede funcionar sin autenticación para consultas públicas' : null
              }
            }
          : r
      ));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 4: Database Query Test (with timeout)
    addResult({
      name: 'Consulta de Base de Datos',
      status: 'pending',
      message: 'Intentando consulta a la tabla principal (timeout 10s)...'
    });

    try {
      const startTime = Date.now();

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de consulta después de 10 segundos')), 10000)
      );

      // Race between database query and timeout
      const dbPromise = supabase
        .from('profesionales_sanitarios')
        .select('id', { count: 'exact' })
        .limit(1);

      const result = await Promise.race([dbPromise, timeoutPromise]) as any;
      const queryTime = Date.now() - startTime;

      if (result && 'error' in result && result.error) {
        throw result.error;
      }

      const { data, error, count } = result;

      setResults(prev => prev.map(r =>
        r.name === 'Consulta de Base de Datos'
          ? {
              ...r,
              status: 'success',
              message: `Consulta exitosa (${queryTime}ms) - ${count || 0} registros totales`,
              details: {
                recordCount: count || 0,
                sampleData: data,
                queryTime,
                tableName: 'profesionales_sanitarios',
                success: true
              }
            }
          : r
      ));
    } catch (error: any) {
      const isTimeout = error.message.includes('Timeout');
      setResults(prev => prev.map(r =>
        r.name === 'Consulta de Base de Datos'
          ? {
              ...r,
              status: isTimeout ? 'error' : 'error',
              message: isTimeout
                ? 'Timeout en consulta de base de datos - la BD no responde'
                : `Error de BD: ${error.message}`,
              details: {
                isTimeout,
                code: error.code,
                details: error.details,
                hint: error.hint,
                message: error.message,
                possibleCauses: isTimeout
                  ? ['Red lenta', 'Servidor Supabase sobrecargado', 'Políticas RLS bloqueando consulta']
                  : ['Políticas RLS', 'Tabla no existe', 'Permisos insuficientes']
              }
            }
          : r
      ));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 5: RLS Policies Test
    addResult({
      name: 'Políticas de Seguridad (RLS)',
      status: 'pending',
      message: 'Verificando políticas de Row Level Security...'
    });

    try {
      const tables = ['profesionales_sanitarios', 'centros_salud', 'busqueda_profesionales_publica'];
      const rlsResults = [];

      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select('id').limit(1);
          rlsResults.push({
            table,
            accessible: !error,
            error: error?.message || null
          });
        } catch (err: any) {
          rlsResults.push({
            table,
            accessible: false,
            error: err.message
          });
        }
      }

      const accessibleTables = rlsResults.filter(r => r.accessible).length;
      
      setResults(prev => prev.map(r => 
        r.name === 'Políticas de Seguridad (RLS)' 
          ? { 
              ...r, 
              status: accessibleTables > 0 ? 'success' : 'error', 
              message: `${accessibleTables}/${tables.length} tablas accesibles`,
              details: rlsResults
            }
          : r
      ));
    } catch (error: any) {
      setResults(prev => prev.map(r => 
        r.name === 'Políticas de Seguridad (RLS)' 
          ? { ...r, status: 'error', message: `Error: ${error.message}` }
          : r
      ));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ADVERTENCIA</Badge>;
      case 'pending':
        return <Badge variant="outline">PENDIENTE</Badge>;
    }
  };

  // Run test automatically on mount
  useEffect(() => {
    runComprehensiveTest();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Diagnóstico Completo de Base de Datos
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Verificación detallada de la conectividad con Supabase
          </p>
          <Button 
            onClick={runComprehensiveTest} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Volver a Probar
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
              </div>
              <span className="text-sm text-gray-500">{result.timestamp}</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{result.message}</p>
            
            {result.details && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">
                  Ver detalles técnicos
                </summary>
                <pre className="bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
        
        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-gray-500">
            Haz clic en "Volver a Probar" para ejecutar el diagnóstico
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseDebugger;
