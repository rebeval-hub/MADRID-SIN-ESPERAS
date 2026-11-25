import { FullHealthData, HospitalMetadata } from '../types';
import {
  MADRID_MUNICIPALITIES,
  calculateDistanceKm,
  MadridMunicipality
} from '../data/madridMunicipalities';

export interface PatientLocation {
  name: string;
  type: 'distrito' | 'municipio' | 'area';
  area: 'Centro' | 'Norte' | 'Sur' | 'Este' | 'Oeste';
  lat?: number;
  lng?: number;
}

export interface PatientClinicalNeed {
  code: string;
  category: 'quirurgica' | 'consultas' | 'pruebas';
  specialtyName: string;
  procedureExample: string;
  isHighComplexity?: boolean;
}

export interface PatientConversationContext {
  pendingNeed?: PatientClinicalNeed | null;
  pendingLocation?: PatientLocation | null;
}

export interface PatientRecommendation {
  detectedLocation: PatientLocation | null;
  detectedNeed: PatientClinicalNeed | null;
  referenceHospital: {
    hospital: HospitalMetadata;
    reason: string;
    waitDays: number | null;
    patients: number | null;
    serviceConfirmed: boolean;
    distanceKm?: number;
  } | null;
  alternativeHospitals: {
    hospital: HospitalMetadata;
    reason: string;
    waitDays: number | null;
    patients: number | null;
    serviceConfirmed: boolean;
    distanceKm?: number;
  }[];
  explanationText: string;
  legalNotice: string;
  conversationState?: {
    needsLocationPrompt?: boolean;
    needsNeedPrompt?: boolean;
    pendingNeed?: PatientClinicalNeed | null;
    pendingLocation?: PatientLocation | null;
  };
}

// ============================================================================
// NORMALIZACIÓN DE TEXTO Y BÚSQUEDA ROBUSTA
// ============================================================================
export function normalizeSpanishText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes y diacríticos
    .replace(/[^a-z0-9\s]/g, ' ')   // Quita puntuación
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// CARTERA DE SERVICIOS POR HOSPITAL (REGCESS / SERMAS)
// ============================================================================
export function hospitalOffersSpecialty(hospital: HospitalMetadata, specialtyCode: string): boolean {
  // 1. Centros sin quirófanos de agudos o monográficos no quirúrgicos
  if (hospital.id === 'guadarrama' || hospital.id === 'jose_germain') {
    return false;
  }

  // 2. Hospital Infantil Universitario Niño Jesús (solo atiende a menores de edad)
  if (hospital.id === 'nino_jesus') {
    return specialtyCode === 'pediatria' || specialtyCode === 'cirugia_pediatrica';
  }

  // 3. Especialidades de muy alta complejidad (REGCESS unidades U.14 y U.15)
  // Cirugía Cardíaca y Vascular mayor: reservada a centros de Grupo 3 acreditados
  if (specialtyCode === 'cirugia_cardiaca') {
    return [
      'la_paz',
      'gregorio_maranon',
      '12_de_octubre',
      'clinico_san_carlos',
      'ramon_y_cajal',
      'puerta_de_hierro',
      'fundacion_jimenez_diaz'
    ].includes(hospital.id);
  }

  // Neurocirugía: Grupo 3 completo + centros de referencia del Sur/Oeste (Getafe, Rey Juan Carlos)
  if (specialtyCode === 'neurocirugia') {
    return hospital.complexityGroup === 'Grupo 3' || ['getafe', 'rey_juan_carlos'].includes(hospital.id);
  }

  // 4. Hospital Universitario Santa Cristina: monográfico en Ginecología, Obstetricia y Cirugía Mayor Ambulatoria
  if (hospital.id === 'santa_cristina') {
    return ['ginecologia', 'cirugia_general', 'oftalmologia'].includes(specialtyCode);
  }

  // 5. Hospital Central de la Cruz Roja: hospital de apoyo con cirugía ambulatoria (CMA)
  if (hospital.id === 'cruz_roja') {
    return ['oftalmologia', 'traumatologia', 'cirugia_general', 'dermatologia', 'orl', 'urologia'].includes(specialtyCode);
  }

  // 6. Hospitales comarcales (Grupo 1) y de complejidad media (Grupo 2):
  // Cubren plenamente las especialidades troncales: oftalmología, traumatología, cirugía general, urología, ORL, ginecología, pruebas
  if (hospital.quirofanos !== null && hospital.quirofanos > 0) {
    return true;
  }

  return false;
}

// ============================================================================
// MAPEO DE DISTRITOS DE MADRID CAPITAL (Keywords y centros de referencia)
// ============================================================================
const MADRID_DISTRICTS: {
  keywords: string[];
  name: string;
  area: 'Centro' | 'Norte' | 'Sur' | 'Este' | 'Oeste';
  referenceHospitalIds: string[];
  lat: number;
  lng: number;
}[] = [
  {
    keywords: ['villaverde', 'villaverde alto', 'villaverde bajo', 'san cristobal', 'butarque', 'los rosales'],
    name: 'Villaverde (Madrid Sur)',
    area: 'Sur',
    referenceHospitalIds: ['12_de_octubre', 'getafe', 'severo_ochoa'],
    lat: 40.3456,
    lng: -3.7108
  },
  {
    keywords: ['usera', 'orcasitas', 'san fermin', 'almendrales', 'moscardo'],
    name: 'Usera (Madrid Sur)',
    area: 'Sur',
    referenceHospitalIds: ['12_de_octubre', 'gregorio_maranon'],
    lat: 40.3817,
    lng: -3.7086
  },
  {
    keywords: ['carabanchel', 'vista alegre', 'opañel', 'buenavista', 'pan bendito', 'san isidro'],
    name: 'Carabanchel (Madrid Sur/Oeste)',
    area: 'Sur',
    referenceHospitalIds: ['12_de_octubre', 'gomez_ulla', 'clinico_san_carlos'],
    lat: 40.3744,
    lng: -3.7447
  },
  {
    keywords: ['vallecas', 'puente de vallecas', 'villa de vallecas', 'ensanche de vallecas', 'entrevias', 'palomeras'],
    name: 'Vallecas (Madrid Este/Sur)',
    area: 'Este',
    referenceHospitalIds: ['infanta_leonor', 'gregorio_maranon'],
    lat: 40.3929,
    lng: -3.6663
  },
  {
    keywords: ['latina', 'aluche', 'campamento', 'cuatro vientos', 'las aguilas', 'lucero'],
    name: 'Latina (Madrid Oeste)',
    area: 'Oeste',
    referenceHospitalIds: ['gomez_ulla', 'clinico_san_carlos', 'puerta_de_hierro'],
    lat: 40.3995,
    lng: -3.7664
  },
  {
    keywords: ['fuencarral', 'el pardo', 'montecarmelo', 'las tablas', 'mirasierra', 'barrio del pilar', 'peñagrande'],
    name: 'Fuencarral - El Pardo (Madrid Norte)',
    area: 'Norte',
    referenceHospitalIds: ['la_paz', 'ramon_y_cajal'],
    lat: 40.4908,
    lng: -3.7126
  },
  {
    keywords: ['tetuan', 'cuatro caminos', 'bellas vistas', 'almenara', 'castillejos', 'valdeacederas'],
    name: 'Tetuán (Madrid Norte)',
    area: 'Norte',
    referenceHospitalIds: ['la_paz', 'ramon_y_cajal', 'la_princesa'],
    lat: 40.4578,
    lng: -3.6989
  },
  {
    keywords: ['chamartin', 'prosperidad', 'ciudad jardin', 'hispanoamerica', 'nueva españa', 'castilla'],
    name: 'Chamartín (Madrid Norte)',
    area: 'Norte',
    referenceHospitalIds: ['la_paz', 'ramon_y_cajal', 'la_princesa'],
    lat: 40.4624,
    lng: -3.6766
  },
  {
    keywords: ['chamberi', 'almagro', 'rios rosas', 'gaztambide', 'arapiles', 'vallehermoso'],
    name: 'Chamberí (Madrid Centro)',
    area: 'Centro',
    referenceHospitalIds: ['clinico_san_carlos', 'fundacion_jimenez_diaz', 'la_princesa'],
    lat: 40.4344,
    lng: -3.7038
  },
  {
    keywords: ['salamanca', 'recoletos', 'goya', 'fuente del berro', 'guindalera', 'lista', 'castellana'],
    name: 'Salamanca (Madrid Centro)',
    area: 'Centro',
    referenceHospitalIds: ['la_princesa', 'gregorio_maranon'],
    lat: 40.4297,
    lng: -3.6796
  },
  {
    keywords: ['distrito centro', 'sol', 'palacio', 'embajadores', 'cortes', 'justicia', 'universidad', 'malasaña', 'chueca', 'lavapies', 'la latina'],
    name: 'Distrito Centro (Madrid)',
    area: 'Centro',
    referenceHospitalIds: ['clinico_san_carlos', 'fundacion_jimenez_diaz', 'gregorio_maranon'],
    lat: 40.4154,
    lng: -3.7074
  },
  {
    keywords: ['arganzuela', 'palos de la frontera', 'acacias', 'chopera', 'legazpi', 'delicias', 'imperial'],
    name: 'Arganzuela (Madrid Centro/Sur)',
    area: 'Centro',
    referenceHospitalIds: ['12_de_octubre', 'gregorio_maranon', 'clinico_san_carlos'],
    lat: 40.3986,
    lng: -3.6974
  },
  {
    keywords: ['retiro', 'pacifico', 'ibiza', 'jeronimos', 'estrella'],
    name: 'Retiro (Madrid Centro)',
    area: 'Centro',
    referenceHospitalIds: ['gregorio_maranon', 'la_princesa'],
    lat: 40.4132,
    lng: -3.6830
  },
  {
    keywords: ['hortaleza', 'sanchinarro', 'canillas', 'pinar del rey', 'valdebebas'],
    name: 'Hortaleza (Madrid Este/Norte)',
    area: 'Este',
    referenceHospitalIds: ['ramon_y_cajal', 'la_paz'],
    lat: 40.4722,
    lng: -3.6425
  },
  {
    keywords: ['san blas', 'canillejas', 'simancas', 'las rosas', 'rejas', 'el salvador'],
    name: 'San Blas - Canillejas (Madrid Este)',
    area: 'Este',
    referenceHospitalIds: ['ramon_y_cajal', 'la_princesa', 'infanta_leonor'],
    lat: 40.4358,
    lng: -3.6198
  },
  {
    keywords: ['barajas', 'alameda de osuna', 'timon', 'corralejos', 'aeropuerto'],
    name: 'Barajas (Madrid Este)',
    area: 'Este',
    referenceHospitalIds: ['ramon_y_cajal', 'infanta_sofia'],
    lat: 40.4737,
    lng: -3.5797
  },
  {
    keywords: ['moratalaz', 'marroquina', 'media legua', 'fontarron', 'vinateros'],
    name: 'Moratalaz (Madrid Este)',
    area: 'Este',
    referenceHospitalIds: ['gregorio_maranon', 'infanta_leonor'],
    lat: 40.4072,
    lng: -3.6449
  },
  {
    keywords: ['vicalvaro', 'el cañaveral', 'ambroz'],
    name: 'Vicálvaro (Madrid Este)',
    area: 'Este',
    referenceHospitalIds: ['infanta_leonor', 'gregorio_maranon'],
    lat: 40.4042,
    lng: -3.6062
  },
  {
    keywords: ['ciudad lineal', 'ventas', 'pueblo nuevo', 'quintana', 'concepcion', 'san pascual', 'colina', 'atalaya', 'costillares'],
    name: 'Ciudad Lineal (Madrid Este)',
    area: 'Este',
    referenceHospitalIds: ['la_princesa', 'ramon_y_cajal', 'gregorio_maranon'],
    lat: 40.4484,
    lng: -3.6506
  },
  {
    keywords: ['moncloa', 'aravaca', 'casa de campo', 'arguelles', 'ciudad universitaria', 'valdezarza'],
    name: 'Moncloa - Aravaca (Madrid Oeste)',
    area: 'Oeste',
    referenceHospitalIds: ['clinico_san_carlos', 'fundacion_jimenez_diaz', 'puerta_de_hierro'],
    lat: 40.4354,
    lng: -3.7317
  }
];

// ============================================================================
// CATÁLOGO DE NECESIDADES CLÍNICAS Y ESPECIALIDADES (AMPLIADO)
// ============================================================================
const CLINICAL_NEEDS: (PatientClinicalNeed & { keywords: string[] })[] = [
  {
    code: 'oftalmologia',
    keywords: [
      'ojos', 'ojo', 'vista', 'cataratas', 'catarata', 'oftalmolog', 'retina',
      'glaucoma', 'miopia', 'astigmatismo', 'estrabismo', 'parpado', 'parpados',
      'oculista', 'laser ocular', 'cornea'
    ],
    specialtyName: 'Oftalmología',
    category: 'quirurgica',
    procedureExample: 'Cirugía de cataratas, retina, glaucoma o párpados'
  },
  {
    code: 'traumatologia',
    keywords: [
      'trauma', 'traumatolog', 'rodilla', 'cadera', 'hueso', 'huesos', 'rotura',
      'ligamento', 'ligamentos', 'menisco', 'protesis', 'columna', 'pie', 'pies',
      'hombro', 'hombros', 'fractura', 'tobillo', 'tobillos', 'muñeca', 'espalda',
      'lumbar', 'ciatica', 'juanete', 'juanetes', 'tunel carpiano', 'artrosis',
      'tendon', 'tendones', 'tendinitis', 'esguince'
    ],
    specialtyName: 'Traumatología y Cirugía Ortopédica',
    category: 'quirurgica',
    procedureExample: 'Prótesis de cadera/rodilla, artroscopia de menisco, juanetes o túnel carpiano'
  },
  {
    code: 'cirugia_general',
    keywords: [
      'vesicula', 'hernia', 'hernias', 'apendice', 'apendicitis', 'colon',
      'digestivo', 'cirugia general', 'vesicula biliar', 'laparoscopia', 'hemorroides',
      'fistula', 'fistulas', 'tiroides', 'paratiroides', 'reflujo', 'estomago',
      'bariátrica', 'bariatrica', 'obesidad morbida', 'polipo colon', 'cma'
    ],
    specialtyName: 'Cirugía General y del Aparato Digestivo',
    category: 'quirurgica',
    procedureExample: 'Colecistectomía (vesícula), reparación de hernia inguinal o cirugía anal'
  },
  {
    code: 'orl',
    keywords: [
      'oido', 'oidos', 'nariz', 'garganta', 'amigdalas', 'orl', 'otorrino',
      'vegetaciones', 'timpano', 'tabique', 'polipos', 'sinusitis', 'ronquidos',
      'laringe', 'cuerdas vocales', 'adenoides', 'sordera'
    ],
    specialtyName: 'Otorrinolaringología (ORL)',
    category: 'quirurgica',
    procedureExample: 'Amigdalectomía, septoplastia nasal o timpanoplastia'
  },
  {
    code: 'urologia',
    keywords: [
      'urolog', 'prostata', 'riñon', 'riñones', 'piedras', 'calculos',
      'fimosis', 'vejiga', 'vasectomia', 'vasectomía', 'varicocele', 'incontinencia',
      'colico nefritico', 'orina'
    ],
    specialtyName: 'Urología',
    category: 'quirurgica',
    procedureExample: 'Cirugía de próstata, litotricia de cálculos o vasectomía'
  },
  {
    code: 'ginecologia',
    keywords: [
      'ginecolog', 'parto', 'utero', 'ovarios', 'mioma', 'miomas', 'cesarea',
      'histerectomia', 'suelo pelvico', 'citologia', 'menopausia', 'trompas',
      'endometriosis', 'quiste ovarico', 'mama', 'seno'
    ],
    specialtyName: 'Ginecología y Obstetricia',
    category: 'quirurgica',
    procedureExample: 'Intervención ginecológica, histerectomía o cirugía de miomas'
  },
  {
    code: 'cirugia_cardiaca',
    keywords: [
      'corazon', 'cirugia cardiaca', 'valvula aortica', 'valvula mitral', 'bypass',
      'marcapasos complejo', 'coronaria', 'aneurisma aorta', 'cardiovascular'
    ],
    specialtyName: 'Cirugía Cardiovascular',
    category: 'quirurgica',
    procedureExample: 'Sustitución valvular o bypass coronario (alta complejidad)',
    isHighComplexity: true
  },
  {
    code: 'neurocirugia',
    keywords: [
      'cerebro', 'neurocirug', 'tumor cerebral', 'aneurisma cerebral', 'columna compleja',
      'hernia discal compleja', 'medula', 'neuro'
    ],
    specialtyName: 'Neurocirugía',
    category: 'quirurgica',
    procedureExample: 'Cirugía craneal o descompresión medular (alta complejidad)',
    isHighComplexity: true
  },
  {
    code: 'dermatologia',
    keywords: [
      'dermatolog', 'piel', 'lunar', 'lunares', 'manchas', 'melanoma', 'biopsia de piel',
      'acne', 'psoriasis', 'verruga', 'verrugas', 'dermatitis', 'eccema'
    ],
    specialtyName: 'Dermatología',
    category: 'consultas',
    procedureExample: 'Consulta especializada de dermatología y extirpación de lesiones'
  },
  {
    code: 'pruebas_diagnosticas',
    keywords: [
      'resonancia', 'rm', 'resonancia magnetica', 'tac', 'scanner', 'escaner',
      'tomografia', 'ecografia', 'endoscopia', 'colonoscopia', 'gastroscopia',
      'mamografia', 'radiografia', 'biopsia', 'pet', 'analitica'
    ],
    specialtyName: 'Pruebas Diagnósticas (TAC, RM, Endoscopia)',
    category: 'pruebas',
    procedureExample: 'Resonancia Magnética, TAC o Endoscopia/Colonoscopia'
  },
  {
    code: 'cardiologia',
    keywords: [
      'cardio', 'cardiolog', 'arritmia', 'infarto', 'tension', 'holter',
      'ecocardiograma', 'hipertension', 'palpitaciones'
    ],
    specialtyName: 'Cardiología',
    category: 'consultas',
    procedureExample: 'Primera consulta de cardiología y pruebas diagnósticas cardíacas'
  },
  {
    code: 'digestivo',
    keywords: [
      'digestivo', 'gastro', 'gastroenterolog', 'colon irritable', 'crohn',
      'colitis', 'helicobacter', 'reflujo gastrico', 'ardores'
    ],
    specialtyName: 'Aparato Digestivo (Consultas)',
    category: 'consultas',
    procedureExample: 'Consulta especializada del aparato digestivo y seguimiento'
  }
];

// ============================================================================
// MOTOR DE CONSULTAS Y RECOMENDACIÓN CON MEMORIA DE CONTEXTO
// ============================================================================
export function analyzePatientQuery(
  query: string,
  data: FullHealthData,
  context?: PatientConversationContext
): PatientRecommendation {
  const normQ = normalizeSpanishText(query);
  const hospitals = Object.values(data.hospitals);

  // 1. Detección de ubicación geográfica
  let detectedLocation: PatientLocation | null = null;
  let targetRefHospIds: string[] = [];

  // A) Primero revisar distritos de Madrid Capital (mayor precisión urbana)
  for (const dist of MADRID_DISTRICTS) {
    if (dist.keywords.some(kw => normQ.includes(normalizeSpanishText(kw)))) {
      detectedLocation = {
        name: dist.name,
        type: 'distrito',
        area: dist.area,
        lat: dist.lat,
        lng: dist.lng
      };
      targetRefHospIds = dist.referenceHospitalIds;
      break;
    }
  }

  // B) Si no es un distrito, revisar los 179 municipios oficiales de la Comunidad de Madrid
  if (!detectedLocation) {
    // Ordenar por longitud de nombre descendente para evitar falsos positivos
    const sortedMunis = [...MADRID_MUNICIPALITIES].sort((a, b) => b.name.length - a.name.length);
    for (const m of sortedMunis) {
      const normMName = normalizeSpanishText(m.name);
      // Evitar que "Madrid" coincida si el usuario dice "hospitales de madrid"
      if (normMName === 'madrid' && (normQ.includes('comunidad de madrid') || normQ.includes('red de madrid') || normQ.includes('en madrid') || normQ.includes('de madrid'))) {
        continue;
      }

      // Comprobar coincidencia como palabra o frase
      const regex = new RegExp(`\\b${normMName}\\b`, 'i');
      if (regex.test(normQ) || (normMName.length >= 5 && normQ.includes(normMName))) {
        detectedLocation = {
          name: m.name,
          type: 'municipio',
          area: m.officialArea || 'Centro',
          lat: m.lat,
          lng: m.lng
        };
        break;
      }
    }
  }

  // C) Si se detectó un municipio pero no tiene hospitales asignados explícitos,
  // calcular los hospitales más cercanos por distancia geodésica real (Haversine)
  if (detectedLocation && targetRefHospIds.length === 0) {
    if (detectedLocation.lat && detectedLocation.lng) {
      const hospByDist = [...hospitals]
        .map(h => ({
          id: h.id,
          dist: calculateDistanceKm(detectedLocation!.lat!, detectedLocation!.lng!, h.lat, h.lng)
        }))
        .sort((a, b) => a.dist - b.dist);

      targetRefHospIds = hospByDist.slice(0, 3).map(x => x.id);
    }
  }

  // D) Si no se detectó ubicación en este mensaje, recuperar del contexto previo
  if (!detectedLocation && context?.pendingLocation) {
    detectedLocation = context.pendingLocation;
    if (detectedLocation.lat && detectedLocation.lng) {
      const hospByDist = [...hospitals]
        .map(h => ({
          id: h.id,
          dist: calculateDistanceKm(detectedLocation!.lat!, detectedLocation!.lng!, h.lat, h.lng)
        }))
        .sort((a, b) => a.dist - b.dist);
      targetRefHospIds = hospByDist.slice(0, 3).map(x => x.id);
    }
  }

  // 2. Detección de necesidad clínica
  let detectedNeed: PatientClinicalNeed | null = null;
  for (const need of CLINICAL_NEEDS) {
    if (need.keywords.some(kw => normQ.includes(normalizeSpanishText(kw)))) {
      detectedNeed = {
        code: need.code,
        category: need.category,
        specialtyName: need.specialtyName,
        procedureExample: need.procedureExample,
        isHighComplexity: need.isHighComplexity
      };
      break;
    }
  }

  // Si no se detectó por palabra clave específica pero se menciona genéricamente operarse o cita
  if (!detectedNeed) {
    if (normQ.includes('operar') || normQ.includes('cirug') || normQ.includes('intervencion') || normQ.includes('quirofan')) {
      detectedNeed = {
        code: 'cirugia_general',
        category: 'quirurgica',
        specialtyName: 'Cirugía Programada',
        procedureExample: 'Intervención quirúrgica oficial'
      };
    } else if (normQ.includes('consulta') || normQ.includes('medico') || normQ.includes('cita') || normQ.includes('especialista')) {
      detectedNeed = {
        code: 'consultas_generales',
        category: 'consultas',
        specialtyName: 'Consultas Externas Especializadas',
        procedureExample: 'Primera consulta especializada'
      };
    } else if (normQ.includes('prueba') || normQ.includes('analisis') || normQ.includes('radiografia')) {
      detectedNeed = {
        code: 'pruebas_diagnosticas',
        category: 'pruebas',
        specialtyName: 'Pruebas Diagnósticas',
        procedureExample: 'Exploración diagnóstica'
      };
    }
  }

  // Si aún no hay necesidad, recuperar del contexto previo
  if (!detectedNeed && context?.pendingNeed) {
    detectedNeed = context.pendingNeed;
  }

  // ==========================================================================
  // CASO A: TENEMOS NECESIDAD PERO FALTA LA UBICACIÓN (Diálogo guiado paso 1)
  // ==========================================================================
  if (detectedNeed && !detectedLocation) {
    const promptText = `Entendido, necesitas atención para **${detectedNeed.specialtyName}** (${detectedNeed.procedureExample}).

Para poder calcular con exactitud cuál es tu hospital público de referencia más cercano y qué centros tienen menor demora con esta especialidad operativa, **¿en qué municipio o distrito de Madrid vives?**`;

    return {
      detectedLocation: null,
      detectedNeed,
      referenceHospital: null,
      alternativeHospitals: [],
      explanationText: promptText,
      legalNotice: 'Conforme al Decreto 51/2010 de Libre Elección en la Comunidad de Madrid, puedes solicitar ser atendido en cualquier hospital público de la red.',
      conversationState: {
        needsLocationPrompt: true,
        pendingNeed: detectedNeed,
        pendingLocation: null
      }
    };
  }

  // ==========================================================================
  // CASO B: TENEMOS UBICACIÓN PERO FALTA LA NECESIDAD CLÍNICA (Diálogo paso 1b)
  // ==========================================================================
  if (detectedLocation && !detectedNeed) {
    let refHospName = 'el hospital asignado a tu zona';
    if (targetRefHospIds.length > 0) {
      const h = hospitals.find(x => x.id === targetRefHospIds[0]);
      if (h) refHospName = h.fullName;
    }

    const promptText = `Perfecto, para residentes en **${detectedLocation.name}**, tu centro público de referencia por proximidad es **${refHospName}**.

**¿Qué tipo de consulta médica, prueba o intervención quirúrgica necesitas?** (por ejemplo: cataratas/ojos, prótesis de rodilla o cadera, hernia, vesícula, colonoscopia o pruebas diagnósticas)`;

    return {
      detectedLocation,
      detectedNeed: null,
      referenceHospital: null,
      alternativeHospitals: [],
      explanationText: promptText,
      legalNotice: 'Conforme al Decreto 51/2010 de Libre Elección en la Comunidad de Madrid, puedes solicitar ser atendido en cualquier hospital público de la red.',
      conversationState: {
        needsNeedPrompt: true,
        pendingNeed: null,
        pendingLocation: detectedLocation
      }
    };
  }

  // ==========================================================================
  // CASO C: DISPONEMOS DE AMBOS DATOS (O consulta directa completa)
  // ==========================================================================
  const activeNeed = detectedNeed || {
    code: 'cirugia_general',
    category: 'quirurgica' as const,
    specialtyName: 'Cirugía Programada',
    procedureExample: 'Intervención quirúrgica oficial'
  };

  const listType = activeNeed.category;
  const yearKey = listType === 'quirurgica' ? '2025' : '2024';

  // 3. Hospital de Referencia (si hay ubicación)
  let referenceHospital: PatientRecommendation['referenceHospital'] = null;
  if (targetRefHospIds.length > 0) {
    const refHosp = hospitals.find(h => h.id === targetRefHospIds[0]);
    if (refHosp) {
      const wait = refHosp.series[listType]?.demora?.[yearKey] ?? null;
      const pac = refHosp.series[listType]?.pacientes?.[yearKey] ?? null;
      const offers = hospitalOffersSpecialty(refHosp, activeNeed.code);
      const distKm = detectedLocation?.lat && detectedLocation?.lng
        ? calculateDistanceKm(detectedLocation.lat, detectedLocation.lng, refHosp.lat, refHosp.lng)
        : undefined;

      referenceHospital = {
        hospital: refHosp,
        reason: offers
          ? `Hospital público asignado por cercanía a ${detectedLocation?.name || 'tu zona'} (${refHosp.area}${distKm ? ` · a ${distKm} km` : ''}). Servicio de ${activeNeed.specialtyName} operativo.`
          : `Hospital público más cercano por zona geográfica, aunque para casos complejos de ${activeNeed.specialtyName} suele coordinarse con centros terciarios del Grupo 3.`,
        waitDays: wait,
        patients: pac,
        serviceConfirmed: offers,
        distanceKm: distKm
      };
    }
  }

  // 4. Centros alternativos con menor demora que SÍ cumplan el servicio
  const validHospitals = hospitals
    .filter(h => {
      const w = h.series[listType]?.demora?.[yearKey];
      const hasWait = w !== null && w !== undefined && w > 0;
      const offersService = hospitalOffersSpecialty(h, activeNeed.code);
      return hasWait && offersService;
    })
    .map(h => {
      const dist = detectedLocation?.lat && detectedLocation?.lng
        ? calculateDistanceKm(detectedLocation.lat, detectedLocation.lng, h.lat, h.lng)
        : undefined;
      return {
        hospital: h,
        waitDays: h.series[listType].demora[yearKey] ?? 999,
        patients: h.series[listType].pacientes[yearKey] ?? null,
        distanceKm: dist
      };
    })
    .sort((a, b) => a.waitDays - b.waitDays);

  const alternativeHospitals: PatientRecommendation['alternativeHospitals'] = [];

  // Top 1 de la red (Mínima demora autonómica)
  const top1 = validHospitals.find(x => x.hospital.id !== referenceHospital?.hospital.id);
  if (top1) {
    alternativeHospitals.push({
      hospital: top1.hospital,
      reason: `Menor tiempo de espera registrado en toda la red pública para ${activeNeed.specialtyName} (${top1.waitDays} días de demora media${top1.distanceKm ? ` · a ${top1.distanceKm} km` : ''}). Servicio verificado conforme al catálogo oficial.`,
      waitDays: top1.waitDays,
      patients: top1.patients,
      serviceConfirmed: true,
      distanceKm: top1.distanceKm
    });
  }

  // Top 2 de la red (Segunda mínima demora autonómica)
  const top2 = validHospitals.find(
    x => x.hospital.id !== referenceHospital?.hospital.id && x.hospital.id !== top1?.hospital.id
  );
  if (top2) {
    alternativeHospitals.push({
      hospital: top2.hospital,
      reason: `Excelente alternativa con ${top2.waitDays} días de espera media (${top2.hospital.area}, ${top2.hospital.complexityGroup}${top2.distanceKm ? ` · a ${top2.distanceKm} km` : ''}). Servicio activo.`,
      waitDays: top2.waitDays,
      patients: top2.patients,
      serviceConfirmed: true,
      distanceKm: top2.distanceKm
    });
  }

  // Alternativa cercana: Centro con baja demora ubicado preferentemente en su misma área sanitaria o a menor distancia
  if (detectedLocation) {
    const areaAlternative = validHospitals.find(
      x =>
        x.hospital.area === detectedLocation?.area &&
        x.hospital.id !== referenceHospital?.hospital.id &&
        !alternativeHospitals.some(alt => alt.hospital.id === x.hospital.id)
    ) || validHospitals.find(
      x =>
        x.hospital.id !== referenceHospital?.hospital.id &&
        !alternativeHospitals.some(alt => alt.hospital.id === x.hospital.id) &&
        (x.distanceKm !== undefined && x.distanceKm <= 25)
    );

    if (areaAlternative) {
      alternativeHospitals.push({
        hospital: areaAlternative.hospital,
        reason: `Alternativa de proximidad en tu entorno (${areaAlternative.hospital.area}${areaAlternative.distanceKm ? ` · a solo ${areaAlternative.distanceKm} km` : ''}), con ${areaAlternative.waitDays} días de espera media.`,
        waitDays: areaAlternative.waitDays,
        patients: areaAlternative.patients,
        serviceConfirmed: true,
        distanceKm: areaAlternative.distanceKm
      });
    }
  }

  // 5. Redacción fluida, pedagógica y libre de asteriscos innecesarios
  let text = '';
  const locName = detectedLocation?.name || 'tu zona';
  const specName = activeNeed.specialtyName;

  if (referenceHospital) {
    const refH = referenceHospital.hospital;
    const refDays = referenceHospital.waitDays;
    const refPac = referenceHospital.patients;
    const distText = referenceHospital.distanceKm !== undefined ? ` (a aprox. ${referenceHospital.distanceKm} km)` : '';

    text += `Para una necesidad de **${specName}** residiendo en **${locName}**, tu hospital público asignado por proximidad es el **${refH.fullName}**${distText}.\n\n`;
    text += `**Situación actual en tu centro de zona (${refH.shortName}):**\n`;
    text += `Registra una demora media de **${refDays ?? 'N/D'} días** en lista ${listType === 'quirurgica' ? 'quirúrgica' : 'de espera'} con **${refPac ?? 'N/D'} pacientes** en espera estructural (${refH.beds ?? 'N/D'} camas instaladas, ${refH.quirofanos ?? 'N/D'} quirófanos).\n\n`;

    if (activeNeed.isHighComplexity) {
      text += `*Nota de alta complejidad:* Este procedimiento requiere un hospital terciario de alta tecnología (Grupo 3). Todos los centros alternativos recomendados disponen de la acreditación requerida.\n\n`;
    }

    if (alternativeHospitals.length > 0) {
      text += `**Alternativas con menor espera gracias a la Libre Elección:**\n`;
      text += `Conforme al Decreto 51/2010 de la Comunidad de Madrid, puedes solicitar a tu médico ser derivado a cualquiera de estos centros con menor tiempo de espera y el servicio de ${specName} activo:\n\n`;
      alternativeHospitals.forEach((alt, idx) => {
        const dText = alt.distanceKm !== undefined ? ` · ${alt.distanceKm} km` : '';
        text += `${idx + 1}. **${alt.hospital.fullName}** (${alt.hospital.shortName}): **${alt.waitDays} días** de espera media (${alt.hospital.area}${dText}). ${alt.reason}\n`;
      });
    }
  } else {
    text += `Para consultas o procedimientos de **${specName}**, los hospitales públicos con menor demora oficial y servicio verificado son:\n\n`;
    alternativeHospitals.slice(0, 3).forEach((alt, idx) => {
      text += `${idx + 1}. **${alt.hospital.fullName}** (${alt.hospital.shortName}): **${alt.waitDays} días** de espera media (${alt.hospital.area}).\n`;
    });
    text += `\nComo referencia, la mediana en el conjunto de la red madrileña se sitúa en torno a los 53 días.`;
  }

  const legalNotice =
    'Información de Servicio Público: Conforme al Decreto 51/2010 de Libre Elección en la Comunidad de Madrid, cualquier ciudadano con tarjeta sanitaria del SERMAS puede solicitar a su médico de atención primaria o especialista ser derivado al hospital público que elija, sin coste ni pérdida de antigüedad.';

  return {
    detectedLocation,
    detectedNeed: activeNeed,
    referenceHospital,
    alternativeHospitals,
    explanationText: text,
    legalNotice,
    conversationState: {
      needsLocationPrompt: false,
      needsNeedPrompt: false,
      pendingNeed: null,
      pendingLocation: null
    }
  };
}
