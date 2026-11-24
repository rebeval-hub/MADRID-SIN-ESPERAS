import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HospitalMetadata, WaitListType } from '../../types';
import { MadridMunicipality, calculateDistanceKm } from '../../data/madridMunicipalities';
import { formatEsDec } from '../../utils/format';
import {
  initMadridMap,
  createHospitalBuildingIcon,
  MADRID_MAP_CENTER
} from '../../utils/leafletMapConfig';

interface MadridRealMapProps {
  hospitals: HospitalMetadata[];
  selectedMunicipality: MadridMunicipality;
  selectedCareType: WaitListType;
  selectedHospitalId: string | null;
  onSelectHospital: (h: HospitalMetadata) => void;
  closestHospitalIds: Set<string>;
  height?: string;
}

export const MadridRealMap: React.FC<MadridRealMapProps> = ({
  hospitals,
  selectedMunicipality,
  selectedCareType,
  selectedHospitalId,
  onSelectHospital,
  closestHospitalIds,
  height = '520px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = initMadridMap(mapContainerRef.current, {
      zoom: 10,
      minZoom: 8,
      maxZoom: 18
    });

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update Markers whenever props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. User Municipality Centroid Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:34px; height:34px; border-radius:50%; background:rgba(66, 108, 121, 0.25); animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position:relative; width:24px; height:24px; border-radius:50%; background:#426C79; border:2.5px solid #FAF9F5; box-shadow:0 2px 6px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:#FAF9F5; font-size:12px; font-weight:bold;">
            ⌂
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const userMarker = L.marker([selectedMunicipality.lat, selectedMunicipality.lng], {
      icon: userIcon,
      zIndexOffset: 1000
    });

    userMarker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px; font-size:12px; line-height:1.4;">
        <strong style="color:#426C79; font-size:13px;">Tu Municipio: ${selectedMunicipality.name}</strong><br/>
        <span style="color:#77766F;">Punto de referencia para cálculo de distancias</span>
      </div>
    `);
    markersLayer.addLayer(userMarker);

    // 2. Hospital Markers using improved building icon
    hospitals.forEach(h => {
      const isSelected = h.id === selectedHospitalId;
      const isClosest = closestHospitalIds.has(h.id);

      // Extract official delay for active care type
      const delayYear = selectedCareType === 'quirurgica' ? '2025' : '2024';
      const delayVal = h.series[selectedCareType]?.demora[delayYear];
      const delayFormatted = delayVal !== null && delayVal !== undefined ? `${Math.round(delayVal)}d` : 'S/D';

      const distanceKm = calculateDistanceKm(
        selectedMunicipality.lat,
        selectedMunicipality.lng,
        h.lat,
        h.lng
      );

      // Color coding based on delay
      let metricColor = '#0284c7';
      if (delayVal !== null && delayVal !== undefined) {
        if (delayVal < 45) metricColor = '#10b981';
        else if (delayVal < 65) metricColor = '#0284c7';
        else if (delayVal < 80) metricColor = '#d97706';
        else metricColor = '#e11d48';
      }

      const hospIcon = createHospitalBuildingIcon({
        hospital: h,
        delayFormatted,
        metricColor,
        isSelected,
        isClosest
      });

      const marker = L.marker([h.lat, h.lng], {
        icon: hospIcon,
        zIndexOffset: isSelected ? 900 : isClosest ? 500 : 100
      });

      marker.on('click', () => {
        onSelectHospital(h);
      });

      marker.bindPopup(`
        <div style="font-family:sans-serif; padding:4px; font-size:12px; line-height:1.4; min-width:190px;">
          <div style="font-size:10px; font-weight:700; color:${isClosest ? '#426C79' : '#77766F'}; text-transform:uppercase;">
            ${isClosest ? '★ Hospital en tu entorno cercano' : h.complexityGroup}
          </div>
          <strong style="color:#202321; font-size:13px; display:block; margin:2px 0;">${h.shortName}</strong>
          <div style="color:#77766F; font-size:11px;">
            ${h.municipality} · Área ${h.area}
          </div>
          <div style="margin-top:6px; padding-top:6px; border-top:1px solid #DAD6CC; display:flex; justify-content:between; align-items:center;">
            <div>
              <span style="font-size:10px; color:#77766F;">Demora oficial (${delayYear}):</span><br/>
              <strong style="font-size:13px; color:#202321;">${delayVal !== null && delayVal !== undefined ? `${formatEsDec(delayVal, 1)} días` : 'No disponible'}</strong>
            </div>
            <div style="text-align:right;">
              <span style="font-size:10px; color:#77766F;">Distancia:</span><br/>
              <strong style="font-size:13px; color:#426C79;">${distanceKm} km</strong>
            </div>
          </div>
        </div>
      `);

      markersLayer.addLayer(marker);
    });

    // Auto-fit bounds within Madrid
    const bounds = L.latLngBounds([
      [selectedMunicipality.lat, selectedMunicipality.lng],
      ...hospitals.map(h => [h.lat, h.lng] as [number, number])
    ]);
    map.fitBounds(bounds, { padding: [25, 25], maxZoom: 13 });
  }, [hospitals, selectedMunicipality, selectedCareType, selectedHospitalId, closestHospitalIds]);

  return (
    <div className="relative w-full rounded-sm border border-[#DAD6CC] overflow-hidden bg-[#FAF9F5] shadow-xs">
      {/* Map Header bar inside component */}
      <div className="bg-[#FAF9F5] px-4 py-2 border-b border-[#DAD6CC] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#426C79] inline-block" />
          <span className="font-semibold text-[#202321]">
            Mapa Geográfico Real de la Comunidad de Madrid
          </span>
          <span className="text-[#77766F] hidden sm:inline">
            (Coordenadas geodésicas oficiales IGN / WGS84)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#426C79] border border-white" />
            <span className="text-[#202321]">Tu municipio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-[#426C79] text-[#FAF9F5] text-[9px] flex items-center justify-center font-bold">
              ★
            </span>
            <span className="text-[#202321]">Entorno cercano</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-[#202321] text-[#FAF9F5] text-[9px] flex items-center justify-center font-bold">
              +
            </span>
            <span className="text-[#77766F]">Resto de Madrid</span>
          </div>
        </div>
      </div>

      {/* Map DOM Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="z-10 focus:outline-none"
      />

      {/* Bottom informational bar */}
      <div className="bg-[#FAF9F5]/90 border-t border-[#DAD6CC] px-3 py-1.5 text-[11px] text-[#77766F] flex items-center justify-between">
        <span>Cartografía interactiva: Haz clic en cualquier hospital para abrir su ficha completa y comparar indicadores.</span>
        <span className="font-mono hidden md:inline">Esri ArcGIS · IGN España (Sin API Key)</span>
      </div>
    </div>
  );
};
