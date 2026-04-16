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
import { AlertCircle, CheckCircle, Zap, Link, AlertTriangle, Clock } from 'lucide-react';

export const FederationDashboard = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'facilities' | 'conflicts' | 'audit'>('overview');

  const [metrics] = useState({
    total_facilities: 12,
    active_facilities: 10,
    pending_facilities: 2,
    total_syncs: 487,
    completed_syncs: 475,
    failed_syncs: 12,
    total_conflicts: 8,
    unresolved_conflicts: 3,
    resolved_conflicts: 5,
  });

  const [facilities] = useState([
    {
      facility_id: 'FAC-001',
      facility_name: 'Clínica Central',
      facility_code: 'CC-001',
      status: 'active',
      last_sync: '2025-02-21 14:32:15',
      sync_frequency: 24,
      data_access: 'read_write',
      patients_synced: 1245,
      active_syncs: 3,
    },
    {
      facility_id: 'FAC-002',
      facility_name: 'Hospital Metropolitano',
      facility_code: 'HM-001',
      status: 'active',
      last_sync: '2025-02-21 13:15:42',
      sync_frequency: 12,
      data_access: 'read_only',
      patients_synced: 2341,
      active_syncs: 5,
    },
    {
      facility_id: 'FAC-003',
      facility_name: 'Clínica Vega',
      facility_code: 'CV-001',
      status: 'active',
      last_sync: '2025-02-21 12:45:30',
      sync_frequency: 24,
      data_access: 'read_write',
      patients_synced: 867,
      active_syncs: 2,
    },
    {
      facility_id: 'FAC-004',
      facility_name: 'Surgery Center North',
      facility_code: 'SCN-001',
      status: 'pending',
      last_sync: 'Never',
      sync_frequency: 0,
      data_access: 'pending',
      patients_synced: 0,
      active_syncs: 0,
    },
    {
      facility_id: 'FAC-005',
      facility_name: 'Emergency Response Unit',
      facility_code: 'ERU-001',
      status: 'active',
      last_sync: '2025-02-21 14:55:08',
      sync_frequency: 1,
      data_access: 'read_write',
      patients_synced: 3456,
      active_syncs: 12,
    },
  ]);

  const [dataConflicts] = useState([
    {
      conflict_id: 'CONF-001',
      patient_id: 'PAT-12345',
      patient_name: 'Carlos Muñoz',
      data_type: 'vital_signs',
      source: 'Clínica Central',
      target: 'Hospital Metropolitano',
      source_value: 'BP: 140/90',
      target_value: 'BP: 138/88',
      created: '2025-02-21 14:20:00',
      status: 'unresolved',
    },
    {
      conflict_id: 'CONF-002',
      patient_id: 'PAT-67890',
      patient_name: 'María García',
      data_type: 'medication',
      source: 'Hospital Metropolitano',
      target: 'Clínica Vega',
      source_value: 'Metformin 500mg',
      target_value: 'Metformin 1000mg',
      created: '2025-02-21 13:45:00',
      status: 'unresolved',
    },
    {
      conflict_id: 'CONF-003',
      patient_id: 'PAT-11111',
      patient_name: 'Juan López',
      data_type: 'diagnosis',
      source: 'Clínica Central',
      target: 'Emergency Response Unit',
      source_value: 'Hypertension (I10)',
      target_value: 'Essential Hypertension',
      created: '2025-02-21 12:30:00',
      status: 'resolved',
    },
  ]);

  const [auditEvents] = useState([
    {
      audit_id: 'AUD-001',
      event_type: 'patient_sync',
      timestamp: '2025-02-21 14:55:08',
      source: 'Clínica Central',
      target: 'Hospital Metropolitano',
      action: 'Patient data synced: vital_signs, medications',
      status: 'success',
      details: '1245 records synced',
    },
    {
      audit_id: 'AUD-002',
      event_type: 'conflict_resolution',
      timestamp: '2025-02-21 14:32:15',
      source: 'System',
      target: '-',
      action: 'Conflict resolved: CONF-003 using source value',
      status: 'success',
      details: 'Auto-resolved based on timestamp',
    },
    {
      audit_id: 'AUD-003',
      event_type: 'policy_sync',
      timestamp: '2025-02-21 14:15:00',
      source: 'Clínica Central',
      target: 'All Active Facilities',
      action: 'RLS policies synced: 12 policies updated',
      status: 'success',
      details: 'Access control policies synchronized',
    },
    {
      audit_id: 'AUD-004',
      event_type: 'facility_connection',
      timestamp: '2025-02-21 13:20:00',
      source: 'System Administrator',
      target: 'Surgery Center North',
      action: 'New facility registered: Surgery Center North (FAC-004)',
      status: 'success',
      details: 'Pending activation',
    },
    {
      audit_id: 'AUD-005',
      event_type: 'data_access',
      timestamp: '2025-02-21 13:10:45',
      source: 'Hospital Metropolitano',
      target: 'Clínica Vega',
      action: 'Accessed patient record: PAT-67890',
      status: 'success',
      details: 'Read access authorized',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'unresolved':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Federation Manager</h1>
        <p className="text-slate-600">Multi-facility data synchronization, conflict resolution, and audit trails</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.active_facilities}/{metrics.total_facilities}
            </div>
            <p className="text-xs text-slate-500 mt-1">Connected</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Syncs (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.completed_syncs}</div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.failed_syncs} failed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Conflicts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.unresolved_conflicts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Unresolved</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.pending_facilities}
            </div>
            <p className="text-xs text-slate-500 mt-1">Facilities</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Sync Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {Math.round(
                (metrics.completed_syncs / metrics.total_syncs) * 100
              )}%
            </div>
            <p className="text-xs text-slate-500 mt-1">Rate</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">RLS Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">12</div>
            <p className="text-xs text-slate-500 mt-1">Synchronized</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full bg-white rounded-lg shadow-sm border">
        <TabsList className="w-full justify-start border-b bg-slate-50 p-0 rounded-none">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            📊 Overview
          </TabsTrigger>
          <TabsTrigger
            value="facilities"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            🏥 Facilities
          </TabsTrigger>
          <TabsTrigger
            value="conflicts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            ⚠️ Conflicts
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            📋 Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Sync Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">24-Hour Sync Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Completed</span>
                    <span className="text-2xl font-bold text-green-600">
                      {metrics.completed_syncs}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm font-medium">Failed</span>
                    <span className="text-2xl font-bold text-red-600">
                      {metrics.failed_syncs}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-2">
                    Success Rate:{' '}
                    {Math.round(
                      (metrics.completed_syncs /
                        (metrics.completed_syncs + metrics.failed_syncs)) *
                        100
                    )}
                    %
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conflict Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conflict Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm font-medium">Unresolved</span>
                    <span className="text-2xl font-bold text-red-600">
                      {metrics.unresolved_conflicts}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Resolved</span>
                    <span className="text-2xl font-bold text-green-600">
                      {metrics.resolved_conflicts}
                    </span>
                  </div>
                  <Button className="w-full mt-2 bg-red-600 hover:bg-red-700 text-xs">
                    Resolve Conflicts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Federation Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Federation Health Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">Network Connectivity</span>
                  <Badge className="bg-green-100 text-green-800">✓ Healthy</Badge>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">Data Integrity</span>
                  <Badge className="bg-green-100 text-green-800">✓ Healthy</Badge>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">Sync Queue</span>
                  <Badge className="bg-yellow-100 text-yellow-800">⚠ 12 pending</Badge>
                </div>
                <div className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">RLS Policy Sync</span>
                  <Badge className="bg-green-100 text-green-800">✓ Current</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facilities Tab */}
        <TabsContent value="facilities" className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Federated Facilities</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">+ Add Facility</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Facility</TableHead>
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Last Sync</TableHead>
                  <TableHead className="font-semibold">Access Level</TableHead>
                  <TableHead className="font-semibold">Patients</TableHead>
                  <TableHead className="font-semibold">Active</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities.map((fac) => (
                  <TableRow key={fac.facility_id} className="border-b hover:bg-slate-50">
                    <TableCell className="font-medium">{fac.facility_name}</TableCell>
                    <TableCell className="text-sm font-mono">{fac.facility_code}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(fac.status)}>
                        <span className="mr-1">{getStatusIcon(fac.status)}</span>
                        {fac.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{fac.last_sync}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">{fac.data_access}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {fac.patients_synced}
                    </TableCell>
                    <TableCell className="text-sm">{fac.active_syncs}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="p-4">
          <div className="space-y-4">
            {dataConflicts.map((conflict) => (
              <Card
                key={conflict.conflict_id}
                className={
                  conflict.status === 'unresolved'
                    ? 'border-l-4 border-l-red-500'
                    : 'border-l-4 border-l-green-500'
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {conflict.conflict_id} - Patient: {conflict.patient_name}
                      </CardTitle>
                      <p className="text-xs text-slate-600 mt-1">
                        {conflict.source} ↔ {conflict.target}
                      </p>
                    </div>
                    <Badge
                      className={
                        conflict.status === 'unresolved'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {conflict.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-xs text-slate-600 mb-1">Source Value:</p>
                      <p className="font-mono text-xs">{conflict.source_value}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-xs text-slate-600 mb-1">Target Value:</p>
                      <p className="font-mono text-xs">{conflict.target_value}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{conflict.created}</p>
                  {conflict.status === 'unresolved' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Use Source
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Use Target
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Merge
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="p-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditEvents.map((event) => (
              <div
                key={event.audit_id}
                className="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(event.status)}
                    <span className="text-xs font-mono text-slate-600">
                      {event.audit_id}
                    </span>
                    <Badge className="bg-slate-200 text-slate-900 text-xs">
                      {event.event_type}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">{event.timestamp}</span>
                </div>
                <p className="text-sm font-medium text-slate-900 mb-1">
                  {event.action}
                </p>
                <p className="text-xs text-slate-600">
                  From: <span className="font-mono">{event.source}</span>
                  {event.target !== '-' && (
                    <>
                      {' → To: '}
                      <span className="font-mono">{event.target}</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">{event.details}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
