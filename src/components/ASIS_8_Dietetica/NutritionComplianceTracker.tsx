// @ts-nocheck
// src/components/ASIS_8_Dietetica/NutritionComplianceTracker.tsx
import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Target, Calendar, TrendingUp, AlertCircle, CheckCircle2, Award, Minus } from 'lucide-react';

interface ComplianceData {
  date: string;
  adherence_percentage: number;
  calories_target: number;
  calories_actual: number;
  weight_kg: number;
}

interface NutritionComplianceTrackerProps {
  patientId: string;
}

export const NutritionComplianceTracker: React.FC<NutritionComplianceTrackerProps> = ({ patientId }) => {
  const [timeframe, setTimeframe] = useState<'1week' | '4weeks' | '12weeks'>('4weeks');
  const [metricView, setMetricView] = useState<'adherence' | 'weight' | 'trends'>('adherence');

  // Mock 4-week compliance data
  const complianceHistory: ComplianceData[] = [
    { date: 'Week 1', adherence_percentage: 78, calories_target: 2000, calories_actual: 1850, weight_kg: 82.5 },
    { date: 'Week 2', adherence_percentage: 82, calories_target: 2000, calories_actual: 1920, weight_kg: 81.8 },
    { date: 'Week 3', adherence_percentage: 88, calories_target: 2000, calories_actual: 1980, weight_kg: 81.2 },
    { date: 'Week 4', adherence_percentage: 91, calories_target: 2000, calories_actual: 2010, weight_kg: 80.5 }
  ];

  const recentWeekData = [
    { day: 'Mon', adherence: 85, targetMet: true },
    { day: 'Tue', adherence: 92, targetMet: true },
    { day: 'Wed', adherence: 78, targetMet: false },
    { day: 'Thu', adherence: 88, targetMet: true },
    { day: 'Fri', adherence: 95, targetMet: true },
    { day: 'Sat', adherence: 82, targetMet: true },
    { day: 'Sun', adherence: 89, targetMet: true }
  ];

  const complianceMetrics = {
    overall_adherence: 87,
    target_days_met: 6,
    total_days: 7,
    compliance_trend: 'improving', // improving, stable, declining
    weight_change: -2.0, // kg
    goal_on_track: true,
    estimated_goal_date: '2026-05-15'
  };

  const recommendations = [
    {
      category: 'Meal Timing',
      status: 'good',
      advice: 'You\'re doing great with consistent meal times. Keep it up!'
    },
    {
      category: 'Protein Intake',
      status: 'needs_attention',
      advice: 'Protein intake averaging 15% below target. Consider adding protein-rich snacks.'
    },
    {
      category: 'Hydration',
      status: 'good',
      advice: 'Water intake is excellent. Maintaining hydration helps metabolism and appetite control.'
    },
    {
      category: 'Portion Control',
      status: 'improvement',
      advice: 'Portion sizes improving. Consistent tracking is key to long-term success.'
    },
    {
      category: 'Caloric Balance',
      status: 'good',
      advice: 'Caloric intake within 5% of target 4 out of 7 days. Excellent work!'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-50 border-green-200';
      case 'needs_attention':
        return 'bg-orange-50 border-orange-200';
      case 'improvement':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'needs_attention':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'improvement':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const trendIcon = complianceMetrics.compliance_trend === 'improving' ? '📈' : '➡️';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-bold">Nutrition Compliance Tracker</h2>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-600">Overall Adherence</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">{complianceMetrics.overall_adherence}%</p>
          <p className="text-xs text-purple-600 mt-1">📊 {trendIcon}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-600">Week Targets Met</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{complianceMetrics.target_days_met}/{complianceMetrics.total_days}</p>
          <p className="text-xs text-green-600 mt-1">{Math.round((complianceMetrics.target_days_met/complianceMetrics.total_days)*100)}% success</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-600">Weight Change</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">{complianceMetrics.weight_change.toFixed(1)} kg</p>
          <p className="text-xs text-blue-600 mt-1">📉 Progress made</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-gray-600">Goal Status</p>
          </div>
          <p className="text-sm font-bold text-orange-600">ON TRACK</p>
          <p className="text-xs text-orange-600 mt-1">Est: {complianceMetrics.estimated_goal_date}</p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <p className="text-xs text-gray-600">Active Plan</p>
          </div>
          <p className="text-2xl font-bold text-indigo-600">4 wks</p>
          <p className="text-xs text-indigo-600 mt-1">Since start</p>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['1week', '4weeks', '12weeks'].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf as any)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              timeframe === tf
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tf === '1week' ? '1 Week' : tf === '4weeks' ? '4 Weeks' : '12 Weeks'}
          </button>
        ))}
      </div>

      {/* Chart View Selector */}
      <div className="flex gap-2 mb-6">
        {['adherence', 'weight', 'trends'].map((view) => (
          <button
            key={view}
            onClick={() => setMetricView(view as any)}
            className={`px-3 py-1 text-sm font-medium rounded-full transition ${
              metricView === view
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {view === 'adherence' ? 'Adherence' : view === 'weight' ? 'Weight' : 'Trends'}
          </button>
        ))}
      </div>

      {/* Charts */}
      {metricView === 'adherence' && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Weekly Adherence Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recentWeekData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                formatter={(value: any) => [`${value}%`, 'Adherence']}
              />
              <Bar 
                dataKey="adherence" 
                fill="#a855f7" 
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {metricView === 'weight' && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Weight Progress (4 Weeks)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={complianceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[78, 84]} />
              <Tooltip formatter={(value: any) => `${value} kg`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="weight_kg" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                isAnimationActive={true}
                name="Weight (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {metricView === 'trends' && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Adherence Trend (4 Weeks)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={complianceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="adherence_percentage"
                fill="#a855f7"
                stroke="#9333ea"
                strokeWidth={2}
                name="Adherence %"
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Personalized Recommendations
        </h3>

        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div key={idx} className={`border rounded-lg p-3 flex gap-3 ${getStatusColor(rec.status)}`}>
              {getStatusIcon(rec.status)}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{rec.category}</p>
                <p className="text-sm text-gray-600 mt-1">{rec.advice}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3">Next Steps</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2 text-blue-700">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Continue current meal plan for next 4 weeks
          </li>
          <li className="flex items-center gap-2 text-blue-700">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Schedule check-in with dietitian on {new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}
          </li>
          <li className="flex items-center gap-2 text-blue-700">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Focus on increasing protein intake by 10g per day
          </li>
          <li className="flex items-center gap-2 text-blue-700">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Re-assess dietary restrictions and preferences
          </li>
        </ul>
      </div>
    </div>
  );
};
