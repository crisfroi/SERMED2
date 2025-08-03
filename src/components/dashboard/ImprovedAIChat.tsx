import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import useRoleBasedData from "@/hooks/useRoleBasedData";
import { useEstadisticasAvanzadas } from "@/hooks/useEstadisticasAvanzadas";
import {
  useTopCenters,
  useAreaProfessionalStats,
  useDistrictStats,
  useAgeRangeStats,
  useGraduationYearStats,
  useCountryStats,
  useInstitutionStats,
  useCenterCategoryStats,
  useTitulacionCategoryStats,
} from "@/hooks/useAdvancedAnalytics";
import AdvancedAnalyticsResults from "./AdvancedAnalyticsResults";

interface Message {
  id: string;
  type: "user" | "bot" | "system" | "analysis";
  content: string;
  naturalResponse?: string; // Respuesta en lenguaje natural
  timestamp: Date;
  metadata?: {
    queryType?: string;
    resultCount?: number;
    executionTime?: number;
    hasVisualData?: boolean;
  };
  visualData?: any; // Datos para visualización
}

interface ImprovedAIChatProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const ImprovedAIChat: React.FC<ImprovedAIChatProps> = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { userRole, hasPermission, isLoading: authLoading } = useAuth();

  // Early return if authentication is still loading
  if (authLoading || !userRole) {
    return (
      <div className="flex flex-col h-full">
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Cargando asistente de IA...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleBasedData = useRoleBasedData();
  const getAllowedMetrics = roleBasedData?.getAllowedMetrics || (() => []);

  // Data hooks
  const { data: estadisticasBasicas } = useEstadisticasAvanzadas();
  const { data: topCenters } = useTopCenters();
  const { data: areaStats } = useAreaProfessionalStats();
  const { data: districtStats } = useDistrictStats();
  const { data: ageRangeStats } = useAgeRangeStats();
  const { data: graduationStats } = useGraduationYearStats();
  const { data: countryStats } = useCountryStats();
  const { data: institutionStats } = useInstitutionStats();
  const { data: centerCategoryStats } = useCenterCategoryStats();
  const { data: titulacionStats } = useTitulacionCategoryStats();

  // Welcome message
  useEffect(() => {
    if (!userRole) return;
    
    const welcomeMessage: Message = {
      id: "welcome",
      type: "system",
      content: `¡Hola ${userRole === "SUPER_ADMINISTRADOR" ? "Juan Froilan" : "Doctor"}! 👋

Soy tu asistente especializado en análisis del sistema sanitario de Guinea Ecuatorial. 

🎯 **¿En qué puedo ayudarte hoy?**

Puedo responder preguntas como:
• "¿Cuántos profesionales tenemos por especialidad?"
• "Dame un resumen de la situación actual"
• "¿Qué centros necesitan más personal?"
• "Muéstrame las estadísticas de formación"

💡 Te daré respuestas conversacionales y después podrás ver los datos visuales si lo necesitas.`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [userRole]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate natural language response with optional visual data
  const generateNaturalResponse = async (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    let naturalResponse = "";
    let visualData = null;
    let hasVisualData = false;

    try {
      // Analyze query and generate appropriate response
      if (lowercaseQuery.includes("profesionales") && (lowercaseQuery.includes("área") || lowercaseQuery.includes("especialidad"))) {
        if (areaStats && areaStats.length > 0) {
          const totalProfesionales = areaStats.reduce((sum, area) => sum + area.aprobados, 0);
          const topArea = areaStats[0];
          const bottomArea = areaStats[areaStats.length - 1];
          
          naturalResponse = `📊 **Análisis de Profesionales por Especialidad**

Te comento lo que veo en nuestros datos:

Actualmente tenemos **${totalProfesionales} profesionales** distribuidos en diferentes especialidades. 

Lo más destacable es que **${topArea.area_profesional}** es nuestra especialidad más fuerte con **${topArea.aprobados} profesionales** (${topArea.porcentaje.toFixed(1)}% del total).

En el otro extremo, **${bottomArea.area_profesional}** es donde más necesitamos reforzar, ya que solo tenemos **${bottomArea.aprobados} profesionales**.

Las especialidades mejor cubiertas son:
${areaStats.slice(0, 3).map((area, index) => 
  `${index + 1}. ${area.area_profesional}: ${area.aprobados} profesionales`
).join('\n')}

¿Te gustaría que profundice en alguna especialidad en particular o que te muestre los datos visuales?`;

          visualData = {
            areaStats,
            totalProfesionales,
            chartType: 'area_profesional'
          };
          hasVisualData = true;
        }
      }
      
      else if (lowercaseQuery.includes("centros") || lowercaseQuery.includes("hospitales")) {
        if (topCenters && topCenters.length > 0) {
          const totalCentros = topCenters.length;
          const centrosConProfesionales = topCenters.filter(c => c.total_profesionales > 0);
          const topCenter = topCenters[0];
          
          naturalResponse = `🏥 **Estado de Nuestros Centros de Salud**

Te doy un panorama de la situación:

Tenemos **${totalCentros} centros de salud** registrados en el sistema, de los cuales **${centrosConProfesionales.length}** ya tienen profesionales asignados.

El centro con mayor capacidad es **${topCenter.nombre}** (${topCenter.categoria}) con **${topCenter.total_profesionales} profesionales**.

La distribución por tipo de centro es bastante equilibrada:
${centerCategoryStats?.slice(0, 3).map(cat => 
  `• ${cat.categoria}: ${cat.total_centros} centros con ${cat.total_profesionales} profesionales`
).join('\n')}

El desafío principal que veo es que **${totalCentros - centrosConProfesionales.length} centros** aún necesitan asignación de personal.

¿Quieres que te muestre los detalles específicos de algún centro?`;

          visualData = {
            topCenters,
            centerCategoryStats,
            chartType: 'centros'
          };
          hasVisualData = true;
        }
      }
      
      else if (lowercaseQuery.includes("resumen") || lowercaseQuery.includes("situación") || lowercaseQuery.includes("general")) {
        if (estadisticasBasicas) {
          const tasaEficiencia = parseFloat(estadisticasBasicas.tasaAprobacion);
          let comentarioEficiencia = "";
          
          if (tasaEficiencia >= 80) {
            comentarioEficiencia = "excelente";
          } else if (tasaEficiencia >= 70) {
            comentarioEficiencia = "buena";
          } else {
            comentarioEficiencia = "necesita mejorar";
          }
          
          naturalResponse = `📋 **Resumen Ejecutivo del Sistema Sanitario**

Te doy un panorama completo de la situación actual:

**📈 Estado General del Sistema:**
- Tenemos **${estadisticasBasicas.total} profesionales** registrados en total
- **${estadisticasBasicas.aprobados} ya están aprobados** y en servicio (${estadisticasBasicas.tasaAprobacion}%)
- **${estadisticasBasicas.recibidos} solicitudes** están pendientes de revisión

**⚡ Eficiencia del Sistema:**
Nuestra tasa de aprobación del **${estadisticasBasicas.tasaAprobacion}%** es ${comentarioEficiencia}. Procesamos las solicitudes de manera bastante eficiente.

**🚨 Puntos de Atención:**
- **${estadisticasBasicas.vencimientosProximos} carnets** están próximos a vencer (requieren renovación)
- **${estadisticasBasicas.carnetVencidos} carnets** ya vencieron (acción inmediata)

**👥 Distribución por Género:**
- Hombres: ${estadisticasBasicas.generoMasculino} (${((estadisticasBasicas.generoMasculino / estadisticasBasicas.aprobados) * 100).toFixed(1)}%)
- Mujeres: ${estadisticasBasicas.generoFemenino} (${((estadisticasBasicas.generoFemenino / estadisticasBasicas.aprobados) * 100).toFixed(1)}%)

En general, el sistema está funcionando bien, pero hay que prestar atención a las renovaciones pendientes.

¿Hay algún aspecto específico que te preocupe o sobre el que quieras profundizar?`;

          visualData = {
            estadisticasBasicas,
            chartType: 'resumen'
          };
          hasVisualData = true;
        }
      }
      
      else if (lowercaseQuery.includes("formación") || lowercaseQuery.includes("universidad") || lowercaseQuery.includes("educación")) {
        if (countryStats && institutionStats) {
          const paisPrincipal = countryStats[0];
          const universidadPrincipal = institutionStats[0];
          
          naturalResponse = `🎓 **Análisis de Formación Académica**

Te cuento sobre el perfil educativo de nuestros profesionales:

**🌍 Origen de la Formación:**
La mayoría de nuestros profesionales se formaron en **${paisPrincipal.pais_formacion}** (${paisPrincipal.cantidad} profesionales, ${paisPrincipal.porcentaje.toFixed(1)}% del total).

**🏛️ Instituciones Destacadas:**
La **${universidadPrincipal.institucion}** es donde más profesionales han estudiado, con **${universidadPrincipal.cantidad} graduados**.

**📊 Diversidad Educativa:**
Tenemos profesionales formados en **${countryStats.length} países diferentes**, lo que aporta una gran riqueza de conocimientos y experiencias al sistema.

Los principales países de formación son:
${countryStats.slice(0, 4).map((country, index) => 
  `${index + 1}. ${country.pais_formacion}: ${country.cantidad} profesionales`
).join('\n')}

Esta diversidad internacional es una fortaleza de nuestro sistema sanitario.

¿Te interesa conocer detalles sobre alguna institución o país en particular?`;

          visualData = {
            countryStats,
            institutionStats,
            chartType: 'formacion'
          };
          hasVisualData = true;
        }
      }
      
      else {
        naturalResponse = `🤔 **Entiendo tu consulta sobre "${query}"**

Aunque no tengo una respuesta específica preparada para esa consulta exacta, puedo ayudarte con análisis sobre:

📊 **Datos que puedo analizar:**
• Estadísticas de profesionales y especialidades
• Estado de centros de salud y hospitales  
• Análisis de formación académica
• Tendencias temporales y proyecciones
• Distribución geográfica y demográfica

💡 **Sugerencias de preguntas:**
• "Dame un resumen general del sistema"
• "¿Cómo estamos en especialidades médicas?"
• "¿Qué centros necesitan más personal?"
• "¿De dónde vienen nuestros profesionales?"

¿Podrías reformular tu pregunta usando alguno de estos temas? Estoy aquí para ayudarte a entender mejor nuestro sistema sanitario.`;
      }

      return {
        naturalResponse,
        visualData,
        hasVisualData
      };

    } catch (error) {
      console.error("Error generating natural response:", error);
      return {
        naturalResponse: `❌ Disculpa, hubo un problema al analizar tu consulta. 

El sistema está experimentando algunas dificultades técnicas, pero puedo intentar ayudarte de todas formas.

¿Podrías intentar con una pregunta más específica? Por ejemplo:
• "¿Cuántos médicos tenemos?"
• "Estado general del sistema"
• "Centros que necesitan personal"`,
        visualData: null,
        hasVisualData: false
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const { naturalResponse, visualData, hasVisualData } = await generateNaturalResponse(inputMessage);
      
      const startTime = Date.now();
      
      // Add natural language response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: naturalResponse,
        timestamp: new Date(),
        metadata: {
          queryType: "natural_response",
          executionTime: Date.now() - startTime,
          hasVisualData
        }
      };

      setMessages(prev => [...prev, botMessage]);

      // Add visual data if available
      if (hasVisualData && visualData) {
        setTimeout(() => {
          const analysisMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: "analysis",
            content: "📊 **Datos Visuales Disponibles**",
            naturalResponse: "Puedes expandir esta sección para ver gráficos y tablas detalladas de los datos mencionados arriba.",
            timestamp: new Date(),
            visualData,
            metadata: {
              queryType: "visual_data",
              hasVisualData: true
            }
          };
          
          setMessages(prev => [...prev, analysisMessage]);
        }, 1000);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: `❌ **Error al procesar tu consulta**

Disculpa, hubo un problema técnico. El sistema de base de datos puede estar experimentando latencia desde Guinea Ecuatorial.

**Mientras tanto, puedes:**
• Intentar con una consulta más simple
• Revisar los datos mock que están disponibles
• Usar las otras secciones del dashboard

¿Quieres intentar de nuevo con una pregunta diferente?`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error temporal",
        description: "Problema de conectividad. Los datos mock están disponibles.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleResultsExpansion = (messageId: string) => {
    setExpandedResults(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <span>Asistente IA Conversacional</span>
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                {userRole}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={clearChat}>
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Nuevo Chat</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Messages Area */}
          <ScrollArea className="flex-1 min-h-96 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-4 ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : message.type === "system"
                          ? "bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-gray-800"
                          : message.type === "analysis"
                          ? "bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 text-gray-800"
                          : "bg-gray-50 border border-gray-200 text-gray-800"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {message.type === "bot" && (
                          <Bot className="w-5 h-5 mt-1 flex-shrink-0 text-blue-600" />
                        )}
                        {message.type === "user" && (
                          <User className="w-5 h-5 mt-1 flex-shrink-0" />
                        )}
                        {message.type === "system" && (
                          <Sparkles className="w-5 h-5 mt-1 flex-shrink-0 text-purple-600" />
                        )}
                        {message.type === "analysis" && (
                          <BarChart3 className="w-5 h-5 mt-1 flex-shrink-0 text-green-600" />
                        )}

                        <div className="flex-1">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>

                          {message.naturalResponse && (
                            <div className="mt-2 text-xs text-gray-600 italic">
                              {message.naturalResponse}
                            </div>
                          )}

                          {message.metadata?.executionTime && (
                            <div className="text-xs opacity-70 mt-2">
                              ⚡ {message.metadata.executionTime}ms
                            </div>
                          )}

                          {/* Visual Data Section */}
                          {message.type === "analysis" && message.visualData && (
                            <div className="mt-4 border-t pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleResultsExpansion(message.id)}
                                className="w-full"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {expandedResults[message.id] ? "Ocultar" : "Ver"} Datos Visuales
                                {expandedResults[message.id] ? (
                                  <ChevronUp className="w-4 h-4 ml-2" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 ml-2" />
                                )}
                              </Button>

                              {expandedResults[message.id] && (
                                <div className="mt-4 p-4 bg-white rounded-lg border">
                                  <AdvancedAnalyticsResults
                                    results={[{
                                      success: true,
                                      data: message.visualData,
                                      query: '',
                                      timestamp: new Date().toISOString()
                                    }]}
                                    onNavigateToTab={onNavigateToTab}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-xs">
                    <div className="flex items-center space-x-3">
                      <Bot className="w-5 h-5 text-blue-600" />
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Analizando datos...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>💬 Pregúntame sobre el sistema sanitario en lenguaje natural</span>
              <Badge variant="outline" className="text-xs">
                {getAllowedMetrics().length} métricas disponibles
              </Badge>
            </div>

            <div className="flex space-x-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ejemplo: ¿Cómo está la situación actual? o ¿Qué especialidades necesitan refuerzo?"
                className="flex-1 min-h-[80px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 h-20"
                size="lg"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedAIChat;
