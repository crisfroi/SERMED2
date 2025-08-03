import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DataExportDialog } from "@/components/dashboard/DataExportDialog"; // Ajusta la ruta según tu estructura
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  BarChart3,
  TrendingUp,
  Database,
  Sparkles,
  Filter,
  Download,
  RefreshCw,
  Lightbulb,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useAdvancedAnalyticsAI, 
  AdvancedStatsQuery, 
  ANALYTICS_CATEGORIES 
} from "@/hooks/useAdvancedAnalyticsAI";
import { AdvancedAnalyticsResults } from "./AdvancedAnalyticsResults";

interface Message {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  query?: AdvancedStatsQuery;
  suggestions?: string[];
  data?: any; // Para almacenar datos del análisis
}

interface AIAdvancedAnalyticsChatProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const AIAdvancedAnalyticsChat: React.FC<AIAdvancedAnalyticsChatProps> = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showResults, setShowResults] = useState(false);
  const [isResultsExpanded, setIsResultsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { userRole } = useAuth();
  
  const {
    loading,
    results,
    error,
    queryStats,
    clearResults,
    getSuggestions,
    parseNaturalLanguage,
    categories
  } = useAdvancedAnalyticsAI();

  // Función para generar respuesta natural basada en los datos
  const generateNaturalResponse = (data: any, query: string): string => {
    if (!data) return "No se encontraron datos para analizar.";

    try {
      let response = "";
      
      // Análisis por tipo de consulta
      switch(query) {
        case 'demographics':
          if (data.total_profesionales) {
            response += `📊 **Análisis Demográfico Completado**\n\n`;
            response += `En el sistema tenemos **${data.total_profesionales.toLocaleString()} profesionales** registrados.\n\n`;
            
            if (data.genero) {
              const genders = Object.entries(data.genero);
              const totalGender = genders.reduce((sum, [_, count]) => sum + (count as number), 0);
              response += `**Distribución por Género:**\n`;
              genders.forEach(([gender, count]) => {
                const percentage = ((count as number / totalGender) * 100).toFixed(1);
                response += `• ${gender}: ${count} profesionales (${percentage}%)\n`;
              });
            }
            
            if (data.grupos_edad) {
              response += `\n**Grupos Etarios:**\n`;
              Object.entries(data.grupos_edad).forEach(([group, count]) => {
                response += `• ${group} años: ${count} profesionales\n`;
              });
            }
            
            if (data.nacionalidades) {
              const topNationalities = Object.entries(data.nacionalidades)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 3);
              response += `\n**Principales Nacionalidades:**\n`;
              topNationalities.forEach(([nationality, count]) => {
                response += `• ${nationality}: ${count} profesionales\n`;
              });
            }
          }
          break;

        case 'professional_areas':
          response += `🏥 **Análisis de Áreas Profesionales**\n\n`;
          if (data.areas_profesionales) {
            const topAreas = Object.entries(data.areas_profesionales)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 5);
            response += `**Áreas más comunes:**\n`;
            topAreas.forEach(([area, count]) => {
              response += `• ${area}: ${count} profesionales\n`;
            });
          }
          
          if (data.especialidades) {
            const specialtyCount = Object.keys(data.especialidades).length;
            response += `\n📚 **Diversidad:** ${specialtyCount} especialidades diferentes registradas\n`;
          }
          break;

        case 'education':
          response += `🎓 **Análisis de Formación Académica**\n\n`;
          if (data.paises_formacion) {
            const topCountries = Object.entries(data.paises_formacion)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 3);
            response += `**Principales países de formación:**\n`;
            topCountries.forEach(([country, count]) => {
              response += `• ${country}: ${count} profesionales\n`;
            });
          }
          
          if (data.años_graduacion) {
            response += `\n**Períodos de graduación activos:**\n`;
            Object.entries(data.años_graduacion).forEach(([period, count]) => {
              response += `• ${period}: ${count} graduados\n`;
            });
          }
          break;

        case 'work_centers':
          response += `🏢 **Análisis de Centros de Trabajo**\n\n`;
          if (data.centros_trabajo) {
            const totalCenters = Object.keys(data.centros_trabajo).length;
            const topCenters = Object.entries(data.centros_trabajo)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 3);
            
            response += `**Distribución laboral:** ${totalCenters} centros de trabajo activos\n\n`;
            response += `**Centros con más personal:**\n`;
            topCenters.forEach(([center, count]) => {
              response += `• ${center}: ${count} profesionales\n`;
            });
          }
          
          if (data.tipos_sector) {
            response += `\n**Por sector:**\n`;
            Object.entries(data.tipos_sector).forEach(([sector, count]) => {
              response += `• ${sector}: ${count} profesionales\n`;
            });
          }
          break;

        case 'application_status':
          response += `📋 **Análisis de Estados de Solicitud**\n\n`;
          if (data.estados_solicitud) {
            response += `**Estado actual de solicitudes:**\n`;
            Object.entries(data.estados_solicitud).forEach(([status, count]) => {
              response += `• ${status}: ${count} solicitudes\n`;
            });
          }
          
          if (data.tasa_aprobacion && data.tasa_aprobacion > 0) {
            response += `\n✅ **Tasa de aprobación:** ${data.tasa_aprobacion.toFixed(1)}%\n`;
          }
          break;

        case 'carnet_generation':
          response += `🆔 **Análisis de Generación de Carnets**\n\n`;
          response += `📊 **Estadísticas actuales:**\n`;
          response += `• Carnets generados: ${data.carnets_generados || 0}\n`;
          response += `• En cola de generación: ${data.en_cola_generacion || 0}\n`;
          
          if (data.estados_cola) {
            response += `\n**Estados de la cola:**\n`;
            Object.entries(data.estados_cola).forEach(([status, count]) => {
              response += `• ${status}: ${count} elementos\n`;
            });
          }
          break;

        case 'comprehensive':
          response += `🎯 **Análisis Comprehensivo del Sistema**\n\n`;
          response += `📈 **Resumen Ejecutivo:**\n`;
          
          if (data.demograficas?.total_profesionales) {
            response += `• **${data.demograficas.total_profesionales.toLocaleString()} profesionales** en el sistema\n`;
          }
          
          if (data.centros?.total_centros) {
            response += `• **${data.centros.total_centros} centros de salud** registrados\n`;
          }
          
          if (data.carnets?.carnets_generados) {
            response += `• **${data.carnets.carnets_generados} carnets** generados\n`;
          }
          
          if (data.solicitudes?.tasa_aprobacion) {
            response += `• **${data.solicitudes.tasa_aprobacion.toFixed(1)}%** tasa de aprobación\n`;
          }
          
          response += `\n💡 Este es un resumen general. Para análisis detallados, consulta los gráficos y tablas en el panel de resultados.\n`;
          break;

        default:
          response = `✅ **Análisis completado**\n\nHe procesado tu consulta y encontré información relevante. Los datos se muestran en detalle en el panel de resultados.`;
      }
      
      response += `\n\n📊 **¿Quieres ver más detalles?** Revisa los gráficos y tablas en el panel de resultados para un análisis más profundo.`;
      
      return response;
      
    } catch (error) {
      return `✅ **Análisis completado**\n\nHe encontrado datos para tu consulta. Revisa el panel de resultados para ver los detalles completos.`;
    }
  };

  // Mensaje de bienvenida inicial
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      type: "system",
      content: `¡Hola! Soy tu asistente de IA especializado en análisis avanzado de estadísticas del sistema de profesionales sanitarios de Guinea Ecuatorial. 

Como usuario con rol **"${userRole}"**, tengo acceso completo a todos los datos del sistema para proporcionarte análisis detallados.

**¿Qué puedo analizar por ti?**

📊 **Categorías de Análisis Disponibles:**
${categories.map(cat => `• **${cat.name}**: ${cat.description}`).join('\n')}

**Ejemplos de consultas:**
• "¿Cuántos profesionales hay por género?"
• "¿Cuáles son las áreas profesionales más comunes?"
• "¿En qué países se formaron más profesionales?"
• "¿Qué centros tienen más profesionales?"
• "Dame un análisis completo de todos los datos"

¡Pregúntame cualquier cosa sobre los datos del sistema!`,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
  }, [userRole, categories]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setShowSuggestions(false);

    // Procesar la consulta
    const parsedQuery = parseNaturalLanguage(inputMessage);
    if (parsedQuery) {
      try {
        const suggestions = getSuggestions(inputMessage);
        
        // Mensaje de procesamiento
        const processingMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `🔍 **Procesando consulta...**\n\nAnalizando: "${parsedQuery.description}"\nCategoría: ${categories.find(cat => cat.queries.includes(parsedQuery.query))?.name || 'Análisis General'}`,
          timestamp: new Date(),
          query: parsedQuery,
          suggestions
        };

        setMessages(prev => [...prev, processingMessage]);

        // Ejecutar la consulta
        const result = await queryStats(parsedQuery);

        // *** AQUÍ ESTÁ EL CAMBIO PRINCIPAL ***
        // Generar respuesta natural basada en los datos
        const naturalResponse = result.success && result.data 
          ? generateNaturalResponse(result.data, parsedQuery.query)
          : `❌ **Error en el análisis**\n\nNo pude procesar tu consulta: ${result.error}`;

        // Mensaje de resultado con respuesta natural
        const resultMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "bot",
          content: naturalResponse,
          timestamp: new Date(),
          query: parsedQuery,
          data: result.data // Guardar datos para referencia
        };

        setMessages(prev => [...prev, resultMessage]);

        if (result.success) {
          setShowResults(true); // Mostrar panel de resultados
          toast({
            title: "Análisis completado",
            description: "Los resultados están listos para revisar",
          });
        } else {
          toast({
            title: "Error en el análisis",
            description: result.error || "Error desconocido",
            variant: "destructive"
          });
        }

      } catch (error) {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "bot",
          content: `❌ **Error inesperado**\n\nOcurrió un error al procesar tu consulta. Por favor, intenta de nuevo.`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: "Error",
          description: "Error inesperado al procesar la consulta",
          variant: "destructive"
        });
      }
    } else {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: `🤔 **No pude entender tu consulta**\n\nPor favor, reformula tu pregunta o usa una de estas categorías:\n\n${categories.map(cat => `• **${cat.name}**: ${cat.examples[0]}`).join('\n')}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setInputMessage(category.examples[0]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    clearResults();
    setShowResults(false);
    toast({
      title: "Chat limpiado",
      description: "Se han eliminado todos los mensajes y resultados",
    });
  };

  const filteredCategories = selectedCategory === "all" 
    ? categories 
    : categories.filter(cat => cat.id === selectedCategory);

  return (
    <div className="h-full flex flex-col max-w-full overflow-hidden">
      {/* Header */}
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">IA Analytics Avanzado</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {userRole}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {showResults && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResultsExpanded(!isResultsExpanded)}
              >
                {isResultsExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className={`flex-1 flex gap-4 p-4 overflow-hidden ${isResultsExpanded ? 'flex-col' : 'flex-row'}`}>
        {/* Panel principal - Chat */}
        <div className={`flex flex-col overflow-hidden ${isResultsExpanded ? 'h-1/2' : 'flex-1'}`}>
          {/* Categorías de análisis - Compactas */}
          <Card className="flex-shrink-0 mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Categorías de Análisis
                </CardTitle>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {filteredCategories.slice(0, 8).map(category => (
                  <Button
                    key={category.id}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-8 px-2 text-xs"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <span className="truncate">{category.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat - Área principal */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.type !== "user" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.type === "system"
                            ? "bg-muted"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">
                              Sugerencias relacionadas:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.suggestions.slice(0, 3).map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6 px-2"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion.length > 25 ? suggestion.substring(0, 25) + '...' : suggestion}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {message.type === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input - Área fija */}
            <div className="flex-shrink-0 p-4 border-t">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      setShowSuggestions(e.target.value.length > 2);
                    }}
                    onKeyPress={handleKeyPress}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Escribe tu consulta de análisis..."
                    disabled={loading}
                    className="pr-10"
                  />
                  {showSuggestions && inputMessage.length > 2 && (
                    <div className="absolute top-full left-0 right-0 bg-background border rounded-lg shadow-lg z-50 mt-1 max-h-32 overflow-y-auto">
                      {getSuggestions(inputMessage).slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <span className="truncate block">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="flex-shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Panel de resultados - Responsive */}
        {showResults && (
          <div className={`overflow-hidden ${isResultsExpanded ? 'h-1/2' : 'w-2/5 min-w-96'}`}>
            <Card className="h-full">
              <CardHeader className="flex-shrink-0 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Resultados del Análisis
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {results.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {results.length} análisis
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowResults(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <AdvancedAnalyticsResults 
                      results={results} 
                      categories={categories} 
                    />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAdvancedAnalyticsChat;
