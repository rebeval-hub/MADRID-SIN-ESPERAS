import L from 'leaflet';
import { HospitalMetadata, ComplexityGroup } from '../types';

export const MADRID_MAP_CENTER: [number, number] = [40.45, -3.70];

export const MADRID_MAP_BOUNDS: [[number, number], [number, number]] = [
  [39.80, -4.60], // Suroeste de la Comunidad de Madrid
  [41.25, -3.05]  // Noreste de la Comunidad de Madrid
];

/**
 * Proveedores de cartografía oficial y realista sin API key
 */
export function addMadridBaseLayers(map: L.Map) {
  const esriStreetLayer = L.tileLayer(
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, USGS, IGN España',
      maxZoom: 19
    }
  );

  const ignLayer = L.tileLayer(
    'https://www.ign.es/wmts/ign-base?service=WMTS&request=GetTile&version=1.0.0&Format=image/png&layer=IGNBaseTodo&style=default&tilematrixset=GoogleMapsCompatible&TileMatrix={z}&TileRow={y}&TileCol={x}',
    {
      attribution:
        '&copy; <a href="https://www.ign.es/">Instituto Geográfico Nacional (IGN España)</a>',
      maxZoom: 19
    }
  );

  const esriGrayLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, IGN',
      maxZoom: 19
    }
  );

  // Default layer
  esriStreetLayer.addTo(map);

  const baseMaps = {
    'Callejero y Carreteras (Esri)': esriStreetLayer,
    'Oficial IGN España': ignLayer,
    'Gris Editorial (Esri Canvas)': esriGrayLayer
  };

  L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

  return { esriStreetLayer, ignLayer, esriGrayLayer };
}

/**
 * Inicializador unificado para todos los mapas de Madrid Sin Esperas
 */
export function initMadridMap(
  container: HTMLElement,
  options?: {
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    zoomControl?: boolean;
    scrollWheelZoom?: boolean;
  }
): L.Map {
  const map = L.map(container, {
    center: MADRID_MAP_CENTER,
    zoom: options?.zoom ?? 10,
    minZoom: options?.minZoom ?? 8,
    maxZoom: options?.maxZoom ?? 18,
    maxBounds: MADRID_MAP_BOUNDS,
    maxBoundsViscosity: 0.85,
    zoomControl: false,
    scrollWheelZoom: options?.scrollWheelZoom ?? true,
    attributionControl: true
  });

  if (options?.zoomControl !== false) {
    L.control.zoom({ position: 'topright' }).addTo(map);
  }

  addMadridBaseLayers(map);
  return map;
}

export interface HospitalMarkerOptions {
  hospital: HospitalMetadata;
  delayFormatted?: string | null;
  metricColor?: string;
  isSelected?: boolean;
  isClosest?: boolean;
  isPeer?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Generador de iconos hospitalarios profesionales y amigables:
 * Representación de edificio hospitalario con cruz médica oficial,
 * diferenciando hospitales de alta complejidad (terciarios/referencia),
 * hospitales generales de área y centros de apoyo.
 */
export function createHospitalBuildingIcon(opts: HospitalMarkerOptions): L.DivIcon {
  const {
    hospital,
    delayFormatted,
    metricColor = '#426C79',
    isSelected = false,
    isClosest = false,
    isPeer = false
  } = opts;

  const isGrupo3 = hospital.complexityGroup === 'Grupo 3';
  const isGrupo2 = hospital.complexityGroup === 'Grupo 2';

  // Dimensiones y estilos según categoría
  let iconWidth = 36;
  let iconHeight = 44;
  let buildingWidth = 26;
  let buildingHeight = 22;

  if (isGrupo3) {
    iconWidth = 44;
    iconHeight = 52;
    buildingWidth = 32;
    buildingHeight = 26;
  } else if (!isGrupo2) {
    iconWidth = 32;
    iconHeight = 40;
    buildingWidth = 22;
    buildingHeight = 18;
  }

  // Colores principales
  const buildingBg = isSelected
    ? '#C64B37'
    : isPeer
    ? '#0284c7'
    : isClosest
    ? '#426C79'
    : '#202321';

  const badgeBg = isSelected ? '#C64B37' : metricColor;
  const roofColor = isGrupo3 ? '#D47528' : isSelected ? '#AE3E2C' : '#343835';
  const glowRing = isSelected
    ? 'filter: drop-shadow(0 0 6px rgba(198, 75, 55, 0.85));'
    : isClosest
    ? 'filter: drop-shadow(0 0 5px rgba(66, 108, 121, 0.75));'
    : 'filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));';

  // SVG del edificio hospitalario con cruz médica y ventanas
  const buildingSvg = `
    <svg width="${buildingWidth}" height="${buildingHeight}" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Tejado / Torre superior -->
      <path d="M12 0 H20 V4 H12 Z" fill="${roofColor}" />
      <!-- Cruz médica roja en el ático -->
      <rect x="14.5" y="1" width="3" height="7" fill="#FAF9F5" rx="0.5" />
      <rect x="12.5" y="3" width="7" height="3" fill="#FAF9F5" rx="0.5" />
      <rect x="15" y="1.5" width="2" height="6" fill="#C64B37" />
      <rect x="13" y="3.5" width="6" height="2" fill="#C64B37" />

      <!-- Cuerpo principal del edificio -->
      <rect x="2" y="6" width="28" height="20" rx="2.5" fill="${buildingBg}" stroke="#FAF9F5" stroke-width="1.5" />

      <!-- Ventanas iluminadas -->
      <rect x="5" y="9" width="4" height="4" rx="0.8" fill="#FAF9F5" opacity="0.9" />
      <rect x="11" y="9" width="4" height="4" rx="0.8" fill="#FAF9F5" opacity="0.9" />
      <rect x="17" y="9" width="4" height="4" rx="0.8" fill="#FAF9F5" opacity="0.9" />
      <rect x="23" y="9" width="4" height="4" rx="0.8" fill="#FAF9F5" opacity="0.9" />

      <rect x="5" y="15" width="4" height="4" rx="0.8" fill="#FAF9F5" opacity="0.9" />
      <rect x="23" y="15" width="4" height="4" rx="0.8" fill="#FAF9F5" opacity="0.9" />

      <!-- Puerta de acceso de urgencias -->
      <rect x="12" y="15" width="8" height="11" rx="1" fill="#FAF9F5" />
      <rect x="13.5" y="17" width="5" height="9" rx="0.5" fill="${buildingBg}" />
    </svg>
  `;

  // Pastilla con demora o etiqueta del indicador
  const pillHtml = delayFormatted
    ? `
      <div style="
        background: ${badgeBg};
        color: #FAF9F5;
        border: 1.5px solid #FAF9F5;
        border-radius: 9999px;
        padding: 1px 5px;
        font-size: 10px;
        font-weight: 800;
        font-family: monospace;
        letter-spacing: -0.02em;
        white-space: nowrap;
        margin-top: -3px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      ">
        ${delayFormatted}
      </div>
    `
    : '';

  const html = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      ${glowRing}
      transform: translate3d(0, 0, 0);
    ">
      ${buildingSvg}
      ${pillHtml}
    </div>
  `;

  return L.divIcon({
    className: 'custom-hospital-building-marker',
    html,
    iconSize: [iconWidth, iconHeight],
    iconAnchor: [iconWidth / 2, buildingHeight + (delayFormatted ? 6 : 0)],
    popupAnchor: [0, -buildingHeight - 6]
  });
}
