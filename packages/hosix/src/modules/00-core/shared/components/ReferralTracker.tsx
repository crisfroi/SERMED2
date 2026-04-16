'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useReferralManagement, type Referral } from '@/hooks/useReferralManagement';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, AlertCircle, CheckCircle, Box, TrendingUp } from 'lucide-react';

interface ReferralTrackerProps {
  patientId: string;
  onSelectReferral?: (referral: Referral) => void;
}

export const ReferralTracker: React.FC<ReferralTrackerProps> = ({
  patientId,
  onSelectReferral,
}) => {
  const {
    loading,
    error,
    getPatientReferrals,
    getReferralStats,
    updateReferralStatus,
    getReferralHistory,
  } = useReferralManagement();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [selectedReferralHistory, setSelectedReferralHistory] = useState<any[]>([]);

  // Load referrals
  useEffect(() => {
    const loadData = async () => {
      const refs = await getPatientReferrals(patientId);
      setReferrals(refs);

      const referralStats = await getReferralStats();
      setStats(referralStats);
    };

    loadData();
  }, [patientId, getPatientReferrals, getReferralStats]);

  // Filter referrals
  const filteredReferrals = referrals.filter((ref) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return ref.status === 'pending';
    if (selectedTab === 'completed') return ref.status === 'completed';
    if (selectedTab === 'rejected') return ref.status === 'rejected';
    return true;
  });

  const handleStatusUpdate = async (referralId: string, newStatus: string) => {
    const success = await updateReferralStatus(
      referralId,
      newStatus as any,
      undefined,
      'current-user'
    );

    if (success) {
      const refs = await getPatientReferrals(patientId);
      setReferrals(refs);
    }
  };

  const handleShowHistory = async (referral: Referral) => {
    const history = await getReferralHistory(referral.id);
    setSelectedReferralHistory(history);
  };

  // Get urgency badge color
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return <Badge className="bg-red-100 text-red-800">🚨 Emergencia</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-100 text-orange-800">⚡ Urgente</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">📋 Rutina</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pendiente</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Aceptada</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Completada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Rechazada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{referrals.length}</p>
              <p className="text-xs text-gray-600 mt-1">Total Referrals</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {referrals.filter((r) => r.status === 'pending').length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Pendientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {referrals.filter((r) => r.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Completadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats?.averageWaitDays || 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Días promedio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            Seguimiento de Derivaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todas ({referrals.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes ({referrals.filter((r) => r.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completadas ({referrals.filter((r) => r.status === 'completed').length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rechazadas ({referrals.filter((r) => r.status === 'rejected').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Razón</TableHead>
                      <TableHead>Urgencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creada</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          Sin derivaciones en esta categoría
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReferrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell className="font-medium">{referral.to_specialty}</TableCell>
                          <TableCell className="text-sm">{referral.reason.substring(0, 30)}...</TableCell>
                          <TableCell>{getUrgencyBadge(referral.urgency)}</TableCell>
                          <TableCell>{getStatusBadge(referral.status)}</TableCell>
                          <TableCell className="text-xs">
                            {format(new Date(referral.created_at), 'PPp', { locale: es })}
                          </TableCell>
                          <TableCell className="text-xs space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShowHistory(referral)}
                            >
                              Ver
                            </Button>
                            {referral.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(referral.id, 'accepted')}
                              >
                                Aceptar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">Error: {error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
