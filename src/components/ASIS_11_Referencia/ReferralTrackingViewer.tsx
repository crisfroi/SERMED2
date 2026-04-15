// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, FileText, Phone, Mail, ExternalLink } from 'lucide-react';

interface ReferralRequest {
  id: string;
  referral_number: string;
  referral_type: string;
  specialist_facility: string;
  clinical_indication: string;
  status: 'pending' | 'sent' | 'received_by_specialist' | 'in_progress' | 'completed' | 'closed';
  priority: 'routine' | 'urgent' | 'STAT';
  request_date: string;
  expected_response_date: string;
  response_received_date?: string;
}

interface SpecialistResponse {
  id: string;
  referral_id: string;
  clinical_findings: string;
  diagnostic_impression: string;
  recommended_treatment: string;
  response_date: string;
  return_to_origin_recommended: boolean;
}

interface Props {
  patientId: string;
  referrals?: ReferralRequest[];
  responses?: SpecialistResponse[];
  isLoading?: boolean;
}

const statusConfig = {
  pending: { color: 'bg-gray-50', border: 'border-l-gray-500', icon: Clock, label: 'Pendiente' },
  sent: { color: 'bg-blue-50', border: 'border-l-blue-500', icon: FileText, label: 'Enviada' },
  received_by_specialist: { color: 'bg-blue-50', border: 'border-l-blue-500', icon: CheckCircle, label: 'Recibida' },
  in_progress: { color: 'bg-amber-50', border: 'border-l-amber-500', icon: Clock, label: 'En Proceso' },
  completed: { color: 'bg-green-50', border: 'border-l-green-500', icon: CheckCircle, label: 'Completada' },
  closed: { color: 'bg-green-50', border: 'border-l-green-500', icon: CheckCircle, label: 'Cerrada' }
};

export const ReferralTrackingViewer: React.FC<Props> = ({
  patientId,
  referrals = [],
  responses = [],
  isLoading = false
}) => {
  const [expandedReferralId, setExpandedReferralId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [filteredReferrals, setFilteredReferrals] = useState<ReferralRequest[]>(referrals);

  useEffect(() => {
    let filtered = referrals;
    if (selectedStatus) {
      filtered = filtered.filter(r => r.status === selectedStatus);
    }
    setFilteredReferrals(filtered);
  }, [referrals, selectedStatus]);

  const getResponse = (referralId: string) => responses.find(r => r.referral_id === referralId);
  const getDaysRemaining = (expectedDate: string) => Math.max(0, Math.ceil((new Date(expectedDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
  
  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === 'pending').length,
    completed: referrals.filter(r => r.status === 'completed').length,
    closed: referrals.filter(r => r.status === 'closed').length
  };

  const completedRate = stats.total > 0 ? ((stats.completed + stats.closed) / stats.total * 100).toFixed(1) : 0;

  const getTimelineSteps = (referral: ReferralRequest) => [
    { label: 'Solicitada', completed: true, date: referral.request_date },
    { label: 'Enviada', completed: ['sent', 'received_by_specialist', 'in_progress', 'completed', 'closed'].includes(referral.status), date: referral.request_date },
    { label: 'Recibida', completed: ['received_by_specialist', 'in_progress', 'completed', 'closed'].includes(referral.status), date: referral.response_received_date },
    { label: 'Procesada', completed: ['in_progress', 'completed', 'closed'].includes(referral.status), date: referral.response_received_date },
    { label: 'Completada', completed: ['completed', 'closed'].includes(referral.status), date: referral.response_received_date }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Seguimiento de Referencias</h2>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">En Proceso</p>
          <p className="text-2xl font-bold text-blue-700">
            {referrals.filter(r => r.status === 'in_progress').length}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Completadas</p>
          <p className="text-2xl font-bold text-green-700">{stats.completed + stats.closed}</p>
          <p className="text-xs text-green-600 mt-1">Tasa: {completedRate}%</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus(null)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            selectedStatus === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Todas ({referrals.length})
        </button>
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              selectedStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Referrals List */}
      <div className="space-y-4">
        {filteredReferrals.map(referral => {
          const config = statusConfig[referral.status];
          const IconComponent = config.icon;
          const response = getResponse(referral.id);
          const daysRemaining = getDaysRemaining(referral.expected_response_date);
          const isOverdue = daysRemaining <= 0 && !['completed', 'closed'].includes(referral.status);
          const timeline = getTimelineSteps(referral);

          return (
            <div
              key={referral.id}
              className={`${config.color} border-l-4 ${config.border} rounded-lg overflow-hidden`}
            >
              <button
                onClick={() => setExpandedReferralId(expandedReferralId === referral.id ? null : referral.id)}
                className="w-full p-4 hover:opacity-90 transition text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <IconComponent className="w-5 h-5 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {referral.referral_type}
                        <span className="text-sm text-gray-600 ml-2">Ref. {referral.referral_number}</span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{referral.specialist_facility}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs rounded font-medium mb-2 ${
                      isOverdue ? 'bg-red-200 text-red-800' :
                      ['completed', 'closed'].includes(referral.status) ? 'bg-green-200 text-green-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {config.label}
                    </span>
                    {!['completed', 'closed'].includes(referral.status) && (
                      <div className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                        {isOverdue ? '⚠️ Vencida' : `${daysRemaining} días restantes`}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  <UserProfile className="w-4 h-4 inline mr-1" />
                  {referral.clinical_indication.substring(0, 100)}...
                </p>

                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Solicitada: {new Date(referral.request_date).toLocaleDateString('es-ES')}</span>
                  <span>Prioridad: <span className="font-semibold">{referral.priority}</span></span>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedReferralId === referral.id && (
                <div className="px-4 pb-4 border-t border-gray-200 bg-white bg-opacity-50">
                  {/* Timeline */}
                  <div className="mt-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Estado del Proceso</h4>
                    <div className="flex justify-between text-center">
                      {timeline.map((step, index) => (
                        <div key={index} className="flex-1">
                          <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold ${
                            step.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {step.completed ? '✓' : index + 1}
                          </div>
                          <p className="text-xs font-medium text-gray-700">{step.label}</p>
                          {step.date && <p className="text-xs text-gray-500">{new Date(step.date).toLocaleDateString('es-ES')}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clinical Information */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Indicación Clínica</p>
                      <p className="text-sm text-gray-600 mt-1">{referral.clinical_indication}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Prioridad y Plazo</p>
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p>Prioridad: <span className="font-medium">{referral.priority}</span></p>
                        <p>Respuesta esperada: {new Date(referral.expected_response_date).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Specialist Response */}
                  {response && (
                    <div className="p-3 bg-green-100 rounded border-l-4 border-green-500 mb-4">
                      <h4 className="font-semibold text-green-900 mb-2">Respuesta del Especialista</h4>
                      <div className="text-sm text-green-800 space-y-2">
                        <div>
                          <span className="font-medium">Hallazgos Clínicos:</span>
                          <p>{response.clinical_findings}</p>
                        </div>
                        <div>
                          <span className="font-medium">Impresión Diagnóstica:</span>
                          <p>{response.diagnostic_impression}</p>
                        </div>
                        <div>
                          <span className="font-medium">Tratamiento Recomendado:</span>
                          <p>{response.recommended_treatment}</p>
                        </div>
                        {response.return_to_origin_recommended && (
                          <div className="p-2 bg-green-50 rounded mt-2">
                            ✓ Retorno al origen recomendado
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Ver Detalles
                    </button>
                    {!response && ['sent', 'received_by_specialist'].includes(referral.status) && (
                      <button className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 rounded text-sm font-medium hover:bg-amber-200">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Seguimiento
                      </button>
                    )}
                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Contactar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredReferrals.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay referencias con este estado</p>
          </div>
        )}
      </div>
    </div>
  );
};

function UserProfile(props: any) {
  return <span {...props}>👤</span>;
}
