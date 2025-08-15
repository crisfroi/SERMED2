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
import { Alert, AlertDescription } from "@/components/ui/alert-dialog";
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
  Loader2,
  Key,
  UserCheck
} from "lucide-react";
import { UserRole } from "@/types/roles";
import { useAuth } from "@/contexts/AuthContext";
import { useCentrosSalud } from "@/hooks/useCentrosSalud";
import {
  useSupabaseUsers,
  useCreateSupabaseUser,
  useUpdateSupabaseUser,
  useDeleteSupabaseUser
} from "@/hooks/useSupabaseUserManagement";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface ExtendedUser extends User {
  role?: UserRole;
  full_name?: string;
  department?: string;
  assigned_center_id?: string;
  center_name?: string;
}

interface NewUser {
  email: string;
  password: string;
  role: UserRole;
  full_name?: string;
  department?: string;
  assigned_center_id?: string;
}

const UserRoleManagementAuth: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { data: centros = [], isLoading: loadingCentros } = useCentrosSalud();
  
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
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
      console.log('🔄 Cargando usuarios desde Supabase Auth...');
      
      // Intentar obtener usuarios usando el admin API
      // Nota: Esto requiere service role key en producción
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('❌ Error cargando usuarios con admin API:', error);
        
        // Fallback: Usar el usuario actual como ejemplo
        const { data: currentUserData } = await supabase.auth.getUser();
        
        if (currentUserData.user) {
          const userWithMetadata = {
            ...currentUserData.user,
            role: currentUserData.user.user_metadata?.role || 'SUPER_ADMINISTRADOR',
            full_name: currentUserData.user.user_metadata?.full_name || 
                      currentUserData.user.email?.split('@')[0],
            department: currentUserData.user.user_metadata?.department || 
                       'Ministerio de Sanidad y Bienestar Social'
          };
          
          setUsers([userWithMetadata]);
          console.log('✅ Mostrando usuario actual como ejemplo');
          toast.success('Mostrando usuario actual (funcionalidad limitada en modo demo)');
        } else {
          throw new Error('No se pudo acceder a los usuarios');
        }
      } else {
        console.log('✅ Usuarios cargados desde Auth:', data.users.length);
        
        // Procesar usuarios y agregar metadatos
        const processedUsers = data.users.map(user => ({
          ...user,
          role: user.user_metadata?.role || user.app_metadata?.role || 'OBSERVADOR',
          full_name: user.user_metadata?.full_name || 
                    user.user_metadata?.name ||
                    user.email?.split('@')[0],
          department: user.user_metadata?.department || 
                     user.app_metadata?.department ||
                     'Ministerio de Sanidad y Bienestar Social',
          assigned_center_id: user.user_metadata?.assigned_center_id || 
                             user.app_metadata?.assigned_center_id
        }));
        
        setUsers(processedUsers);
        toast.success(`${processedUsers.length} usuarios cargados exitosamente`);
      }
      
    } catch (error: any) {
      console.error('❌ Error en loadUsers:', error);
      const errorMessage = error.message || 'Error desconocido al cargar usuarios';
      setError(errorMessage);
      
      // Proporcionar datos de demostración como fallback
      console.log('🔄 Usando datos de demostración');
      setUsers([
        {
          id: 'demo-auth-1',
          email: 'admin@salud.gq',
          role: 'SUPER_ADMINISTRADOR',
          full_name: 'Administrador Sistema',
          department: 'Ministerio de Sanidad',
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {
            role: 'SUPER_ADMINISTRADOR',
            full_name: 'Administrador Sistema'
          }
        },
        {
          id: 'demo-auth-2', 
          email: 'revisor@salud.gq',
          role: 'REVISOR_SOLICITUDES',
          full_name: 'Revisor General',
          department: 'Ministerio de Sanidad',
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {
            role: 'REVISOR_SOLICITUDES',
            full_name: 'Revisor General'
          }
        }
      ] as ExtendedUser[]);
      
      toast.error(`Error al cargar usuarios: ${errorMessage} (usando datos demo)`);
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
    if (!newUser.email || !newUser.password || !newUser.role) {
      toast.error('Email, contraseña y rol son requeridos');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Creando usuario en Supabase Auth...');
      
      // Crear usuario usando Supabase Auth Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true, // Auto confirmar email
        user_metadata: {
          role: newUser.role,
          full_name: newUser.full_name,
          department: newUser.department,
          assigned_center_id: newUser.assigned_center_id || null
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Usuario creado exitosamente:', data.user.email);
      toast.success('Usuario creado exitosamente en Supabase Auth');
      
      // Limpiar formulario
      setNewUser({
        email: '',
        password: '',
        role: 'OBSERVADOR',
        full_name: '',
        department: 'Ministerio de Sanidad y Bienestar Social',
        assigned_center_id: ''
      });
      
      setIsAddDialogOpen(false);
      loadUsers(); // Recargar lista
      
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      
      if (error.message?.includes('admin')) {
        toast.error('Funcionalidad limitada: Se requiere service role key para crear usuarios');
      } else {
        toast.error('Error al crear usuario: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    setIsLoading(true);
    try {
      console.log('🔄 Actualizando rol de usuario...');
      
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            role: newRole
          }
        }
      );

      if (error) {
        throw error;
      }

      console.log('✅ Rol actualizado exitosamente');
      toast.success('Rol de usuario actualizado exitosamente');
      loadUsers();
      
    } catch (error: any) {
      console.error('❌ Error updating user role:', error);
      toast.error('Error al actualizar rol: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      console.log('🔄 Eliminando usuario...');
      
      const { data, error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        throw error;
      }

      console.log('✅ Usuario eliminado exitosamente');
      toast.success('Usuario eliminado exitosamente');
      loadUsers();
      
    } catch (error: any) {
      console.error('❌ Error deleting user:', error);
      toast.error('Error al eliminar usuario: ' + error.message);
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
            Error en Panel de Usuarios (Supabase Auth)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Error:</strong> {error}</p>
                <p className="text-sm text-gray-600">
                  Para acceder a la funcionalidad completa de gestión de usuarios, 
                  se requiere configurar el service role key de Supabase.
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
        <h2 className="text-2xl font-bold">Gestión de Usuarios (Supabase Auth)</h2>
        <p className="text-gray-600">
          Administrar usuarios del sistema usando Supabase Authentication
        </p>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error} (Funcionalidad limitada - se requiere service role key)
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
                <p className="text-sm text-gray-600">Usuarios Autenticados</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
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

      {/* Botones de acción */}
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
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario en Supabase Auth</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Se requiere service role key para crear usuarios. En modo demo esta función está limitada.
                </AlertDescription>
              </Alert>
              
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
                <label className="text-sm font-medium">Contraseña</label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Contraseña segura"
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
          <CardTitle>Usuarios Autenticados ({users.length} en total)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Cargando usuarios desde Supabase Auth...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay usuarios registrados en Supabase Auth
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Acciones</TableHead>
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
                        <div className="text-xs text-gray-400">
                          ID: {user.id.substring(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getRoleColor(user.role || 'OBSERVADOR')} flex items-center gap-1 w-fit`}>
                        {getRoleIcon(user.role || 'OBSERVADOR')}
                        {roleOptions.find(r => r.value === user.role)?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.department || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Autenticado
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {user.last_sign_in_at ? 
                          new Date(user.last_sign_in_at).toLocaleDateString() : 
                          'Nunca'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente la cuenta de usuario "{user.email}" 
                                de Supabase Auth. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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

export default UserRoleManagementAuth;
