import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  Crown, 
  Eye, 
  Building2, 
  Hospital,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { UserRole } from "@/types/roles";
import { useAuth } from "@/contexts/AuthContext";
import { useCentrosSalud } from "@/hooks/useCentrosSalud";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  department?: string;
  assigned_center_id?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  center_name?: string;
}

interface NewUser {
  email: string;
  role: UserRole;
  full_name?: string;
  department?: string;
  assigned_center_id?: string;
}

const UserRoleManagementFixed: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { data: centros = [], isLoading: loadingCentros } = useCentrosSalud();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    role: 'OBSERVADOR',
    full_name: '',
    department: 'Ministerio de Sanidad y Bienestar Social',
    assigned_center_id: ''
  });

  const roleOptions = [
    { 
      value: 'SUPER_ADMINISTRADOR', 
      label: 'Super Administrador',
      description: 'Acceso completo al sistema'
    },
    { 
      value: 'PERSONALIDAD_MINISTERIAL', 
      label: 'Personalidad Ministerial',
      description: 'Acceso a datos ministeriales y estadísticas'
    },
    { 
      value: 'DIRECTIVO_CENTRO_SANITARIO', 
      label: 'Directivo Centro Sanitario',
      description: 'Gestión de centro específico'
    },
    { 
      value: 'HOSPITAL', 
      label: 'Hospital',
      description: 'Acceso de red hospitalaria'
    },
    { 
      value: 'REVISOR_SOLICITUDES', 
      label: 'Revisor de Solicitudes',
      description: 'Validación de solicitudes'
    },
    { 
      value: 'OBSERVADOR', 
      label: 'Observador',
      description: 'Solo lectura de datos públicos'
    },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando usuarios...');
      
      // Test basic connectivity first
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Error de conectividad:', testError);
        throw new Error(`Error de conectividad: ${testError.message}`);
      }

      // Load users with center information
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          centros_salud:assigned_center_id (
            nombre
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando usuarios:', error);
        throw error;
      }

      console.log('✅ Usuarios cargados:', data?.length || 0);

      const usersWithCenterName = (data || []).map(user => ({
        ...user,
        center_name: user.centros_salud?.nombre
      }));

      setUsers(usersWithCenterName as UserProfile[]);
    } catch (error: any) {
      console.error('❌ Error en loadUsers:', error);
      const errorMessage = error.message || 'Error desconocido al cargar usuarios';
      setError(errorMessage);
      toast.error(`Error al cargar usuarios: ${errorMessage}`);
      
      // Provide fallback data for development
      if (error.message?.includes('relation "user_profiles" does not exist') || 
          error.message?.includes('permission denied')) {
        console.log('🔄 Usando datos de demostración');
        setUsers([
          {
            id: 'demo-1',
            email: 'admin@salud.gq',
            full_name: 'Administrador Sistema',
            role: 'SUPER_ADMINISTRADOR',
            department: 'Ministerio de Sanidad',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-2', 
            email: 'revisor@salud.gq',
            full_name: 'Revisor General',
            role: 'REVISOR_SOLICITUDES',
            department: 'Ministerio de Sanidad',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ] as UserProfile[]);
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMINISTRADOR':
        return <Crown className="w-4 h-4" />;
      case 'PERSONALIDAD_MINISTERIAL':
        return <Users className="w-4 h-4" />;
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return <Building2 className="w-4 h-4" />;
      case 'HOSPITAL':
        return <Hospital className="w-4 h-4" />;
      case 'REVISOR_SOLICITUDES':
        return <Shield className="w-4 h-4" />;
      case 'OBSERVADOR':
        return <Eye className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMINISTRADOR':
        return 'bg-red-100 text-red-800';
      case 'PERSONALIDAD_MINISTERIAL':
        return 'bg-purple-100 text-purple-800';
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return 'bg-green-100 text-green-800';
      case 'HOSPITAL':
        return 'bg-teal-100 text-teal-800';
      case 'REVISOR_SOLICITUDES':
        return 'bg-blue-100 text-blue-800';
      case 'OBSERVADOR':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.role) {
      toast.error('Email y rol son requeridos');
      return;
    }

    setIsLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: crypto.randomUUID(),
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          department: newUser.department,
          assigned_center_id: newUser.assigned_center_id || null,
          created_by: currentUser?.id,
          is_active: true
        });

      if (profileError) throw profileError;

      toast.success('Usuario creado exitosamente');
      
      setNewUser({
        email: '',
        role: 'OBSERVADOR',
        full_name: '',
        department: 'Ministerio de Sanidad y Bienestar Social',
        assigned_center_id: ''
      });
      setIsAddDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (error && users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Error en Panel de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Error:</strong> {error}</p>
                <p className="text-sm text-gray-600">
                  Esto puede ocurrir si la tabla user_profiles no existe o no tienes permisos de acceso.
                </p>
                <Button onClick={loadUsers} variant="outline" size="sm">
                  <Loader2 className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestión de Usuarios y Roles</h2>
        <p className="text-gray-600">
          Administrar usuarios del sistema con control de acceso multinivel
        </p>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error} (Mostrando datos de demostración)
          </AlertDescription>
        </Alert>
      )}

      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administradores</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'SUPER_ADMINISTRADOR').length}
                </p>
              </div>
              <Crown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón de agregar usuario */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button onClick={loadUsers} variant="outline" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Users className="w-4 h-4 mr-2" />
            )}
            Actualizar
          </Button>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@salud.gq"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Nombre Completo</label>
                <Input
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="Nombre completo del usuario"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role.value as UserRole)}
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-xs text-gray-500">{role.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Departamento</label>
                <Input
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="Departamento o área de trabajo"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateUser} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Crear Usuario
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema ({users.filter(u => u.is_active).length} activos)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Cargando usuarios...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay usuarios registrados en el sistema
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Centro Asignado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name || user.email}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getRoleColor(user.role)} flex items-center gap-1 w-fit`}>
                        {getRoleIcon(user.role)}
                        {roleOptions.find(r => r.value === user.role)?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.department || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.center_name || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleManagementFixed;
