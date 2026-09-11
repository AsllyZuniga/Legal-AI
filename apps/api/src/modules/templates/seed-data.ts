export function getComprehensiveSeedData() {
  const currentYear = new Date().getFullYear();
  const reviewDate = new Date();

  const base = {
    fileType: 'docx',
    fileSize: 0,
    jurisdiction: 'Colombia',
    isDefault: true,
    vigencyStatus: 'vigente',
    lastReviewDate: reviewDate,
    reviewYear: currentYear,
    tags: [],
    relatedNorms: [],
    relatedJurisprudence: [],
  };

  return [
    // ============================================
    // DERECHO CONSTITUCIONAL
    // ============================================
    { ...base, name: 'Accion de Tutela', description: 'Modelo de accion de tutela para proteccion de derechos fundamentales', legalArea: 'Derecho Constitucional', subcategory: 'Accion de tutela', documentType: 'Accion constitucional', purpose: 'Defender al cliente', tags: ['tutela', 'derechos fundamentales', 'articulo 86'], relatedNorms: ['Art. 86 CP', 'Decreto 2591 de 1991'], officialSource: 'Corte Constitucional', fileUrl: '/templates/default/accion-tutela.docx' },
    { ...base, name: 'Derecho de Peticion General', description: 'Modelo de derecho de peticion general ante autoridades o particulares', legalArea: 'Derecho Constitucional', subcategory: 'Derechos de peticion', documentType: 'Derecho de peticion', purpose: 'Solicitar informacion', tags: ['peticion', 'articulo 23'], relatedNorms: ['Art. 23 CP', 'Ley 1755 de 2015'], officialSource: 'Congreso de Colombia', fileUrl: '/templates/default/derecho-peticion-general.docx' },

    // ============================================
    // DERECHO CIVIL
    // ============================================
    { ...base, name: 'Demanda Ejecutiva', description: 'Demanda ejecutiva para cobro de obligaciones claras y exigibles', legalArea: 'Derecho Civil', subcategory: 'Procesos ejecutivos', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['ejecutivo', 'cobro'], relatedNorms: ['Art. 422 y ss. Ley 1564 de 2012'], officialSource: 'Rama Judicial', fileUrl: '/templates/default/demanda-ejecutiva.docx' },
    { ...base, name: 'Contrato de Compraventa Civil', description: 'Contrato de compraventa de bien inmueble o mueble', legalArea: 'Derecho Civil', subcategory: 'Compraventa', documentType: 'Contrato', purpose: 'Celebrar contrato', tags: ['compraventa', 'bien'], relatedNorms: ['Art. 1849 y ss. CC'], officialSource: 'Congreso de Colombia', fileUrl: '/templates/default/compraventa-civil.docx' },
    { ...base, name: 'Poder General Judicial', description: 'Poder general para actuar en procesos judiciales', legalArea: 'Derecho Civil', subcategory: 'Poderes', documentType: 'Poder', purpose: 'Representar al cliente', tags: ['poder', 'judicial'], relatedNorms: ['Art. 71 y ss. Ley 1564 de 2012'], officialSource: 'Rama Judicial', fileUrl: '/templates/default/poder-general-judicial.docx' },
    { ...base, name: 'Poder Especial', description: 'Poder especial para acto o proceso especifico', legalArea: 'Derecho Civil', subcategory: 'Poderes', documentType: 'Poder', purpose: 'Representar al cliente', tags: ['poder', 'especial'], relatedNorms: ['Art. 72 Ley 1564 de 2012'], officialSource: 'Rama Judicial', fileUrl: '/templates/default/poder-especial.docx' },

    // ============================================
    // DERECHO DE FAMILIA
    // ============================================
    { ...base, name: 'Demanda de Divorcio Contencioso', description: 'Demanda de divorcio contencioso por causales', legalArea: 'Derecho de Familia', subcategory: 'Divorcio', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['divorcio', 'contencioso'], relatedNorms: ['Art. 154 CC', 'Ley 25 de 1992'], officialSource: 'Corte Suprema de Justicia', fileUrl: '/templates/default/divorcio-contencioso.docx' },
    { ...base, name: 'Demanda de Divorcio de Mutuo Acuerdo', description: 'Demanda de divorcio de mutuo consentimiento', legalArea: 'Derecho de Familia', subcategory: 'Divorcio', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['divorcio', 'mutuo acuerdo'], relatedNorms: ['Art. 154 CC', 'Ley 25 de 1992'], officialSource: 'Corte Suprema de Justicia', fileUrl: '/templates/default/divorcio-mutuo-acuerdo.docx' },
    { ...base, name: 'Cesacion de Efectos Civiles de Matrimonio Religioso', description: 'Demanda de cesacion de efectos civiles de matrimonio religioso', legalArea: 'Derecho de Familia', subcategory: 'Cesacion de efectos civiles', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['cesacion', 'efectos civiles'], relatedNorms: ['Ley 25 de 1992', 'Concordato Art. 42'], officialSource: 'Corte Suprema de Justicia', fileUrl: '/templates/default/cesacion-efectos-civiles.docx' },
    { ...base, name: 'Aumento de Cuota Alimentaria', description: 'Solicitud de aumento de cuota alimentaria', legalArea: 'Derecho de Familia', subcategory: 'Aumento de cuota alimentaria', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['aumento', 'alimentos'], relatedNorms: ['Ley 1098 de 2006'], officialSource: 'ICBF', fileUrl: '/templates/default/aumento-cuota-alimentaria.docx' },
    { ...base, name: 'Impugnacion de Paternidad', description: 'Demanda de impugnacion de paternidad', legalArea: 'Derecho de Familia', subcategory: 'Impugnacion de paternidad', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['impugnacion', 'paternidad'], relatedNorms: ['Art. 333 y ss. CC'], officialSource: 'Corte Suprema de Justicia', fileUrl: '/templates/default/impugnacion-paternidad.docx' },
    { ...base, name: 'Sucesion Testamentaria', description: 'Demanda de sucesion testamentaria', legalArea: 'Derecho de Familia', subcategory: 'Sucesiones', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['sucesion', 'testamento'], relatedNorms: ['Art. 1043 y ss. CC'], officialSource: 'Rama Judicial', fileUrl: '/templates/default/sucesion-testamentaria.docx' },
    { ...base, name: 'Liquidacion de Sociedad Conyugal', description: 'Demanda de liquidacion de sociedad conyugal', legalArea: 'Derecho de Familia', subcategory: 'Liquidacion de sociedad conyugal', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['liquidacion', 'sociedad conyugal'], relatedNorms: ['Art. 1754 y ss. CC', 'Ley 28 de 1932'], officialSource: 'Corte Suprema de Justicia', fileUrl: '/templates/default/liquidacion-sociedad-conyugal.docx' },
    { ...base, name: 'Declaracion de Union Marital de Hecho', description: 'Solicitud de declaracion de union marital de hecho', legalArea: 'Derecho de Familia', subcategory: 'Declaracion de union marital', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['union marital', 'companeros permanentes'], relatedNorms: ['Ley 54 de 1990', 'Ley 979 de 2005'], officialSource: 'Congreso de Colombia', fileUrl: '/templates/default/declaracion-union-marital.docx' },

    // ============================================
    // DERECHO LABORAL Y SEGURIDAD SOCIAL
    // ============================================
    { ...base, name: 'Demanda Laboral Ordinaria', description: 'Demanda laboral ordinaria ante juez laboral', legalArea: 'Derecho Laboral y Seguridad Social', subcategory: 'Demandas laborales', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['demanda', 'laboral'], relatedNorms: ['CST', 'Ley 712 de 2001'], officialSource: 'Ministerio del Trabajo', fileUrl: '/templates/default/demanda-laboral-ordinaria.docx' },

    // ============================================
    // DERECHO ADMINISTRATIVO
    // ============================================
    { ...base, name: 'Demanda de Nulidad y Restablecimiento del Derecho', description: 'Demanda de nulidad y restablecimiento del derecho', legalArea: 'Derecho Administrativo', subcategory: 'Nulidad y restablecimiento del derecho', documentType: 'Demanda', purpose: 'Iniciar proceso', tags: ['nulidad', 'restablecimiento'], relatedNorms: ['Art. 138 CPACA'], officialSource: 'Consejo de Estado', fileUrl: '/templates/default/nulidad-restablecimiento.docx' },
    { ...base, name: 'Poder Administrativo', description: 'Poder para actuar ante entidades administrativas', legalArea: 'Derecho Administrativo', subcategory: 'Poderes', documentType: 'Poder', purpose: 'Representar al cliente', tags: ['poder', 'administrativo'], relatedNorms: ['CPACA'], officialSource: 'Congreso de Colombia', fileUrl: '/templates/default/poder-administrativo.docx' },

    // ============================================
    // DERECHO PENAL
    // ============================================
    { ...base, name: 'Poder para Actuacion Penal', description: 'Poder para representacion en proceso penal', legalArea: 'Derecho Penal', subcategory: 'Poder penal', documentType: 'Poder', purpose: 'Representar al cliente', tags: ['poder', 'penal'], relatedNorms: ['Ley 906 de 2004'], officialSource: 'Fiscalia General de la Nacion', fileUrl: '/templates/default/poder-penal.docx' },

    // ============================================
    // DERECHO COMERCIAL / MERCANTIL
    // ============================================
    { ...base, name: 'Contrato de Compraventa Comercial', description: 'Contrato de compraventa mercantil', legalArea: 'Derecho Comercial', subcategory: 'Compraventa comercial', documentType: 'Contrato', purpose: 'Celebrar contrato', tags: ['compraventa', 'comercial'], relatedNorms: ['Codigo de Comercio'], officialSource: 'Congreso de Colombia', fileUrl: '/templates/default/compraventa-comercial.docx' },
  ];
}
