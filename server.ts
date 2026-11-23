import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'madrid-sin-esperas-4' });
});

app.post('/api/ai/explain', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(400).json({
        error:
          'No hay una clave GEMINI_API_KEY configurada en el entorno del servidor (Settings > Secrets). Los cálculos estadísticos siguen operando de forma reproducible.',
      });
      return;
    }

    const { topic, listLabel, period, structuredResults, customQuestion } = req.body ?? {};
    if (!structuredResults) {
      res.status(400).json({ error: 'Se requieren resultados estructurados calculados para generar la interpretación.' });
      return;
    }

    const systemInstruction = `Eres un analista estadístico senior en inteligencia sanitaria del Servicio Madrileño de Salud (SERMAS).
Tu única función es INTERPRETAR en español claro, riguroso y accionable los resultados numéricos EXACTOS que recibes en el JSON adjunto.

REGLAS ESTRICTAS DE RIGOR CIENTÍFICO (OBLIGATORIAS):
1. PROHIBIDO inventar cifras, redondear de forma inconsistente o realizar cálculos nuevos no presentes en el JSON. Cita únicamente números, hospitales, periodos y métricas que aparezcan explícitamente en los datos recibidos.
2. Cita siempre el tipo de lista (${listLabel || 'especificada en los datos'}) y el periodo exacto de corte (${period || 'especificado en los datos'}) en cada afirmación.
3. PROHIBIDO etiquetar hospitales como "malos", "ineficientes" o atribuir causalidad clínica sin evidencia. Usa lenguaje analítico prudente ("merece investigación", "desviación estadística respecto a su cluster", "asociación observada").
4. Distingue estrictamente:
   - Correlación ≠ causalidad.
   - Anomalía estadística ≠ fallo asistencial demostrado.
   - Similitud estadística ≠ equivalencia clínica o de case-mix.
   - Menor volumen de pacientes pendientes ≠ capacidad ociosa disponible para derivaciones automáticas.
   - Concentración de pacientes (Lorenz/Gini/HHI) ≠ desigualdad en tiempos de espera.
5. Si los datos tienen limitaciones (p. ej. cortes anuales sin desagregación mensual, ausencia de datos por hospital×especialidad o falta de ajuste por GRD), menciónalo explícitamente.
6. Estructura la respuesta de forma escaneable con viñetas cortas y claras:
   - Síntesis de hallazgos clave (con cifras exactas)
   - Matices metodológicos y cautelas de interpretación
   - Líneas de investigación sugeridas (sin prescribir derivaciones automáticas)`;

    const userPrompt = `Tema analítico solicitado: ${topic || 'Resumen integral del Radar de Oportunidades'}
Lista activa: ${listLabel || 'N/D'}
Periodo de análisis: ${period || 'N/D'}
${customQuestion ? `Pregunta específica del analista: ${customQuestion}\n` : ''}
Resultados estadísticos y de machine learning calculados (JSON exacto):
${JSON.stringify(structuredResults, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userPrompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const text = response.text;
    if (!text) {
      res.status(502).json({ error: 'El modelo devolvió una respuesta vacía.' });
      return;
    }

    res.json({
      explanation: text,
      model: 'gemini-4-hydrogen',
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Gemini API Error:', message);
    if (message.includes('403') || message.includes('PERMISSION_DENIED') || message.includes('API_KEY_INVALID')) {
      res.status(403).json({
        error: 'Error de autenticación con Gemini API. Verifica tu clave en el panel Settings > Secrets.',
      });
      return;
    }
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      res.status(429).json({
        error: 'Límite de cuota alcanzado temporalmente en Gemini API. Inténtalo de nuevo en unos momentos.',
      });
      return;
    }
    res.status(500).json({ error: `Error al generar la interpretación IA: ${message}` });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MADRID SIN ESPERAS 4.0 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
