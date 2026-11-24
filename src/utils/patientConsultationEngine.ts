import { FullHealthData, HospitalMetadata } from '../types';

export interface PatientRecommendation {
  detectedLocation: {
    name: string;
    type: 'distrito' | 'municipio' | 'area';
    area: 'Centro' | 'Norte' | 'Sur' | 'Este' | 'Oeste';
  } | null;
  detectedNeed: {
    category: 'quirurgica' | 'consultas' | 'pruebas';
    specialtyName: string;
    procedureExample: string;
  } | null;
  referenceHospital: {
    hospital: HospitalMetadata;
    reason: string;
    waitDays: number | null;
    patients: number | null;
  } | null;
  alternativeHospitals: {
    hospital: HospitalMetadata;
    reason: string;
    waitDays: number | null;
    patients: number | null;
  }[];
  explanationText: string;
  legalNotice: string;
}

// Mapeo exhaustivo de distritos de Madrid Capital y Municipios
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
    keywords: ['tetuan', 'cuatro caminos', 'bellas vistas', 'almenara', 'castillejos', 'valdeacederas'],
    name: 'Tetuán (Madrid Norte)',
    type: 'distrito',
    area: 'Norte',
    referenceHospitalIds: ['la_paz', 'ramon_y_cajal', 'la_princesa']
  },
  {
    keywords: ['chamartin', 'prosperidad', 'ciudad jardin', 'hispanoamerica', 'nueva españa', 'castilla'],
    name: 'Chamartín (Madrid Norte)',
    type: 'distrito',
    area: 'Norte',
    referenceHospitalIds: ['la_paz', 'ramon_y_cajal', 'la_princesa']
  },
  {
    keywords: ['chamberi', 'almagro', 'rios rosas', 'gaztambide', 'arapiles', 'vallehermoso'],
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
    keywords: ['centro', 'sol', 'palacio', 'embajadores', 'cortes', 'justicia', 'universidad', 'malasaña', 'chueca', 'lavapies'],
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
    keywords: ['vicalvaro', 'el cañaveral', 'casco historico de vicalvaro', 'ambroz'],
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
    keywords: ['alcala', 'alcalá', 'alcala de henares', 'alcalá de henares'],
    name: 'Alcalá de Henares',
    type: 'municipio',
    area: 'Este',
    referenceHospitalIds: ['principe_de_asturias', 'torrejon']
  },
  {
    keywords: ['fuenlabrada'],
    name: 'Fuenlabrada',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['fuenlabrada', 'severo_ochoa', 'getafe']
  },
  {
    keywords: ['leganes', 'leganés'],
    name: 'Leganés',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['severo_ochoa', 'getafe', '12_de_octubre']
  },
  {
    keywords: ['getafe'],
    name: 'Getafe',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['getafe', '12_de_octubre', 'severo_ochoa']
  },
  {
    keywords: ['alcorcon', 'alcorcón'],
    name: 'Alcorcón',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['fundacion_alcorcon', 'mostoles', 'rey_juan_carlos']
  },
  {
    keywords: ['parla'],
    name: 'Parla',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['infanta_cristina', 'getafe']
  },
  {
    keywords: ['torrejon', 'torrejón', 'torrejon de ardoz'],
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
    keywords: ['las rozas', 'majadahonda', 'boadilla'],
    name: 'Majadahonda / Las Rozas / Boadilla',
    type: 'municipio',
    area: 'Oeste',
    referenceHospitalIds: ['puerta_de_hierro']
  },
  {
    keywords: ['collado villalba', 'villalba', 'el escorial', 'guadarrama', 'alpedrete', 'torrelodones'],
    name: 'Collado Villalba / Sierra Noroeste',
    type: 'municipio',
    area: 'Oeste',
    referenceHospitalIds: ['villalba', 'escorial', 'puerta_de_hierro']
  },
  {
    keywords: ['aranjuez', 'ciempozuelos'],
    name: 'Aranjuez',
    type: 'municipio',
    area: 'Sur',
    referenceHospitalIds: ['tajo', '12_de_octubre']
  },
  {
    keywords: ['arganda', 'arganda del rey', 'rivas', 'rivas vaciamadrid', 'rivas-vaciamadrid'],
    name: 'Arganda del Rey / Rivas',
    type: 'municipio',
    area: 'Este',
    referenceHospitalIds: ['sureste', 'gregorio_maranon']
  },
  {
    keywords: ['valdemoro', 'pinto'],
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

// Necesidades clínicas y especialidades quirúrgicas/diagnósticas
const CLINICAL_NEEDS = [
  {
    keywords: ['ojos', 'ojo', 'vista', 'cataratas', 'catarata', 'oftalmolog', 'retina', 'glaucoma', 'miopia', 'astigmatismo'],
    specialtyName: 'Oftalmología',
    category: 'quirurgica' as const,
    procedureExample: 'Cirugía de cataratas, desprendimiento de retina, glaucoma'
  },
  {
    keywords: ['trauma', 'traumatolog', 'rodilla', 'cadera', 'hueso', 'huesos', 'rotura', 'ligamento', 'menisco', 'protesis', 'columna', 'pie', 'hombro'],
    specialtyName: 'Traumatología y Cirugía Ortopédica',
    category: 'quirurgica' as const,
    procedureExample: 'Prótesis de cadera o rodilla, artroscopia de menisco'
  },
  {
    keywords: ['vesicula', 'vesícula', 'hernia', 'apendice', 'apéndice', 'colon', 'digestivo', 'cirugia general', 'vesicula biliar'],
    specialtyName: 'Cirugía General y del Aparato Digestivo',
    category: 'quirurgica' as const,
    procedureExample: 'Reparación de hernia inguinal o umbilical, colecistectomía'
  },
  {
    keywords: ['oido', 'oído', 'nariz', 'garganta', 'amigdalas', 'amígdalas', 'orl', 'otorrino', 'vegetaciones', 'timpano', 'tabique'],
    specialtyName: 'Otorrinolaringología (ORL)',
    category: 'quirurgica' as const,
    procedureExample: 'Amigdalectomía, septoplastia nasal'
  },
  {
    keywords: ['urolog', 'prostata', 'próstata', 'riñon', 'riñón', 'piedras', 'calculos', 'cálculos', 'fimosis', 'vejiga'],
    specialtyName: 'Urología',
    category: 'quirurgica' as const,
    procedureExample: 'Cirugía prostática, litotricia'
  },
  {
    keywords: ['ginecolog', 'parto', 'utero', 'útero', 'ovarios', 'mioma', 'cesarea', 'cesárea'],
    specialtyName: 'Ginecología y Obstetricia',
    category: 'quirurgica' as const,
    procedureExample: 'Intervención ginecológica o cirugía de miomas'
  },
  {
    keywords: ['resonancia', 'rm', 'resonancia magnetica', 'resonancia magnética'],
    specialtyName: 'Resonancia Magnética (RM)',
    category: 'pruebas' as const,
    procedureExample: 'RM craneal, de columna, articular o abdominopélvica'
  },
  {
    keywords: ['tac', 'scanner', 'escaner', 'escáner', 'tomografia', 'tomografía'],
    specialtyName: 'Tomografía Axial Computarizada (TAC)',
    category: 'pruebas' as const,
    procedureExample: 'TAC toracoabdominal o cerebral'
  },
  {
    keywords: ['dermatolog', 'piel', 'lunar', 'lunares', 'manchas', 'melanoma'],
    specialtyName: 'Dermatología',
    category: 'consultas' as const,
    procedureExample: 'Consulta especializada de dermatología y extirpación de lesiones'
  },
  {
    keywords: ['cardio', 'corazon', 'corazón', 'cardiolog', 'arritmia', 'infarto', 'tension', 'tensión'],
    specialtyName: 'Cardiología',
    category: 'consultas' as const,
    procedureExample: 'Primera consulta de cardiología y pruebas hemodinámicas'
  }
];

export function analyzePatientQuery(query: string, data: FullHealthData): PatientRecommendation {
  const cleanQ = query.toLowerCase().trim();
  const hospitals = Object.values(data.hospitals);

  // 1. Detectar ubicación geográfica
  let detectedLocation: PatientRecommendation['detectedLocation'] = null;
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

  // 2. Detectar necesidad clínica
  let detectedNeed: PatientRecommendation['detectedNeed'] = null;
  for (const need of CLINICAL_NEEDS) {
    if (need.keywords.some(kw => cleanQ.includes(kw))) {
      detectedNeed = {
        category: need.category,
        specialtyName: need.specialtyName,
        procedureExample: need.procedureExample
      };
      break;
    }
  }

  // Si no se detectó necesidad explícita pero se menciona "operar", "cirugia", "espera", asumir quirúrgica general
  if (!detectedNeed) {
    if (cleanQ.includes('operar') || cleanQ.includes('cirug') || cleanQ.includes('intervencion') || cleanQ.includes('quirofan')) {
      detectedNeed = {
        category: 'quirurgica',
        specialtyName: 'Cirugía Programada',
        procedureExample: 'Intervención quirúrgica general'
      };
    } else if (cleanQ.includes('consulta') || cleanQ.includes('medico') || cleanQ.includes('cita')) {
      detectedNeed = {
        category: 'consultas',
        specialtyName: 'Consultas Externas',
        procedureExample: 'Primera consulta especializada'
      };
    } else if (cleanQ.includes('prueba') || cleanQ.includes('analisis') || cleanQ.includes('radiografia')) {
      detectedNeed = {
        category: 'pruebas',
        specialtyName: 'Pruebas Diagnósticas',
        procedureExample: 'Exploración diagnóstica'
      };
    } else {
      detectedNeed = {
        category: 'quirurgica',
        specialtyName: 'Cirugía Programada',
        procedureExample: 'Intervención quirúrgica oficial'
      };
    }
  }

  const listType = detectedNeed.category;
  const yearKey = listType === 'quirurgica' ? '2025' : '2024';

  // 3. Obtener Hospital de Referencia (si hay ubicación detectada)
  let referenceHospital: PatientRecommendation['referenceHospital'] = null;
  if (targetRefHospIds.length > 0) {
    const refHosp = hospitals.find(h => h.id === targetRefHospIds[0]);
    if (refHosp) {
      const wait = refHosp.series[listType]?.demora?.[yearKey] ?? null;
      const pac = refHosp.series[listType]?.pacientes?.[yearKey] ?? null;
      referenceHospital = {
        hospital: refHosp,
        reason: `Hospital público asignado por cercanía a ${detectedLocation?.name || 'tu zona'} (área ${refHosp.area}).`,
        waitDays: wait,
        patients: pac
      };
    }
  }

  // 4. Calcular Hospitales Alternativos Recomendados
  // A) Centros con menor demora en la red (Libre Elección de Madrid)
  // B) Centro cercano en la misma área sanitaria
  const validHospitals = hospitals
    .filter(h => {
      const w = h.series[listType]?.demora?.[yearKey];
      return w !== null && w !== undefined && w > 0;
    })
    .sort((a, b) => {
      const wa = a.series[listType].demora[yearKey] || 999;
      const wb = b.series[listType].demora[yearKey] || 999;
      return wa - wb;
    });

  const alternativeHospitals: PatientRecommendation['alternativeHospitals'] = [];

  // Añadir el mejor hospital en demora de toda la red
  const topNetwork = validHospitals.find(h => h.id !== referenceHospital?.hospital.id);
  if (topNetwork) {
    alternativeHospitals.push({
      hospital: topNetwork,
      reason: `Menor tiempo de espera de toda la red pública de Madrid para esta lista (${topNetwork.series[listType].demora[yearKey]} días). Disponible mediante Libre Elección.`,
      waitDays: topNetwork.series[listType].demora[yearKey] ?? null,
      patients: topNetwork.series[listType].pacientes[yearKey] ?? null
    });
  }

  // Añadir un segundo hospital con baja espera (ej. Torrejón, Villalba o FJD si no está ya)
  const secondNetwork = validHospitals.find(
    h => h.id !== referenceHospital?.hospital.id && h.id !== topNetwork?.id
  );
  if (secondNetwork) {
    alternativeHospitals.push({
      hospital: secondNetwork,
      reason: `Excelente tiempo de espera (${secondNetwork.series[listType].demora[yearKey]} días, frente a la mediana regional de 53 d).`,
      waitDays: secondNetwork.series[listType].demora[yearKey] ?? null,
      patients: secondNetwork.series[listType].pacientes[yearKey] ?? null
    });
  }

  // Si hay ubicación, buscar un hospital alternativo cercano en la misma área
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
        reason: `Alternativa muy cercana en tu misma área (${detectedLocation.area}), con ${areaAlternative.series[listType].demora[yearKey]} días de espera media.`,
        waitDays: areaAlternative.series[listType].demora[yearKey] ?? null,
        patients: areaAlternative.series[listType].pacientes[yearKey] ?? null
      });
    }
  }

  // 5. Redacción fluida, pedagógica y personalizada (sin excesos de asteriscos)
  let text = '';
  const locName = detectedLocation?.name || 'tu zona';
  const specName = detectedNeed.specialtyName;

  if (referenceHospital) {
    const refH = referenceHospital.hospital;
    const refDays = referenceHospital.waitDays;
    const refPac = referenceHospital.patients;

    text += `Para una necesidad de ${specName} viviendo en ${locName}, tu centro público de referencia por proximidad es el ${refH.fullName}.\n\n`;
    text += `Situación en tu hospital de zona (${refH.shortName}):\n`;
    text += `Actualmente registra una demora media de ${refDays ?? 'N/D'} días en lista ${listType === 'quirurgica' ? 'quirúrgica oficial' : 'de espera'}, con ${refPac ?? 'N/D'} pacientes en espera estructural. El centro dispone de ${refH.beds} camas instaladas y ${refH.quirofanos} quirófanos en funcionamiento.\n\n`;

    if (alternativeHospitals.length > 0) {
      text += `Alternativas con menor espera gracias a la Libre Elección:\n`;
      text += `En la Comunidad de Madrid puedes elegir libremente ser atendido en cualquier otro hospital público de la red. Si deseas reducir el tiempo de espera, estos son los centros con menores demoras registradas para este servicio:\n\n`;
      alternativeHospitals.forEach((alt, idx) => {
        text += `${idx + 1}. ${alt.hospital.fullName} (${alt.hospital.shortName}): ${alt.waitDays} días de espera media (${alt.hospital.area}, ${alt.hospital.complexityGroup}). ${alt.reason}\n`;
      });
    }
  } else {
    text += `Para consultas o procedimientos de ${specName}, los hospitales públicos con menor demora oficial a cierre de ejercicio son:\n\n`;
    alternativeHospitals.slice(0, 3).forEach((alt, idx) => {
      text += `${idx + 1}. ${alt.hospital.fullName} (${alt.hospital.shortName}): ${alt.waitDays} días de espera media (${alt.hospital.area}, ${alt.hospital.complexityGroup}).\n`;
    });
    text += `\nComo referencia, la mediana en el conjunto de la red hospitalaria madrileña se sitúa en torno a los 53 días.`;
  }

  const legalNotice =
    'Información de Servicio Público: Conforme al Decreto 51/2010 de Libre Elección en la Comunidad de Madrid, cualquier ciudadano con tarjeta sanitaria del SERMAS puede solicitar a su médico de atención primaria o especialista ser derivado al hospital público que elija, sin perder su puesto ni derechos.';

  return {
    detectedLocation,
    detectedNeed,
    referenceHospital,
    alternativeHospitals,
    explanationText: text,
    legalNotice
  };
}
