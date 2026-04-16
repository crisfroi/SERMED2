'use client';

import React, { useState, useEffect } from 'react';
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
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const ImagingWorklistDashboard = () => {
  const [activeTab, setActiveTab] = useState<'worklist' | 'viewer' | 'reports'>('worklist');
  const [metrics, setMetrics] = useState({
    pendingOrders: 24,
    completedOrders: 187,
    statOrdersPending: 3,
    totalStudies: 211,
    totalStorageGB: 542.3,
    averageStudySizeMB: 156.8,
  });

  const [worklist] = useState([
    {
      order_id: 'IMG-001',
      patient_name: 'Carlos Muñoz',
      modality: 'CT',
      body_part: 'Abdomen',
      urgency: 'stat',
      scheduled_time: '09:15 AM',
      status: 'ready',
    },
    {
      order_id: 'IMG-002',
      patient_name: 'María García',
      modality: 'XR',
      body_part: 'Chest',
      urgency: 'urgent',
      scheduled_time: '10:30 AM',
      status: 'in_progress',
    },
    {
      order_id: 'IMG-003',
      patient_name: 'Juan López',
      modality: 'MRI',
      body_part: 'Brain',
      urgency: 'routine',
      scheduled_time: '11:00 AM',
      status: 'pending',
    },
    {
      order_id: 'IMG-004',
      patient_name: 'Ana Hermano',
      modality: 'US',
      body_part: 'Abdomen',
      urgency: 'routine',
      scheduled_time: '02:00 PM',
      status: 'pending',
    },
    {
      order_id: 'IMG-005',
      patient_name: 'Pedro Sánchez',
      modality: 'CT',
      body_part: 'Chest',
      urgency: 'urgent',
      scheduled_time: '03:30 PM',
      status: 'pending',
    },
  ]);

  const [studies] = useState([
    {
      study_id: 'STU-001',
      modality: 'CT',
      body_part: 'Abdomen',
      acquisition_date: '2025-02-21',
      series_count: 5,
      image_count: 186,
      file_size_mb: 523.4,
      status: 'final',
    },
    {
      study_id: 'STU-002',
      modality: 'MRI',
      body_part: 'Brain',
      acquisition_date: '2025-02-21',
      series_count: 12,
      image_count: 428,
      file_size_mb: 892.1,
      status: 'final',
    },
    {
      study_id: 'STU-003',
      modality: 'XR',
      body_part: 'Chest',
      acquisition_date: '2025-02-21',
      series_count: 1,
      image_count: 2,
      file_size_mb: 12.5,
      status: 'final',
    },
  ]);

  const [reports] = useState([
    {
      report_id: 'RPT-001',
      study_id: 'STU-001',
      radiologist: 'Dr. Fernando Ruiz',
      report_date: '2025-02-21',
      status: 'final',
      critical: false,
      impression: 'No acute findings. Liver unremarkable. No free fluid.',
    },
    {
      report_id: 'RPT-002',
      study_id: 'STU-002',
      radiologist: 'Dra. Patricia Molina',
      report_date: '2025-02-21',
      status: 'preliminary',
      critical: true,
      impression: 'CRITICAL: Left temporal mass 2.3cm with mass effect on lateral ventricle.',
    },
    {
      report_id: 'RPT-003',
      study_id: 'STU-003',
      radiologist: 'Dr. Roberto Silva',
      report_date: '2025-02-20',
      status: 'amended',
      critical: false,
      impression: 'Small left pleural effusion, likely dependent. No pneumothorax.',
    },
  ]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'stat':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-blue-600';
      case 'in_progress':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'final':
        return 'bg-green-100 text-green-800';
      case 'preliminary':
        return 'bg-yellow-100 text-yellow-800';
      case 'amended':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Imaging Worklist Manager</h1>
        <p className="text-slate-600">DICOM ordering, acquisition tracking, and radiology reporting</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <Card className="border-l-4 border-l-red-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Stat Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.statOrdersPending}</div>
            <p className="text-xs text-slate-500 mt-1">Pending STAT studies</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.pendingOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Orders in queue</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.completedOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Today</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Studies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.totalStudies}</div>
            <p className="text-xs text-slate-500 mt-1">In database</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.totalStorageGB}GB</div>
            <p className="text-xs text-slate-500 mt-1">Total DICOM data</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Study Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{metrics.averageStudySizeMB}MB</div>
            <p className="text-xs text-slate-500 mt-1">Per study</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="worklist" className="w-full bg-white rounded-lg shadow-sm border">
        <TabsList className="w-full justify-start border-b bg-slate-50 p-0 rounded-none">
          <TabsTrigger
            value="worklist"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            📋 Imaging Worklist
          </TabsTrigger>
          <TabsTrigger
            value="viewer"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            🖼️ DICOM Viewer
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            📄 Reports
          </TabsTrigger>
        </TabsList>

        {/* Worklist Tab */}
        <TabsContent value="worklist" className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Pending Acquisitions</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">New Order</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b">
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Patient</TableHead>
                  <TableHead className="font-semibold">Modality</TableHead>
                  <TableHead className="font-semibold">Region</TableHead>
                  <TableHead className="font-semibold">Urgency</TableHead>
                  <TableHead className="font-semibold">Scheduled</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worklist.map((item) => (
                  <TableRow key={item.order_id} className="border-b hover:bg-slate-50">
                    <TableCell className="font-mono text-sm text-blue-600">{item.order_id}</TableCell>
                    <TableCell className="font-medium">{item.patient_name}</TableCell>
                    <TableCell>
                      <Badge className="bg-slate-200 text-slate-900 font-mono">
                        {item.modality}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.body_part}</TableCell>
                    <TableCell>
                      <Badge className={getUrgencyColor(item.urgency)}>
                        {item.urgency.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.scheduled_time}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${getStatusColor(item.status)}`}>
                        {item.status === 'ready' && '✓ Ready'}
                        {item.status === 'in_progress' && '◐ In Progress'}
                        {item.status === 'pending' && '○ Pending'}
                      </span>
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
          </div>
        </TabsContent>

        {/* DICOM Viewer Tab */}
        <TabsContent value="viewer" className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Study</label>
                <select className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                  <option>Select a study...</option>
                  {studies.map((s) => (
                    <option key={s.study_id}>{s.study_id} - {s.body_part}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Series</label>
                <select className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                  <option>Select series...</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-8 flex items-center justify-center" style={{ height: '400px' }}>
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-4">DICOM Viewer (Web PACS Integration)</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded">
                  <span className="text-green-400 text-2xl">▶</span>
                  <span className="text-slate-300">Select study to view DICOM images</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              {studies.map((study) => (
                <Card key={study.study_id} className="bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{study.study_id}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-600">Modality:</span>
                      <Badge className="ml-2 bg-blue-100 text-blue-800">{study.modality}</Badge>
                    </div>
                    <div>
                      <span className="text-slate-600">Region:</span>
                      <span className="ml-2 font-medium">{study.body_part}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Series/Images:</span>
                      <span className="ml-2">{study.series_count}/{study.image_count}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Size:</span>
                      <span className="ml-2 font-mono">{study.file_size_mb}MB</span>
                    </div>
                    <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-xs">
                      Load Study
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="p-4">
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.report_id} className={report.critical ? 'border-l-4 border-l-red-500' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{report.report_id}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">Study: {report.study_id}</p>
                    </div>
                    <div className="flex gap-2">
                      {report.critical && (
                        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> CRITICAL
                        </Badge>
                      )}
                      <Badge className={getReportStatusColor(report.status)}>
                        {report.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Radiologist</p>
                    <p className="font-medium">{report.radiologist}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Report Date</p>
                    <p className="text-sm">{report.report_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Impression</p>
                    <p className={`text-sm p-2 rounded ${report.critical ? 'bg-red-50 text-red-900' : 'bg-slate-50'}`}>
                      {report.impression}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      View Full Report
                    </Button>
                    <Button variant="ghost" size="sm">
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modalities Grid */}
      <Card className="mt-6 bg-white">
        <CardHeader>
          <CardTitle>Available Modalities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {['CT', 'MRI', 'XR', 'US', 'NM', 'PET', 'ECHO', 'IR'].map((modality) => (
              <button
                key={modality}
                className="p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <p className="font-bold text-lg text-slate-900">{modality}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {modality === 'CT' && 'Computed Tomography'}
                  {modality === 'MRI' && 'Magnetic Resonance'}
                  {modality === 'XR' && 'X-Ray'}
                  {modality === 'US' && 'Ultrasound'}
                  {modality === 'NM' && 'Nuclear Medicine'}
                  {modality === 'PET' && 'Positron Emission'}
                  {modality === 'ECHO' && 'Echocardiography'}
                  {modality === 'IR' && 'Interventional'}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
