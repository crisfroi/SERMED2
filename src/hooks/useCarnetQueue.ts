import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/utils/errorHandler';

interface CarnetQueueItem {
  id: string;
  profesional_id: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  url_carnet?: string;
  mensaje_error?: string;
  created_at: string;
  updated_at: string;
  profesional?: {
    nombre_completo: string;
    id_profesional_unico: string;
  };
}

interface QueueProcessResult {
  success: boolean;
  message: string;
  url_carnet?: string;
  error?: string;
}

export const useCarnetQueue = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Query para obtener profesionales aprobados sin carnet
  const getProfessionalsWithoutCarnet = useQuery({
    queryKey: ['professionals-without-carnet'],
    queryFn: async () => {
      console.log('Buscando profesionales aprobados sin carnet...');
      
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('id, nombre_completo, id_profesional_unico, url_carnet, estado_solicitud')
        .eq('estado_solicitud', 'Aprobado')
        .or('url_carnet.is.null,url_carnet.eq.')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching professionals without carnet:', getErrorMessage(error));
        throw new Error(getErrorMessage(error));
      }

      console.log(`Encontrados ${data?.length || 0} profesionales sin carnet`);
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Query para obtener el estado de la cola
  const getQueueStatus = useQuery({
    queryKey: ['carnet-queue-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cola_generacion_carnets')
        .select(`
          id,
          profesional_id,
          estado,
          url_carnet,
          mensaje_error,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return data || [];
    },
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });

  // Mutación para agregar profesionales a la cola
  const addToQueueMutation = useMutation({
    mutationFn: async (professionalIds: string[]) => {
      console.log(`Agregando ${professionalIds.length} profesionales a la cola...`);
      
      const queueItems = professionalIds.map(id => ({
        profesional_id: id,
        estado: 'pendiente' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('cola_generacion_carnets')
        .insert(queueItems)
        .select();

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Agregados a la Cola",
        description: `${data.length} profesionales agregados a la cola de generación.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['carnet-queue-status'] });
      queryClient.invalidateQueries({ queryKey: ['professionals-without-carnet'] });
    },
    onError: (error) => {
      console.error('Error adding to queue:', getErrorMessage(error));
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  });

  // Mutación para procesar la cola usando la edge function
  const processQueueMutation = useMutation({
    retry: false, // Disable retries to prevent "body stream already read" errors
    mutationFn: async (): Promise<QueueProcessResult> => {
      console.log('Procesando cola de carnets...');

      try {
        // Get current session for authentication
        const { data: session } = await supabase.auth.getSession();

        if (!session?.session?.access_token) {
          throw new Error('No hay sesión activa para autenticar la solicitud');
        }

        // Make direct HTTP request to the Edge Function
        const response = await fetch(`${SUPABASE_URL}/functions/v1/procesar-cola-carnets`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'apikey': SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
        });

        // Clone response for defensive programming (in case of unexpected retries)
        const responseClone = response.clone();

        // Read response body once and handle both success and error cases
        let responseText;
        try {
          responseText = await response.text();
        } catch (streamError) {
          // If the stream was already read, try the clone
          console.warn('Response stream already read, using clone:', streamError);
          responseText = await responseClone.text();
        }

        if (!response.ok) {
          console.error('Error response from Edge Function:', {
            status: response.status,
            statusText: response.statusText,
            body: responseText
          });
          throw new Error(`Edge Function error (${response.status}): ${responseText}`);
        }

        // Parse the successful response as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing response JSON:', parseError);
          throw new Error(`Invalid JSON response from Edge Function: ${responseText}`);
        }

        console.log('Resultado del procesamiento:', data);
        return data as QueueProcessResult;

      } catch (error) {
        console.error('Error procesando cola:', getErrorMessage(error));
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Cola Procesada",
          description: result.message,
        });
      } else {
        toast({
          title: "Procesamiento Incompleto", 
          description: result.message,
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['carnet-queue-status'] });
      queryClient.invalidateQueries({ queryKey: ['professionals-without-carnet'] });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
    },
    onError: (error) => {
      console.error('Error in queue processing:', getErrorMessage(error));
      toast({
        title: "Error en Procesamiento",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  });

  // Función para procesar múltiples items de la cola
  const processMultipleQueue = async (maxItems: number = 5) => {
    setIsProcessingQueue(true);

    try {
      for (let i = 0; i < maxItems; i++) {
        console.log(`Processing queue item ${i + 1} of ${maxItems}`);

        try {
          await processQueueMutation.mutateAsync();
          console.log(`Queue item ${i + 1} processed successfully`);
        } catch (error) {
          console.error(`Error processing queue item ${i + 1}:`, getErrorMessage(error));
          // Continue with next item instead of breaking the loop
        }

        // Pausa de 2 segundos entre procesamiento para no sobrecargar
        if (i < maxItems - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error('Error in batch queue processing:', getErrorMessage(error));
    } finally {
      setIsProcessingQueue(false);
    }
  };

  // Función para automatizar: agregar profesionales sin carnet a la cola y procesarlos
  const automateCarnetGeneration = async () => {
    const professionalsWithoutCarnet = getProfessionalsWithoutCarnet.data;
    
    if (!professionalsWithoutCarnet || professionalsWithoutCarnet.length === 0) {
      toast({
        title: "No hay Profesionales",
        description: "No se encontraron profesionales aprobados sin carnet.",
      });
      return;
    }

    try {
      // Agregar a la cola
      const professionalIds = professionalsWithoutCarnet.map(p => p.id);
      await addToQueueMutation.mutateAsync(professionalIds);
      
      // Esperar un momento y luego procesar
      setTimeout(() => {
        processMultipleQueue(Math.min(professionalIds.length, 10));
      }, 3000);
      
    } catch (error) {
      console.error('Error in automated carnet generation:', getErrorMessage(error));
    }
  };

  return {
    // Data
    professionalsWithoutCarnet: getProfessionalsWithoutCarnet.data || [],
    queueStatus: getQueueStatus.data || [],
    
    // Loading states
    isLoadingProfessionals: getProfessionalsWithoutCarnet.isLoading,
    isLoadingQueue: getQueueStatus.isLoading,
    isAddingToQueue: addToQueueMutation.isPending,
    isProcessingQueue: processQueueMutation.isPending || isProcessingQueue,
    
    // Actions
    addToQueue: addToQueueMutation.mutate,
    addToQueueAsync: addToQueueMutation.mutateAsync,
    processQueue: processQueueMutation.mutate,
    processQueueAsync: processQueueMutation.mutateAsync,
    processMultipleQueue,
    automateCarnetGeneration,
    
    // Refetch functions
    refetchProfessionals: getProfessionalsWithoutCarnet.refetch,
    refetchQueue: getQueueStatus.refetch,
  };
};
