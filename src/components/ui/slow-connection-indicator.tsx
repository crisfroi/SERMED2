import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wifi, WifiOff, Clock, CheckCircle, X } from 'lucide-react';

interface SlowConnectionIndicatorProps {
  isVisible?: boolean;
  onDismiss?: () => void;
}

export const SlowConnectionIndicator: React.FC<SlowConnectionIndicatorProps> = ({ 
  isVisible = true, 
  onDismiss 
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState<'fast' | 'slow' | 'unknown'>('unknown');

  useEffect(() => {
    // Check if we've detected slow connections before
    const hasSlowConnection = localStorage.getItem('detected-slow-connection') === 'true';
    if (hasSlowConnection) {
      setConnectionSpeed('slow');
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('slow-connection-dismissed', 'true');
    onDismiss?.();
  };

  // Don't show if dismissed or not visible
  if (isDismissed || !isVisible) {
    return null;
  }

  // Only show for slow connections
  if (connectionSpeed !== 'slow') {
    return null;
  }

  return (
    <Card className="mx-4 mt-4 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-medium text-orange-800">
                  Conexión Lenta Detectada
                </h4>
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  África ↔ Supabase
                </Badge>
              </div>
              
              <p className="text-sm text-orange-700 mb-3">
                Tu conexión a Supabase es lenta (latencia alta desde Guinea Ecuatorial). 
                La app ha sido optimizada automáticamente para funcionar mejor con conexiones lentas.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-orange-700">Timeouts aumentados a 30s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-orange-700">Cache extendido a 10 min</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-orange-700">Datos mock automáticos</span>
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-orange-100 rounded text-xs text-orange-800">
                <strong>💡 Recomendación:</strong> Para mejor rendimiento, considera cambiar la región de tu proyecto 
                Supabase a Europa (eu-central-1) que está más cerca de África.
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="text-orange-600 hover:text-orange-800 hover:bg-orange-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook para detectar conexiones lentas
export const useSlowConnectionDetection = () => {
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const detectSlowConnection = () => {
      const startTime = performance.now();
      
      // Test simple connectivity
      fetch(`${window.location.origin}/favicon.ico`, { 
        method: 'HEAD',
        cache: 'no-cache' 
      })
      .then(() => {
        const latency = performance.now() - startTime;
        const isSlow = latency > 800; // More than 800ms is considered slow
        
        if (isSlow) {
          setIsSlowConnection(true);
          localStorage.setItem('detected-slow-connection', 'true');
        }
      })
      .catch(() => {
        // If request fails, assume slow connection
        setIsSlowConnection(true);
        localStorage.setItem('detected-slow-connection', 'true');
      });
    };

    // Run detection after a short delay
    const timer = setTimeout(detectSlowConnection, 2000);
    return () => clearTimeout(timer);
  }, []);

  return { isSlowConnection };
};

export default SlowConnectionIndicator;
