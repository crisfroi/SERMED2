'use client';

import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEHRVersioning, type EHRDocumentVersion, type EHRDocument } from '@hosix/hooks/07-clinical-docs/useEHRVersioning';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Clock, User, FileText, ArrowLeft, ArrowRight } from 'lucide-react';

interface VersionHistoryViewerProps {
  documentId: string;
  onClose?: () => void;
}

export const VersionHistoryViewer: React.FC<VersionHistoryViewerProps> = ({
  documentId,
  onClose,
}) => {
  const {
    loading,
    error,
    fetchDocumentHistory,
    rollbackToVersion,
    getVersionAtTimestamp,
    compareVersions,
  } = useEHRVersioning();

  const [document, setDocument] = useState<EHRDocument | null>(null);
  const [versions, setVersions] = useState<EHRDocumentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<EHRDocumentVersion | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersion, setCompareVersion] = useState<EHRDocumentVersion | null>(null);

  // Load document history
  React.useEffect(() => {
    const loadHistory = async () => {
      const history = await fetchDocumentHistory(documentId);
      if (history) {
        setDocument(history.document);
        setVersions(history.versions);
        if (history.versions.length > 0) {
          setSelectedVersion(history.versions[0]);
        }
      }
    };
    loadHistory();
  }, [documentId, fetchDocumentHistory]);

  const toggleVersionExpand = useCallback((versionId: string) => {
    setExpandedVersions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  }, []);

  const handleRollback = useCallback(
    async (version: EHRDocumentVersion) => {
      const reason = prompt('¿Razón del rollback?', 'Revertir cambios no autorizados');
      if (!reason) return;

      const success = await rollbackToVersion(documentId, version.version_number, reason, 'current-user');

      if (success) {
        // Reload history
        const history = await fetchDocumentHistory(documentId);
        if (history) {
          setVersions(history.versions);
        }
      }
    },
    [documentId, rollbackToVersion, fetchDocumentHistory]
  );

  const handleCompare = useCallback((version: EHRDocumentVersion) => {
    if (!selectedVersion) return;

    const comparison = compareVersions(selectedVersion, version);
    setCompareVersion(version);
    setCompareMode(true);

    // You could display comparison details in a modal or side panel
    console.log('Comparison:', comparison);
  }, [selectedVersion, compareVersions]);

  const handleSelectVersion = useCallback((version: EHRDocumentVersion) => {
    setSelectedVersion(version);
    setCompareMode(false);
  }, []);

  if (!document || versions.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {loading ? 'Cargando historial de versiones...' : 'Sin historial de versiones disponible'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with document info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {document.title}
              </CardTitle>
              <CardDescription className="mt-2">
                Tipo:{' '}
                <Badge variant="outline" className="ml-1">
                  {document.document_type}
                </Badge>
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main content with tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Línea de Tiempo</TabsTrigger>
          <TabsTrigger value="details">Detalles de Versión</TabsTrigger>
        </TabsList>

        {/* Timeline view */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <div key={version.id} className="flex gap-4">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-4 h-4 rounded-full cursor-pointer transition-all ${
                            selectedVersion?.id === version.id
                              ? 'bg-blue-600 ring-2 ring-blue-300'
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          onClick={() => handleSelectVersion(version)}
                        />
                        {index < versions.length - 1 && <div className="w-0.5 h-12 bg-gray-200 my-1" />}
                      </div>

                      {/* Version card */}
                      <div
                        className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVersion?.id === version.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectVersion(version)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">v{version.version_number}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(version.created_at), 'PPpp', { locale: es })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {version.status}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                          <User className="w-4 h-4" />
                          Por: {version.created_by}
                        </p>

                        <p className="text-sm font-medium text-gray-700 mb-3">{version.change_summary}</p>

                        {selectedVersion?.id === version.id && (
                          <div className="flex gap-2 pt-3 border-t">
                            {version.version_number > 1 && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRollback(version)}
                                  disabled={loading}
                                >
                                  Revertir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCompare(version)}
                                >
                                  Comparar
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details view */}
        <TabsContent value="details" className="space-y-4">
          {selectedVersion && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Versión {selectedVersion.version_number}</CardTitle>
                  <CardDescription>
                    Creada {format(new Date(selectedVersion.created_at), 'PPpp', { locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cambios</p>
                    <p className="text-sm text-gray-800 mt-2">{selectedVersion.change_summary}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Autor</p>
                    <p className="text-sm text-gray-800 mt-2">{selectedVersion.created_by}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Contenido</p>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-[300px] overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                        {selectedVersion.content.substring(0, 500)}
                        {selectedVersion.content.length > 500 && '...'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {compareMode && compareVersion && selectedVersion && (
            <Card>
              <CardHeader>
                <CardTitle>Comparación</CardTitle>
                <CardDescription>
                  v{selectedVersion.version_number} vs v{compareVersion.version_number}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-sm mb-2">Versión {selectedVersion.version_number}</p>
                    <div className="bg-red-50 p-3 rounded text-sm text-gray-700">
                      {selectedVersion.content.substring(0, 200)}...
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-2">Versión {compareVersion.version_number}</p>
                    <div className="bg-green-50 p-3 rounded text-sm text-gray-700">
                      {compareVersion.content.substring(0, 200)}...
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
