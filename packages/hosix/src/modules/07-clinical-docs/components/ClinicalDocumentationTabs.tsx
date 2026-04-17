/**
 * HOSIX - Module 16: Clinical Documentation Tabs (CLINICAL)
 * Componente integrador para toda la documentación clínica
 */

import React, { useState, useEffect } from 'react';
import { useClinical } from '@hosix/hooks/07-clinical-docs/useClinical';
import { usePermissions } from '@hosix/hooks/shared/usePermissions';
import { VisitNotesForm } from './VisitNotesForm';
import { DiagnosisForm } from './DiagnosisForm';
import { PrescriptionForm } from './PrescriptionForm';
import { DocumentSigningInterface } from './DocumentSigningInterface';
import { DocumentViewer } from './DocumentViewer';

export interface ClinicalDocumentationTabsProps {
  patientId: string;
  patientName: string;
}

type TabType = 'visits' | 'diagnoses' | 'prescriptions' | 'documents' | 'signed';
type ModalType = 'visit' | 'diagnosis' | 'prescription' | 'sign' | 'view' | null;

export const ClinicalDocumentationTabs: React.FC<ClinicalDocumentationTabsProps> = ({
  patientId,
  patientName,
}) => {
  const { isDoctor } = usePermissions();
  const {
    documents,
    currentDocument,
    isLoading,
    totalDocuments,
    fetchDocuments,
    getDocumentsByType,
  } = useClinical();

  const [activeTab, setActiveTab] = useState<TabType>('visits');
  const [showModal, setShowModal] = useState<ModalType>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadTabData();
  }, [activeTab, page, patientId]);

  const loadTabData = async () => {
    if (activeTab === 'visits') {
      await getDocumentsByType(patientId, 'visit_note');
    } else if (activeTab === 'diagnoses') {
      await getDocumentsByType(patientId, 'diagnosis');
    } else if (activeTab === 'prescriptions') {
      await getDocumentsByType(patientId, 'prescription');
    } else if (activeTab === 'documents') {
      await fetchDocuments(patientId, page, 10);
    } else if (activeTab === 'signed') {
      // TODO: Load signed documents
    }
  };

  const tabs = [
    {
      id: 'visits' as TabType,
      label: '📋 Visitas',
      icon: '📋',
      count: documents.filter((d) => d.type === 'visit_note').length,
    },
    {
      id: 'diagnoses' as TabType,
      label: '🏥 Diagnósticos',
      icon: '🏥',
      count: documents.filter((d) => d.type === 'diagnosis').length,
    },
    {
      id: 'prescriptions' as TabType,
      label: '💊 Prescripciones',
      icon: '💊',
      count: documents.filter((d) => d.type === 'prescription').length,
    },
    {
      id: 'documents' as TabType,
      label: '📄 Documentos',
      icon: '📄',
      count: documents.length,
    },
    {
      id: 'signed' as TabType,
      label: '✓ Firmados',
      icon: '✓',
      count: documents.filter((d) => d.signed_at).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-white rounded-t-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Visits Tab */}
        {activeTab === 'visits' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Notas de Visita</h3>
              {isDoctor() && (
                <button
                  onClick={() => setShowModal('visit')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  + Nueva Visita
                </button>
              )}
            </div>

            {documents.filter((d) => d.type === 'visit_note').length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay notas de visita</p>
            ) : (
              <div className="space-y-3">
                {documents
                  .filter((d) => d.type === 'visit_note')
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setShowModal('view')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {doc.content}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Diagnoses Tab */}
        {activeTab === 'diagnoses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Diagnósticos</h3>
              {isDoctor() && (
                <button
                  onClick={() => setShowModal('diagnosis')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  + Nuevo Diagnóstico
                </button>
              )}
            </div>

            {documents.filter((d) => d.type === 'diagnosis').length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay diagnósticos registrados</p>
            ) : (
              <div className="space-y-3">
                {documents
                  .filter((d) => d.type === 'diagnosis')
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-green-200 rounded-lg p-4 bg-green-50 hover:bg-green-100 cursor-pointer"
                      onClick={() => setShowModal('view')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.title}</h4>
                          <p className="text-sm text-gray-600">{doc.content}</p>
                        </div>
                        {doc.signed_at && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                            ✓ Firmado
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Prescripciones</h3>
              {isDoctor() && (
                <button
                  onClick={() => setShowModal('prescription')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  + Nueva Prescripción
                </button>
              )}
            </div>

            {documents.filter((d) => d.type === 'prescription').length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay prescripciones</p>
            ) : (
              <div className="space-y-3">
                {documents
                  .filter((d) => d.type === 'prescription')
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-blue-200 rounded-lg p-4 bg-blue-50 hover:bg-blue-100 cursor-pointer"
                      onClick={() => setShowModal('view')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {doc.content}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Todos los Documentos</h3>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay documentos</p>
            ) : (
              <>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setShowModal('view')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.title}</h4>
                          <p className="text-xs text-gray-500">{doc.type}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalDocuments > documents.length && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      ← Anterior
                    </button>
                    <span className="px-3 py-1">Página {page}</span>
                    <button
                      onClick={() => setPage(page + 1)}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Signed Tab */}
        {activeTab === 'signed' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documentos Firmados</h3>
            {documents.filter((d) => d.signed_at).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay documentos firmados</p>
            ) : (
              <div className="space-y-3">
                {documents
                  .filter((d) => d.signed_at)
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="border-2 border-green-300 rounded-lg p-4 bg-green-50 hover:bg-green-100 cursor-pointer"
                      onClick={() => setShowModal('view')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">✓ {doc.title}</h4>
                          <p className="text-sm text-gray-600">
                            Firmado: {new Date(doc.signed_at!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals - Simplified */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">
                {showModal === 'visit' && 'Nueva Nota de Visita'}
                {showModal === 'diagnosis' && 'Nuevo Diagnóstico'}
                {showModal === 'prescription' && 'Nueva Prescripción'}
                {showModal === 'sign' && 'Firmar Documento'}
              </h2>
              <button
                onClick={() => setShowModal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {showModal === 'visit' && (
                <VisitNotesForm
                  patientId={patientId}
                  onCancel={() => setShowModal(null)}
                />
              )}
              {showModal === 'diagnosis' && (
                <DiagnosisForm
                  patientId={patientId}
                  onCancel={() => setShowModal(null)}
                />
              )}
              {showModal === 'prescription' && (
                <PrescriptionForm
                  patientId={patientId}
                  onCancel={() => setShowModal(null)}
                />
              )}
              {showModal === 'sign' && (
                <DocumentSigningInterface
                  documentTitle={currentDocument?.title || 'Documento'}
                  documentContent={currentDocument?.content || ''}
                  onCancel={() => setShowModal(null)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalDocumentationTabs;
