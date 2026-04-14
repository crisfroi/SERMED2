// WEEK 11 ADMIN 1: Scheduling Board Component
// Component: SchedulingBoard
// Purpose: Manage staff shifts and schedules
// Note: Attendance tracking (PENDIENTE for Phase 2)

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Schedule {
  id: string;
  staff_name: string;
  date: string;
  shift_type: string;
  shift_start: string;
  shift_end: string;
  shift_hours: number;
  is_confirmed: boolean;
  department: string;
}

export const SchedulingBoard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const queryClient = useQueryClient();

  // Fetch schedules
  const { data: schedules, isLoading } = useQuery<Schedule[]>({
    queryKey: ['schedules', currentDate.toISOString().slice(0, 7)],
    queryFn: async () => {
      const yearMonth = currentDate.toISOString().slice(0, 7);
      const response = await fetch(
        `/api/v1/hr/schedules?year_month=${yearMonth}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json();
    },
    staleTime: 3 * 60 * 1000,
  });

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add previous month's days
    const startingDayOfWeek = firstDay.getDay();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - (i + 1));
      days.push(date);
    }

    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add next month's days
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let i = days.length; i < totalCells; i++) {
      const date = new Date(lastDay);
      date.setDate(lastDay.getDate() + (i - lastDay.getDate() + 1));
      days.push(date);
    }

    return days;
  };

  const days = viewType === 'week' ? getWeekDays() : getMonthDays();

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return (schedules || []).filter((s) => s.date === dateStr);
  };

  const shiftColors = {
    morning: 'bg-yellow-50 border-yellow-200',
    afternoon: 'bg-blue-50 border-blue-200',
    night: 'bg-indigo-50 border-indigo-200',
    'on-call': 'bg-purple-50 border-purple-200',
  };

  const shiftIconBg = {
    morning: 'bg-yellow-100 text-yellow-600',
    afternoon: 'bg-blue-100 text-blue-600',
    night: 'bg-indigo-100 text-indigo-600',
    'on-call': 'bg-purple-100 text-purple-600',
  };

  const prevPeriod = () => {
    if (viewType === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    }
  };

  const nextPeriod = () => {
    if (viewType === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Programación de Turnos</h1>
            <p className="text-gray-600 mt-1">Gestione los turnos del personal</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            <Plus size={20} />
            Nuevo Turno
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={prevPeriod}
              className="p-2 hover:bg-gray-100 rounded transition"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 min-w-48 text-center">
              {viewType === 'week'
                ? `${days[0].toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                  })} - ${days[6].toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                  })}`
                : currentDate.toLocaleDateString('es-ES', {
                    month: 'long',
                    year: 'numeric',
                  })}
            </h2>
            <button
              onClick={nextPeriod}
              className="p-2 hover:bg-gray-100 rounded transition"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewType('week')}
              className={`px-4 py-2 rounded transition ${
                viewType === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewType('month')}
              className={`px-4 py-2 rounded transition ${
                viewType === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Mes
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
            {viewType === 'week'
              ? days.map((date) => (
                  <div key={date.toString()} className="p-4 text-center border-r border-gray-200">
                    <p className="font-semibold text-gray-900">
                      {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {date.getDate()}
                    </p>
                  </div>
                ))
              : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'].map((day) => (
                  <div key={day} className="p-3 text-center border-r border-gray-200 font-semibold">
                    {day}
                  </div>
                ))}
          </div>

          {/* Calendar Cells */}
          <div className={`grid gap-0 ${viewType === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
            {days.map((date, idx) => {
              const daySchedules = getSchedulesForDate(date);
              const isCurrentMonth =
                viewType === 'month' &&
                date.getMonth() !== currentDate.getMonth();

              return (
                <div
                  key={idx}
                  className={`min-h-32 p-3 border-r border-b border-gray-200 ${
                    isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  {viewType === 'month' && (
                    <p className={`text-sm font-semibold mb-2 ${isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </p>
                  )}

                  <div className="space-y-1">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`text-xs p-2 rounded border-l-4 border-gray-300 ${
                          shiftColors[schedule.shift_type as keyof typeof shiftColors] ||
                          'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            shiftIconBg[schedule.shift_type as keyof typeof shiftIconBg]
                          }`}>
                            {schedule.shift_type.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-medium">{schedule.staff_name}</span>
                        </div>
                        <p className="text-gray-600 mt-1">
                          {schedule.shift_start} - {schedule.shift_end}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shift Legend & Notes */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Leyenda de Turnos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="text-yellow-600" size={20} />
              <span className="text-sm text-gray-700">Mañana</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-blue-600" size={20} />
              <span className="text-sm text-gray-700">Tarde</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-indigo-600" size={20} />
              <span className="text-sm text-gray-700">Noche</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-purple-600" size={20} />
              <span className="text-sm text-gray-700">On-Call</span>
            </div>
          </div>

          {/* Attendance Note */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="font-medium text-blue-900">Control de Asistencia - PENDIENTE</p>
                <p className="text-sm text-blue-700 mt-1">
                  El sistema de registro de asistencia (check-in/check-out) estará disponible en la siguiente fase.
                  Por ahora, los turnos se confirman manualmente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulingBoard;
