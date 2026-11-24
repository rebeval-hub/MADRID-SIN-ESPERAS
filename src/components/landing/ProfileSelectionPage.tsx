import React, { useState } from 'react';
import {
  Compass,
  BarChart3,
  MapPin,
  HeartPulse,
  LineChart,
  ArrowRight,
  ShieldCheck,
  Building2,
  Database,
  Users,
  Search,
  Sparkles,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { FullHealthData, HospitalMetadata } from '../../types';
import { analyzePatientQuery, PatientRecommendation } from '../../utils/patientConsultationEngine';

interface ProfileSelectionPageProps {
  onSelectProfile: (profile: 'patient' | 'analyst') => void;
  data?: FullHealthData;
  onSelectHospital?: (hospital: HospitalMetadata) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendation?: PatientRecommendation;
}

const QUICK_PROMPTS = [
  'VIVO EN VILLAVERDE Y ME QUIERO OPERAR DE LOS OJOS QUE HOSPITALES RECOMIENDAS',
  'Vivo en Alcalá de Henares y necesito cita con Dermatología',
  'Vivo en Móstoles y quiero saber tiempos para operarme de traumatología',
  'Tengo cita en La Paz pero busco menor tiempo de espera quirúrgica'
];

export const ProfileSelectionPage: React.FC<ProfileSelectionPageProps> = ({
  onSelectProfile,
  data,
  onSelectHospital
}) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAsk = (userText: string) => {
    const cleanText = userText.trim();
    if (!cleanText || !data) return;

    setIsProcessing(true);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: cleanText
    };

    const recommendation = analyzePatientQuery(cleanText, data);

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      sender: 'assistant',
      text: recommendation.explanationText,
      recommendation
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setQuery('');
    setIsProcessing(false);
  };

  const handleClearChat = () => {
    setMessages([]);
    setQuery('');
  };

  return (
    <div className="min-h-screen bg-[#F3F0E8] text-[#202321] flex flex-col justify-between font-sans antialiased selection:bg-[#C64B37] selection:text-[#FAF9F5]">
      {/* Top micro-bar */}
      <div className="bg-[#FAF9F5] border-b border-[#DAD6CC] px-4 sm:px-8 py-2.5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs text-[#77766F] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C64B37] inline-block animate-pulse" />
            <span className="text-[#202321] font-semibold">DATAMAD 2026</span>
            <span className="hidden sm:inline">· Comunidad de Madrid</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Datos Oficiales Abiertos</span>
            <span>·</span>
            <span className="text-[#426C79] font-medium">Red Hospitalaria SERMAS</span>
          </div>
        </div>
      </div>

      {/* Main hero & selection */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16 max-w-[1240px] mx-auto w-full">
        {/* Masthead Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <img
              src="/assets/aistudio/1958ecc3-383f-4604-95d1-fa7bdd5612c2_62eeedc1.png"
              alt="MADRID SIN ESPERAS"
              className="h-12 sm:h-14 w-auto object-contain select-none"
            />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#202321] leading-none">
              MADRID SIN ESPERAS
            </h1>
            <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-[#C64B37] font-semibold">
              INTELIGENCIA SANITARIA AL SERVICIO DE LAS PERSONAS
            </p>
          </div>

          <p className="text-sm sm:text-base text-[#77766F] max-w-2xl mx-auto leading-relaxed pt-1">
            Una plataforma para comprender las listas de espera sanitarias y explorar la información hospitalaria de la Comunidad de Madrid.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* CHAT RÁPIDO DE CONSULTA INICIAL PARA PACIENTES */}
        {/* ========================================================================= */}
        <section className="w-full max-w-4xl mx-auto mb-12">
          <div className="bg-[#FAF9F5] border-2 border-[#426C79] rounded-md shadow-md overflow-hidden">
            {/* Header del Chat Rápido */}
            <div className="bg-gradient-to-r from-[#426C79] to-[#345661] text-[#FAF9F5] px-5 sm:px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#FAF9F5]/20 rounded">
                  <Sparkles className="w-4 h-4 text-[#FAF9F5]" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-semibold tracking-wide">
                    Consulta Rápida para Pacientes
                  </h2>
                  <p className="text-xs text-[#FAF9F5]/80 font-mono">
                    Orientación directa sobre tu zona, hospital de referencia y menores tiempos de espera
                  </p>
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="flex items-center gap-1 text-xs text-[#FAF9F5]/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded transition-colors"
                  title="Reiniciar consulta"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nueva consulta</span>
                </button>
              )}
            </div>

            {/* Cuerpo del Chat / Respuestas */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[520px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-6 px-4 space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#426C79]/10 text-[#426C79] mb-1">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg text-[#202321] font-semibold">
                      ¿Dónde vives y qué procedimiento o consulta necesitas?
                    </h3>
                    <p className="text-xs sm:text-sm text-[#77766F] max-w-lg mx-auto leading-relaxed">
                      Escribe tu consulta o haz clic en los ejemplos rápidos para conocer qué hospital te corresponde y qué centros tienen menor demora con libre elección de la Comunidad de Madrid.
                    </p>
                  </div>

                  {/* Chips de sugerencia rápida */}
                  <div className="pt-2">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[#77766F] mb-2 font-semibold">
                      Preguntas frecuentes rápidas:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {QUICK_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAsk(prompt)}
                          className="text-left text-xs bg-[#F3F0E8] hover:bg-[#426C79] hover:text-[#FAF9F5] text-[#202321] border border-[#DAD6CC] hover:border-[#426C79] px-3.5 py-2 rounded-full transition-all duration-150 shadow-2xs font-medium cursor-pointer"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {msg.sender === 'user' ? (
                        <div className="bg-[#426C79] text-[#FAF9F5] px-4 py-2.5 rounded-lg rounded-tr-none max-w-[85%] sm:max-w-[75%] text-sm font-medium shadow-xs">
                          {msg.text}
                        </div>
                      ) : (
                        <div className="bg-[#F3F0E8] border border-[#DAD6CC] rounded-lg rounded-tl-none p-4 sm:p-5 max-w-[95%] sm:max-w-[90%] text-sm text-[#202321] space-y-4 shadow-xs">
                          {/* Texto explicativo fluido */}
                          <div className="leading-relaxed whitespace-pre-line text-[#202321]">
                            {msg.text}
                          </div>

                          {/* Tarjetas de hospitales recomendados */}
                          {msg.recommendation && (
                            <div className="pt-2 space-y-3">
                              {/* Hospital de Referencia Asignado */}
                              {msg.recommendation.referenceHospital && (
                                <div className="bg-[#FAF9F5] border border-[#DAD6CC] p-3.5 rounded-sm">
                                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#426C79] uppercase bg-[#426C79]/10 px-2 py-0.5 rounded">
                                      <Building2 className="w-3.5 h-3.5" />
                                      Tu Hospital de Referencia Asignado
                                    </span>
                                    {msg.recommendation.referenceHospital.waitDays !== null && (
                                      <span className="text-xs font-mono font-bold text-[#C64B37] bg-[#C64B37]/10 px-2 py-0.5 rounded">
                                        Demora media: {msg.recommendation.referenceHospital.waitDays} días
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <h4 className="font-semibold text-sm text-[#202321]">
                                        {msg.recommendation.referenceHospital.hospital.fullName}
                                      </h4>
                                      <p className="text-xs text-[#77766F]">
                                        {msg.recommendation.referenceHospital.reason}
                                      </p>
                                    </div>
                                    {onSelectHospital && (
                                      <button
                                        type="button"
                                        onClick={() => onSelectHospital(msg.recommendation!.referenceHospital!.hospital)}
                                        className="shrink-0 text-xs bg-[#FAF9F5] hover:bg-[#426C79] text-[#426C79] hover:text-[#FAF9F5] border border-[#426C79] px-2.5 py-1.5 rounded transition-colors font-medium cursor-pointer"
                                      >
                                        Ver Ficha
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Alternativas con Menor Demora */}
                              {msg.recommendation.alternativeHospitals.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#202321] font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                                    <span>Centros con Menor Demora (Libre Elección de Madrid)</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {msg.recommendation.alternativeHospitals.map((alt, idx) => (
                                      <div
                                        key={alt.hospital.id || idx}
                                        className="bg-[#FAF9F5] border border-[#DAD6CC] hover:border-[#426C79] p-3 rounded-sm flex flex-col justify-between transition-colors"
                                      >
                                        <div>
                                          <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="text-[10px] font-mono text-[#2E7D32] bg-[#2E7D32]/10 px-1.5 py-0.5 rounded font-semibold">
                                              {alt.waitDays !== null ? `${alt.waitDays} días de espera` : 'Menor espera'}
                                            </span>
                                            <span className="text-[10px] font-mono text-[#77766F]">
                                              {alt.hospital.area}
                                            </span>
                                          </div>
                                          <h5 className="font-medium text-xs text-[#202321] line-clamp-1">
                                            {alt.hospital.fullName}
                                          </h5>
                                          <p className="text-[11px] text-[#77766F] mt-0.5 line-clamp-2">
                                            {alt.reason}
                                          </p>
                                        </div>
                                        {onSelectHospital && (
                                          <div className="mt-2.5 pt-2 border-t border-[#DAD6CC]/60 flex justify-end">
                                            <button
                                              type="button"
                                              onClick={() => onSelectHospital(alt.hospital)}
                                              className="text-[11px] text-[#426C79] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>Ficha y demoras</span>
                                              <ChevronRight className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Aviso Legal de Libre Elección */}
                              <div className="bg-[#FAF9F5] border-l-3 border-[#426C79] p-2.5 rounded-xs text-[11.5px] text-[#77766F] leading-snug">
                                <strong className="text-[#202321]">Tu Derecho en el SERMAS: </strong>
                                {msg.recommendation.legalNotice}
                              </div>

                              {/* Acceso a la ruta de paciente */}
                              <div className="pt-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => onSelectProfile('patient')}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#426C79] hover:bg-[#345661] text-[#FAF9F5] text-xs font-semibold rounded-sm transition-colors cursor-pointer shadow-2xs"
                                >
                                  <span>Explorar Mapa y Comparador Completo de Paciente</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-xs text-[#77766F] italic">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-[#426C79]" />
                      <span>Analizando tiempos de espera en los 31 hospitales de la Comunidad de Madrid...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Barra de entrada de texto */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAsk(query);
              }}
              className="border-t border-[#DAD6CC] bg-[#FAF9F5] p-3 sm:p-4 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#77766F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Escribe tu consulta (ej. Vivo en Villaverde y me quiero operar de los ojos qué recomiendas)..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-white border border-[#DAD6CC] rounded-sm text-[#202321] placeholder:text-[#77766F] focus:outline-none focus:ring-1 focus:ring-[#426C79] focus:border-[#426C79]"
                />
              </div>
              <button
                type="submit"
                disabled={!query.trim() || isProcessing}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#426C79] hover:bg-[#345661] disabled:opacity-50 text-[#FAF9F5] font-semibold text-xs sm:text-sm rounded-sm transition-colors shadow-2xs cursor-pointer"
              >
                <span>Consultar</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </section>

        <div className="text-center mb-8">
          <span className="inline-block text-xs font-mono font-semibold tracking-wider text-[#202321] uppercase bg-[#FAF9F5] border border-[#DAD6CC] px-4 py-1.5 rounded-full shadow-xs">
            O SELECCIONA TU ENTORNO DE TRABAJO
          </span>
        </div>

        {/* 2 Big Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl mx-auto">
          {/* Card 1: SOY PACIENTE */}
          <div
            onClick={() => onSelectProfile('patient')}
            className="group relative bg-[#FAF9F5] rounded-sm border-2 border-[#DAD6CC] hover:border-[#426C79] p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#426C79] tracking-wider uppercase bg-[#426C79]/10 px-2.5 py-1 rounded-xs">
                  Experiencia Ciudadana
                </span>
                <div className="flex items-center gap-1.5 text-[#426C79]">
                  <HeartPulse className="w-5 h-5" />
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#202321] group-hover:text-[#426C79] transition-colors">
                  SOY PACIENTE
                </h2>
                <p className="text-xs font-mono text-[#77766F] mt-0.5">
                  MI RUTA SANITARIA · ASISTENTE INTERACTIVO
                </p>
              </div>

              <p className="text-sm text-[#202321]/80 leading-relaxed">
                Encuentra y compara información sobre los hospitales de tu entorno. Explora las alternativas disponibles y conoce los indicadores de espera publicados.
              </p>

              <div className="pt-2 border-t border-[#DAD6CC]/70 space-y-1.5 text-xs text-[#77766F]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#426C79] rounded-full" />
                  <span>Explora hospitales por cercanía a tu municipio</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#426C79] rounded-full" />
                  <span>Mapa geográfico interactivo real de Madrid</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#426C79] rounded-full" />
                  <span>Comparador transparente con demoras oficiales</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 bg-[#426C79] group-hover:bg-[#345661] text-[#FAF9F5] font-semibold text-sm rounded-sm transition-colors shadow-xs cursor-pointer"
              >
                <span>ACCEDER COMO PACIENTE</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Card 2: SOY ANALISTA */}
          <div
            onClick={() => onSelectProfile('analyst')}
            className="group relative bg-[#FAF9F5] rounded-sm border-2 border-[#DAD6CC] hover:border-[#C64B37] p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#C64B37] tracking-wider uppercase bg-[#C64B37]/10 px-2.5 py-1 rounded-xs">
                  Plataforma Especializada
                </span>
                <div className="flex items-center gap-1.5 text-[#C64B37]">
                  <BarChart3 className="w-5 h-5" />
                  <LineChart className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#202321] group-hover:text-[#C64B37] transition-colors">
                  SOY ANALISTA
                </h2>
                <p className="text-xs font-mono text-[#77766F] mt-0.5">
                  PANEL CUANTITATIVO, TERRITORIAL Y PREDICTIVO
                </p>
              </div>

              <p className="text-sm text-[#202321]/80 leading-relaxed">
                Accede al análisis estadístico, territorial y predictivo de las listas de espera de la Comunidad de Madrid.
              </p>

              <div className="pt-2 border-t border-[#DAD6CC]/70 space-y-1.5 text-xs text-[#77766F]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#C64B37] rounded-full" />
                  <span>8 módulos analíticos completos con 31 hospitales</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#C64B37] rounded-full" />
                  <span>Radar Sanitario SPC y Radar Territorial</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#C64B37] rounded-full" />
                  <span>Modelos predictivos Holt y exportación oficial CSV</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 bg-[#C64B37] group-hover:bg-[#AE3E2C] text-[#FAF9F5] font-semibold text-sm rounded-sm transition-colors shadow-xs cursor-pointer"
              >
                <span>ACCEDER COMO ANALISTA</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Ethical / Methodological Micro-Guarantee Banner */}
        <div className="mt-10 max-w-3xl mx-auto bg-[#FAF9F5]/70 border border-[#DAD6CC] rounded-sm p-4 text-center">
          <p className="text-xs text-[#77766F] leading-relaxed">
            <strong className="text-[#202321]">Compromiso de Integridad Informativa:</strong> Ambas experiencias utilizan la misma base de datos oficial auditada del Servicio Madrileño de Salud (SERMAS) y del Portal de Datos Abiertos de la Comunidad de Madrid, distinguiendo siempre entre datos observados, estimaciones y campos no disponibles.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DAD6CC] bg-[#FAF9F5] py-5 px-4 text-center text-[#77766F] space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]">
          UN PROYECTO DESARROLLADO PARA DATAMAD 2026
        </p>
        <p className="text-xs font-medium text-[#202321]">
          Rebeca del Val · Emir Jiménez
        </p>
        <p className="font-mono text-[10.5px] text-[#77766F]">
          Ciencia de Datos · Universidad Complutense de Madrid
        </p>
      </footer>
    </div>
  );
};
