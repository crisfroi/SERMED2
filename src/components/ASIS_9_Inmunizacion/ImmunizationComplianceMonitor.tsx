// @ts-nocheck
// src/components/ASIS_9_Inmunizacion/ImmunizationComplianceMonitor.tsx
import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Users, Zap, MapPin, TrendingUp, AlertTriangle, CheckCircle, Globe, Activity } from 'lucide-react';

interface ComplianceData {
  region: string;
  coverage_percentage: number;
  target_percentage: number;
  population: number;
  trend: 'up' | 'down' | 'stable';
}

interface ImmunizationComplianceMonitorProps {
  regionFilter?: string;
}

export const ImmunizationComplianceMonitor: React.FC<ImmunizationComplianceMonitorProps> = ({ regionFilter }) => {
  const [viewType, setViewType] = useState<'regional' | 'vaccine' | 'demographics'>('regional');
  const [selectedVaccine, setSelectedVaccine] = useState('MMR');

  // Regional compliance data (simulating 10 regions)
  const regionalData: ComplianceData[] = [
    { region: 'North Metro', coverage_percentage: 94, target_percentage: 95, population: 245000, trend: 'up' },
    { region: 'South Metro', coverage_percentage: 92, target_percentage: 95, population: 189000, trend: 'stable' },
    { region: 'East District', coverage_percentage: 87, target_percentage: 95, population: 134000, trend: 'up' },
    { region: 'West District', coverage_percentage: 91, target_percentage: 95, population: 156000, trend: 'down' },
    { region: 'Central City', coverage_percentage: 96, target_percentage: 95, population: 312000, trend: 'stable' },
    { region: 'Rural North', coverage_percentage: 78, target_percentage: 95, population: 87000, trend: 'up' },
    { region: 'Rural South', coverage_percentage: 81, target_percentage: 95, population: 92000, trend: 'up' },
    { region: 'Suburb East', coverage_percentage: 89, target_percentage: 95, population: 167000, trend: 'stable' },
    { region: 'Suburb West', coverage_percentage: 93, target_percentage: 95, population: 178000, trend: 'up' },
    { region: 'Special District', coverage_percentage: 85, target_percentage: 95, population: 54000, trend: 'down' }
  ];

  // Vaccine-specific compliance
  const vaccineCompliance = [
    { name: 'MMR', coverage: 94, herd_immunity_threshold: 95, status: 'near_threshold' },
    { name: 'DTP', coverage: 92, herd_immunity_threshold: 95, status: 'near_threshold' },
    { name: 'Polio', coverage: 96, herd_immunity_threshold: 95, status: 'above_threshold' },
    { name: 'Hepatitis B', coverage: 93, herd_immunity_threshold: 95, status: 'near_threshold' },
    { name: 'Measles', coverage: 95, herd_immunity_threshold: 95, status: 'above_threshold' },
    { name: 'Varicella', coverage: 89, herd_immunity_threshold: 90, status: 'above_threshold' },
    { name: 'Influenza', coverage: 68, herd_immunity_threshold: 40, status: 'above_threshold' },
  ];

  // Compliance trend over 12 months
  const trendData = [
    { month: 'Jan', coverage: 88 },
    { month: 'Feb', coverage: 89 },
    { month: 'Mar', coverage: 90 },
    { month: 'Apr', coverage: 90 },
    { month: 'May', coverage: 91 },
    { month: 'Jun', coverage: 91 },
    { month: 'Jul', coverage: 92 },
    { month: 'Aug', coverage: 92 },
    { month: 'Sep', coverage: 92 },
    { month: 'Oct', coverage: 92 },
    { month: 'Nov', coverage: 93 },
    { month: 'Dec', coverage: 93 }
  ];

  // Age group demographics
  const demographicsData = [
    { age_group: '0-12 months', coverage: 96, population: 32000 },
    { age_group: '1-2 years', coverage: 94, population: 31000 },
    { age_group: '3-5 years', coverage: 92, population: 48000 },
    { age_group: '6-12 years', coverage: 91, population: 95000 },
    { age_group: '13-18 years', coverage: 89, population: 108000 },
    { age_group: '18-30 years', coverage: 85, population: 142000 },
    { age_group: '30-50 years', coverage: 75, population: 198000 },
    { age_group: '>50 years', coverage: 68, population: 245000 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const getStatusColor = (coverage: number, target: number) => {
    if (coverage >= target) return '#10b981'; // Green
    if (coverage >= target - 5) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getStatusBadge = (coverage: number, target: number) => {
    if (coverage >= target) return { text: 'At Goal', color: 'text-green-600 bg-green-50 border-green-200' };
    if (coverage >= target - 5) return { text: 'Near Goal', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { text: 'Below Goal', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const averageCoverage = (regionalData.reduce((sum, r) => sum + r.coverage_percentage, 0) / regionalData.length).toFixed(1);
  const regionsBelowGoal = regionalData.filter(r => r.coverage_percentage < 95).length;
  const herdImmunityCritical = vaccineCompliance.filter(v => v.coverage < v.herd_immunity_threshold).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">Population Immunization Compliance</h2>
      </div>

      {/* High-Level KPI Dashboard */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-600">Average Coverage</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">{averageCoverage}%</p>
          <p className="text-xs text-blue-600 mt-1">Across {regionalData.length} regions</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-600">Regions At Goal</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{regionalData.length - regionsBelowGoal}</p>
          <p className="text-xs text-green-600 mt-1">of {regionalData.length} (95%+)</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-xs text-gray-600">Regions Below Goal</p>
          </div>
          <p className="text-3xl font-bold text-red-600">{regionsBelowGoal}</p>
          <p className="text-xs text-red-600 mt-1">Requires intervention</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-gray-600">Herd Immunity Risk</p>
          </div>
          <p className="text-3xl font-bold text-orange-600">{herdImmunityCritical}</p>
          <p className="text-xs text-orange-600 mt-1">vaccines below threshold</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-600">Total Population</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {(regionalData.reduce((sum, r) => sum + r.population, 0) / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-purple-600 mt-1">Tracked across regions</p>
        </div>
      </div>

      {/* View Type Selector */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['regional', 'vaccine', 'demographics'].map((view) => (
          <button
            key={view}
            onClick={() => setViewType(view as any)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              viewType === view
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {view === 'regional' ? 'By Region' : view === 'vaccine' ? 'By Vaccine' : 'By Age'}
          </button>
        ))}
      </div>

      {/* Regional View */}
      {viewType === 'regional' && (
        <div className="space-y-6">
          {/* Map visualization placeholder */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-4">Regional Coverage Map</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="region" type="category" width={120} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="coverage_percentage" fill="#3b82f6" name="Current Coverage" />
                <Bar dataKey="target_percentage" fill="#10b981" name="Target (95%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Regional Detail Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Region</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Coverage</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Target</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Population</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Trend</th>
                </tr>
              </thead>
              <tbody>
                {regionalData.map((region, idx) => {
                  const status = getStatusBadge(region.coverage_percentage, region.target_percentage);
                  return (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {region.region}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${region.coverage_percentage}%`,
                                backgroundColor: getStatusColor(region.coverage_percentage, region.target_percentage)
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold">{region.coverage_percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{region.target_percentage}%</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{(region.population / 1000).toFixed(0)}K</td>
                      <td className="px-4 py-3 text-sm text-lg">{getTrendIcon(region.trend)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vaccine View */}
      {viewType === 'vaccine' && (
        <div className="space-y-6">
          {/* Herd Immunity Status */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Vaccine-Specific Coverage vs Herd Immunity Threshold</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vaccineCompliance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="coverage" fill="#3b82f6" name="Current Coverage" />
                <Bar dataKey="herd_immunity_threshold" fill="#10b981" name="Herd Immunity Threshold" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 12-Month Trend */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Population Coverage Trend (12 Months)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[60, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="coverage" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                  name="Population Coverage"
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Vaccine Compliance Status */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Herd Immunity Assessment</h3>
            <div className="space-y-2 text-sm">
              <p className="text-yellow-800">
                To maintain population protection, most vaccines require 90-95% coverage. Current status:
              </p>
              <div className="space-y-1">
                {vaccineCompliance.map((vaccine, idx) => (
                  <div key={idx} className="flex justify-between items-center text-yellow-800">
                    <span>{vaccine.name}</span>
                    <span className="font-semibold">
                      {vaccine.coverage}% {vaccine.coverage >= vaccine.herd_immunity_threshold ? '✓' : '⚠️'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demographics View */}
      {viewType === 'demographics' && (
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Coverage by Age Group</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demographicsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age_group" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="coverage" fill="#3b82f6" name="Coverage %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Age Group Details */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Age Group</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Coverage %</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Population</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {demographicsData.map((group, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{group.age_group}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${group.coverage}%` }}
                          />
                        </div>
                        <span className="font-bold text-sm">{group.coverage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <Users className="w-4 h-4 inline mr-1" />
                      {(group.population / 1000).toFixed(0)}K
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {group.coverage >= 90 ? (
                        <span className="text-green-600 font-medium">✓ Good</span>
                      ) : (
                        <span className="text-orange-600 font-medium">⚠️ Monitor</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
