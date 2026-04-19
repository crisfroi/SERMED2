/**
 * HOSIX - Module 16: Document Signing Interface (CLINICAL)
 * Interfaz para firmar documentos clínicos digitalmente
 */

import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '@hosix/hooks/shared';

export interface DocumentSigningInterfaceProps {
  documentTitle: string;
  documentContent: string;
  onSign?: (signature: string, timestamp: string) => void;
  onCancel?: () => void;
}

export const DocumentSigningInterface: React.FC<DocumentSigningInterfaceProps> = ({
  documentTitle,
  documentContent,
  onSign,
  onCancel,
}) => {
  const { addNotification } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const rect = canvas?.getBoundingClientRect();

    if (ctx && rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const rect = canvas?.getBoundingClientRect();

    if (ctx && rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);
      setHasSignature(false);
    }
  };

  const handleSign = async () => {
    if (!hasSignature) {
      addNotification('error', 'Por favor firma el documento');
      return;
    }

    setIsLoading(true);

    try {
      const canvas = canvasRef.current;
      const signature = canvas?.toDataURL() || '';
      const timestamp = new Date().toISOString();

      // TODO: Save signature to database
      addNotification('success', 'Documento firmado exitosamente');
      onSign?.(signature, timestamp);
    } catch (error: any) {
      addNotification('error', error.message || 'Error al firmar documento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Document Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{documentTitle}</h2>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
          <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
            {documentContent}
          </pre>
        </div>
      </div>

      {/* Signature Canvas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Firma Digital
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Firma en el recuadro de abajo para confirmar este documento
        </p>

        <div className="border-2 border-black rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full cursor-crosshair display-block"
          />
        </div>

        {/* Signature Info */}
        <div className="mt-4 flex justify-between items-center text-sm">
          <div>
            {hasSignature && (
              <span className="text-green-600">✓ Firma detectada</span>
            )}
          </div>
          <button
            type="button"
            onClick={clearSignature}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Signing Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Al firmar este documento, confirmas que has
          revisado todo su contenido y aceptas su autenticidad.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSign}
          disabled={isLoading || !hasSignature}
          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400"
        >
          {isLoading ? 'Firmando...' : '✓ Firmar documento'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default DocumentSigningInterface;
