/** Departamentos de Colombia para el checkout. */
export const COLOMBIA_DEPARTMENTS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá",
  "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba",
  "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena",
  "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda",
  "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
  "Valle del Cauca", "Vaupés", "Vichada", "Bogotá D.C.",
] as const;

export type ColombiaDepartment = (typeof COLOMBIA_DEPARTMENTS)[number];

/**
 * Principales municipios por departamento para el selector de ciudad del
 * checkout. No es la lista exhaustiva de los ~1.100 municipios del país; cubre
 * las cabeceras y los municipios más poblados. Para el resto, el formulario
 * ofrece la opción "Otra ciudad…" con entrada de texto libre.
 */
export const COLOMBIA_CITIES: Record<ColombiaDepartment, string[]> = {
  Amazonas: ["Leticia", "Puerto Nariño"],
  Antioquia: [
    "Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Turbo",
    "Rionegro", "Sabaneta", "La Estrella", "Copacabana", "Girardota",
    "Caucasia", "Caldas", "Marinilla", "El Carmen de Viboral", "Necoclí",
    "Yarumal", "Andes", "Santa Fe de Antioquia", "Puerto Berrío",
  ],
  Arauca: ["Arauca", "Tame", "Saravena", "Arauquita", "Fortul", "Puerto Rondón", "Cravo Norte"],
  Atlántico: [
    "Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Puerto Colombia",
    "Galapa", "Baranoa", "Sabanagrande", "Santo Tomás", "Palmar de Varela",
  ],
  Bolívar: [
    "Cartagena", "Magangué", "Turbaco", "El Carmen de Bolívar", "Arjona",
    "Mompós", "María La Baja", "San Juan Nepomuceno", "San Pablo", "Simití",
  ],
  Boyacá: [
    "Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa", "Puerto Boyacá",
    "Villa de Leyva", "Moniquirá", "Nobsa", "Samacá", "Garagoa", "Aquitania",
  ],
  Caldas: [
    "Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio",
    "Anserma", "Aguadas", "Salamina", "Supía", "Neira",
  ],
  Caquetá: ["Florencia", "San Vicente del Caguán", "Puerto Rico", "El Doncello", "Belén de los Andaquíes", "Cartagena del Chairá"],
  Casanare: ["Yopal", "Aguazul", "Villanueva", "Tauramena", "Paz de Ariporo", "Monterrey", "Maní", "Trinidad"],
  Cauca: [
    "Popayán", "Santander de Quilichao", "Puerto Tejada", "Patía (El Bordo)",
    "Guapi", "Miranda", "Corinto", "Piendamó", "Timbío", "Caloto",
  ],
  Cesar: [
    "Valledupar", "Aguachica", "Agustín Codazzi", "Bosconia", "La Jagua de Ibirico",
    "El Copey", "Chiriguaná", "Curumaní", "San Alberto", "Pailitas",
  ],
  Chocó: ["Quibdó", "Istmina", "Condoto", "Tadó", "Riosucio", "Bahía Solano", "Nuquí", "Acandí"],
  Córdoba: [
    "Montería", "Cereté", "Lorica", "Sahagún", "Montelíbano", "Planeta Rica",
    "Tierralta", "Ciénaga de Oro", "San Andrés de Sotavento", "Puerto Libertador",
  ],
  Cundinamarca: [
    "Soacha", "Fusagasugá", "Facatativá", "Zipaquirá", "Chía", "Girardot",
    "Mosquera", "Madrid", "Funza", "Cajicá", "Ubaté", "Cota", "Sibaté",
    "La Calera", "Tocancipá", "Villeta", "Tenjo", "Gachetá", "Anapoima",
  ],
  Guainía: ["Inírida"],
  Guaviare: ["San José del Guaviare", "El Retorno", "Calamar", "Miraflores"],
  Huila: [
    "Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre", "Gigante",
    "Palermo", "Aipe", "San Agustín", "Rivera",
  ],
  "La Guajira": [
    "Riohacha", "Maicao", "Uribia", "Fonseca", "San Juan del Cesar",
    "Villanueva", "Barrancas", "Manaure", "Albania", "Dibulla",
  ],
  Magdalena: [
    "Santa Marta", "Ciénaga", "Fundación", "El Banco", "Plato", "Zona Bananera",
    "Aracataca", "Pivijay", "Sitionuevo", "Puebloviejo",
  ],
  Meta: [
    "Villavicencio", "Acacías", "Granada", "Puerto López", "San Martín",
    "Cumaral", "Restrepo", "Puerto Gaitán", "Guamal", "Castilla la Nueva",
  ],
  Nariño: [
    "Pasto", "Ipiales", "Tumaco", "Túquerres", "La Unión", "Samaniego",
    "Sandoná", "Barbacoas", "Cumbal", "Pupiales",
  ],
  "Norte de Santander": [
    "Cúcuta", "Ocaña", "Villa del Rosario", "Los Patios", "Pamplona",
    "Tibú", "El Zulia", "Chinácota", "Ábrego", "Sardinata",
  ],
  Putumayo: ["Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez (La Hormiga)", "Villagarzón", "Sibundoy", "Puerto Caicedo"],
  Quindío: ["Armenia", "Calarcá", "La Tebaida", "Montenegro", "Quimbaya", "Circasia", "Filandia", "Salento", "Génova"],
  Risaralda: [
    "Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia",
    "Marsella", "Belén de Umbría", "Quinchía", "Apía", "Santuario",
  ],
  "San Andrés y Providencia": ["San Andrés", "Providencia y Santa Catalina"],
  Santander: [
    "Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja",
    "San Gil", "Barbosa", "Socorro", "Málaga", "Vélez", "Lebrija", "Sabana de Torres",
  ],
  Sucre: [
    "Sincelejo", "Corozal", "Sampués", "San Marcos", "San Onofre",
    "Tolú", "Coveñas", "Majagual", "Sincé", "Los Palmitos",
  ],
  Tolima: [
    "Ibagué", "Espinal", "Melgar", "Honda", "Líbano", "Chaparral",
    "Mariquita", "Flandes", "Purificación", "Guamo", "Fresno", "Cajamarca",
  ],
  "Valle del Cauca": [
    "Cali", "Buenaventura", "Palmira", "Tuluá", "Cartago", "Buga",
    "Jamundí", "Yumbo", "Florida", "Candelaria", "Zarzal", "Sevilla",
    "Cerrito", "Roldanillo", "La Unión", "Pradera",
  ],
  Vaupés: ["Mitú", "Carurú", "Taraira"],
  Vichada: ["Puerto Carreño", "La Primavera", "Santa Rosalía", "Cumaribo"],
  "Bogotá D.C.": ["Bogotá D.C."],
};

/** Sentinel para cuando el municipio no está en la lista y se escribe a mano. */
export const OTHER_CITY = "__otra__";
