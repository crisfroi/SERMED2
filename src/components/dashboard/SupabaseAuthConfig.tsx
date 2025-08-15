import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Key, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Settings,
  Users,
  Database
} from 'lucide-react';

export const SupabaseAuthConfig: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: "Accede al Dashboard de Supabase",
      description: "Ve a https://supabase.com/dashboard y selecciona tu proyecto",
      icon: <ExternalLink className="w-4 h-4" />
    },
    {
      step: 2,
      title: "Ve a Settings > API",
      description: "En la barra lateral, navega a Settings y luego API",
      icon: <Settings className="w-4 h-4" />
    },
    {
      step: 3,
      title: "Copia el Service Role Key",
      description: "En la sección 'Project API keys', copia el 'service_role' key",
      icon: <Key className="w-4 h-4" />
    },
    {
      step: 4,
      title: "Configura en Variables de Entorno",
      description: "Agrega la key como variable de entorno en tu proyecto",
      icon: <Shield className="w-4 h-4" />
    }
  ];

  const features = [
    {
      feature: "Crear usuarios",
      description: "Crear nuevas cuentas de usuario con email y contraseña",
      icon: <Users className="w-4 h-4 text-green-600" />
    },
    {
      feature: "Asignar roles",
      description: "Configurar roles y permisos usando user_metadata",
      icon: <Shield className="w-4 h-4 text-blue-600" />
    },
    {
      feature: "Asignar hospitales",
      description: "Restringir acceso a datos específicos por hospital",
      icon: <Database className="w-4 h-4 text-purple-600" />
    },
    {
      feature: "Gestión completa",
      description: "Editar, eliminar y administrar usuarios existentes",
      icon: <Settings className="w-4 h-4 text-orange-600" />
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Configuración de Supabase Auth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Para crear usuarios en Supabase Auth, necesitas configurar 
              el service role key. Sin esta configuración, solo podrás ver usuarios demo.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pasos para configurar:</h3>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.step} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Badge variant="outline" className="min-w-fit">
                    {step.step}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {step.icon}
                      <h4 className="font-medium">{step.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Variables de entorno necesarias:</h4>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
              <div># En tu archivo .env o configuración de Supabase</div>
              <div>SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui</div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Una vez configurado, podrás crear usuarios con roles específicos y asignar hospitales 
              para restringir el acceso a datos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {feature.icon}
                <div>
                  <h4 className="font-medium">{feature.feature}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles y Restricciones de Hospital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-100 text-green-800">DIRECTIVO_CENTRO_SANITARIO</Badge>
                <Hospital className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                <strong>Requiere hospital asignado.</strong> Solo puede ver y gestionar datos 
                del hospital específico asignado en su perfil.
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-teal-100 text-teal-800">HOSPITAL</Badge>
                <Database className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-sm text-gray-600">
                <strong>Requiere hospital asignado.</strong> Acceso de red hospitalaria 
                limitado al hospital especificado.
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-100 text-purple-800">PERSONALIDAD_MINISTERIAL</Badge>
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">
                <strong>Acceso completo.</strong> Puede ver datos de todos los hospitales 
                y estadísticas ministeriales.
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-red-100 text-red-800">SUPER_ADMINISTRADOR</Badge>
                <Key className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-sm text-gray-600">
                <strong>Sin restricciones.</strong> Acceso completo a todos los datos 
                y funcionalidades del sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseAuthConfig;
