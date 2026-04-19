/**
 * @file VerifyTwoFA.tsx
 * @module 00-core/auth
 * @description HOSIX - Componente de Verificación 2FA
 * Permite ingresar código de 2FA (SMS o Authenticator)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Check, Copy } from 'lucide-react';
import { useAuth2FA } from '@/hooks/useAuth2FA';

export interface VerifyTwoFAProps {
  onVerifySuccess?: () => void;
  tempSessionId?: string;
  method?: '2fa_sms' | '2fa_authenticator';
}

export const VerifyTwoFA: React.FC<VerifyTwoFAProps> = ({
  onVerifySuccess,
  tempSessionId,
  method = '2fa_sms',
}) => {
  const navigate = useNavigate();
  const { verifyTwoFACode } = useAuth2FA();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Focus en el input cuando el componente monta
  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  // Timer para re-envío
  useEffect(() => {
    if (!canResend && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
    setCode(value);
    setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validación
      if (!code.trim()) {
        setError('Por favor ingresa el código de 2FA');
        setIsLoading(false);
        return;
      }

      if (code.length < 6) {
        setError('El código debe tener 6 dígitos');
        setIsLoading(false);
        return;
      }

      if (!tempSessionId) {
        setError('Sesión inválida. Por favor intenta de nuevo.');
        setIsLoading(false);
        return;
      }

      // Llamar a verificación
      const result = await verifyTwoFACode(code, tempSessionId);

      if (result.success) {
        setSuccess(true);
        // Esperar 1 segundo antes de navegar
        setTimeout(() => {
          onVerifySuccess?.();
          navigate('/hosix/dashboard');
        }, 1000);
      } else {
        setError(result.error || 'Código inválido. Por favor intenta de nuevo.');
        setCode('');
        codeInputRef.current?.focus();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError(null);

    try {
      // Aquí iría lógica para re-enviar el código
      // Por ahora solo mostramos el mensaje
      setResendCount((prev) => prev + 1);
      setCanResend(false);
      setTimeLeft(60);

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (method === '2fa_sms') {
        setError(null); // Limpiar si hay error anterior
        alert('Código re-enviado a tu número de teléfono');
      } else {
        alert('Por favor usa tu aplicación de autenticación');
      }
    } catch (err) {
      setError('Error al re-enviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodText = () => {
    return method === '2fa_sms'
      ? 'tu número de teléfono'
      : 'tu aplicación de autenticación (Google Authenticator, Authy, etc)';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    }}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🔐</div>
          </div>
          <CardTitle className="text-center">Verificación en Dos Pasos</CardTitle>
          <CardDescription className="text-center">
            Ingresa el código de 6 dígitos de {getMethodText()}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            {/* Code Input - Display as 6 boxes for better UX */}
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                Código de Verificación
              </Label>
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Input
                    key={i}
                    ref={i === 0 ? codeInputRef : null}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[i] || ''}
                    onChange={(e) => {
                      const newCode = code.split('');
                      newCode[i] = e.target.value.replace(/[^\d]/g, '');
                      setCode(newCode.join('').slice(0, 6));

                      // Auto-focus al siguiente input
                      if (e.target.value && i < 5) {
                        const inputs = document.querySelectorAll('input[inputmode="numeric"]');
                        (inputs[i + 1] as HTMLInputElement)?.focus();
                      }
                    }}
                    disabled={isLoading || success}
                    className="w-12 h-12 text-center text-xl font-bold border-2 rounded"
                    placeholder="0"
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ¡Verificación exitosa! Redirigiendo...
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || success || code.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Verificado
                </>
              ) : (
                'Verificar Código'
              )}
            </Button>

            {/* Resend Code Section */}
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm text-gray-600 text-center">
                ¿No recibiste el código?
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={!canResend || isLoading}
                onClick={handleResend}
                className="w-full"
              >
                {canResend ? (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Re-enviar Código
                  </>
                ) : (
                  `Puedes re-enviar en ${timeLeft}s`
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-xs text-gray-500 pt-4">
              <p>Si tienes problemas, contacta al soporte técnico</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyTwoFA;
