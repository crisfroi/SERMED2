// @ts-nocheck
// src/components/ASIS_9_Inmunizacion/VaccineStatusTracker.tsx
import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, TrendingUp, Shield, BadgeAlert, Calendar } from 'lucide-react';

interface VaccineRecord {
  vaccine_name: string;
  date_administered: string;
  status: 'completed' | 'pending' | 'overdue' | 'contraindicated';
  batch_lot_number: string;
  provider: string;
  facility: string;
  adverse_events: string[];
  next_dose_date?: string;
  days_until_due?: number;
}

interface VaccineStatusTrackerProps {
  patientId: string;
  patientName?: string;
}

const VACCINE_SCHEDULE_REFERENCE: { [key: string]: { doses: number; schedule: string; interval: string } } = {
  'DTaP': { doses: 5, schedule: '2mo, 4mo, 6mo, 15-18mo, 4-6yr', interval: '4-8 weeks (primary series)' },
  'IPV': { doses: 4, schedule: '2mo, 4mo, 6mo, 12-18mo, 4-6yr', interval: '4 weeks (primary series)' },
  'Hepatitis B': { doses: 3, schedule: '0mo, 1mo, 6mo', interval: '4 weeks then 5 months' },
  'Hepatitis A': { doses: 2, schedule: '12mo, 18mo', interval: '6-12 months apart' },
  'MMR': { doses: 2, schedule: '12-15mo, 4-6yr', interval: '4 weeks minimum' },
  'Varicella': { doses: 2, schedule: '12-15mo, 4-6yr', interval: '4 weeks minimum' },
  'Rotavirus': { doses: 3, schedule: '2mo, 4mo, 6mo', interval: '4-10 weeks' },
  'Influenza': { doses: 2, schedule: 'Annually', interval: 'Annual' },
  'Meningococcal (MenACWY)': { doses: 1, schedule: '11-12yr', interval: 'Single dose' },
};

export const VaccineStatusTracker: React.FC<VaccineStatusTrackerProps> = ({ patientId, patientName }) => {
  const [selectedVaccine, setSelectedVaccine] = useState('DTaP');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'complete'>('all');

  // Mock vaccination records
  const vaccineRecords: VaccineRecord[] = [
    {
      vaccine_name: 'DTaP',
      date_administered: '2024-02-01',
      status: 'completed',
      batch_lot_number: 'LOT-2024-0012345',
      provider: 'Dr. Sarah Johnson',
      facility: 'City Health Center',
      adverse_events: [],
      next_dose_date: '2024-04-01',
      days_until_due: -30
    },
    {
      vaccine_name: 'IPV',
      date_administered: '2024-02-01',
      status: 'completed',
      batch_lot_number: 'LOT-2024-0054321',
      provider: 'Dr. Sarah Johnson',
      facility: 'City Health Center',
      adverse_events: [],
      next_dose_date: '2024-04-01',
      days_until_due: -30
    },
    {
      vaccine_name: 'Hepatitis B',
      date_administered: '2024-02-15',
      status: 'completed',
      batch_lot_number: 'LOT-2024-0009999',
      provider: 'Nurse Patricia',
      facility: 'City Health Center',
      adverse_events: [],
      next_dose_date: '2024-08-15'
    },
    {
      vaccine_name: 'MMR',
      date_administered: '2025-01-20',
      status: 'completed',
      batch_lot_number: 'LOT-2025-0001234',
      provider: 'Dr. Michael Lee',
      facility: 'County Immunization Center',
      adverse_events: ['Low fever (99.5F) resolved in 24 hours'],
      next_dose_date: undefined
    },
    {
      vaccine_name: 'Varicella',
      date_administered: '2025-01-20',
      status: 'completed',
      batch_lot_number: 'LOT-2025-0005678',
      provider: 'Dr. Michael Lee',
      facility: 'County Immunization Center',
      adverse_events: [],
      next_dose_date: undefined
    },
    {
      vaccine_name: 'Rotavirus',
      date_administered: '2025-02-01',
      status: 'overdue',
      batch_lot_number: 'LOT-2025-0002222',
      provider: 'Dr. Sarah Johnson',
      facility: 'City Health Center',
      adverse_events: [],
      next_dose_date: '2025-04-11',
      days_until_due: -15
    },
    {
      vaccine_name: 'PCV13',
      date_administered: '2025-02-15',
      status: 'pending',
      batch_lot_number: 'LOT-2025-0003333',
      provider: 'Dr. James Wilson',
      facility: 'City Health Center',
      adverse_events: [],
      next_dose_date: '2025-06-15',
      days_until_due: 90
    },
    {
      vaccine_name: 'Influenza',
      date_administered: '2024-10-15',
      status: 'pending',
      batch_lot_number: 'LOT-2024-0008888',
      provider: 'Nurse Patricia',
      facility: 'City Health Center',
      adverse_events: [],
      next_dose_date: '2025-10-15',
      days_until_due: 240
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'contraindicated':
        return <BadgeAlert className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'contraindicated':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      default:
        return '';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getCompliancePercentage = () => {
    const completed = vaccineRecords.filter(r => r.status === 'completed').length;
    return Math.round((completed / vaccineRecords.length) * 100);
  };

  const overdueCount = vaccineRecords.filter(r => r.status === 'overdue').length;
  const pendingCount = vaccineRecords.filter(r => r.status === 'pending').length;
  const completedCount = vaccineRecords.filter(r => r.status === 'completed').length;

  const filteredRecords = 
    filterStatus === 'all' ? vaccineRecords :
    filterStatus === 'pending' ? vaccineRecords.filter(r => ['pending', 'overdue'].includes(r.status)) :
    vaccineRecords.filter(r => r.status === 'completed');

  const scheduleInfo = VACCINE_SCHEDULE_REFERENCE[selectedVaccine];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-bold">Vaccine Status Tracker</h2>
      </div>

      {/* Patient Info and Compliance Summary */}
      {patientName && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-semibold">{patientName}</p>
        </div>
      )}

      {/* Compliance Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{completedCount}</p>
          <p className="text-xs text-green-600 mt-1">of {vaccineRecords.length} vaccines</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-600">Pending</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">{pendingCount}</p>
          <p className="text-xs text-blue-600 mt-1">Due within 12 months</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-xs text-gray-600">Overdue</p>
          </div>
          <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
          <p className="text-xs text-red-600 mt-1">Requires immediate attention</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-600">Compliance</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">{getCompliancePercentage()}%</p>
          <p className="text-xs text-purple-600 mt-1">Overall coverage</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'complete'].map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterStatus(filter as any)}
            className={`px-4 py-2 font-medium rounded-lg transition ${
              filterStatus === filter
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter === 'all' ? 'All' : filter === 'pending' ? 'Pending/Overdue' : 'Completed'}
          </button>
        ))}
      </div>

      {/* Vaccine Records Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vaccine</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date Given</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Batch Lot</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Provider</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Facility</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Adverse Events</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Next Due</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                    record.status === 'completed' ? 'bg-green-50' :
                    record.status === 'pending' ? 'bg-blue-50' :
                    record.status === 'overdue' ? 'bg-red-50' :
                    'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.vaccine_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(record.date_administered).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{record.batch_lot_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{record.provider}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{record.facility}</td>
                  <td className="px-4 py-3 text-sm">
                    {record.adverse_events.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-orange-600 text-xs">{record.adverse_events.length} event(s)</span>
                      </div>
                    ) : (
                      <span className="text-green-600 text-xs">✓ None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {record.next_dose_date ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-600">
                          {new Date(record.next_dose_date).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">Series complete</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Reference */}
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Vaccine Schedule Reference</h3>
          <select
            value={selectedVaccine}
            onChange={(e) => setSelectedVaccine(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
          >
            {Object.keys(VACCINE_SCHEDULE_REFERENCE).map((vaccine) => (
              <option key={vaccine} value={vaccine}>{vaccine}</option>
            ))}
          </select>
          
          {scheduleInfo && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Total Doses</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleInfo.doses}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Recommended Schedule</p>
                <p className="text-sm text-gray-700">{scheduleInfo.schedule}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Interval Between Doses</p>
                <p className="text-sm text-gray-700">{scheduleInfo.interval}</p>
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-3">🔔 Important Reminders</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>✓ Keep vaccination records in a safe place</li>
            <li>✓ Bring records to all medical appointments</li>
            <li>✓ Report any serious adverse events to VAERS</li>
            <li>✓ Maintain up-to-date immunizations for travel</li>
            <li>✓ Review catch-up schedules with healthcare provider</li>
            <li>✓ Schedule overdue vaccines immediately</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
