-- ============================================
-- SEED: DATOS DE PRUEBA (MOCK)
-- ============================================
-- NOTA: Todos estos datos son MOCK para desarrollo.
-- En producción, estos datos provienen de fuentes oficiales.

-- ============================================
-- USUARIOS
-- Abogado (password: "Demo1234")
-- ============================================

INSERT INTO users (id, document_number, password_hash, full_name, law_firm, role_id, credits) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '1000000001', '$2a$10$rhGvTTUm4Qw.MtPsvK9NkeMlLuOdjYPi/P4S28.hTfHqz0emE8gNu', 'Abogado Demo', 'Firma Demo', 'lawyer', 1000);

-- ============================================
-- CASOS DE PRUEBA (MOCK)
-- ============================================

INSERT INTO cases (id, user_id, name, description, legal_area, subarea, parties, pretensions, legal_problem_description, status) VALUES
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Demo vs. Constructora Demo - Incumplimiento contractual',
    'Demanda por incumplimiento de contrato de compraventa de vivienda. El vendedor no entregó a tiempo y la vivienda presenta defectos de construcción.',
    'civil',
    'incumplimiento_contractual',
    '{"demandantes": [{"name": "DEMANDANTE DEMO", "documentType": "CC", "documentNumber": "80000001"}], "demandados": [{"name": "CONSTRUCTORA DEMO S.A.S.", "documentType": "NIT", "documentNumber": "900000001"}]}',
    'Pago de perjuicios materiales y moratorias por incumplimiento del contrato de compraventa de vivienda C-2024-001.',
    '¿Tiene derecho el comprador a la indemnización por daños y perjuicios solicitada cuando el vendedor incumplió el plazo de entrega y la vivienda presenta defectos de construcción?',
    'active'
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Rodríguez - Custodia de menores',
    'Proceso de custodia y cuidado personal de dos menores de edad después del divorcio.',
    'familia',
    'custodia_menores',
    '{"demandantes": [{"name": "ANA MARÍA RODRÍGUEZ SUÁREZ", "documentType": "CC", "documentNumber": "52345678"}], "demandados": [{"name": "PEDRO ANTONIO MARTÍNEZ LÓPEZ", "documentType": "CC", "documentNumber": "79123456"}]}',
    'Asignación de la custodia y cuidado personal de los menores Pedro y Sofía Martínez Rodríguez.',
    '¿Cuáles son los factores que debe evaluar el juez para determinar la custodia en un caso de divorcio con menores?',
    'active'
  );

-- ============================================
-- HECHOS DE PRUEBA (MOCK)
-- ============================================

INSERT INTO case_facts (id, case_id, fact_type, description, event_date, is_date_exact, chronological_order, is_juridically_relevant, relevance_explanation, verification_status) VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'documented', 'Celebración del contrato de compraventa de vivienda C-2024-001 entre las partes.', '2024-01-15', true, 1, true, 'Constituye el origen de la obligación contractual.', 'verified'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'documented', 'Pago del valor total de la vivienda por parte del comprador.', '2024-02-01', true, 2, true, 'Demuestra el cumplimiento de la obligación del comprador.', 'verified'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'user_reported', 'Fecha pactada de entrega de la vivienda.', '2024-06-01', true, 3, true, 'Plazo contractual incumplido.', 'unverified'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'user_reported', 'El vendedor notificó demora en la entrega.', '2024-05-20', true, 4, true, 'Reconocimiento implícito de incumplimiento.', 'needs_verification'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b00', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'documented', 'Entrega efectiva de la vivienda con defectos.', '2024-09-15', true, 5, true, 'Incumplimiento del plazo y entrega con vicios.', 'verified'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'user_reported', 'Requerimiento extrajudicial al vendedor para subsanar defectos.', '2024-10-01', true, 6, true, 'Intento de resolución amigable.', 'unverified'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'user_reported', 'El vendedor no respondió al requerimiento.', '2024-10-15', true, 7, true, 'Agota la vía administrativa.', 'unverified');

-- ============================================
-- SENTENCIAS DE PRUEBA (MOCK)
-- ============================================

INSERT INTO rulings (id, citation, ruling_type, process_type, corporation, chamber, magistrate_ponent, ruling_date, legal_area, themes, summary, resuelve, source_url, source_type, referenced_norms, cited_rulings, embedding_status) VALUES
  (
    '10eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    'T-409/19',
    'sentencia',
    'tutela',
    'corte_constitucional',
    'Sala Primera de Revisión',
    'ALEJANDRO LINARES CANTOR',
    '2019-05-13',
    'constitucional',
    '["DERECHO A LA VIVIENDA DIGNA", "INCUMPLIMIENTO CONTRACTUAL", "DEFENSAS DEL CONSUMIDOR"]',
    'La Corte tuteló el derecho a la vivienda digna de un comprador frente al incumplimiento de una constructora que no entregó a tiempo la vivienda.',
    'Se REVOCA la sentencia de tutela y se ordena a la constructora entregar la vivienda en un plazo de 30 días o restituir el dinero con intereses.',
    'https://www.corteconstitucional.gov.co/relatoria/2019/T-409-19.htm',
    'official',
    '["Art. 51 C.P.", "Ley 675 de 2001", "Código Civil art. 1546"]',
    '["T-285/18", "SU-400/17", "T-613/16"]',
    'completed'
  ),
  (
    '10eebc99-9c0b-4ef8-bb6d-6bb9bd380c02',
    'SC-2023-001',
    'sentencia',
    'casacion',
    'corte_suprema',
    'Sala de Casación Civil',
    'ARAMBUJO TRUJILLO, ESTHER',
    '2023-03-15',
    'civil',
    '["RESPONSABILIDAD CONTRACTUAL", "DAÑOS Y PERJUICIOS", "INCUMPLIMIENTO CONTRACTUAL"]',
    'La Corte estableció criterios para la cuantificación de perjuicios en casos de incumplimiento de contrato de compraventa.',
    'Se CASA parcialmente la sentencia y se condena al vendedor al pago de perjuicios materiales y moratorias.',
    'https://cortesuprema.gov.co/corte/',
    'official',
    '["Art. 1602 C.C.", "Art. 1603 C.C.", "Art. 884 C.C."]',
    '["SC-2021-001", "SC-2019-003"]',
    'completed'
  ),
  (
    '10eebc99-9c0b-4ef8-bb6d-6bb9bd380c03',
    'CE-SU-2022-001',
    'sentencia',
    'union',
    'consejo_estado',
    'Sala Plena',
    'ROJAS GIL, WILLIAM',
    '2022-06-10',
    'contencioso_administrativo',
    '["RESPONSABILIDAD DEL ESTADO", "DAÑO ANTIJURÍDICO", "SERVICIO PÚBLICO"]',
    'El Consejo de Estado definió los parámetros para la indemnización por daño antijurídico en casos de mala prestación del servicio público de salud.',
    'Se condena a la entidad prestadora al pago de perjuicios materiales y morales.',
    'https://www.consejodeestado.gov.co',
    'official',
    '["Art. 90 C.P.", "Ley 270 de 1996", "C.C.A. art. 141"]',
    '["CE-2021-001", "CE-2020-005"]',
    'completed'
  );

-- ============================================
-- ALERTAS DE PRUEBA (MOCK)
-- ============================================

INSERT INTO case_alerts (case_id, alert_type, priority, title, description, recommendation) VALUES
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'evidentiary_deficit', 'high', 'Falta de prueba de la fecha exacta de entrega', 'El usuario indica la fecha de entrega pero no ha adjuntado documento que la compruebe.', 'Solicitar al cliente la escritura pública o acta de entrega.'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'procedural_deadline', 'medium', 'Verificar término de prescripción', 'Verificar que la acción no haya prescrito según los términos del Código Civil.', 'Calcular el término de prescripción desde el incumplimiento.');

-- ============================================
-- FUENTES REGISTRADAS (MOCK)
-- ============================================

INSERT INTO source_registry (name, source_type, url, adapter_class, is_active, total_documents) VALUES
  ('Corte Constitucional - Datos Abiertos', 'api', 'https://www.datos.gov.co/resource/v2k4-2t8s.json', 'CorteConstitucionalAdapter', true, 15000),
  ('Corte Constitucional - Relatoria', 'scraper', 'https://www.corteconstitucional.gov.co/relatoria/', 'CorteConstitucionalRelatoriaAdapter', true, 15000),
  ('Corte Suprema - WebRelatoria', 'scraper', 'https://consultajurisprudencial.ramajudicial.gov.co/WebRelatoria/csj/', 'CorteSupremaAdapter', true, 30000),
  ('Consejo de Estado - Mi Relatoría', 'scraper', 'https://www.consejodeestado.gov.co/buscador-de-jurisprudencia2/', 'ConsejoEstadoAdapter', true, 25000),
  ('SUIN-Juriscol - Normativa', 'scraper', 'https://www.suin-juriscol.gov.co/', 'SuinJuriscolAdapter', true, 10000);
