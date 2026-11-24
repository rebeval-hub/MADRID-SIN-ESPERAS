/**
 * Test Client para validar el servidor MCP de MADRID SIN ESPERAS
 * Se conecta vía StdioClientTransport, lista las herramientas y ejecuta pruebas unitarias.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('====================================================');
  console.log('🧪 INICIANDO TEST LOCAL DEL SERVIDOR MCP (SERMAS)');
  console.log('====================================================\n');

  const serverScript = path.resolve(__dirname, 'server.ts');
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', serverScript]
  });

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log('✓ Conexión establecida con el servidor MCP vía Stdio.\n');

  // 1. Listar herramientas
  const toolsResult = await client.listTools();
  console.log(`📋 Herramientas registradas (${toolsResult.tools.length}):`);
  toolsResult.tools.forEach((t, i) => {
    console.log(`   ${i + 1}. [${t.name}]: ${(t.description || '').slice(0, 75)}...`);
  });
  console.log('\n--- EJECUTANDO PRUEBAS DE LLAMADA A HERRAMIENTAS ---\n');

  // TEST 1: sermas_list_hospitals (Área Sur)
  console.log('▶ TEST 1: sermas_list_hospitals (Filtrado por Área Sur)');
  const res1: any = await client.callTool({
    name: 'sermas_list_hospitals',
    arguments: { area: 'Sur' }
  });
  const data1 = JSON.parse(res1.content[0].text);
  console.log(`   ✓ Hospitales devueltos en el Área Sur: ${data1.total}`);
  console.log(`   ✓ Muestra: ${data1.hospitales.slice(0, 3).map((h: any) => h.nombre_corto).join(', ')}...\n`);

  // TEST 2: sermas_get_hospital (La Paz)
  console.log('▶ TEST 2: sermas_get_hospital (La Paz)');
  const res2: any = await client.callTool({
    name: 'sermas_get_hospital',
    arguments: { hospital: 'la_paz' }
  });
  const data2 = JSON.parse(res2.content[0].text);
  console.log(`   ✓ Nombre: ${data2.identificacion.nombre_oficial}`);
  console.log(`   ✓ Camas instaladas: ${data2.recursos_materiales_sermas_2024.camas_instaladas} | Quirófanos: ${data2.recursos_materiales_sermas_2024.quirofanos}`);
  console.log(`   ✓ Demora quirúrgica 2025: ${data2.series_temporales.quirurgica.demora_media['2025']} días (${data2.series_temporales.quirurgica.pacientes['2025']} pacientes)\n`);

  // TEST 3: sermas_compare_hospitals
  console.log('▶ TEST 3: sermas_compare_hospitals (La Paz vs 12 de Octubre vs Gregorio Marañón)');
  const res3: any = await client.callTool({
    name: 'sermas_compare_hospitals',
    arguments: {
      hospitales: ['la_paz', '12_de_octubre', 'gregorio_maranon'],
      tipo_lista: 'quirurgica',
      anio: '2025'
    }
  });
  const data3 = JSON.parse(res3.content[0].text);
  data3.resultados.forEach((r: any) => {
    console.log(`   • ${r.nombre}: Demora ${r.demora_media_dias} d | ${r.pacientes_pendientes} pac. | ${r.camas_instaladas} camas`);
  });
  console.log();

  // TEST 4: sermas_get_radar_alerts
  console.log('▶ TEST 4: sermas_get_radar_alerts (Alertas Persistentes)');
  const res4: any = await client.callTool({
    name: 'sermas_get_radar_alerts',
    arguments: { nivel: 'ALERTA_PERSISTENTE' }
  });
  const data4 = JSON.parse(res4.content[0].text);
  console.log(`   ✓ Total alertas persistentes detectadas: ${data4.total_alertas}`);
  console.log(`   ✓ Ejemplo: ${data4.alertas[0]?.hospital} (${data4.alertas[0]?.tipo_lista}): ${data4.alertas[0]?.justificacion_analitica.slice(0, 80)}...\n`);

  // TEST 5: sermas_get_forecast
  console.log('▶ TEST 5: sermas_get_forecast (quirurgica_pacientes)');
  const res5: any = await client.callTool({
    name: 'sermas_get_forecast',
    arguments: { serie: 'quirurgica_pacientes' }
  });
  const data5 = JSON.parse(res5.content[0].text);
  console.log(`   ✓ Indicador: ${data5.indicador}`);
  console.log(`   ✓ Parámetros óptimos: Alpha=${data5.modelo_detalles?.alpha}, Beta=${data5.modelo_detalles?.beta}`);
  console.log(`   ✓ Proyección 2026: ${data5.proyecciones_futuras[0].point} pacientes [IC 95%: ${data5.proyecciones_futuras[0].lower95} - ${data5.proyecciones_futuras[0].upper95}]\n`);

  // TEST 6: sermas_get_dcat_metadata
  console.log('▶ TEST 6: sermas_get_dcat_metadata (LEQ_Hosp)');
  const res6: any = await client.callTool({
    name: 'sermas_get_dcat_metadata',
    arguments: { dataset_clave: 'LEQ_Hosp' }
  });
  const data6 = JSON.parse(res6.content[0].text);
  console.log(`   ✓ dct:title: ${data6.dcat_ap_es['dct:title']}`);
  console.log(`   ✓ dct:publisher: ${data6.dcat_ap_es['dct:publisher']}`);
  console.log(`   ✓ dcat:landingPage: ${data6.dcat_ap_es['dcat:landingPage']}`);
  console.log(`   ✓ Filas procesadas: ${data6.calidad_ingesta.filas_procesadas}\n`);

  console.log('====================================================');
  console.log('✅ TODAS LAS PRUEBAS DEL MCP HAN PASADO CON ÉXITO');
  console.log('====================================================');

  await client.close();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Error en el test del MCP:', err);
  process.exit(1);
});
