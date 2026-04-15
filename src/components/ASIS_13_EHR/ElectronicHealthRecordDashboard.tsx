// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, Download, Share2, Clock, Users, FileText } from 'lucide-react';
import { useElectronicHealthRecord } from '../hooks/useElectronicHealthRecord';
import { useThalamusSync } from '../hooks/useThalamusSync';
import EHRTimeline from './EHRTimeline';
import ResumenClinico from './ResumenClinico';
import DocumentStorage from './DocumentStorage';
import AuditLog from './AuditLog';

// ============================================================================
// ASIS 13: ElectronicHealthRecordDashboard
// Propósito: Dashboard principal consolidado de HME del paciente
// Estado: HIPAA-compliant con auditoría completa
// Integración: THALAMUS sync indicators
// ============================================================================

interface ElectronicHealthRecordDashboardProps {
  patientId: string;
  hospitalId: string;
  readOnly?: boolean;
}

type TabType = 'summary' | 'timeline' | 'documents' | 'audit' | 'cross-hospital';

interface EHRTabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const EHR_TABS: EHRTabConfig[] = [
  {
    id: 'summary',
    label: 'Resumen Clínico',
    icon: <FileText className="w-4 h-4" />,
    description: 'Consolidado automático de diagnósticos, medicamentos y alergias'
  },
  {
    id: 'timeline',
    label: 'Línea de Tiempo',
    icon: <Clock className="w-4 h-4" />,
    description: 'Cronología de consultas, hospitalizaciones y procedimientos'
  },
  {
    id: 'documents',
    label: 'Documentos',
    icon: <FileText className="w-4 h-4" />,
    description: 'Prescripciones, reportes, resultados de laboratorio e imágenes'
  },
  {
    id: 'audit',
    label: 'Auditoría (HIPAA)',
    icon: <Users className="w-4 h-4" />,
    description: 'Log de accesos, cambios, y exportaciones'
  },
  {
    id: 'cross-hospital',
    label: 'Red RENAPROSA',
    icon: <Share2 className="w-4 h-4" />,
    description: 'Información de otros hospitales via THALAMUS (si autorizado)'
  }
];

export const ElectronicHealthRecordDashboard: React.FC<ElectronicHealthRecordDashboardProps> = ({
  patientId,
  hospitalId,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'hl7' | 'fhir'>('pdf');

  // Hooks para datos
  const {
    ehr,
    episodes,
    documents,
    isLoading,
    error,
    refetch,
    exportEHR,
    generatePDF,
    isExporting
  } = useElectronicHealthRecord(patientId);

  // Hook para THALAMUS sync
  const {
    syncStatus,
    lastSync,
    isSyncing,
    crossHospitalData,
    initiateSync,
    queryCrossHospitalHistory
  } = useThalamusSync(patientId, hospitalId);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleExportEHR = async () => {
    try {
      await generatePDF(exportFormat);
      // Log de acceso (auditoría)
      await fetch('/api/log-ehr-access', {
        method: 'POST',
        body: JSON.stringify({
          ehr_id: ehr?.id,
          access_type: 'export',
          reason: `export_${exportFormat}`,
          data_accessed: {
            summary: true,
            episodes: true,
            documents: true
          }
        })
      });
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleInitiateTransfer = async (toHospitalId: string) => {
    try {
      const response = await fetch('/api/coordinate-transfer', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: patientId,
          from_hospital_id: hospitalId,
          to_hospital_id: toHospitalId,
          reason: 'patient_request' // or medical_necessity, etc.
        })
      });

      if (!response.ok) throw new Error('Transfer coordination failed');

      setShowTransferModal(false);
      // Show success notification
    } catch (err) {
      console.error('Transfer initiation failed:', err);
    }
  };

  const handleSyncWithThalamus = async () => {
    await initiateSync();
  };

  // ============================================================================
  // LOADER & ERROR STATES
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando Historia Médica Electrónica...</p>
        </div>
      </div>
    );
  }

  if (error || !ehr) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-900 font-semibold">Error cargando HME</h3>
            <p className="text-red-700 text-sm mt-1">{error || 'No se pudo encontrar el registro'}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER MAIN DASHBOARD
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold">Historia Médica Electrónica</h1>
        <p className="text-blue-100 mt-2">Consolidado completo del paciente - Acceso auditado HIPAA</p>

        {/* SYNC STATUS INDICATOR */}
        <div className="mt-4 flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
            syncStatus === 'synced' 
              ? 'bg-green-400/20 text-green-200' 
              : syncStatus === 'syncing'
              ? 'bg-yellow-400/20 text-yellow-200'
              : 'bg-red-400/20 text-red-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              syncStatus === 'synced' ? 'bg-green-400' :
              syncStatus === 'syncing' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span>THALAMUS: {syncStatus === 'synced' ? `Sincronizado hace ${lastSync}` : syncStatus === 'syncing' ? 'Sincronizando...' : 'No sincronizado'}</span>
          </div>
          <button
            onClick={handleSyncWithThalamus}
            disabled={isSyncing}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium disabled:opacity-50"
          >
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
          </button>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleExportEHR}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exportando...' : 'Exportar PDF'}</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded font-medium"
          >
            <Share2 className="w-4 h-4" />
            <span>Transferencia Inter-Hospital</span>
          </button>
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-500 text-sm font-medium">Problemas Activos</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{ehr.active_problems?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-500 text-sm font-medium">Medicamentos Vigentes</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{ehr.medications_active?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-500 text-sm font-medium">Episodios Clínicos</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{episodes?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-500 text-sm font-medium">Documentos</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{documents?.length || 0}</p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {EHR_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="p-6">
          {activeTab === 'summary' && (
            <ResumenClinico ehr={ehr} readOnly={readOnly} />
          )}

          {activeTab === 'timeline' && (
            <EHRTimeline episodes={episodes} />
          )}

          {activeTab === 'documents' && (
            <DocumentStorage documents={documents} ehr={ehr} />
          )}

          {activeTab === 'audit' && (
            <AuditLog erhId={ehr.id} />
          )}

          {activeTab === 'cross-hospital' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 text-sm">
                  Realizando búsqueda en otros hospitales RENAPROSA a través de THALAMUS...
                </p>
              </div>
              {crossHospitalData && crossHospitalData.length > 0 ? (
                <div className="space-y-3">
                  {crossHospitalData.map((record, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <p className="font-semibold text-gray-900">{record.hospital_name}</p>
                      <p className="text-sm text-gray-600">
                        Encuentros: {record.encounter_count} | Última visita: {record.last_encounter_date}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No hay encuentros registrados en otros hospitales</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <TransferModal
          onClose={() => setShowTransferModal(false)}
          onConfirm={handleInitiateTransfer}
        />
      )}

      {/* HIPAA NOTICE */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-xs font-medium">
          ⚠️ AVISO HIPAA: Este registro es confidencial. Todo acceso es auditado y registrado.
          Los cambios no autorizados violarán la privacidad del paciente.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// TRANSFER MODAL COMPONENT
// ============================================================================

interface TransferModalProps {
  onClose: () => void;
  onConfirm: (hospitalId: string) => Promise<void>;
}

const TransferModal: React.FC<TransferModalProps> = ({ onClose, onConfirm }) => {
  const [selectedHospital, setSelectedHospital] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hospitals = [
    { id: 'hosix_quito', name: 'HOSIX Quito' },
    { id: 'hosix_ibarra', name: 'HOSIX Ibarra' },
    { id: 'hosix_ambato', name: 'HOSIX Ambato' },
    { id: 'hosix_loja', name: 'HOSIX Loja' }
  ];

  const handleSubmit = async () => {
    if (!selectedHospital) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selectedHospital);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Solicitar Transferencia Inter-Hospitalaria</h2>
        
        <p className="text-gray-600 text-sm mb-4">
          Selecciona el hospital destino. Se enviará un resumen clínico encriptado.
        </p>

        <div className="space-y-2 mb-6">
          {hospitals.map(hospital => (
            <label key={hospital.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="hospital"
                value={hospital.id}
                checked={selectedHospital === hospital.id}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-gray-900">{hospital.name}</span>
            </label>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedHospital || isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Procesando...' : 'Solicitar Transferencia'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElectronicHealthRecordDashboard;
