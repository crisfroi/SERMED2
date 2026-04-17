'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDocumentEncryption } from '@hosix/hooks/07-clinical-docs/useDocumentEncryption';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Lock, Key, Shield, RefreshCw, Trash2, Copy } from 'lucide-react';

interface EncryptionKey {
  id: string;
  algorithm: string;
  status: 'active' | 'inactive' | 'rotated';
  createdAt: string;
  expiresAt?: string;
  documentsProtected: number;
}

export const DocumentEncryptionStatus: React.FC = () => {
  const {
    encryptionStatus,
    getActiveKeys,
    generateNewKey,
    rotateKey,
    loading,
    error,
  } = useDocumentEncryption();

  const [keys, setKeys] = useState<EncryptionKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [showKeyRotation, setShowKeyRotation] = useState(false);
  const [rotationReason, setRotationReason] = useState('');
  const [newKeyAlgorithm, setNewKeyAlgorithm] = useState('AES-256-GCM');

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    const activeKeys = await getActiveKeys();
    if (activeKeys) {
      setKeys(activeKeys);
      if (activeKeys.length > 0 && !selectedKeyId) {
        setSelectedKeyId(activeKeys[0].id);
      }
    }
  };

  const handleGenerateNewKey = async () => {
    const success = await generateNewKey({
      algorithm: newKeyAlgorithm as any,
      rotationSchedule: '90d',
    });

    if (success) {
      await loadKeys();
      setNewKeyAlgorithm('AES-256-GCM');
    }
  };

  const handleRotateKey = async () => {
    if (!selectedKeyId || !rotationReason.trim()) {
      alert('Selecciona una clave y proporciona razón de rotación');
      return
    }

    const confirmRotation = window.confirm(
      '⚠️ La rotación de claves afectará la desencriptación. ¿Proceder?'
    );

    if (confirmRotation) {
      const success = await rotateKey(selectedKeyId, {
        reason: rotationReason,
        newAlgorithm: newKeyAlgorithm as any,
      });

      if (success) {
        await loadKeys();
        setShowKeyRotation(false);
        setRotationReason('');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">🔐 Activa</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">⚪ Inactiva</Badge>;
      case 'rotated':
        return <Badge className="bg-blue-100 text-blue-800">🔄 Rotada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const encryptionMetrics = [
    {
      label: 'Documentos Protegidos',
      value: encryptionStatus?.documentsProtected || 0,
      icon: Lock,
    },
    {
      label: 'Claves Activas',
      value: keys.filter((k) => k.status === 'active').length,
      icon: Key,
    },
    {
      label: 'Algoritmo Actual',
      value: encryptionStatus?.algorithm || 'AES-256-GCM',
      icon: Shield,
    },
    {
      label: 'Próxima Rotación',
      value: encryptionStatus?.nextRotationDate
        ? format(new Date(encryptionStatus.nextRotationDate), 'PPp', { locale: es })
        : 'N/A',
      icon: RefreshCw,
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {encryptionMetrics.map((metric, idx) => {
          const IconComponent = metric.icon;
          return (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                  </div>
                  <p className="text-lg font-bold">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Encryption Status Card */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Lock className="w-5 h-5" />
            Estado de Encriptación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-green-700 font-medium">Algoritmo Actual</p>
              <p className="text-xl font-bold text-green-900">
                {encryptionStatus?.algorithm || 'AES-256-GCM'}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Documentos Encriptados</p>
              <p className="text-xl font-bold text-green-900">
                {encryptionStatus?.documentsProtected || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Nivel de Seguridad</p>
              <Badge className="bg-green-100 text-green-800 text-base">Máximo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Claves de Encriptación
          </CardTitle>
          <CardDescription>Gestiona las claves criptográficas activas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Clave</TableHead>
                  <TableHead>Algoritmo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Sin claves de encriptación
                    </TableCell>
                  </TableRow>
                ) : (
                  keys.map((key) => (
                    <TableRow
                      key={key.id}
                      onClick={() => setSelectedKeyId(key.id)}
                      className={`cursor-pointer ${selectedKeyId === key.id ? 'bg-blue-50' : ''}`}
                    >
                      <TableCell className="font-mono text-xs">{key.id.substring(0, 12)}...</TableCell>
                      <TableCell className="font-mono">{key.algorithm}</TableCell>
                      <TableCell>{getStatusBadge(key.status)}</TableCell>
                      <TableCell>{key.documentsProtected}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(key.createdAt), 'PPp', { locale: es })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {key.expiresAt
                          ? format(new Date(key.expiresAt), 'PPp', { locale: es })
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <button className="text-blue-600 hover:text-blue-800" title="Copiar">
                          <Copy className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Generate New Key */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-sm">Generar Nueva Clave</h4>
            <div className="space-y-2">
              <Label htmlFor="algorithm">Algoritmo</Label>
              <Select value={newKeyAlgorithm} onValueChange={setNewKeyAlgorithm}>
                <SelectTrigger id="algorithm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AES-256-GCM">AES-256-GCM (Recomendado)</SelectItem>
                  <SelectItem value="AES-256-CBC">AES-256-CBC</SelectItem>
                  <SelectItem value="ChaCha20-Poly1305">ChaCha20-Poly1305</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateNewKey}
              disabled={loading}
              className="w-full"
            >
              <Key className="w-4 h-4 mr-2" />
              {loading ? 'Generando...' : 'Generar Nueva Clave'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Rotation */}
      {showKeyRotation && selectedKeyId && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <RefreshCw className="w-5 h-5" />
              Rotar Clave
            </CardTitle>
            <CardDescription className="text-orange-800">
              Esto puede afectar la desencriptación. Usar solo cuando sea necesario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rotationReason">Razón de Rotación *</Label>
              <textarea
                id="rotationReason"
                value={rotationReason}
                onChange={(e) => setRotationReason(e.target.value)}
                placeholder="Explica por qué se debe rotar la clave"
                rows={3}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowKeyRotation(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRotateKey}
                disabled={loading || !rotationReason.trim()}
                variant="destructive"
                className="flex-1"
              >
                {loading ? 'Rotando...' : 'Proceder con Rotación'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!showKeyRotation && selectedKeyId && (
        <Button
          onClick={() => setShowKeyRotation(true)}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Rotar Clave Seleccionada
        </Button>
      )}

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
