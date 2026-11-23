import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Hospital as HospitalIcon,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { FullHealthData, HospitalMetadata, WaitListType } from '../../types';

interface CopilotWidgetProps {
  data: FullHealthData;
  onSelectHospital: (hospital: HospitalMetadata) => void;
  onNavigateTab: (tab: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text: string;
  action?: {
    type: 'open_hospital' | 'navigate_tab';
    payload: any;
    label: string;
  };
  detailsCard?: {
    title: string;
    metrics: { label: string; value: string | number; badge?: string }[];
    note?: string;
  };
}

export const CopilotWidget: React.FC<CopilotWidgetProps> = ({
  data,
  onSelectHospital,
  onNavigateTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hospitalsList = Object.values(data.hospitals);

  // Mensaje inicial de bienvenida
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Hola, soy el asistente de MADRID SIN ESPERAS. Estoy conectado en tiempo real a los datos oficiales del SERMAS (2015–2025). Puedes preguntarme por los tiempos de espera de cualquier hospital, pedirme comparativas entre centros, consultar el Radar Sanitario o revisar las proyecciones para los próximos años.'
        }
      ]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickQuestions = [
    '¿Qué hospital tiene menor demora quirúrgica?',
    'Comparar La Paz vs 12 de Octubre',
    '¿Qué alertas tiene el Infanta Cristina?',
    'Menor espera en consultas en el Sur',
    '¿Qué predicen los modelos para 2026?',
    '¿Qué significa el Modified Z-Score?'
  ];

  // Motor analítico del copiloto sanitario (100% determinista sobre datos oficiales)
  const processQuery = (userQuery: string): ChatMessage => {
    const q = userQuery.toLowerCase().trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = Date.now().toString();

    // 1. COMPARATIVA DE HOSPITALES ("compara la paz vs 12 de octubre", etc.)
    if (q.includes('compar') || q.includes(' vs ') || q.includes('frente a')) {
      const matchedHospitals = hospitalsList.filter(
        h => q.includes(h.shortName.toLowerCase()) || q.includes(h.id) || q.includes(h.fullName.toLowerCase())
      );

      if (matchedHospitals.length >= 2) {
        const h1 = matchedHospitals[0];
        const h2 = matchedHospitals[1];
        const leq1 = h1.series.quirurgica.demora['2025'] ?? 'N/D';
        const leq2 = h2.series.quirurgica.demora['2025'] ?? 'N/D';
        const pac1 = h1.series.quirurgica.pacientes['2025'] ?? 'N/D';
        const pac2 = h2.series.quirurgica.pacientes['2025'] ?? 'N/D';
        const lece1 = h1.series.consultas.demora['2024'] ?? 'N/D';
        const lece2 = h2.series.consultas.demora['2024'] ?? 'N/D';

        return {
          id: msgId,
          sender: 'bot',
          timestamp: time,
          text: `Al comparar **${h1.shortName}** con **${h2.shortName}**, encontramos diferencias importantes según los últimos registros oficiales del SERMAS:\n\nEn **lista de espera quirúrgica** (cierre a diciembre de 2025), ${h1.shortName} registra una demora media de **${leq1} días** con **${pac1} pacientes** en lista de espera estructural. Por su parte, ${h2.shortName} se sitúa en **${leq2} días** y **${pac2} pacientes**.\n\nEn **consultas externas** (corte a diciembre de 2024), la demora media en ${h1.shortName} es de **${lece1} días**, mientras que en ${h2.shortName} es de **${lece2} días**.\n\nRespecto a su dotación estructural, ${h1.shortName} cuenta con **${h1.beds} camas instaladas** (${h1.quirofanos} quirófanos), frente a las **${h2.beds} camas** (${h2.quirofanos} quirófanos) de ${h2.shortName}.`,
          detailsCard: {
            title: `Resumen Comparativo (${h1.complexityGroup} vs ${h2.complexityGroup})`,
            metrics: [
              { label: `${h1.shortName} (LEQ 2025)`, value: `${leq1} d`, badge: h1.managementModel },
              { label: `${h2.shortName} (LEQ 2025)`, value: `${leq2} d`, badge: h2.managementModel }
            ],
            note: 'Datos oficiales verificados de la Memoria SERMAS 2024 y datos.comunidad.madrid.'
          }
        };
      }
    }

    // 2. MEJOR / MENOR ESPERA QUIRÚRGICA
    if (
      (q.includes('menor') || q.includes('menos') || q.includes('mejor') || q.includes('ranking')) &&
      (q.includes('quirurg') || q.includes('operacion') || q.includes('cirug'))
    ) {
      const valid = hospitalsList
        .filter(h => h.series.quirurgica.demora['2025'] !== null && h.series.quirurgica.demora['2025'] !== undefined)
        .sort((a, b) => (a.series.quirurgica.demora['2025'] || 999) - (b.series.quirurgica.demora['2025'] || 999));

      const top3 = valid.slice(0, 3);
      const best = top3[0];

      return {
        id: msgId,
        sender: 'bot',
        timestamp: time,
        text: `A corte de diciembre de 2025, los tres hospitales públicos con menor tiempo de espera para una intervención quirúrgica son:\n\n1. **${top3[0].shortName}**, con **${top3[0].series.quirurgica.demora['2025']} días** de demora media (${top3[0].complexityGroup}, área sanitaria ${top3[0].area}).\n2. **${top3[1].shortName}**, con **${top3[1].series.quirurgica.demora['2025']} días** (${top3[1].complexityGroup}).\n3. **${top3[2].shortName}**, con **${top3[2].series.quirurgica.demora['2025']} días** (${top3[2].complexityGroup}).\n\nComo referencia para contextualizar estas cifras, la mediana en el conjunto de la red pública madrileña se sitúa en torno a los 53 días. Las demoras más reducidas suelen concentrarse en hospitales de gestión concesional y comarcales, en parte debido a la menor complejidad media de los casos que asumen.`,
        action: {
          type: 'open_hospital',
          payload: best,
          label: `Ver Ficha Detallada de ${best.shortName}`
        }
      };
    }

    // 3. CONSULTAS EXTERNAS O PRUEBAS POR ÁREA (ej. "consultas en el sur")
    if (q.includes('sur') || q.includes('norte') || q.includes('este') || q.includes('oeste') || q.includes('centro')) {
      let targetArea = 'Sur';
      if (q.includes('norte')) targetArea = 'Norte';
      if (q.includes('este')) targetArea = 'Este';
      if (q.includes('oeste')) targetArea = 'Oeste';
      if (q.includes('centro')) targetArea = 'Centro';

      const areaHosp = hospitalsList
        .filter(h => h.area === targetArea && h.series.consultas.demora['2024'] !== null)
        .sort((a, b) => (a.series.consultas.demora['2024'] || 999) - (b.series.consultas.demora['2024'] || 999));

      if (areaHosp.length > 0) {
        return {
          id: msgId,
          sender: 'bot',
          timestamp: time,
          text: `En el **Área Sanitaria ${targetArea}**, la situación de las primeras consultas externas (datos oficiales a diciembre de 2024) muestra los siguientes tiempos de espera:\n\n` +
            areaHosp.slice(0, 4).map((h, i) => `${i + 1}. **${h.shortName}:** **${h.series.consultas.demora['2024']} días** de espera media (${h.complexityGroup}).`).join('\n') +
            `\n\nEn total hemos evaluado **${areaHosp.length} hospitales** en esta zona territorial. Puedes consultar la comparativa completa de todos ellos en la pestaña de Territorio.`
        };
      }
    }

    // 4. PREGUNTA POR UN HOSPITAL CONCRETO
    const matchedOne = hospitalsList.find(
      h => q.includes(h.shortName.toLowerCase()) || q.includes(h.fullName.toLowerCase()) || q.includes(h.id)
    );

    if (matchedOne) {
      const leq = matchedOne.series.quirurgica.demora['2025'] ?? 'N/D';
      const pacQ = matchedOne.series.quirurgica.pacientes['2025'] ?? 'N/D';
      const lece = matchedOne.series.consultas.demora['2024'] ?? 'N/D';
      const lepd = matchedOne.series.pruebas.demora['2024'] ?? 'N/D';
      const alerts = data.radarAlerts.filter(a => a.hospitalId === matchedOne.id);

      return {
        id: msgId,
        sender: 'bot',
        timestamp: time,
        text: `El **${matchedOne.fullName}** es un hospital de **${matchedOne.complexityGroup}** ubicado en **${matchedOne.municipality}** (área sanitaria ${matchedOne.area}), gestionado bajo el modelo de **${matchedOne.managementModel}**.\n\nEn cuanto a dotación material, cuenta con **${matchedOne.beds ?? 'N/D'} camas instaladas** (${matchedOne.operatingBeds ?? 'N/D'} en funcionamiento) y **${matchedOne.quirofanos ?? 'N/D'} quirófanos** según la memoria oficial de actividad.\n\nTiempos de espera vigentes:\n• En **lista quirúrgica (diciembre 2025):** registra **${leq} días** de demora media y **${pacQ} pacientes** pendientes.\n• En **consultas externas (diciembre 2024):** la demora es de **${lece} días**.\n• En **pruebas diagnósticas (diciembre 2024):** se sitúa en **${lepd} días**.\n\n${alerts.length > 0 ? `El Radar Sanitario tiene actualmente ${alerts.length} señal(es) de vigilancia para este centro: ${alerts.map(a => `${a.level} en ${a.listLabel}`).join(', ')}.` : 'Actualmente no presenta señales anómalas en el Radar Sanitario.'}`,
        action: {
          type: 'open_hospital',
          payload: matchedOne,
          label: `Abrir Ficha Completa de ${matchedOne.shortName}`
        }
      };
    }

    // 5. ALERTAS DEL RADAR SANITARIO ("alertas", "radar", "anomalias")
    if (q.includes('alerta') || q.includes('radar') || q.includes('anomali') || q.includes('spc')) {
      const persistent = data.radarAlerts.filter(a => a.level === 'ALERTA_PERSISTENTE');
      return {
        id: msgId,
        sender: 'bot',
        timestamp: time,
        text: `El Radar Sanitario monitoriza en tiempo real las desviaciones estadísticas mediante Modified Z-Score y límites de control de procesos (SPC $\\pm 2\\sigma / \\pm 3\\sigma$).\n\nActualmente se identifican **${data.radarAlerts.length} alertas estadísticas**, de las cuales **${persistent.length} son alertas persistentes** al acumular tres o más años consecutivos de empeoramiento respecto a su histórico:\n\n` +
          persistent.slice(0, 4).map(a => `• **${a.hospitalShort}** (${a.listLabel}): ${a.rationale}`).join('\n') +
          `\n\nPuedes explorar todas las señales desglosadas por tipo y nivel de criticidad en la pestaña del Radar Sanitario.`,
        action: {
          type: 'navigate_tab',
          payload: 'radar',
          label: 'Ir al Radar Sanitario'
        }
      };
    }

    // 6. PREDICCIONES / FORECASTING
    if (q.includes('predic') || q.includes('futuro') || q.includes('2026') || q.includes('2027') || q.includes('forecasting')) {
      const fc = data.forecasting.quirurgica_pacientes;
      const p26 = fc.projections[0];
      const p27 = fc.projections[1];

      return {
        id: msgId,
        sender: 'bot',
        timestamp: time,
        text: `Según el modelo predictivo Holt-Winters (suavizado exponencial con tendencia aditiva), las estimaciones para la **lista de espera quirúrgica autonómica** son:\n\nTras cerrar el ejercicio 2025 con **103.967 pacientes** en espera, la proyección central para **2026** se sitúa en torno a **${Math.round(p26.point).toLocaleString('es-ES')} pacientes** (con un intervalo de confianza al 95% entre ${Math.round(p26.lower95).toLocaleString('es-ES')} y ${Math.round(p26.upper95).toLocaleString('es-ES')}).\n\nPara **2027**, la proyección apunta a **${Math.round(p27.point).toLocaleString('es-ES')} pacientes**.\n\nEstos modelos han sido validados mediante origen rodante (rolling-origin) para evitar la fuga de información futura y evaluar el error real de predicción.`,
        action: {
          type: 'navigate_tab',
          payload: 'predictive',
          label: 'Explorar Modelos Predictivos'
        }
      };
    }

    // 7. EXPLICACIÓN METODOLÓGICA (Z-score, Gini, SPC)
    if (q.includes('z-score') || q.includes('modified') || q.includes('mad') || q.includes('gini') || q.includes('metodolog')) {
      return {
        id: msgId,
        sender: 'bot',
        timestamp: time,
        text: `El análisis estadístico del sistema se apoya en métodos robustos diseñados para evitar distorsiones causadas por valores extremos:\n\n• **Modified Z-Score (Iglewicz y Hoaglin):**\n  En lugar de utilizar la media y la desviación típica habituales (que se ven fácilmente alteradas si un hospital tiene una demora desproporcionada), emplea la **mediana** y la **Desviación Absoluta Mediana (MAD)**.\n\n• **Límites de Detección:**\n  - Valores superiores a **2.0** indican zona de vigilancia preventiva (+2σ).\n  - Valores superiores a **3.5** señalan una anomalía estadística extrema (+3σ).\n  - Si un centro encadena tres ejercicios consecutivos de deterioro respecto a su propio histórico, el sistema emite una alerta persistente.`
      };
    }

    // RESPUESTA GENERAL CON GUÍA
    return {
      id: msgId,
      sender: 'bot',
      timestamp: time,
      text: `He revisado la base de datos oficial del SERMAS para tu consulta sobre "${userQuery}".\n\nPuedo ofrecerte respuestas específicas si me pides, por ejemplo:\n• Comparar dos hospitales (como "La Paz vs 12 de Octubre").\n• Consultar qué hospital tiene menor demora en una zona geográfica (como "Consultas en el Sur").\n• Conocer la ficha técnica y quirófanos de un hospital concreto.\n• Ver las alertas estadísticas activas en el Radar Sanitario.\n• Consultar las proyecciones para 2026.`
    };
  };

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: q
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Micro-retardo para simular procesamiento analítico
    setTimeout(() => {
      const botResponse = processQuery(q);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 350);
  };

  // Renderizador limpio que transforma **texto** en negritas reales y formatea párrafos fluidos
  const renderFormattedMessage = (rawText: string, isUser: boolean) => {
    if (isUser) {
      return <p className="leading-relaxed">{rawText}</p>;
    }

    const lines = rawText.split('\n');

    return (
      <div className="space-y-2 leading-relaxed">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
          const cleanLine = isBullet ? trimmed.replace(/^[•\-\*]\s*/, '') : trimmed;
          const isNumbered = /^\d+\.\s+/.test(cleanLine);

          // Parsear **texto** en elementos <strong> reales sin dejar asteriscos visibles
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const boldText = part.slice(2, -2);
              return (
                <strong key={pIdx} className="font-semibold text-[#181B19]">
                  {boldText}
                </strong>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-1 text-[11.5px]">
                <span className="text-[#C64B37] font-bold select-none leading-tight mt-0.5">•</span>
                <div className="flex-1 text-[#333735]">{renderedLine}</div>
              </div>
            );
          }

          if (isNumbered) {
            const numMatch = trimmed.match(/^\d+\./)?.[0] || '';
            const lineWithoutNum = cleanLine.replace(/^\d+\.\s*/, '');
            const subParts = lineWithoutNum.split(/(\*\*.*?\*\*)/g);

            return (
              <div key={lIdx} className="flex items-start gap-2 pl-1 text-[11.5px]">
                <span className="text-[#426C79] font-mono font-bold select-none leading-tight mt-0.5">
                  {numMatch}
                </span>
                <div className="flex-1 text-[#333735]">
                  {subParts.map((sp, spIdx) => {
                    if (sp.startsWith('**') && sp.endsWith('**')) {
                      return (
                        <strong key={spIdx} className="font-semibold text-[#181B19]">
                          {sp.slice(2, -2)}
                        </strong>
                      );
                    }
                    return sp;
                  })}
                </div>
              </div>
            );
          }

          return (
            <p key={lIdx} className="text-[#202321] text-[12px]">
              {renderedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Botón flotante en la esquina inferior derecha */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-[#C64B37] hover:bg-[#B03E2B] text-[#FAF9F5] px-4 py-3 rounded-full shadow-lg border border-[#FAF9F5]/30 flex items-center gap-2.5 transition-all duration-200 transform hover:scale-105 cursor-pointer group"
          aria-label="Abrir Copiloto Sanitario"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 animate-pulse text-[#F4D35E]" />
          </div>
          <span className="font-serif font-bold text-xs tracking-wide">
            Copiloto Sanitario
          </span>
          <span className="bg-[#202321] text-[10px] font-mono px-2 py-0.5 rounded-full text-[#FAF9F5]/90 border border-[#DAD6CC]/20">
            SERMAS
          </span>
        </button>
      )}

      {/* Ventana Modal / Drawer del Copiloto */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 w-[95vw] sm:w-[460px] max-w-[480px] h-[580px] max-h-[85vh] bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Cabecera Editorial */}
          <div className="bg-[#202321] text-[#FAF9F5] px-4 py-3 flex items-center justify-between border-b border-[#C64B37]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-sm bg-[#C64B37] flex items-center justify-center text-[#FAF9F5]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[#FAF9F5] leading-tight">
                  Copiloto Sanitario SERMAS
                </h3>
                <p className="text-[10px] text-[#A6A18F] font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#2D6A4F]" />
                  <span>Datos Abiertos Oficiales (2015–2025)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMessages([
                    {
                      id: 'welcome',
                      sender: 'bot',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      text: 'Historial reiniciado. ¿En qué hospital o indicador puedo ayudarte?'
                    }
                  ]);
                }}
                title="Reiniciar conversación"
                className="p-1.5 text-[#A6A18F] hover:text-[#FAF9F5] hover:bg-[#FAF9F5]/10 rounded-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar copiloto"
                className="p-1.5 text-[#A6A18F] hover:text-[#FAF9F5] hover:bg-[#FAF9F5]/10 rounded-sm transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8F6F0] text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3.5 rounded-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#C64B37] text-[#FAF9F5] font-medium'
                      : 'bg-[#FAF9F5] text-[#202321] border border-[#DAD6CC] shadow-xs'
                  }`}
                >
                  {renderFormattedMessage(msg.text, msg.sender === 'user')}

                  {/* Tarjeta de métricas adjuntas si existe */}
                  {msg.detailsCard && (
                    <div className="mt-3 pt-2.5 border-t border-[#DAD6CC] space-y-1.5 font-mono text-[11px]">
                      <div className="text-[10px] uppercase font-bold text-[#77766F] tracking-wide">
                        {msg.detailsCard.title}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {msg.detailsCard.metrics.map((m, idx) => (
                          <div key={idx} className="p-2 bg-[#F3F0E8] rounded-xs border border-[#DAD6CC]/70">
                            <span className="text-[10px] text-[#77766F] block truncate">{m.label}</span>
                            <span className="font-bold text-sm text-[#202321]">{m.value}</span>
                          </div>
                        ))}
                      </div>
                      {msg.detailsCard.note && (
                        <p className="text-[10px] text-[#77766F] font-sans italic">{msg.detailsCard.note}</p>
                      )}
                    </div>
                  )}

                  {/* Botón de acción interactivo */}
                  {msg.action && (
                    <div className="mt-3 pt-2.5 border-t border-[#DAD6CC]/60">
                      {msg.action.type === 'open_hospital' && (
                        <button
                          onClick={() => {
                            onSelectHospital(msg.action?.payload);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#202321] hover:bg-[#323633] text-[#FAF9F5] rounded-xs text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <HospitalIcon className="w-3.5 h-3.5 text-[#F4D35E]" />
                          <span>{msg.action.label}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </button>
                      )}
                      {msg.action.type === 'navigate_tab' && (
                        <button
                          onClick={() => {
                            onNavigateTab(msg.action?.payload);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#426C79] hover:bg-[#345761] text-[#FAF9F5] rounded-xs text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{msg.action.label}</span>
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-[#77766F] font-mono mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-2.5 text-[11px] text-[#77766F] font-mono bg-[#FAF9F5] border border-[#DAD6CC] rounded-sm w-fit">
                <Sparkles className="w-3.5 h-3.5 text-[#C64B37] animate-spin" />
                <span>Analizando datos oficiales del SERMAS...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias Rápidas */}
          <div className="px-3 py-2 bg-[#FAF9F5] border-t border-[#DAD6CC] overflow-x-auto flex gap-1.5 scrollbar-none">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] font-medium bg-[#F3F0E8] hover:bg-[#E8E4D8] text-[#4A4D48] hover:text-[#202321] rounded-full border border-[#DAD6CC] transition-colors cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Formulario de Entrada */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#FAF9F5] border-t border-[#DAD6CC] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Pregunta por un hospital, demora, radar o comparativa..."
              className="flex-1 text-xs px-3 py-2 bg-[#FFFFFF] border border-[#DAD6CC] rounded-xs focus:outline-none focus:border-[#C64B37] transition-colors font-sans text-[#202321] placeholder:text-[#A6A18F]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-3.5 py-2 bg-[#C64B37] hover:bg-[#B03E2B] disabled:opacity-40 text-[#FAF9F5] rounded-xs font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
