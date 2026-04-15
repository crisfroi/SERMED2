// @ts-nocheck
// src/components/ASIS_7_Cirugia/PostSurgeryRecoveryTracker.tsx
import React, { useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Droplet, Activity, Heart, FileText } from 'lucide-react';

interface FollowupRecord {
  followup_number: number;
  followup_date: string;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  wound_condition: 'healing_well' | 'minor_issues' | 'infection_signs' | 'dehiscence' | 'seroma';
  pain_level: number;
  mobility_level: 'bed_rest' | 'limited' | 'partial' | 'full';
  medications_compliance: 'excellent' | 'good' | 'fair' | 'poor';
  drain_status: 'in_place' | 'removed' | 'na';
  drain_output_ml?: number;
  suture_removal_date?: string;
}

interface PostSurgeryRecoveryTrackerProps {
  surgeryBookingId: string;
  surgeryDate: string;
  initialFollowups?: FollowupRecord[];
  onUpdated?: (followups: FollowupRecord[]) => void;
}

export const PostSurgeryRecoveryTracker: React.FC<PostSurgeryRecoveryTrackerProps> = ({
  surgeryBookingId,
  surgeryDate,
  initialFollowups = [],
  onUpdated
}) => {
  const [followups, setFollowups] = useState<FollowupRecord[]>(initialFollowups);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'scheduled' | 'completed' | 'missed'>('all');

  const calculateDaysSinceSurgery = (followupDate: string) => {
    const surgery = new Date(surgeryDate);
    const followup = new Date(followupDate);
    return Math.floor((followup.getTime() - surgery.getTime()) / (1000 * 60 * 60 * 24));
  };

  const woundColors = {
    healing_well: { bg: 'bg-green-50', border: 'border-green-300', icon: '✓' },
    minor_issues: { bg: 'bg-yellow-50', border: 'border-yellow-300', icon: '⚠' },
    infection_signs: { bg: 'bg-red-50', border: 'border-red-300', icon: '!' },
    dehiscence: { bg: 'bg-red-100', border: 'border-red-400', icon: '!' },
    seroma: { bg: 'bg-orange-50', border: 'border-orange-300', icon: '⚠' }
  };

  const mobilityIcons = {
    bed_rest: '🛏️',
    limited: '👣',
    partial: '🚶',
    full: '💪'
  };

  const complianceColors = {
    excellent: 'text-green-600 bg-green-50',
    good: 'text-blue-600 bg-blue-50',
    fair: 'text-yellow-600 bg-yellow-50',
    poor: 'text-red-600 bg-red-50'
  };

  const filteredFollowups = followups.filter(f =>
    selectedStatus === 'all' || f.status === selectedStatus
  );

  const stats = {
    total: followups.length,
    completed: followups.filter(f => f.status === 'completed').length,
    scheduled: followups.filter(f => f.status === 'scheduled').length,
    missed: followups.filter(f => f.status === 'missed').length
  };

  const averagePain = followups.length > 0
    ? (followups.reduce((sum, f) => sum + f.pain_level, 0) / followups.length).toFixed(1)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-green-500" />
        <h2 className="text-xl font-bold">Post-Operative Recovery</h2>
      </div>

      {/* Recovery Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-gray-600 mb-1">Total Followups</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs text-gray-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-xs text-gray-600 mb-1">Average Pain</p>
          <p className="text-2xl font-bold text-yellow-600">{averagePain}/10</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-gray-600 mb-1">Scheduled</p>
          <p className="text-2xl font-bold text-purple-600">{stats.scheduled}</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'completed', 'scheduled', 'missed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedStatus === status
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && ` (${stats[status]})`}
          </button>
        ))}
      </div>

      {/* Followup Records */}
      <div className="space-y-3">
        {filteredFollowups.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No followup records</p>
        ) : (
          filteredFollowups.map((followup, index) => (
            <div
              key={index}
              className={`rounded-lg border-2 p-4 cursor-pointer transition ${
                followup.status === 'completed'
                  ? 'bg-green-50 border-green-300'
                  : followup.status === 'scheduled'
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-300'
              }`}
              onClick={() => setExpandedId(expandedId === index ? null : index)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    Followup #{followup.followup_number}
                    <span className="text-xs text-gray-600 ml-2">
                      {calculateDaysSinceSurgery(followup.followup_date)} days post-op
                    </span>
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">{followup.followup_date}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    followup.status === 'completed'
                      ? 'bg-green-200 text-green-800'
                      : followup.status === 'scheduled'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {followup.status}
                  </span>
                </div>
              </div>

              {/* Summary Row */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className={`${woundColors[followup.wound_condition].bg} border ${woundColors[followup.wound_condition].border} rounded p-2`}>
                  <span className="font-medium">Wound: {woundColors[followup.wound_condition].icon}</span>
                  <p className="text-xs mt-1 capitalize">{followup.wound_condition.replace(/_/g, ' ')}</p>
                </div>

                <div className="bg-orange-50 border border-orange-300 rounded p-2">
                  <span className="font-medium">💊 Pain</span>
                  <p className="text-lg font-bold">{followup.pain_level}/10</p>
                </div>

                <div className="bg-blue-50 border border-blue-300 rounded p-2">
                  <span className="font-medium">Mobility</span>
                  <p className="text-lg">{mobilityIcons[followup.mobility_level]}</p>
                </div>

                <div className={`${complianceColors[followup.medications_compliance]} rounded p-2`}>
                  <span className="font-medium">Meds</span>
                  <p className="capitalize text-xs mt-1">{followup.medications_compliance}</p>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === index && (
                <div className="mt-4 pt-4 border-t border-gray-300 space-y-3">
                  {/* Wound Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded p-3 border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Droplet className="w-3 h-3" /> Drain Status
                      </p>
                      <p className="text-sm capitalize">{followup.drain_status}</p>
                      {followup.drain_output_ml && (
                        <p className="text-xs text-gray-600 mt-1">Output: {followup.drain_output_ml} ml</p>
                      )}
                    </div>

                    <div className="bg-white rounded p-3 border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Suture Removal</p>
                      <p className="text-sm">
                        {followup.suture_removal_date ? new Date(followup.suture_removal_date).toLocaleDateString() : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Clinical Summary */}
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Clinical Notes
                    </p>
                    <div className="text-xs text-gray-700 space-y-1">
                      <p><strong>Mobility:</strong> {followup.mobility_level.replace(/_/g, ' ')}</p>
                      <p><strong>Medications:</strong> {followup.medications_compliance}</p>
                      <p><strong>Days Post-Op:</strong> {calculateDaysSinceSurgery(followup.followup_date)}</p>
                    </div>
                  </div>

                  {/* Recovery Status Indicator */}
                  {followup.wound_condition === 'healing_well' && followup.pain_level <= 4 && followup.mobility_level === 'full' && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-700 font-medium">Excellent recovery progress</p>
                    </div>
                  )}

                  {(followup.wound_condition === 'infection_signs' || followup.wound_condition === 'dehiscence') && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 rounded">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-700 font-medium">⚠️ Wound complications detected - ensure close monitoring</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Recovery Timeline Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 mb-1">Expected Recovery Timeline</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Week 1-2: Pain management, limited mobility, drain monitoring</li>
              <li>• Week 2-4: Increased mobility, suture removal, pain reducing</li>
              <li>• Week 4-6: Return to light activities, full wound healing</li>
              <li>• Week 6-12: Gradual return to normal activities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
