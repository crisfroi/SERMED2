/**
 * HOSIX - Module 16: Document Viewer
 * Visor de documentos clínicos con zoom y navegación
 */

import React, { useState } from 'react';
import { formatDate } from '@sermed2/shared/utils/formatters';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: 'visit_note' | 'diagnosis' | 'prescription' | 'lab_result' | 'imaging';
  doctorName: string;
  patientName: string;
  createdAt: string;
  signature?: string;
  signedAt?: string;
}

export interface DocumentViewerProps {
  document: Document;
  onClose?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
  onPrint,
  onDownload,
  onShare,
}) => {
  const [zoom, setZoom] = useState(100);

  const docTypeLabels = {
    visit_note: '📋 Nota de Visita',
    diagnosis: '🏥 Diagnóstico',
    prescription: '💊 Prescripción',
    lab_result: '🔬 Resultado de Laboratorio',
    imaging: '📷 Imagen Médica',
  };

  return (
    <div className="space-y-4 max-w-4xl max-h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-900">{document.title}</h2>
          <p className="text-sm text-gray-600">
            {docTypeLabels[document.type]} • {formatDate(document.createdAt)}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="text-gray-700 hover:text-gray-900"
            >
              −
            </button>
            <span className="text-sm font-medium text-gray-700 w-12 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="text-gray-700 hover:text-gray-900"
            >
              +
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={onPrint}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            title="Imprimir"
          >
            🖨️
          </button>
          <button
            onClick={onDownload}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            title="Descargar"
          >
            ⬇️
          </button>
          <button
            onClick={onShare}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            title="Compartir"
          >
            🔗
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div
        className="bg-white border border-gray-200 rounded-lg p-8 overflow-auto flex-1"
        style={{ fontSize: `${zoom / 100 * 16}px` }}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="border-b-2 border-gray-300 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {docTypeLabels[document.type]}
            </h1>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Paciente:</p>
                <p className="font-medium text-gray-900">{document.patientName}</p>
              </div>
              <div>
                <p className="text-gray-600">Doctor:</p>
                <p className="font-medium text-gray-900">{document.doctorName}</p>
              </div>
              <div>
                <p className="text-gray-600">Fecha:</p>
                <p className="font-medium text-gray-900">
                  {formatDate(document.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Tipo:</p>
                <p className="font-medium text-gray-900">{document.type}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="prose prose-sm max-w-none">
            <pre className="text-gray-700 font-mono whitespace-pre-wrap overflow-hidden">
              {document.content}
            </pre>
          </div>

          {/* Signature Section */}
          {document.signature && document.signedAt && (
            <div className="border-t-2 border-gray-300 pt-6 mt-6">
              <p className="text-sm text-gray-600 mb-2">Firmado digitalmente por {document.doctorName}</p>
              <div className="flex items-end gap-4">
                <div className="border-t-2 border-gray-700 pt-2">
                  <img
                    src={document.signature}
                    alt="Firma"
                    style={{ maxHeight: '80px', maxWidth: '200px' }}
                  />
                </div>
                <div className="text-xs text-gray-600">
                  <p>Firmado: {formatDate(document.signedAt)}</p>
                  <p>ID: {document.id}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
        <p>
          Documento ID: {document.id} | Versión: 1.0 | Estado:{' '}
          {document.signature ? '✓ Firmado' : '⊐ Pendiente de firma'}
        </p>
      </div>
    </div>
  );
};

export default DocumentViewer;
