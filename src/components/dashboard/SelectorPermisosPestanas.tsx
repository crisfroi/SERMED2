import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ALL_TABS = [
  'overview','professionals','requests','renewals','guardias','analytics','health-centers','incidents','iachat','ministerial','users','admin','traslados'
];

interface UserOption { id: string; email: string; full_name: string | null }

const SelectorPermisosPestanas = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, { view: boolean; edit: boolean; approve: boolean }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPermissions(Object.fromEntries(ALL_TABS.map(t => [t, { view: false, edit: false, approve: false }])));
  }, []);

  const searchUsers = async () => {
    const { data, error } = await supabase.from('user_profiles').select('id,email,full_name').ilike('email', `%${query}%`).limit(10);
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron buscar usuarios', variant: 'destructive' });
      return;
    }
    setOptions((data as any) || []);
  };

  useEffect(() => {
    const t = setTimeout(() => { if (query && query.length >= 2) searchUsers(); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const loadExisting = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('permisos_pestanas').select('*').eq('usuario_id', userId);
      if (error) throw error;
      const map = Object.fromEntries(ALL_TABS.map(t => [t, { view: false, edit: false, approve: false }]));
      for (const r of (data as any) || []) {
        map[r.pestana] = { view: !!r.puede_ver, edit: !!r.puede_editar, approve: !!r.puede_aprobar };
      }
      setPermissions(map);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (id: string) => {
    setSelectedUserId(id);
    if (id) loadExisting(id);
  };

  const save = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const rows = ALL_TABS.map(tab => ({
        usuario_id: selectedUserId,
        pestana: tab,
        puede_ver: permissions[tab]?.view || false,
        puede_editar: permissions[tab]?.edit || false,
        puede_aprobar: permissions[tab]?.approve || false,
        restricciones: {}
      }));
      const { error } = await supabase.from('permisos_pestanas').upsert(rows, { onConflict: 'usuario_id,pestana' });
      if (error) throw error;
      toast({ title: 'Permisos guardados', description: 'Se actualizaron los permisos del usuario.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (tab: string, key: 'view'|'edit'|'approve') => {
    setPermissions(prev => ({ ...prev, [tab]: { ...prev[tab], [key]: !prev[tab][key] } }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permisos por Pestaña</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input placeholder="Buscar usuario por email" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={selectedUserId} onValueChange={handleSelectUser}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione usuario" />
            </SelectTrigger>
            <SelectContent>
              {options.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUserId && (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pestaña</TableHead>
                  <TableHead>Ver</TableHead>
                  <TableHead>Editar</TableHead>
                  <TableHead>Aprobar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_TABS.map(tab => (
                  <TableRow key={tab}>
                    <TableCell className="capitalize">{tab}</TableCell>
                    <TableCell><Switch checked={!!permissions[tab]?.view} onCheckedChange={() => toggle(tab, 'view')} /></TableCell>
                    <TableCell><Switch checked={!!permissions[tab]?.edit} onCheckedChange={() => toggle(tab, 'edit')} /></TableCell>
                    <TableCell><Switch checked={!!permissions[tab]?.approve} onCheckedChange={() => toggle(tab, 'approve')} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={save} disabled={!selectedUserId || loading}>Guardar cambios</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectorPermisosPestanas;
