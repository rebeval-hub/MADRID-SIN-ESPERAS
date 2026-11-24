import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  TrendingUp,
  Radar,
  Compass,
  LineChart,
  Sliders,
  Database
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'hospitals'
  | 'specialties'
  | 'timeseries'
  | 'radar'
  | 'opportunities'
  | 'predictive'
  | 'simulators'
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  radarAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  radarAlertsCount
}) => {
  const navGroups = [
    {
      title: 'Diagnóstico Regional',
      items: [
        {
          id: 'overview' as ActiveTab,
          num: '01',
          label: 'Visión General',
          icon: LayoutDashboard,
          badge: null
        },
        {
          id: 'hospitals' as ActiveTab,
          num: '02',
          label: 'Hospitales y Territorio',
          icon: Building2,
          badge: '31 centros'
        },
        {
          id: 'specialties' as ActiveTab,
          num: '03',
          label: 'Especialidades y Pruebas',
          icon: Stethoscope,
          badge: 'ESCRI 2023'
        },
        {
          id: 'timeseries' as ActiveTab,
          num: '04',
          label: 'Evolución Temporal',
          icon: TrendingUp,
          badge: '2015–2025'
        }
      ]
    },
    {
      title: 'Vigilancia y Territorio',
      items: [
        {
          id: 'radar' as ActiveTab,
          num: '05',
          label: 'RADAR SANITARIO',
          icon: Radar,
          badge: `${radarAlertsCount} comp.`
        },
        {
          id: 'opportunities' as ActiveTab,
          num: '06',
          label: 'RADAR TERRITORIAL',
          icon: Compass,
          badge: 'Mapa'
        }
      ]
    },
    {
      title: 'Cuantitativo y Gobernanza',
      items: [
        {
          id: 'predictive' as ActiveTab,
          num: '07',
          label: 'Modelos Predictivos',
          icon: LineChart,
          badge: 'Experimental'
        },
        {
          id: 'simulators' as ActiveTab,
          num: '08',
          label: 'Simuladores What-If',
          icon: Sliders,
          badge: '4 modelos'
        },
        {
          id: 'audit' as ActiveTab,
          num: '09',
          label: 'Fuentes y Créditos',
          icon: Database,
          badge: 'DATAMAD'
        }
      ]
    }
  ];

  const allItems = navGroups.flatMap(g => g.items);

  return (
    <aside className="w-full lg:w-64 xl:w-72 bg-[#FAF9F5] border-b lg:border-b-0 lg:border-r border-[#DAD6CC] text-[#202321] flex flex-col shrink-0">
      {/* Mobile / Tablet compact horizontal index */}
      <nav aria-label="Navegación principal móvil" className="lg:hidden overflow-x-auto px-3 py-2.5 flex items-center gap-1.5">
        {allItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-[#202321] text-[#FAF9F5] border-[#202321]'
                  : 'bg-[#F3F0E8] text-[#202321] border-[#DAD6CC] hover:border-[#A6A18F]'
              }`}
            >
              <span className={`font-mono text-[10px] ${isActive ? 'text-[#C64B37]' : 'text-[#77766F]'}`}>
                {item.num}
              </span>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Swiss-editorial index rail */}
      <nav aria-label="Navegación principal" className="hidden lg:flex flex-col flex-1 px-4 py-6 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={group.title} className={gIdx > 0 ? 'pt-4 border-t border-[#DAD6CC]/80' : ''}>
            <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-[#77766F]">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isRadar = item.id === 'radar';
                const isOpps = item.id === 'opportunities';

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`group relative w-full flex items-center justify-between px-2.5 py-2.5 rounded-sm text-xs transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#F3F0E8] text-[#202321] font-semibold'
                        : 'text-[#55544E] hover:bg-[#F3F0E8]/60 hover:text-[#202321] font-medium'
                    }`}
                  >
                    {isActive && (
                      <span
                        className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] ${
                          isOpps ? 'bg-[#426C79]' : 'bg-[#C64B37]'
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0 pl-1">
                      <span
                        className={`font-mono text-[10px] shrink-0 ${
                          isActive
                            ? isOpps
                              ? 'text-[#426C79] font-bold'
                              : 'text-[#C64B37] font-bold'
                            : 'text-[#A6A18F] group-hover:text-[#77766F]'
                        }`}
                      >
                        {item.num}
                      </span>
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isActive
                            ? isOpps
                              ? 'text-[#426C79]'
                              : 'text-[#C64B37]'
                            : isRadar
                            ? 'text-[#C64B37]/80'
                            : isOpps
                            ? 'text-[#426C79]/80'
                            : 'text-[#77766F] group-hover:text-[#202321]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`font-mono text-[10px] shrink-0 ml-2 ${
                          isActive
                            ? isRadar
                              ? 'text-[#C64B37] font-semibold'
                              : isOpps
                              ? 'text-[#426C79] font-semibold'
                              : 'text-[#202321]'
                            : isRadar
                            ? 'text-[#C64B37]'
                            : 'text-[#77766F]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Editorial Colophon: Principio de Rigor */}
        <div className="mt-auto pt-5 border-t border-[#DAD6CC]">
          <div className="px-2 space-y-1.5">
            <div className="text-[11px] font-serif text-[#202321] tracking-tight">
              Principio de Rigor
            </div>
            <p className="text-[11px] leading-relaxed text-[#77766F]">
              Todos los datos provienen de series publicadas por la Comunidad de Madrid y el Ministerio de Sanidad (ESCRI). Sin extrapolación ni imputación de valores ausentes.
            </p>
          </div>
        </div>
      </nav>
    </aside>
  );
};
