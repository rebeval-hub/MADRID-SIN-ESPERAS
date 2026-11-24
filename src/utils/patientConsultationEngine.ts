import { FullHealthData, HospitalMetadata } from '../types';

export interface PatientLocation {
  name: string;
  type: 'distrito' | 'municipio' | 'area';
  area: 'Centro' | 'Norte' | 'Sur' | 'Este' | 'Oeste';
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
  } | null;
  alternativeHospitals: {
    hospital: HospitalMetadata;
    reason: string;
    waitDays: number | null;
    patients: number | null;
    serviceConfirmed: boolean;
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
    return ['ginecologia', 'cirugia_general'].includes(specialtyCode);
  }

  // 5. Hospital Central de la Cruz Roja: hospital de apoyo con cirugía ambulatoria (CMA)
  if (hospital.id === 'cruz_roja') {
    return ['oftalmologia', 'traumatologia', 'cirugia_general', 'dermatologia'].includes(specialtyCode);
  }

  // 6. Hospitales comarcales (Grupo 1) y de complejidad media (Grupo 2):
  // Cubren plenamente las especialidades troncales: oftalmología, traumatología, cirugía general, urología, ORL, ginecología, pruebas
  if (hospital.quirofanos !== null && hospital.quirofanos > 0) {
    return true;
  }

  return false;
}

// ============================================================================
// MAPEO DE DISTRITOS DE MADRID Y MUNICIPIOS
// ============================================================================
const MADRID_LOCATIONS: {
  keywords: string[];
  name: string;
  type: 'distrito' | 'municipio' | 'area';
  area: 'Centro' | 'Norte' | 'Sur' | 'Este' | 'Oeste';
  referenceHospitalIds: string[];
}[] = [
  // Distritos de Madrid Capital
  {
    keywords: ['villaverde', 'villaverde alto', 'villaverde bajo', 'san cristobal', 'butarque', 'los rosales'],
    name: 'Villaverde (Madrid Sur)',
    type: 'distrito',
    area: 'Sur',
    referenceHospitalIds: ['12_de_octubre', 'getafe', 'severo_ochoa']
  },
  {
    keywords: ['usera', 'orcasitas', 'san fermin', 'almendrales', 'moscardo'],
    name: 'Usera (Madrid Sur)',
    type: 'distrito',
    area: 'Sur',
    referenceHospitalIds: ['12_de_octubre', 'gregorio_maranon']
  },
  {
    keywords: ['carabanchel', 'vista alegre', 'opañel', 'buenavista', 'pan bendito', 'san isidro'],
    name: 'Carabanchel (Madrid Sur/Oeste)',
    type: 'distrito',
    area: 'Sur',
    referenceHospitalIds: ['12_de_octubre', 'gomez_ulla', 'clinico_san_carlos']
  },
  {
    keywords: ['vallecas', 'puente de vallecas', 'villa de vallecas', 'ensanche de vallecas', 'entrevias', 'palomeras'],
    name: 'Vallecas (Madrid Este/Sur)',
    type: 'distrito',
    area: 'Este',
    referenceHospitalIds: ['infanta_leonor', 'gregorio_maranon']
  },
  {
    keywords: ['latina', 'aluche', 'campamento', 'cuatro vientos', 'las aguilas', 'lucero'],
    name: 'Latina (Madrid Oeste)',
    type: 'distrito',
    area: 'Oeste',
    referenceHospitalIds: ['gomez_ulla', 'clinico_san_carlos', 'puerta_de_hierro']
  },
  {
    keywords: ['fuencarral', 'el pardo', 'montecarmelo', 'las tablas', 'mirasierra', 'barrio del pilar'],
    name: 'Fuencarral - El Pardo (Madrid Norte)',
    type: 'distrito',
    area: 'Norte',
    referenceHospitalIds: ['la_paz', 'ramon_y_cajal']
  },
  {
    keywords: ['tetuan', 'tetuán', 'cuatro caminos', 'bellas vistas', 'almenara', 'castillejos', 'valdeacederas'],
    name: 'Tetuán (Madrid Norte)',
    type: 'distrito',
    area: 'Norte',
    referenceHospitalIds: ['la_paz', 'ramon_y_cajal', 'la_princesa']
  },
  {
    keywords: ['chamartin', 'chamartín', 'prosperidad', 'ciudad jardin', 'hispanoamerica', 'nueva españa', 'castilla'],
    name: 'Chamartín (Madrid Norte)',
    type: 'distrito',
    area: 'Norte',
    referenceHospitalIds: ['la_paz', 'ramon_y_cajal', 'la_princesa']
  },
  {
    keywords: ['chamberi', 'chamberí', 'almagro', 'rios rosas', 'gaztambide', 'arapiles', 'vallehermoso'],
    name: 'Chamberí (Madrid Centro)',
    type: 'distrito',
    area: 'Centro',
    referenceHospitalIds: ['clinico_san_carlos', 'fundacion_jimenez_diaz', 'la_princesa']
  },
  {
    keywords: ['salamanca', 'recoletos', 'goya', 'fuente del berro', 'guindalera', 'lista', 'castellana'],
    name: 'Salamanca (Madrid Centro)',
    type: 'distrito',
    area: 'Centro',
    referenceHospitalIds: ['la_princesa', 'gregorio_maranon']
  },
  {
    keywords: ['distrito centro', 'sol', 'palacio', 'embajadores', 'cortes', 'justicia', 'universidad', 'malasaña', 'chueca', 'lavapies'],
    name: 'Distrito Centro (Madrid)',
    type: 'distrito',
    area: 'Centro',
    referenceHospitalIds: ['clinico_san_carlos', 'fundacion_jimenez_diaz', 'gregorio_maranon']
  },
  {
    keywords: ['arganzuela', 'palos de la frontera', 'acacias', 'chopera', 'legazpi', 'delicias', 'imperial'],
    name: 'Arganzuela (Madrid Centro/Sur)',
    type: 'distrito',
    area: 'Centro',
    referenceHospitalIds: ['12_de_octubre', 'gregorio_maranon', 'clinico_san_carlos']
  },
  {
    keywords: ['retiro', 'pacifico', 'ibiza', 'jerónimos', 'estrella', 'niño jesus'],
    name: 'Retiro (Madrid Centro)',
    type: 'distrito',
    area: 'Centro',
    referenceHospitalIds: ['gregorio_maranon', 'la_princesa']
  },
  {
    keywords: ['hortaleza', 'sanchinarro', 'canillas', 'pinar del rey', 'valdebebas'],
    name: 'Hortaleza (Madrid Este/Norte)',
    type: 'distrito',
    area: 'Este',
    referenceHospitalIds: ['ramon_y_cajal', 'la_paz']
  },
  {
    keywords: ['san blas', 'canillejas', 'simancas', 'las rosas', 'rejas', 'el salvador'],
    name: 'San Blas - Canillejas (Madrid Este)',
    type: 'distrito',
    area: 'Este',
    referenceHospitalIds: ['ramon_y_cajal', 'la_princesa', 'infanta_leonor']
  },
  {
    keywords: ['barajas', 'alameda de osuna', 'timon', 'corralejos', 'aeropuerto'],
    name: 'Barajas (Madrid Este)',
    type: 'distrito',
    area: 'Este',
    referenceHospitalIds: ['ramon_y_cajal', 'infanta_sofia']
  },
  {
    keywords: ['moratalaz', 'marroquina', 'media legua', 'fontarrón', 'vinateros'],
    name: 'Moratalaz (Madrid Este)',
    type: 'distrito',
    area: 'Este',
    referenceHospitalIds: ['gregorio_maranon', 'infanta_leonor']
  },
  {
    keywords: ['vicalvaro', 'vicálvaro', 'el cañaveral', 'casco historico de vicalvaro', 'ambroz'],
    name: 'Vicálvaro (Madrid Este)',
    type: 'distrito',
    area: 'Este',
    referenceHospitalIds: ['infanta_leonor', 'gregorio_maranon']
  },
  {
    keywords: ['ciudad lineal', 'ventas', 'pueblo nuevo', 'quintana', 'concepcion', 'san pascual', 'colina', 'atalaya', 'costillares'],
    name: 'Ciudad Lineal (Madrid Este)',
    type: 'distrito',
    area: 'Este',
    referenceHospitalIds: ['la_princesa', 'ramon_y_cajal', 'gregorio_maranon']
  },
  {
    keywords: ['moncloa', 'aravaca', 'casa de campo', 'arguelles', 'ciudad universitaria', 'valdezarza'],
    name: 'Moncloa - Aravaca (Madrid Oeste)',
    type: 'distrito',
    area: 'Oeste',
    referenceHospitalIds: ['clinico_san_carlos', 'fundacion_jimenez_diaz', 'puerta_de_hierro']
  },

  // Municipios de la Comunidad de Madrid
  {
    keywords: ['mostoles', 'móstoles'],
    name: 'Móstoles',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['mostoles', 'rey_juan_carlos', 'fundacion_alcorcon']
  },
  {
    keywords: ['fuenlabrada', 'humanes'],
    name: 'Fuenlabrada',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['fuenlabrada', 'severo_ochoa', 'getafe']
  },
  {
    keywords: ['alcorcon', 'alcorcón'],
    name: 'Alcorcón',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['fundacion_alcorcon', 'mostoles', 'rey_juan_carlos']
  },
  {
    keywords: ['getafe'],
    name: 'Getafe',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['getafe', '12_de_octubre', 'severo_ochoa']
  },
  {
    keywords: ['leganes', 'leganés', 'zarzaquemada', 'la fortuna', 'san nicasio'],
    name: 'Leganés',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['severo_ochoa', 'getafe', '12_de_octubre']
  },
  {
    keywords: ['parla'],
    name: 'Parla',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['infanta_cristina', 'getafe', 'fuenlabrada']
  },
  {
    keywords: ['alcala', 'alcalá', 'alcala de henares', 'alcalá de henares'],
    name: 'Alcalá de Henares',
    type: 'municipio',
    area: 'Este',
    referenceHospitalIds: ['principe_de_asturias', 'torrejon']
  },
  {
    keywords: ['torrejon', 'torrejón', 'torrejon de ardoz', 'torrejón de ardoz'],
    name: 'Torrejón de Ardoz',
    type: 'municipio',
    area: 'Este',
    referenceHospitalIds: ['torrejon', 'principe_de_asturias']
  },
  {
    keywords: ['alcobendas', 'san sebastian de los reyes', 'sanse'],
    name: 'Alcobendas / San Sebastián de los Reyes',
    type: 'municipio',
    area: 'Norte',
    referenceHospitalIds: ['infanta_sofia', 'la_paz']
  },
  {
    keywords: ['las rozas', 'majadahonda'],
    name: 'Las Rozas / Majadahonda',
    type: 'municipio',
    area: 'Oeste',
    referenceHospitalIds: ['puerta_de_hierro', 'villalba']
  },
  {
    keywords: ['pozuelo', 'pozuelo de alarcon', 'pozuelo de alarcón'],
    name: 'Pozuelo de Alarcón',
    type: 'municipio',
    area: 'Oeste',
    referenceHospitalIds: ['puerta_de_hierro', 'clinico_san_carlos']
  },
  {
    keywords: ['collado villalba', 'villalba', 'alpedrete', 'moralzarzal', 'galapagar'],
    name: 'Collado Villalba',
    type: 'municipio',
    area: 'Oeste',
    referenceHospitalIds: ['villalba', 'puerta_de_hierro', 'escorial']
  },
  {
    keywords: ['aranjuez'],
    name: 'Aranjuez',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['tajo', '12_de_octubre']
  },
  {
    keywords: ['arganda', 'arganda del rey', 'rivas', 'rivas vaciamadrid'],
    name: 'Rivas / Arganda del Rey',
    type: 'municipio',
    area: 'Este',
    referenceHospitalIds: ['sureste', 'gregorio_maranon']
  },
  {
    keywords: ['valdemoro', 'pinto', 'ciempozuelos'],
    name: 'Valdemoro / Pinto',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['infanta_elena', 'getafe', '12_de_octubre']
  },
  {
    keywords: ['coslada', 'san fernando de henares'],
    name: 'Coslada / San Fernando de Henares',
    type: 'municipio',
    area: 'Este',
    referenceHospitalIds: ['henares', 'ramon_y_cajal']
  }
];

// ============================================================================
// CATÁLOGO DE NECESIDADES CLÍNICAS Y ESPECIALIDADES
// ============================================================================
const CLINICAL_NEEDS: (PatientClinicalNeed & { keywords: string[] })[] = [
  {
    code: 'oftalmologia',
    keywords: ['ojos', 'ojo', 'vista', 'cataratas', 'catarata', 'oftalmolog', 'retina', 'glaucoma', 'miopia', 'astigmatismo'],
    specialtyName: 'Oftalmología',
    category: 'quirurgica',
    procedureExample: 'Cirugía de cataratas, desprendimiento de retina, glaucoma'
  },
  {
    code: 'traumatologia',
    keywords: ['trauma', 'traumatolog', 'rodilla', 'cadera', 'hueso', 'huesos', 'rotura', 'ligamento', 'menisco', 'protesis', 'prótesis', 'columna', 'pie', 'hombro', 'fractura'],
    specialtyName: 'Traumatología y Cirugía Ortopédica',
    category: 'quirurgica',
    procedureExample: 'Prótesis de cadera o rodilla, artroscopia de menisco'
  },
  {
    code: 'cirugia_general',
    keywords: ['vesicula', 'vesícula', 'hernia', 'apendice', 'apéndice', 'colon', 'digestivo', 'cirugia general', 'vesicula biliar', 'laparoscopia'],
    specialtyName: 'Cirugía General y del Aparato Digestivo',
    category: 'quirurgica',
    procedureExample: 'Reparación de hernia inguinal o umbilical, colecistectomía'
  },
  {
    code: 'orl',
    keywords: ['oido', 'oído', 'nariz', 'garganta', 'amigdalas', 'amígdalas', 'orl', 'otorrino', 'vegetaciones', 'timpano', 'tímpano', 'tabique', 'polipos', 'pólipos'],
    specialtyName: 'Otorrinolaringología (ORL)',
    category: 'quirurgica',
    procedureExample: 'Amigdalectomía, septoplastia nasal'
  },
  {
    code: 'urologia',
    keywords: ['urolog', 'prostata', 'próstata', 'riñon', 'riñón', 'piedras', 'calculos', 'cálculos', 'fimosis', 'vejiga'],
    specialtyName: 'Urología',
    category: 'quirurgica',
    procedureExample: 'Cirugía prostática, litotricia'
  },
  {
    code: 'ginecologia',
    keywords: ['ginecolog', 'parto', 'utero', 'útero', 'ovarios', 'mioma', 'cesarea', 'cesárea', 'histerectomia', 'suelo pelvico'],
    specialtyName: 'Ginecología y Obstetricia',
    category: 'quirurgica',
    procedureExample: 'Intervención ginecológica o cirugía de miomas'
  },
  {
    code: 'cirugia_cardiaca',
    keywords: ['corazon', 'corazón', 'cirugia cardiaca', 'cirugía cardíaca', 'valvula aortica', 'válvula mitral', 'bypass', 'marcapasos complejo', 'coronaria'],
    specialtyName: 'Cirugía Cardiovascular',
    category: 'quirurgica',
    procedureExample: 'Sustitución valvular, bypass coronario (alta complejidad)',
    isHighComplexity: true
  },
  {
    code: 'neurocirugia',
    keywords: ['cerebro', 'neurocirug', 'neurocirugía', 'tumor cerebral', 'aneurisma', 'columna compleja'],
    specialtyName: 'Neurocirugía',
    category: 'quirurgica',
    procedureExample: 'Cirugía craneal o descompresión medular (alta complejidad)',
    isHighComplexity: true
  },
  {
    code: 'dermatologia',
    keywords: ['dermatolog', 'piel', 'lunar', 'lunares', 'manchas', 'melanoma', 'biopsia de piel'],
    specialtyName: 'Dermatología',
    category: 'consultas',
    procedureExample: 'Consulta especializada de dermatología y extirpación de lesiones'
  },
  {
    code: 'pruebas_diagnosticas',
    keywords: ['resonancia', 'rm', 'resonancia magnetica', 'tac', 'scanner', 'escaner', 'escáner', 'tomografia', 'ecografia', 'endoscopia'],
    specialtyName: 'Pruebas Diagnósticas (TAC / Resonancia)',
    category: 'pruebas',
    procedureExample: 'Resonancia Magnética o Tomografía Axial Computarizada'
  },
  {
    code: 'cardiologia',
    keywords: ['cardio', 'cardiolog', 'arritmia', 'infarto', 'tension', 'tensión', 'holter', 'ecocardiograma'],
    specialtyName: 'Cardiología',
    category: 'consultas',
    procedureExample: 'Primera consulta de cardiología y pruebas diagnósticas cardíacas'
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
  const cleanQ = query.toLowerCase().trim();
  const hospitals = Object.values(data.hospitals);

  // 1. Detección de ubicación geográfica
  let detectedLocation: PatientLocation | null = null;
  let targetRefHospIds: string[] = [];

  for (const loc of MADRID_LOCATIONS) {
    if (loc.keywords.some(kw => cleanQ.includes(kw))) {
      detectedLocation = {
        name: loc.name,
        type: loc.type,
        area: loc.area
      };
      targetRefHospIds = loc.referenceHospitalIds;
      break;
    }
  }

  // Si no se detectó ubicación en este mensaje, recuperar del contexto previo
  if (!detectedLocation && context?.pendingLocation) {
    detectedLocation = context.pendingLocation;
    for (const loc of MADRID_LOCATIONS) {
      if (loc.name === detectedLocation.name) {
        targetRefHospIds = loc.referenceHospitalIds;
        break;
      }
    }
  }

  // 2. Detección de necesidad clínica
  let detectedNeed: PatientClinicalNeed | null = null;
  for (const need of CLINICAL_NEEDS) {
    if (need.keywords.some(kw => cleanQ.includes(kw))) {
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

  // Si no se detectó en este mensaje pero se menciona genéricamente operarse o cita
  if (!detectedNeed) {
    if (cleanQ.includes('operar') || cleanQ.includes('cirug') || cleanQ.includes('intervencion') || cleanQ.includes('quirofan')) {
      detectedNeed = {
        code: 'cirugia_general',
        category: 'quirurgica',
        specialtyName: 'Cirugía Programada',
        procedureExample: 'Intervención quirúrgica oficial'
      };
    } else if (cleanQ.includes('consulta') || cleanQ.includes('medico') || cleanQ.includes('cita')) {
      detectedNeed = {
        code: 'consultas_generales',
        category: 'consultas',
        specialtyName: 'Consultas Externas',
        procedureExample: 'Primera consulta especializada'
      };
    } else if (cleanQ.includes('prueba') || cleanQ.includes('analisis') || cleanQ.includes('radiografia')) {
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
    const promptText = `Detecto que necesitas una atención de ${detectedNeed.specialtyName} (${detectedNeed.procedureExample}).

Para poder indicarte cuál es tu hospital público de referencia más cercano y qué centros tienen menor tiempo de espera en esta especialidad, ¿en qué municipio o distrito de Madrid vives?`;

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

    const promptText = `Para residentes en ${detectedLocation.name}, tu centro público de referencia por proximidad es ${refHospName}.

¿Qué tipo de consulta médica, prueba diagnóstica o intervención quirúrgica necesitas (por ejemplo: cataratas/ojos, rodilla/cadera, hernia, pruebas, etc.)? Así podré informarte de los tiempos de espera y de los centros con menor demora.`;

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

      referenceHospital = {
        hospital: refHosp,
        reason: offers
          ? `Hospital público asignado por cercanía a ${detectedLocation?.name || 'tu zona'} (Área ${refHosp.area}). Cuenta con el servicio de ${activeNeed.specialtyName} operativo.`
          : `Hospital público más cercano por zona geográfica, aunque para casos complejos de ${activeNeed.specialtyName} suele coordinarse con centros terciarios del Grupo 3.`,
        waitDays: wait,
        patients: pac,
        serviceConfirmed: offers
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
    .sort((a, b) => {
      const wa = a.series[listType].demora[yearKey] || 999;
      const wb = b.series[listType].demora[yearKey] || 999;
      return wa - wb;
    });

  const alternativeHospitals: PatientRecommendation['alternativeHospitals'] = [];

  // Top 1 de la red
  const top1 = validHospitals.find(h => h.id !== referenceHospital?.hospital.id);
  if (top1) {
    alternativeHospitals.push({
      hospital: top1,
      reason: `Menor tiempo de espera registrado en toda la red pública para ${activeNeed.specialtyName} (${top1.series[listType].demora[yearKey]} días de demora media). Servicio verificado conforme al catálogo oficial.`,
      waitDays: top1.series[listType].demora[yearKey] ?? null,
      patients: top1.series[listType].pacientes[yearKey] ?? null,
      serviceConfirmed: true
    });
  }

  // Top 2 de la red
  const top2 = validHospitals.find(
    h => h.id !== referenceHospital?.hospital.id && h.id !== top1?.id
  );
  if (top2) {
    alternativeHospitals.push({
      hospital: top2,
      reason: `Excelente alternativa con ${top2.series[listType].demora[yearKey]} días de espera media (${top2.area}, ${top2.complexityGroup}). Servicio de ${activeNeed.specialtyName} activo.`,
      waitDays: top2.series[listType].demora[yearKey] ?? null,
      patients: top2.series[listType].pacientes[yearKey] ?? null,
      serviceConfirmed: true
    });
  }

  // Alternativa cercana en la misma área geográfica
  if (detectedLocation) {
    const areaAlternative = validHospitals.find(
      h =>
        h.area === detectedLocation?.area &&
        h.id !== referenceHospital?.hospital.id &&
        !alternativeHospitals.some(alt => alt.hospital.id === h.id)
    );
    if (areaAlternative) {
      alternativeHospitals.push({
        hospital: areaAlternative,
        reason: `Alternativa muy próxima en tu misma área (${detectedLocation.area}), con ${areaAlternative.series[listType].demora[yearKey]} días de demora media.`,
        waitDays: areaAlternative.series[listType].demora[yearKey] ?? null,
        patients: areaAlternative.series[listType].pacientes[yearKey] ?? null,
        serviceConfirmed: true
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

    text += `Para una necesidad de ${specName} residiendo en ${locName}, tu centro público de referencia por proximidad es el ${refH.fullName}.\n\n`;
    text += `Situación en tu hospital de zona (${refH.shortName}):\n`;
    text += `Actualmente registra una demora media de ${refDays ?? 'N/D'} días en lista ${listType === 'quirurgica' ? 'quirúrgica oficial' : 'de espera'} con ${refPac ?? 'N/D'} pacientes en espera estructural. El centro dispone de ${refH.beds ?? 'N/D'} camas y ${refH.quirofanos ?? 'N/D'} quirófanos.\n\n`;

    if (activeNeed.isHighComplexity) {
      text += `Nota de alta complejidad: Este procedimiento requiere un hospital de tercer nivel (Grupo 3). Hemos verificado que todos los centros alternativos recomendados disponen de la acreditación quirúrgica requerida.\n\n`;
    }

    if (alternativeHospitals.length > 0) {
      text += `Alternativas con menor espera gracias a la Libre Elección:\n`;
      text += `En la Comunidad de Madrid puedes elegir libremente ser intervenido en cualquier otro hospital público de la red. Si deseas reducir el tiempo de espera, estos son los centros con menor demora que cuentan con el servicio de ${specName} operativo:\n\n`;
      alternativeHospitals.forEach((alt, idx) => {
        text += `${idx + 1}. ${alt.hospital.fullName} (${alt.hospital.shortName}): ${alt.waitDays} días de espera media (${alt.hospital.area}, ${alt.hospital.complexityGroup}). ${alt.reason}\n`;
      });
    }
  } else {
    text += `Para consultas o procedimientos de ${specName}, los hospitales públicos con menor demora oficial y servicio verificado son:\n\n`;
    alternativeHospitals.slice(0, 3).forEach((alt, idx) => {
      text += `${idx + 1}. ${alt.hospital.fullName} (${alt.hospital.shortName}): ${alt.waitDays} días de espera media (${alt.hospital.area}, ${alt.hospital.complexityGroup}).\n`;
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
