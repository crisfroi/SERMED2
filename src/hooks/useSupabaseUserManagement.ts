import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/roles';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

interface ExtendedUser extends User {
  role?: UserRole;
  full_name?: string;
  department?: string;
  assigned_center_id?: string;
}

interface CreateUserParams {
  email: string;
  password: string;
  role: UserRole;
  full_name?: string;
  department?: string;
  assigned_center_id?: string;
}

interface UpdateUserParams {
  user_id: string;
  role?: UserRole;
  full_name?: string;
  department?: string;
  assigned_center_id?: string;
}

// Hook para listar usuarios
export const useSupabaseUsers = () => {
  return useQuery({
    queryKey: ['supabase-users'],
    queryFn: async (): Promise<ExtendedUser[]> => {
      console.log('🔄 Obteniendo usuarios desde Edge Function...');
      
      try {
        const { data, error } = await supabase.functions.invoke('user-management', {
          body: { action: 'list_users' }
        });

        if (error) {
          console.error('❌ Error en Edge Function:', error);
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Error desconocido');
        }

        console.log('✅ Usuarios obtenidos:', data.users.length);
        return data.users;
        
      } catch (error: any) {
        console.error('❌ Error obteniendo usuarios:', error);
        
        // Fallback: Intentar obtener usuario actual
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
          
          console.log('✅ Usando usuario actual como fallback');
          return [userWithMetadata];
        }
        
        // Si todo falla, devolver datos demo
        return [
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
          }
        ] as ExtendedUser[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
};

// Hook para crear usuario
export const useCreateSupabaseUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CreateUserParams) => {
      console.log('🔄 Creando usuario:', params.email);
      
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { 
          action: 'create_user',
          ...params
        }
      });

      if (error) {
        console.error('❌ Error en Edge Function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      console.log('✅ Usuario creado exitosamente');
      return data;
    },
    onSuccess: (data) => {
      toast.success('Usuario creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['supabase-users'] });
    },
    onError: (error: any) => {
      console.error('❌ Error creando usuario:', error);
      
      if (error.message?.includes('not found') || error.message?.includes('function')) {
        toast.error('Función Edge no disponible. Configurar service role key.');
      } else {
        toast.error(`Error al crear usuario: ${error.message}`);
      }
    }
  });
};

// Hook para actualizar usuario
export const useUpdateSupabaseUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: UpdateUserParams) => {
      console.log('🔄 Actualizando usuario:', params.user_id);
      
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { 
          action: 'update_user',
          ...params
        }
      });

      if (error) {
        console.error('❌ Error en Edge Function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Error al actualizar usuario');
      }

      console.log('✅ Usuario actualizado exitosamente');
      return data;
    },
    onSuccess: (data) => {
      toast.success('Usuario actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['supabase-users'] });
    },
    onError: (error: any) => {
      console.error('❌ Error actualizando usuario:', error);
      toast.error(`Error al actualizar usuario: ${error.message}`);
    }
  });
};

// Hook para eliminar usuario
export const useDeleteSupabaseUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (user_id: string) => {
      console.log('🔄 Eliminando usuario:', user_id);
      
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { 
          action: 'delete_user',
          user_id
        }
      });

      if (error) {
        console.error('❌ Error en Edge Function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Error al eliminar usuario');
      }

      console.log('✅ Usuario eliminado exitosamente');
      return data;
    },
    onSuccess: (data) => {
      toast.success('Usuario eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['supabase-users'] });
    },
    onError: (error: any) => {
      console.error('❌ Error eliminando usuario:', error);
      toast.error(`Error al eliminar usuario: ${error.message}`);
    }
  });
};

// Hook para obtener un usuario específico
export const useSupabaseUser = (user_id: string) => {
  return useQuery({
    queryKey: ['supabase-user', user_id],
    queryFn: async (): Promise<ExtendedUser> => {
      console.log('🔄 Obteniendo usuario específico:', user_id);
      
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { 
          action: 'get_user',
          user_id
        }
      });

      if (error) {
        console.error('❌ Error en Edge Function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener usuario');
      }

      console.log('✅ Usuario obtenido');
      return data.user;
    },
    enabled: !!user_id,
    staleTime: 5 * 60 * 1000
  });
};
