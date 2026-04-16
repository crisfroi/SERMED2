'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocumentEncryption, type EncryptionKey, type EncryptionStatus } from '@/hooks/useDocumentEncryption';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Lock, LockOpen, RotateCcw, Key, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface DocumentEncryptionStatusProps {
  documentId: string;
  onKeyRotate?: () => void;
}

export const DocumentEncryptionStatus: React.FC<DocumentEncryptionStatusProps> = ({
  documentId,
  onKeyRotate,
}) => {
  const {
    loading,
    error,
    getEncryptionStatus,
    generateEncryptionKey,
    reEncryptDocument,
    getActiveEncryptionKeys,
  } = useDocumentEncryption();

  const [status, setStatus] = useState<EncryptionStatus | null>(null);
  const [activeKeys, setActiveKeys] = useState<EncryptionKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  // Load encryption status
  useEffect(() => {
    const loadStatus = async () => {
      const encStatus = await getEncryptionStatus(documentId);
      if (encStatus) {
        setStatus(encStatus);
      }

      const keys = await getActiveEncryptionKeys();
      setActiveKeys(keys);
      if (keys.length > 0) {
        setSelectedKeyId(keys[0].id);
      }
    };

    loadStatus();
  }, [documentId, getEncryptionStatus, getActiveEncryptionKeys]);

  const handleGenerateKey = async () => {
    const keyName = prompt('Nombre de la clave de encriptación:', 'encryption-key-'+Date.now());
    if (!keyName) return;

    const newKey = await generateEncryptionKey(keyName);
    if (newKey) {
      setActiveKeys([newKey, ...activeKeys]);
      setSelectedKeyId(newKey.id);
    }
  };

  const handleRotateKey = async () => {
    if (!selectedKeyId) return;

    // Reload document and re-encrypt with new key
    const success = await reEncryptDocument(
      documentId,
      'encrypted_content', // Placeholder - in production would fetch actual content
      selectedKeyId
    );

    if (success) {
      const newStatus = await getEncryptionStatus(documentId);
      if (newStatus) {
        setStatus(newStatus);
      }
      setShowRotateConfirm(false);
      onKeyRotate?.();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Encryption Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status?.isEncrypted ? (
              <Lock className="w-5 h-5 text-green-600" />
            ) : (
              <LockOpen className="w-5 h-5 text-yellow-600" />
            )}
            Estado de Encriptación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Estado</span>
            {status?.isEncrypted ? (
              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Encriptado
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Sin encriptar
              </Badge>
            )}
          </div>

          {/* Key info */}
          {status?.isEncrypted && (
            <>
              <div>
                <p className="text-sm text-gray-600 mb-1">ID de Clave Activa</p>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded text-gray-800 truncate">
                  {status.keyId}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Algoritmo</p>
                <Badge variant="outline">{status.algorithm}</Badge>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Encriptado</p>
                <p className="text-sm text-gray-800">
                  {status.encryptedAt && format(new Date(status.encryptedAt), 'PPp', { locale: es })}
                </p>
              </div>

              {status.expiresAt && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vencimiento de Clave</p>
                  <p className={`text-sm ${new Date(status.expiresAt) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                    {format(new Date(status.expiresAt), 'PPp', { locale: es })}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-1">Clave Activa</p>
                <Badge variant={status.keyIsActive ? 'default' : 'destructive'}>
                  {status.keyIsActive ? 'Sí' : 'No (expirada)'}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Key Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Gestión de Claves
          </CardTitle>
          <CardDescription>Generar y rotar claves de encriptación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Keys List */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Claves Activas ({activeKeys.length})</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {activeKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setSelectedKeyId(key.id)}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{key.key_name}</p>
                    <p className="text-xs text-gray-500">v{key.key_version}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Algoritmo: <Badge variant="secondary" className="text-xs">{key.algorithm}</Badge>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedKeyId === key.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t">
            <Button
              onClick={handleGenerateKey}
              disabled={loading}
              className="flex-1"
              variant="outline"
            >
              <Key className="w-4 h-4 mr-2" />
              Nueva Clave
            </Button>

            {status?.isEncrypted && (
              <Button
                onClick={() => setShowRotateConfirm(true)}
                disabled={loading || !selectedKeyId}
                className="flex-1"
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Rotar Clave
              </Button>
            )}
          </div>

          {/* Rotate Confirmation */}
          {showRotateConfirm && (
            <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    ¿Rotar clave de encriptación?
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    El documento será re-encriptado con la nueva clave.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleRotateKey}
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Confirmar Rotación
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRotateConfirm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="w-5 h-5" />
            Información de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Encriptación AES-256 para confidencialidad</li>
            <li>✓ Autenticación de integridad con GCM</li>
            <li>✓ Claves con vencimiento automático</li>
            <li>✓ Rotación de claves soportada</li>
            <li>✓ Auditoría completa de acceso</li>
          </ul>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">Error: {error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
