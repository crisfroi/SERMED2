import React, { useState } from 'react';
import { FileText, Download, Eye, Trash2, Upload, Filter } from 'lucide-react';

// ============================================================================
// ASIS 13: DocumentStorage Component
// Propósito: Gestionar almacenamiento de documentos (PDF, imágenes, etc.)
// Estado: Soporta vista previa y descarga
// Líneas: ~400
// ============================================================================

interface Document {
  id: string;
  document_type: string;
  document_title: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploaded_by: string;
  document_date: string;
  is_encrypted: boolean;
}

interface EHRData {
  id: string;
}

interface DocumentStorageProps {
  documents: Document[];
  ehr: EHRData;
}

export const DocumentStorage: React.FC<DocumentStorageProps> = ({ documents, ehr }) => {
  const [selectedType, setSelectedType] = useState<string | 'all'>('all');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filteredDocs = selectedType === 'all'
    ? documents
    : documents.filter(doc => doc.document_type === selectedType);

  const documentTypes = Array.from(new Set(documents.map(doc => doc.document_type)));

  const getDocTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'prescription': '💊',
      'report': '📄',
      'imaging': '📸',
      'lab_result': '🔬',
      'letter': '📮',
      'consent': '✍️',
      'discharge_summary': '📋',
      'diagnostic_image': '🖼️',
      'surgical_note': '⚕️'
    };
    return iconMap[type] || '📄';
  };

  const getDocTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      'prescription': 'Prescripción',
      'report': 'Reporte Médico',
      'imaging': 'Química Diagnóstica',
      'lab_result': 'Resultado de Laboratorio',
      'letter': 'Carta',
      'consent': 'Consentimiento',
      'discharge_summary': 'Resumen de Alta',
      'diagnostic_image': 'Imagen Diagnóstica',
      'surgical_note': 'Nota Quirúrgica'
    };
    return labelMap[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.document_title || `document-${doc.id}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('ehr_id', ehr.id);
    formData.append('document_type', 'report'); // Default type

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        // Refresh documents list
        // (En una app real, esto dispararía un evento de actualización)
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* UPLOAD SECTION */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
        <div className="flex flex-col items-center justify-center">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">Arrastra documentos aquí o</p>
          <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
            haz clic para seleccionar
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">PDF, PNG, JPG (máximo 50MB)</p>
        </div>
      </div>

      {/* FILTER SECTION */}
      {documentTypes.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos ({documents.length})
          </button>
          {documentTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {getDocTypeLabel(type)} ({documents.filter(d => d.document_type === type).length})
            </button>
          ))}
        </div>
      )}

      {/* DOCUMENTS LIST */}
      {filteredDocs.length > 0 ? (
        <div className="space-y-2">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Document Icon */}
                  <span className="text-2xl mt-1">{getDocTypeIcon(doc.document_type)}</span>

                  {/* Document Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {doc.document_title || `Documento: ${doc.document_type}`}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {getDocTypeLabel(doc.document_type)}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {formatFileSize(doc.file_size)}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {formatDate(doc.created_at)}
                      </span>
                      {doc.is_encrypted && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          🔒 Encriptado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {doc.document_date && `Fecha del documento: ${formatDate(doc.document_date)}`}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Vista previa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay documentos</p>
          <p className="text-gray-400 text-sm mt-1">
            {selectedType === 'all'
              ? 'Carga tu primer documento para comenzar'
              : `No hay documentos de tipo ${getDocTypeLabel(selectedType)}`}
          </p>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {previewDoc.document_title || `Documento: ${previewDoc.document_type}`}
              </h2>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Document Preview */}
            <div className="bg-gray-100 rounded-lg p-4 mb-4 min-h-96">
              {previewDoc.mime_type.includes('image') ? (
                <img
                  src={previewDoc.file_path}
                  alt={previewDoc.document_title}
                  className="w-full h-auto"
                />
              ) : previewDoc.mime_type.includes('pdf') ? (
                <p className="text-center text-gray-600">
                  PDF preview no soportado en navegador. Por favor descarga el archivo.
                </p>
              ) : (
                <p className="text-center text-gray-600">
                  Vista previa no disponible para este tipo de archivo
                </p>
              )}
            </div>

            <button
              onClick={() => {
                handleDownload(previewDoc);
                setPreviewDoc(null);
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Descargar Documento
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentStorage;
