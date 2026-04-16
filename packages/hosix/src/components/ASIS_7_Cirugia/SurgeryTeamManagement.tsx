// src/components/ASIS_7_Cirugia/SurgeryTeamManagement.tsx
import React, { useState } from 'react';
import { Users, Plus, Trash2, Clock, Award, AlertCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  role: 'lead_surgeon' | 'assistant_surgeon' | 'anesthesiologist' | 'scrub_nurse' | 'circulating_nurse' | 'surgical_tech';
  name: string;
  specialization: string;
  years_experience: number;
  certification_status: 'valid' | 'expired' | 'pending' | 'suspended';
  license_number: string;
  arrival_time?: string;
  departure_time?: string;
}

interface SurgeryTeamManagementProps {
  surgeryBookingId: string;
  initialTeam?: TeamMember[];
  onSave?: (team: TeamMember[]) => void;
}

export const SurgeryTeamManagement: React.FC<SurgeryTeamManagementProps> = ({
  surgeryBookingId,
  initialTeam = [],
  onSave
}) => {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [selectedRole, setSelectedRole] = useState<TeamMember['role']>('lead_surgeon');
  const [newMember, setNewMember] = useState({ name: '', specialization: '', experience: 0, license: '' });

  const roleColors = {
    lead_surgeon: 'bg-red-50 border-red-300',
    assistant_surgeon: 'bg-orange-50 border-orange-300',
    anesthesiologist: 'bg-blue-50 border-blue-300',
    scrub_nurse: 'bg-green-50 border-green-300',
    circulating_nurse: 'bg-purple-50 border-purple-300',
    surgical_tech: 'bg-yellow-50 border-yellow-300'
  };

  const certificationColors = {
    valid: 'text-green-600 bg-green-50',
    expired: 'text-red-600 bg-red-50',
    pending: 'text-yellow-600 bg-yellow-50',
    suspended: 'text-red-600 bg-red-100'
  };

  const addTeamMember = () => {
    if (newMember.name && newMember.license) {
      const member: TeamMember = {
        id: `${Date.now()}`,
        role: selectedRole,
        name: newMember.name,
        specialization: newMember.specialization,
        years_experience: newMember.experience,
        certification_status: 'valid',
        license_number: newMember.license
      };
      setTeam([...team, member]);
      setNewMember({ name: '', specialization: '', experience: 0, license: '' });
    }
  };

  const removeMember = (id: string) => {
    setTeam(team.filter(m => m.id !== id));
  };

  const updateMemberTime = (id: string, field: 'arrival_time' | 'departure_time', value: string) => {
    setTeam(team.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const requiredRoles = ['lead_surgeon', 'anesthesiologist', 'scrub_nurse'];
  const missingRoles = requiredRoles.filter(r => !team.some(m => m.role === r));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-bold">Surgical Team</h2>
        <span className="ml-auto text-sm text-gray-600">{team.length} members</span>
      </div>

      {/* Missing Required Roles Alert */}
      {missingRoles.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Missing Required Team Members:</p>
            <p className="text-sm text-yellow-800">{missingRoles.join(', ')}</p>
          </div>
        </div>
      )}

      {/* Add New Member Form */}
      <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Team Member
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as TeamMember['role'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="lead_surgeon">Lead Surgeon</option>
              <option value="assistant_surgeon">Assistant Surgeon</option>
              <option value="anesthesiologist">Anesthesiologist</option>
              <option value="scrub_nurse">Scrub Nurse</option>
              <option value="circulating_nurse">Circulating Nurse</option>
              <option value="surgical_tech">Surgical Technician</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
            <input
              type="text"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="Full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">License Number</label>
            <input
              type="text"
              value={newMember.license}
              onChange={(e) => setNewMember({ ...newMember, license: e.target.value })}
              placeholder="License #"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Specialization</label>
            <input
              type="text"
              value={newMember.specialization}
              onChange={(e) => setNewMember({ ...newMember, specialization: e.target.value })}
              placeholder="e.g., Cardiac Surgery"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Years of Experience</label>
            <input
              type="number"
              value={newMember.experience}
              onChange={(e) => setNewMember({ ...newMember, experience: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              min="0"
              max="60"
            />
          </div>
        </div>

        <button
          onClick={addTeamMember}
          disabled={!newMember.name || !newMember.license}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 rounded-lg text-sm font-medium transition"
        >
          Add to Team
        </button>
      </div>

      {/* Team Members List */}
      <div className="space-y-3">
        {team.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No team members assigned yet</p>
        ) : (
          team.map((member) => (
            <div
              key={member.id}
              className={`border-2 rounded-lg p-4 ${roleColors[member.role]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${certificationColors[member.certification_status]}`}>
                      {member.certification_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 capitalize">{member.role.replace(/_/g, ' ')}</p>
                </div>
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-red-600 hover:text-red-700 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div className="flex items-center gap-1 text-gray-700">
                  <Award className="w-4 h-4 text-gray-600" />
                  <span>{member.specialization || 'General'}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span>{member.years_experience} years experience</span>
                </div>
              </div>

              {/* License and Timing Info */}
              <div className="bg-white bg-opacity-50 rounded p-2 mb-3 text-xs text-gray-700">
                <p>License: <span className="font-mono">{member.license_number}</span></p>
              </div>

              {/* Arrival/Departure Times */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Arrival</label>
                  <input
                    type="time"
                    value={member.arrival_time || ''}
                    onChange={(e) => updateMemberTime(member.id, 'arrival_time', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Departure</label>
                  <input
                    type="time"
                    value={member.departure_time || ''}
                    onChange={(e) => updateMemberTime(member.id, 'departure_time', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save Button */}
      {team.length > 0 && (
        <button
          onClick={() => onSave?.(team)}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition"
        >
          Save Surgical Team
        </button>
      )}
    </div>
  );
};
