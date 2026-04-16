'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Clock, User, MapPin, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const CalendarDashboard = () => {
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  const [metrics] = useState({
    appointmentsToday: 14,
    completedToday: 10,
    noShowsToday: 1,
    totalAppointments: 487,
    scheduledAppointments: 265,
    completedAppointments: 198,
    cancelledAppointments: 24,
  });

  const [appointments] = useState([
    {
      appointment_id: 'APT-001',
      time: '09:00',
      patient: 'Carlos Muñoz',
      provider: 'Dr. Fernando Ruiz',
      type: 'consultation',
      facility: 'Clínica Central',
      status: 'completed',
      chief_complaint: 'Hypertension follow-up',
    },
    {
      appointment_id: 'APT-002',
      time: '10:00',
      patient: 'María García',
      provider: 'Dr. Roberto Silva',
      type: 'checkup',
      facility: 'Clínica Central',
      status: 'completed',
      chief_complaint: 'Annual physical',
    },
    {
      appointment_id: 'APT-003',
      time: '11:00',
      patient: 'Juan López',
      provider: 'Dra. Patricia Molina',
      type: 'procedure',
      facility: 'Surgery Center',
      status: 'in_progress',
      chief_complaint: 'Knee arthroscopy',
    },
    {
      appointment_id: 'APT-004',
      time: '02:00',
      patient: 'Ana Hermano',
      provider: 'Dr. Fernando Ruiz',
      type: 'follow_up',
      facility: 'Clínica Central',
      status: 'scheduled',
      chief_complaint: 'Post-surgery follow-up',
    },
    {
      appointment_id: 'APT-005',
      time: '03:30',
      patient: 'Pedro Sánchez',
      provider: 'Dr. Miguel Herrera',
      type: 'consultation',
      facility: 'Clínica Vega',
      status: 'scheduled',
      chief_complaint: 'Diabetes management',
    },
  ]);

  const [availableSlots] = useState([
    { time: '08:00', available: true },
    { time: '08:30', available: true },
    { time: '09:00', available: false },
    { time: '09:30', available: false },
    { time: '10:00', available: true },
    { time: '10:30', available: true },
    { time: '11:00', available: false },
    { time: '11:30', available: true },
    { time: '02:00', available: true },
    { time: '02:30', available: true },
    { time: '03:00', available: false },
    { time: '03:30', available: true },
    { time: '04:00', available: true },
    { time: '04:30', available: true },
  ]);

  const [todayAppointments] = useState([
    {
      time: '09:00',
      patient: 'Carlos M.',
      type: 'Hypertension',
      provider: 'Dr. Ruiz',
      status: 'completed',
    },
    {
      time: '09:30',
      patient: 'María G.',
      type: 'Physical',
      provider: 'Dr. Silva',
      status: 'completed',
    },
    {
      time: '10:00',
      patient: 'Juan L.',
      type: 'Arthroscopy',
      provider: 'Dra. Molina',
      status: 'in_progress',
    },
    {
      time: '02:00',
      patient: 'Ana H.',
      type: 'Post-op',
      provider: 'Dr. Ruiz',
      status: 'scheduled',
    },
    {
      time: '03:30',
      patient: 'Pedro S.',
      type: 'Diabetes',
      provider: 'Dr. Herrera',
      status: 'scheduled',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const prevLastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0).getDate();

    let startDate = firstDay.getDay();
    let endDate = lastDay.getDate();

    for (let i = startDate - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="p-2 text-center text-gray-400 bg-gray-50 border">
          {prevLastDay - i}
        </div>
      );
    }

    for (let i = 1; i <= endDate; i++) {
      const isToday =
        i === new Date().getDate() &&
        selectedDate.getMonth() === new Date().getMonth() &&
        selectedDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={`current-${i}`}
          className={`p-3 border text-center cursor-pointer hover:bg-blue-50 transition-colors ${
            isToday ? 'border-blue-500 bg-blue-100 font-bold text-blue-900' : ''
          }`}
        >
          <div className="font-semibold">{i}</div>
          <div className="text-xs text-green-600 mt-1">
            {Math.floor(Math.random() * 5)} apts
          </div>
        </div>
      );
    }

    const remainingDays = days.length % 7 > 0 ? 7 - (days.length % 7) : 0;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <div key={`next-${i}`} className="p-2 text-center text-gray-400 bg-gray-50 border">
          {i}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Appointment Calendar</h1>
        <p className="text-slate-600">Unified scheduling, availability management, and reminders</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.appointmentsToday}</div>
            <p className="text-xs text-slate-500 mt-1">Appointments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.completedToday}</div>
            <p className="text-xs text-slate-500 mt-1">Today</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">No-Shows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.noShowsToday}</div>
            <p className="text-xs text-slate-500 mt-1">Today</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.scheduledAppointments}</div>
            <p className="text-xs text-slate-500 mt-1">Upcoming</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{metrics.completedAppointments}</div>
            <p className="text-xs text-slate-500 mt-1">Total</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.cancelledAppointments}</div>
            <p className="text-xs text-slate-500 mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="month" className="w-full bg-white rounded-lg shadow-sm border">
        <TabsList className="w-full justify-start border-b bg-slate-50 p-0 rounded-none">
          <TabsTrigger
            value="month"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            📅 Month View
          </TabsTrigger>
          <TabsTrigger
            value="week"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            📊 Week View
          </TabsTrigger>
          <TabsTrigger
            value="day"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            ⏰ Day View
          </TabsTrigger>
        </TabsList>

        {/* Month View */}
        <TabsContent value="month" className="p-4">
          <div className="space-y-4">
            {/* Calendar navigation */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                >
                  ← Previous
                </Button>
                <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                >
                  Next →
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNewAppointment(true)}>
                  + New Appointment
                </Button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 gap-0 bg-slate-100">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-3 text-center font-semibold text-slate-900 border">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0">{generateCalendarDays()}</div>
            </div>
          </div>
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week" className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Week of Feb 17-23, 2025</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">+ New Appointment</Button>
            </div>

            <div className="grid grid-cols-7 gap-2 bg-white p-4 rounded-lg border">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <div key={day} className="border rounded-lg p-2">
                  <p className="font-semibold text-sm text-slate-900">{day}</p>
                  <p className="text-xs text-slate-500">
                    {17 + idx}
                  </p>
                  <div className="mt-2 space-y-1">
                    {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, i) => (
                      <div key={i} className="bg-blue-100 text-blue-800 text-xs p-1 rounded truncate">
                        {Math.floor(Math.random() * 12) + 8}:00
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Day View */}
        <TabsContent value="day" className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - Today
              </h2>
              <Button className="bg-blue-600 hover:bg-blue-700">+ New Appointment</Button>
            </div>

            {/* Time slots and appointments */}
            <div
              className="bg-white rounded-lg border overflow-y-auto"
              style={{ height: '500px' }}
            >
              <div className="space-y-2 p-4">
                {todayAppointments.map((apt, idx) => (
                  <div
                    key={idx}
                    className={`border-l-4 p-3 rounded ${
                      apt.status === 'completed'
                        ? 'border-l-green-500 bg-green-50'
                        : apt.status === 'in_progress'
                          ? 'border-l-blue-500 bg-blue-50'
                          : 'border-l-gray-500 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">{apt.time}</p>
                        <p className="text-sm font-medium text-slate-700">{apt.patient}</p>
                        <p className="text-xs text-slate-600">{apt.type}</p>
                        <p className="text-xs text-slate-500 mt-1">{apt.provider}</p>
                      </div>
                      <Badge className={getStatusColor(apt.status)}>
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Availability Check */}
      <Card className="mt-6 bg-white">
        <CardHeader>
          <CardTitle>Provider Availability (Feb 21, 2025)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot.time}
                disabled={!slot.available}
                className={`p-3 border rounded text-center transition-colors ${
                  slot.available
                    ? 'border-green-300 bg-green-50 hover:bg-green-100 cursor-pointer'
                    : 'border-red-300 bg-red-50 cursor-not-allowed opacity-50'
                }`}
              >
                <p className="font-semibold text-sm">{slot.time}</p>
                <p className="text-xs mt-1">
                  {slot.available ? '✓ Available' : '✗ Booked'}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="mt-6 bg-white">
        <CardHeader>
          <CardTitle>Today&apos;s Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Time</TableHead>
                <TableHead className="font-semibold">Patient</TableHead>
                <TableHead className="font-semibold">Provider</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.appointment_id} className="border-b hover:bg-slate-50">
                  <TableCell className="font-mono font-semibold">{apt.time}</TableCell>
                  <TableCell className="font-medium">{apt.patient}</TableCell>
                  <TableCell>{apt.provider}</TableCell>
                  <TableCell className="text-sm">{apt.chief_complaint}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(apt.status)} variant="outline">
                      <span className="mr-1">{getStatusIcon(apt.status)}</span>
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
