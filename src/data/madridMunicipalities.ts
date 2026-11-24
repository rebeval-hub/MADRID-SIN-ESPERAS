export interface MadridMunicipality {
  name: string;
  postalCodes: string[];
  lat: number;
  lng: number;
  officialArea?: 'Centro' | 'Norte' | 'Sur' | 'Este' | 'Oeste';
  populationApprox?: number;
}

export const MADRID_MUNICIPALITIES: MadridMunicipality[] = [
  {
    name: 'Madrid',
    postalCodes: [
      '28001', '28002', '28003', '28004', '28005', '28006', '28007', '28008', '28009', '28010',
      '28011', '28012', '28013', '28014', '28015', '28016', '28017', '28018', '28019', '28020',
      '28021', '28022', '28023', '28024', '28025', '28026', '28027', '28028', '28029', '28030',
      '28031', '28032', '28033', '28034', '28035', '28036', '28037', '28038', '28039', '28040',
      '28041', '28042', '28043', '28044', '28045', '28046', '28047', '28048', '28049', '28050',
      '28051', '28052', '28053', '28054', '28055'
    ],
    lat: 40.4168,
    lng: -3.7038,
    officialArea: 'Centro',
    populationApprox: 3332035
  },
  {
    name: 'Móstoles',
    postalCodes: ['28931', '28932', '28933', '28934', '28935', '28936', '28937', '28938'],
    lat: 40.3232,
    lng: -3.8649,
    officialArea: 'Sur',
    populationApprox: 211265
  },
  {
    name: 'Alcalá de Henares',
    postalCodes: ['28801', '28802', '28803', '28804', '28805', '28806', '28807'],
    lat: 40.4820,
    lng: -3.3599,
    officialArea: 'Este',
    populationApprox: 199184
  },
  {
    name: 'Fuenlabrada',
    postalCodes: ['28941', '28942', '28943', '28944', '28945', '28946', '28947'],
    lat: 40.2842,
    lng: -3.7942,
    officialArea: 'Sur',
    populationApprox: 189891
  },
  {
    name: 'Leganés',
    postalCodes: ['28911', '28912', '28913', '28914', '28915', '28916', '28917', '28918', '28919'],
    lat: 40.3282,
    lng: -3.7635,
    officialArea: 'Sur',
    populationApprox: 191114
  },
  {
    name: 'Getafe',
    postalCodes: ['28901', '28902', '28903', '28904', '28905', '28906', '28907', '28909'],
    lat: 40.3083,
    lng: -3.7327,
    officialArea: 'Sur',
    populationApprox: 185180
  },
  {
    name: 'Alcorcón',
    postalCodes: ['28921', '28922', '28923', '28924', '28925'],
    lat: 40.3458,
    lng: -3.8249,
    officialArea: 'Sur',
    populationApprox: 171772
  },
  {
    name: 'Torrejón de Ardoz',
    postalCodes: ['28850', '28851'],
    lat: 40.4589,
    lng: -3.4795,
    officialArea: 'Este',
    populationApprox: 137711
  },
  {
    name: 'Parla',
    postalCodes: ['28981', '28982', '28983', '28984'],
    lat: 40.2372,
    lng: -3.7742,
    officialArea: 'Sur',
    populationApprox: 133004
  },
  {
    name: 'Alcobendas',
    postalCodes: ['28100', '28108', '28109'],
    lat: 40.5475,
    lng: -3.6421,
    officialArea: 'Norte',
    populationApprox: 119416
  },
  {
    name: 'Las Rozas de Madrid',
    postalCodes: ['28230', '28231', '28232', '28290'],
    lat: 40.4929,
    lng: -3.8736,
    officialArea: 'Oeste',
    populationApprox: 96705
  },
  {
    name: 'San Sebastián de los Reyes',
    postalCodes: ['28701', '28702', '28703', '28707', '28708', '28709'],
    lat: 40.5473,
    lng: -3.6264,
    officialArea: 'Norte',
    populationApprox: 92446
  },
  {
    name: 'Rivas-Vaciamadrid',
    postalCodes: ['28521', '28522', '28523', '28524'],
    lat: 40.3541,
    lng: -3.5358,
    officialArea: 'Este',
    populationApprox: 100270
  },
  {
    name: 'Pozuelo de Alarcón',
    postalCodes: ['28223', '28224'],
    lat: 40.4354,
    lng: -3.8136,
    officialArea: 'Oeste',
    populationApprox: 88784
  },
  {
    name: 'Coslada',
    postalCodes: ['28821', '28822', '28823'],
    lat: 40.4259,
    lng: -3.5658,
    officialArea: 'Este',
    populationApprox: 80596
  },
  {
    name: 'Valdemoro',
    postalCodes: ['28341', '28342', '28343'],
    lat: 40.1908,
    lng: -3.6766,
    officialArea: 'Sur',
    populationApprox: 81394
  },
  {
    name: 'Majadahonda',
    postalCodes: ['28220', '28221', '28222'],
    lat: 40.4727,
    lng: -3.8722,
    officialArea: 'Oeste',
    populationApprox: 72548
  },
  {
    name: 'Collado Villalba',
    postalCodes: ['28400'],
    lat: 40.6346,
    lng: -4.0084,
    officialArea: 'Oeste',
    populationApprox: 65657
  },
  {
    name: 'Aranjuez',
    postalCodes: ['28300'],
    lat: 40.0333,
    lng: -3.6028,
    officialArea: 'Sur',
    populationApprox: 61992
  },
  {
    name: 'Arganda del Rey',
    postalCodes: ['28500'],
    lat: 40.3005,
    lng: -3.4384,
    officialArea: 'Este',
    populationApprox: 58990
  },
  {
    name: 'Boadilla del Monte',
    postalCodes: ['28660', '28669'],
    lat: 40.4069,
    lng: -3.8753,
    officialArea: 'Oeste',
    populationApprox: 64742
  },
  {
    name: 'Pinto',
    postalCodes: ['28320'],
    lat: 40.2417,
    lng: -3.7001,
    officialArea: 'Sur',
    populationApprox: 55208
  },
  {
    name: 'Colmenar Viejo',
    postalCodes: ['28770'],
    lat: 40.6586,
    lng: -3.7675,
    officialArea: 'Norte',
    populationApprox: 55198
  },
  {
    name: 'San Fernando de Henares',
    postalCodes: ['28830'],
    lat: 40.4258,
    lng: -3.5350,
    officialArea: 'Este',
    populationApprox: 38904
  },
  {
    name: 'Tres Cantos',
    postalCodes: ['28760'],
    lat: 40.6074,
    lng: -3.7118,
    officialArea: 'Norte',
    populationApprox: 51453
  },
  {
    name: 'Galapagar',
    postalCodes: ['28260'],
    lat: 40.5794,
    lng: -4.0044,
    officialArea: 'Oeste',
    populationApprox: 35273
  },
  {
    name: 'Villaviciosa de Odón',
    postalCodes: ['28670'],
    lat: 40.3582,
    lng: -3.9036,
    officialArea: 'Sur',
    populationApprox: 28986
  },
  {
    name: 'Navalcarnero',
    postalCodes: ['28600'],
    lat: 40.2882,
    lng: -4.0152,
    officialArea: 'Sur',
    populationApprox: 31979
  },
  {
    name: 'Ciempozuelos',
    postalCodes: ['28350'],
    lat: 40.1583,
    lng: -3.6166,
    officialArea: 'Sur',
    populationApprox: 25866
  },
  {
    name: 'Mejorada del Campo',
    postalCodes: ['28840'],
    lat: 40.3972,
    lng: -3.4847,
    officialArea: 'Este',
    populationApprox: 24274
  },
  {
    name: 'Torrelodones',
    postalCodes: ['28250'],
    lat: 40.5761,
    lng: -3.9297,
    officialArea: 'Oeste',
    populationApprox: 25115
  },
  {
    name: 'Algete',
    postalCodes: ['28110'],
    lat: 40.5978,
    lng: -3.4984,
    officialArea: 'Norte',
    populationApprox: 20985
  },
  {
    name: 'Arroyomolinos',
    postalCodes: ['28939'],
    lat: 40.2747,
    lng: -3.9208,
    officialArea: 'Sur',
    populationApprox: 35972
  },
  {
    name: 'San Martín de la Vega',
    postalCodes: ['28330'],
    lat: 40.2081,
    lng: -3.5706,
    officialArea: 'Sur',
    populationApprox: 20309
  },
  {
    name: 'Humanes de Madrid',
    postalCodes: ['28970'],
    lat: 40.2525,
    lng: -3.8292,
    officialArea: 'Sur',
    populationApprox: 20239
  },
  {
    name: 'Paracuellos de Jarama',
    postalCodes: ['28860'],
    lat: 40.5053,
    lng: -3.5292,
    officialArea: 'Este',
    populationApprox: 27000
  },
  {
    name: 'San Lorenzo de El Escorial',
    postalCodes: ['28280'],
    lat: 40.5925,
    lng: -4.1481,
    officialArea: 'Oeste',
    populationApprox: 18495
  },
  {
    name: 'El Escorial',
    postalCodes: ['28292'],
    lat: 40.5833,
    lng: -4.1281,
    officialArea: 'Oeste',
    populationApprox: 16834
  },
  {
    name: 'Villanueva de la Cañada',
    postalCodes: ['28691', '28692'],
    lat: 40.4467,
    lng: -3.9989,
    officialArea: 'Oeste',
    populationApprox: 23103
  },
  {
    name: 'Villanueva del Pardillo',
    postalCodes: ['28229'],
    lat: 40.4908,
    lng: -3.9639,
    officialArea: 'Oeste',
    populationApprox: 17731
  },
  {
    name: 'Guadarrama',
    postalCodes: ['28440'],
    lat: 40.6725,
    lng: -4.0886,
    officialArea: 'Oeste',
    populationApprox: 17063
  },
  {
    name: 'Alpedrete',
    postalCodes: ['28430'],
    lat: 40.6603,
    lng: -4.0197,
    officialArea: 'Oeste',
    populationApprox: 15312
  },
  {
    name: 'Meco',
    postalCodes: ['28880'],
    lat: 40.5528,
    lng: -3.3275,
    officialArea: 'Este',
    populationApprox: 15404
  },
  {
    name: 'Moralzarzal',
    postalCodes: ['28411'],
    lat: 40.6808,
    lng: -3.9708,
    officialArea: 'Oeste',
    populationApprox: 14278
  },
  {
    name: 'Cercedilla',
    postalCodes: ['28470'],
    lat: 40.7411,
    lng: -4.0539,
    officialArea: 'Oeste',
    populationApprox: 7648
  },
  {
    name: 'San Agustín del Guadalix',
    postalCodes: ['28750'],
    lat: 40.6789,
    lng: -3.6156,
    officialArea: 'Norte',
    populationApprox: 13608
  },
  {
    name: 'Brunete',
    postalCodes: ['28690'],
    lat: 40.4042,
    lng: -3.9989,
    officialArea: 'Oeste',
    populationApprox: 11014
  },
  {
    name: 'Daganzo de Arriba',
    postalCodes: ['28814'],
    lat: 40.5433,
    lng: -3.4567,
    officialArea: 'Este',
    populationApprox: 10650
  },
  {
    name: 'Griñón',
    postalCodes: ['28971'],
    lat: 40.2139,
    lng: -3.8556,
    officialArea: 'Sur',
    populationApprox: 10594
  },
  {
    name: 'El Álamo',
    postalCodes: ['28607'],
    lat: 40.2319,
    lng: -3.9903,
    officialArea: 'Sur',
    populationApprox: 10322
  },
  {
    name: 'Sevilla la Nueva',
    postalCodes: ['28609'],
    lat: 40.3475,
    lng: -4.0253,
    officialArea: 'Oeste',
    populationApprox: 9551
  },
  {
    name: 'Colmenarejo',
    postalCodes: ['28270'],
    lat: 40.5603,
    lng: -4.0133,
    officialArea: 'Oeste',
    populationApprox: 9534
  },
  {
    name: 'Soto del Real',
    postalCodes: ['28791'],
    lat: 40.7525,
    lng: -3.7844,
    officialArea: 'Norte',
    populationApprox: 9399
  },
  {
    name: 'Manzanares el Real',
    postalCodes: ['28410'],
    lat: 40.7272,
    lng: -3.8647,
    officialArea: 'Norte',
    populationApprox: 9386
  },
  {
    name: 'Miraflores de la Sierra',
    postalCodes: ['28792'],
    lat: 40.8122,
    lng: -3.7686,
    officialArea: 'Norte',
    populationApprox: 6945
  },
  {
    name: 'Becerril de la Sierra',
    postalCodes: ['28490'],
    lat: 40.7097,
    lng: -3.9936,
    officialArea: 'Oeste',
    populationApprox: 6277
  },
  {
    name: 'Navacerrada',
    postalCodes: ['28491'],
    lat: 40.7289,
    lng: -4.0147,
    officialArea: 'Oeste',
    populationApprox: 3282
  },
  {
    name: 'Buitrago del Lozoya',
    postalCodes: ['28730'],
    lat: 40.9936,
    lng: -3.6381,
    officialArea: 'Norte',
    populationApprox: 1959
  },
  {
    name: 'Rascafría',
    postalCodes: ['28740'],
    lat: 40.9061,
    lng: -3.8797,
    officialArea: 'Norte',
    populationApprox: 1754
  },
  {
    name: 'San Martín de Valdeiglesias',
    postalCodes: ['28680'],
    lat: 40.3622,
    lng: -4.4008,
    officialArea: 'Oeste',
    populationApprox: 8977
  },
  {
    name: 'Villa del Prado',
    postalCodes: ['28630'],
    lat: 40.2789,
    lng: -4.3044,
    officialArea: 'Sur',
    populationApprox: 7272
  },
  {
    name: 'Chinchón',
    postalCodes: ['28370'],
    lat: 40.1397,
    lng: -3.4228,
    officialArea: 'Sur',
    populationApprox: 5658
  },
  {
    name: 'Villarejo de Salvanés',
    postalCodes: ['28590'],
    lat: 40.1689,
    lng: -3.2756,
    officialArea: 'Este',
    populationApprox: 7746
  }
];

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function searchMunicipalities(query: string): MadridMunicipality[] {
  if (!query || query.trim().length === 0) {
    return MADRID_MUNICIPALITIES.slice(0, 15);
  }
  const clean = query.trim().toLowerCase();

  // If query is numeric, check postal codes
  if (/^\d+$/.test(clean)) {
    return MADRID_MUNICIPALITIES.filter(m =>
      m.postalCodes.some(cp => cp.startsWith(clean))
    );
  }

  // Name match
  return MADRID_MUNICIPALITIES.filter(m =>
    m.name.toLowerCase().includes(clean)
  );
}

export function findMunicipalityByNameOrCp(query: string): MadridMunicipality | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();

  // Exact postal code match
  const byCp = MADRID_MUNICIPALITIES.find(m => m.postalCodes.includes(clean));
  if (byCp) return byCp;

  // Exact name match
  const byNameExact = MADRID_MUNICIPALITIES.find(m => m.name.toLowerCase() === clean);
  if (byNameExact) return byNameExact;

  // Partial match
  const byNamePartial = MADRID_MUNICIPALITIES.find(m => m.name.toLowerCase().includes(clean));
  return byNamePartial || null;
}
