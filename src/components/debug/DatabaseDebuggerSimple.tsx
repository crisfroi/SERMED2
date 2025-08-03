import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Database, Wifi, AlertTriangle, Clock } from 'lucide-react';
import SupabaseTimeoutDiagnostic from './SupabaseTimeoutDiagnostic';
import SupabaseConfigGuide from './SupabaseConfigGuide';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

export const DatabaseDebuggerSimple: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showTimeoutDiagnostic, setShowTimeoutDiagnostic] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  const addResult = (result: Omit<TestResult, 'timestamp'>) => {
    setResults(prev => [...prev, {
      ...result,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runFocusedTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    // Test 1: Basic Configuration
    addResult({
      name: 'Configuración Básica',
      status: 'pending',
      message: 'Verificando configuración...'
    });

    try {
      const url = supabase.supabaseUrl;
      const key = supabase.supabaseKey;
      
      setResults(prev => prev.map(r => 
        r.name === 'Configuración Básica' 
          ? { 
              ...r, 
              status: 'success', 
              message: 'Configuración OK',
              details: {
                url: url?.substring(0, 40) + '...',
                hasKey: !!key,
                keyLength: key?.length || 0
              }
            }
          : r
      ));
    } catch (error: any) {
      setResults(prev => prev.map(r => 
        r.name === 'Configuración Básica' 
          ? { ...r, status: 'error', message: error.message }
          : r
      ));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Database Query Direct (bypassing auth issues)
    addResult({
      name: 'Consulta Directa a BD',
      status: 'pending',
      message: 'Probando consulta directa a profesionales_sanitarios...'
    });

    try {
      const startTime = Date.now();
      
      // Direct query with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout después de 8 segundos')), 8000)
      );
      
      const dbPromise = supabase
        .from('profesionales_sanitarios')
        .select('id, estado_solicitud')
        .limit(3);
      
      const result = await Promise.race([dbPromise, timeoutPromise]) as any;
      const queryTime = Date.now() - startTime;

      if (result?.error) {
        throw result.error;
      }

      const { data, error } = result;

      setResults(prev => prev.map(r => 
        r.name === 'Consulta Directa a BD' 
          ? { 
              ...r, 
              status: 'success', 
              message: `✅ BD FUNCIONAL (${queryTime}ms) - ${data?.length || 0} registros obtenidos`,
              details: {
                queryTime,
                recordCount: data?.length || 0,
                sampleData: data?.slice(0, 2),
                tableName: 'profesionales_sanitarios'
              }
            }
          : r
      ));
      
      // If successful, try to get count
      await new Promise(resolve => setTimeout(resolve, 500));
      await runCountTest();
      
    } catch (error: any) {
      const isTimeout = error.message.includes('Timeout');
      setResults(prev => prev.map(r => 
        r.name === 'Consulta Directa a BD' 
          ? { 
              ...r, 
              status: 'error', 
              message: isTimeout 
                ? '❌ TIMEOUT - Base de datos no responde'
                : `❌ ERROR BD: ${error.message}`,
              details: {
                isTimeout,
                errorCode: error.code,
                errorDetails: error.details,
                errorHint: error.hint,
                possibleCauses: [
                  'Políticas RLS bloqueando acceso',
                  'Tabla no existe o sin permisos',
                  'Red lenta o BD sobrecargada',
                  'Credenciales incorrectas'
                ]
              }
            }
          : r
      ));
    }

    setIsRunning(false);
  };

  const runCountTest = async () => {
    addResult({
      name: 'Conteo Total de Registros',
      status: 'pending',
      message: 'Obteniendo count total...'
    });

    try {
      const { count, error } = await supabase
        .from('profesionales_sanitarios')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      setResults(prev => prev.map(r => 
        r.name === 'Conteo Total de Registros' 
          ? { 
              ...r, 
              status: 'success', 
              message: `📊 Total de profesionales: ${count || 0}`,
              details: { totalRecords: count }
            }
          : r
      ));
    } catch (error: any) {
      setResults(prev => prev.map(r => 
        r.name === 'Conteo Total de Registros' 
          ? { 
              ...r, 
              status: 'error', 
              message: `Error obteniendo count: ${error.message}`
            }
          : r
      ));
    }
  };

  const runPublicTableTest = async () => {
    addResult({
      name: 'Tabla Pública (Búsqueda)',
      status: 'pending',
      message: 'Probando tabla de búsqueda pública...'
    });

    try {
      const { data, error } = await supabase
        .from('busqueda_profesionales_publica')
        .select('*')
        .limit(2);

      if (error) throw error;

      setResults(prev => prev.map(r => 
        r.name === 'Tabla Pública (Búsqueda)' 
          ? { 
              ...r, 
              status: 'success', 
              message: `✅ Tabla pública accesible - ${data?.length || 0} registros`,
              details: { publicRecords: data?.length, sampleData: data }
            }
          : r
      ));
    } catch (error: any) {
      setResults(prev => prev.map(r => 
        r.name === 'Tabla Pública (Búsqueda)' 
          ? { 
              ...r, 
              status: 'error', 
              message: `❌ Tabla pública inaccesible: ${error.message}`
            }
          : r
      ));
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">ÉXITO</Badge>;
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ADVERTENCIA</Badge>;
      case 'pending':
        return <Badge variant="outline">EJECUTANDO</Badge>;
    }
  };

  // Run test automatically on mount
  useEffect(() => {
    runFocusedTest();
  }, []);

  // Show timeout diagnostic if we detect timeout issues
  useEffect(() => {
    const hasTimeouts = results.some(r =>
      r.status === 'error' &&
      r.details?.isTimeout
    );
    if (hasTimeouts) {
      setShowTimeoutDiagnostic(true);
    }
  }, [results]);

  if (showConfigGuide) {
    return (
      <div className="space-y-6">
        <SupabaseConfigGuide />
        <Card className="w-full max-w-4xl mx-auto">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setShowConfigGuide(false)}
                variant="outline"
                className="flex-1"
              >
                ← Volver al diagnóstico
              </Button>
              <Button
                onClick={() => {
                  setShowConfigGuide(false);
                  setShowTimeoutDiagnostic(true);
                }}
                variant="outline"
                className="flex-1"
              >
                Ver Análisis Timeout →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showTimeoutDiagnostic) {
    return (
      <div className="space-y-6">
        <SupabaseTimeoutDiagnostic />
        <Card className="w-full max-w-4xl mx-auto">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setShowTimeoutDiagnostic(false)}
                variant="outline"
                className="flex-1"
              >
                ← Volver al diagnóstico
              </Button>
              <Button
                onClick={() => {
                  setShowTimeoutDiagnostic(false);
                  setShowConfigGuide(true);
                }}
                variant="outline"
                className="flex-1"
              >
                Ver Guía Configuración →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Diagnóstico Focualizado - Problema de Base de Datos
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Pruebas específicas para identificar por qué la BD está "unavailable"
          </p>
          <div className="flex gap-2">
            <Button
              onClick={runPublicTableTest}
              disabled={isRunning}
              variant="outline"
              size="sm"
            >
              Probar Tabla Pública
            </Button>
            <Button
              onClick={() => setShowTimeoutDiagnostic(true)}
              variant="outline"
              size="sm"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            >
              <Clock className="h-4 w-4 mr-2" />
              Análisis Timeout
            </Button>
            <Button
              onClick={runFocusedTest}
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
                  Repetir Test
                </>
              )}
            </Button>
          </div>
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
            
            <p className="text-sm text-gray-600 mb-2 font-mono">{result.message}</p>
            
            {result.details && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">
                  📋 Ver detalles técnicos
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
            🔍 Ejecutando diagnóstico automático...
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Análisis del Problema:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Si "Consulta Directa a BD" es exitosa → El problema está en los hooks de React Query</li>
              <li>• Si da timeout → Problema de red o servidor Supabase</li>
              <li>• Si da error RLS → Problema de políticas de seguridad</li>
              <li>• Si da error de permisos → Problema de credenciales o configuración</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseDebuggerSimple;
