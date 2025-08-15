import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action, ...payload } = await req.json()

    console.log('User management action:', action, payload)

    switch (action) {
      case 'list_users': {
        const { data, error } = await supabaseClient.auth.admin.listUsers()
        
        if (error) {
          throw error
        }

        // Agregar información de roles desde user_metadata
        const usersWithRoles = data.users.map(user => ({
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
        }))

        return new Response(
          JSON.stringify({ 
            success: true, 
            users: usersWithRoles,
            count: usersWithRoles.length 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      case 'create_user': {
        const { email, password, role, full_name, department, assigned_center_id } = payload

        if (!email || !password || !role) {
          throw new Error('Email, password y rol son requeridos')
        }

        const { data, error } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role,
            full_name,
            department,
            assigned_center_id
          }
        })

        if (error) {
          throw error
        }

        console.log('Usuario creado exitosamente:', data.user.email)

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: data.user,
            message: 'Usuario creado exitosamente'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      case 'update_user': {
        const { user_id, role, full_name, department, assigned_center_id } = payload

        if (!user_id) {
          throw new Error('ID de usuario es requerido')
        }

        const updateData: any = {
          user_metadata: {}
        }

        if (role) updateData.user_metadata.role = role
        if (full_name) updateData.user_metadata.full_name = full_name
        if (department) updateData.user_metadata.department = department
        if (assigned_center_id) updateData.user_metadata.assigned_center_id = assigned_center_id

        const { data, error } = await supabaseClient.auth.admin.updateUserById(
          user_id,
          updateData
        )

        if (error) {
          throw error
        }

        console.log('Usuario actualizado exitosamente:', data.user.email)

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: data.user,
            message: 'Usuario actualizado exitosamente'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      case 'delete_user': {
        const { user_id } = payload

        if (!user_id) {
          throw new Error('ID de usuario es requerido')
        }

        const { data, error } = await supabaseClient.auth.admin.deleteUser(user_id)

        if (error) {
          throw error
        }

        console.log('Usuario eliminado exitosamente:', user_id)

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Usuario eliminado exitosamente'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      case 'get_user': {
        const { user_id } = payload

        if (!user_id) {
          throw new Error('ID de usuario es requerido')
        }

        const { data, error } = await supabaseClient.auth.admin.getUserById(user_id)

        if (error) {
          throw error
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: {
              ...data.user,
              role: data.user.user_metadata?.role || 'OBSERVADOR',
              full_name: data.user.user_metadata?.full_name,
              department: data.user.user_metadata?.department,
              assigned_center_id: data.user.user_metadata?.assigned_center_id
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      default:
        throw new Error(`Acción no soportada: ${action}`)
    }

  } catch (error) {
    console.error('Error en user-management:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error interno del servidor'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
