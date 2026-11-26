# MADRID SIN ESPERAS — DATAMAD 2026

**Plataforma de Inteligencia Sanitaria y Libre Elección Ciudadana del SERMAS**
---
<sub>Acceso en Línea: https://madrid-sin-esperas.onrender.com/</sub>

## Autoría y Contexto Académico

- **Autores**: Rebeca del Val y Emir Jiménez
- **Titulación**: Grado en Ciencia de Datos Aplicada, Universidad Complutense de Madrid (UCM)
- **Evento / Certamen**: DATAMAD 2026
- **Propósito**: Transformar los datos abiertos del Servicio Madrileño de Salud (SERMAS) en una herramienta de utilidad pública y análisis operativo para dos audiencias clave:
  1. **Ciudadanía y pacientes**: Orientación personalizada para ejercer su derecho a la Libre Elección de hospital público con menores demoras y cercanía garantizada.
  2. **Gestores, analistas y clínicos**: Cuadro de mando territorial, detección precoz de anomalías estadísticas mediante control estadístico de procesos (SPC), modelos predictivos a 2026–2027 y simuladores de gestión hospitalaria.

---

## Características Principales

### 1. Experiencia de Libre Elección para Pacientes y Ciudadanos
- **Recomendador de Hospitales**: Basado en el Decreto 51/2010 de Libre Elección en la Comunidad de Madrid. Cruza los tiempos de espera oficiales con la ubicación geográfica del paciente.
- **Cartografía Geográfica Real (Leaflet + IGN/Esri)**: Coordenadas geodésicas oficiales de los 179 municipios de Madrid y los 31 centros hospitalarios para calcular distancias geodésicas exactas (fórmula de Haversine).
- **Copiloto Sanitario (Asistente Virtual)**:
  - Motor determinista y contextual multietapa conectado a datos reales sin alucinaciones.
  - Reconoce los 179 municipios y 21 distritos de Madrid capital con normalización de tildes.
  - Catálogo clínico amplio: cirugías de cataratas, prótesis de cadera/rodilla, vesícula, hernias, pruebas de imagen (TAC, RM, colonoscopias), etc.
  - Filtro estricto de cartera de servicios (REGCESS): asegura que los centros recomendados cubran realmente la especialidad requerida (ej. cirugías de alta complejidad restringidas a centros del Grupo 3).
  - Sugerencias interactivas de respuesta rápida.

### 2. Cuadro de Mando y Analítica para Gestores Sanitarios
- **Visión General e Indicadores Clave**: Listas de espera quirúrgica (LEQ), consultas externas (LECE) y pruebas diagnósticas (LEPD).
- **Ficha Técnica Individual de los 31 Hospitales**: Recursos estructurales (camas instaladas y en funcionamiento, quirófanos), modelo de gestión (directa vs. concesión) y series temporales históricas.
- **Radar Territorial y Detección de Anomalías**:
  - Control Estadístico de Procesos (SPC) mediante *Modified Z-Score* (Iglewicz y Hoaglin) basado en mediana y MAD (Desviación Absoluta Mediana) para blindar el análisis frente a valores extremos.
  - Detección de alertas persistentes (3 o más ejercicios consecutivos de deterioro respecto a su propio histórico).
  - Conexión visual y comparativas de hospitales de misma complejidad.
- **Simuladores de Escenarios de Gestión**:
  - *Simulador de Derivación Quirúrgica*: Impacto de redistribuir pacientes entre hospitales del mismo grupo de complejidad hacia centros con menor demora.
  - *Simulador de Refuerzo Quirúrgico*: Estimación de quirófanos adicionales o jornadas extraordinarias necesarias para reducir la lista de espera a un objetivo de días.
  - *Simulador de Estrés por Cuellos de Botella*: Análisis del impacto de derivar pacientes entre consultas externas y lista quirúrgica.
- **Modelos Predictivos (Holt-Winters / ETS)**:
  - Proyecciones autonómicas a 2026 y 2027 con intervalos de confianza al 95%.
  - Evaluación mediante validación cruzada con origen rodante 
- **Integración con MCP (Model Context Protocol)**:
  - Servidor MCP completo (`mcp/server.ts`) con 8 herramientas estandarizadas para conectar asistentes de IA (Claude, Cursor, Gemini) con la base de datos oficial auditada.

---

## Datasets Oficiales Utilizados

Todos los datos proceden del **Portal de Datos Abiertos de la Comunidad de Madrid** (`datos.comunidad.madrid`) y de la estadística oficial **ESCRI** del Ministerio de Sanidad:

| Dataset | Organismo Fuente | Cobertura Temporal | Enlace Oficial |
| :--- | :--- | :--- | :--- |
| **Lista de espera quirúrgica por hospitales (LEQ_Hosp)** | Consejería de Sanidad / SERMAS | 2015 – 2025 | [Portal CAM](https://datos.comunidad.madrid/dataset/lista_de_espera_quirurgica_por_hospitales) |
| **Lista de espera consultas externas por hospitales (LECE_Hosp)** | Consejería de Sanidad / SERMAS | 2017 – 2024 | [Portal CAM](https://datos.comunidad.madrid/dataset/lista_espera_consultas_externas_por_hospitales) |
| **Lista de espera pruebas diagnósticas por hospitales (LEPD_Hosp)** | Consejería de Sanidad / SERMAS | 2017 – 2024 | [Portal CAM](https://datos.comunidad.madrid/dataset/lista_de_espera_pruebas_diagnosticas_por_hospitales) |
| **Lista de espera quirúrgica agregada (LEQ_Global)** | Instituto de Estadística / SERMAS | 2015 – 2025 | [Portal CAM (1922240)](https://datos.comunidad.madrid/dataset/1922240) |
| **Lista de espera consultas externas agregada (LECE_Global)** | Instituto de Estadística / SERMAS | 2015 – 2024 | [Portal CAM (1922241)](https://datos.comunidad.madrid/dataset/1922241) |
| **Lista de espera pruebas diagnósticas agregada (LEPD_Global)** | Instituto de Estadística / SERMAS | 2015 – 2024 | [Portal CAM (1922242)](https://datos.comunidad.madrid/dataset/1922242) |
| **Consultas por especialidad médica (ESCRI)** | Estadística ESCRI / Min. Sanidad | 2010 – 2023 | [Portal CAM (1914582)](https://datos.comunidad.madrid/dataset/1914582) |
| **Actividad diagnóstica y quirúrgica (ESCRI)** | Estadística ESCRI / Min. Sanidad | 2010 – 2023 | [Portal CAM (1914583)](https://datos.comunidad.madrid/dataset/1914583) |
| **Estructura Hospitalaria y Memorias SERMAS** | Memoria de Actividad SERMAS 2024 | 2023 – 2024 | [Memorias SERMAS](https://www.comunidad.madrid/servicios/salud/memorias-e-informes-servicio-madrileno-salud) |
| **Catálogo Nacional de Hospitales (CNH)** | Ministerio de Sanidad | Corte 31-dic-2024 | [Ministerio de Sanidad](https://www.sanidad.gob.es/estadEstudios/estadisticas/sisInfSanSNS/ofertaRecursos/hospitales/home.htm) |
| **Observatorio de Resultados del SERMAS** | Consejería de Sanidad | Ejercicio 2025 | [Observatorio Resultados](https://observatorioresultados.sanidadmadrid.org/) |
| **Cartografía Oficial de la Comunidad de Madrid** | Instituto Geográfico Nacional (IGN) | WGS84 / ETRS89 | [Portal IGN](https://www.ign.es/web/ign/portal) |

> **Nota de Gobernanza de Datos**: El proyecto aplica una política estricta de auditoría: los valores ausentes (`"-"`) se conservan como `null` y nunca se imputan como ceros ni se interpolan artificialmente.

---

## Arquitectura Tecnológica

- **Frontend**: React 19, TypeScript, Vite.
- **Estilos y Componentes**: Tailwind CSS v4, Lucide Icons.
- **Cartografía Interactiva**: Leaflet 1.9, baldosas geodésicas de CartoDB Voyager, Esri ArcGIS e IGN España.
- **Protocolo de IA**: Servidor Model Context Protocol (MCP) compatible con clientes Stdio.
- **Lanzador Local**: Script de ejecución rápida bajo Windows (`INICIAR_MADRID_SIN_ESPERAS.bat`).

---

## Puesta en Marcha en Local

### Requisitos previos
- **Node.js** (versión 18 o superior recomendada)
- **npm** (incluido con Node.js)

### Opción 1: Lanzador automático en Windows
Hacer doble clic en el archivo:
```text
INICIAR_MADRID_SIN_ESPERAS.bat
```
El script iniciará el servidor de desarrollo y abrirá automáticamente la aplicación en el navegador en `http://localhost:3000/?perfil=inicio`.

### Opción 2: Desde terminal
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build

# 4. Ejecutar tests del servidor MCP
npm run test:mcp
```

---

##  Licencia

Los datos oficiales reutilizados están sujetos a la licencia **Creative Commons Reconocimiento (CC-BY 4.0)** de la Comunidad de Madrid y del Ministerio de Sanidad.
