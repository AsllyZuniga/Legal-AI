CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Roles
INSERT INTO roles (id, name, permissions) VALUES
  ('lawyer', 'Abogado', '["create_cases","view_own_cases","search_jurisprudence","generate_documents","upload_documents"]')
ON CONFLICT (id) DO NOTHING;

-- Abogado (password: Demo1234)
INSERT INTO users (id, document_number, password_hash, full_name, law_firm, role_id, credits, updated_at) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '1000000001', '$2a$10$rhGvTTUm4Qw.MtPsvK9NkeMlLuOdjYPi/P4S28.hTfHqz0emE8gNu', 'Abogado Demo', 'Firma Demo', 'lawyer', 1000, NOW())
ON CONFLICT DO NOTHING;

-- Caso de prueba
INSERT INTO cases (id, user_id, name, description, legal_area, subarea, parties, pretensions, legal_problem_description, status, updated_at) VALUES
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Demo vs. Constructora Demo', 'Demanda por incumplimiento de contrato de compraventa de vivienda.', 'civil', 'incumplimiento_contractual', '{"demandantes": [{"name": "DEMANDANTE DEMO"}], "demandados": [{"name": "CONSTRUCTORA DEMO S.A.S."}]}', 'Pago de perjuicios materiales y moratorias por incumplimiento del contrato.', '¿Tiene derecho el comprador a la indemnización por daños y perjuicios?', 'active', NOW())
ON CONFLICT DO NOTHING;

-- Sentencias de prueba
INSERT INTO rulings (id, citation, ruling_type, process_type, corporation, chamber, magistrate_ponent, ruling_date, legal_area, themes, summary, source_url, source_type, referenced_norms, embedding_status, updated_at) VALUES
  ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'T-409/19', 'sentencia', 'tutela', 'corte_constitucional', 'Sala Primera de Revisión', 'ALEJANDRO LINARES CANTOR', '2019-05-13', 'constitucional', '["DERECHO A LA VIVIENDA DIGNA", "INCUMPLIMIENTO CONTRACTUAL"]', 'La Corte tuteló el derecho a la vivienda digna de un comprador frente al incumplimiento de una constructora.', 'https://www.corteconstitucional.gov.co/relatoria/2019/T-409-19.htm', 'official', '["Art. 51 C.P.", "Ley 675 de 2001"]', 'completed', NOW()),
  ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'SC-2023-001', 'sentencia', 'casacion', 'corte_suprema', 'Sala de Casación Civil', 'ARAMBUJO TRUJILLO, ESTHER', '2023-03-15', 'civil', '["RESPONSABILIDAD CONTRACTUAL", "DAÑOS Y PERJUICIOS"]', 'La Corte estableció criterios para la cuantificación de perjuicios en incumplimiento contractual.', 'https://cortesuprema.gov.co/corte/', 'official', '["Art. 1602 C.C.", "Art. 1603 C.C."]', 'completed', NOW()),
  ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'CE-SU-2022-001', 'sentencia', 'union', 'consejo_estado', 'Sala Plena', 'ROJAS GIL, WILLIAM', '2022-06-10', 'contencioso_administrativo', '["RESPONSABILIDAD DEL ESTADO", "DAÑO ANTIJURÍDICO"]', 'El Consejo definió parámetros para indemnización por daño antijurídico.', 'https://www.consejodeestado.gov.co', 'official', '["Art. 90 C.P."]', 'completed', NOW())
ON CONFLICT DO NOTHING;

-- Hechos de prueba
INSERT INTO case_facts (id, case_id, fact_type, description, event_date, is_date_exact, chronological_order, is_juridically_relevant, relevance_explanation, verification_status, updated_at) VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'documented', 'Celebración del contrato de compraventa C-2024-001.', '2024-01-15', true, 1, true, 'Origen de la obligación contractual.', 'verified', NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'documented', 'Pago del valor total de la vivienda.', '2024-02-01', true, 2, true, 'Cumplimiento del comprador.', 'verified', NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'user_reported', 'Fecha pactada de entrega de la vivienda.', '2024-06-01', true, 3, true, 'Plazo contractual incumplido.', 'unverified', NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b00', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'documented', 'Entrega efectiva de la vivienda con defectos.', '2024-09-15', true, 5, true, 'Incumplimiento y entrega con vicios.', 'verified', NOW())
ON CONFLICT DO NOTHING;

-- Alertas de prueba
INSERT INTO case_alerts (id, case_id, alert_type, priority, title, description, recommendation) VALUES
  (gen_random_uuid(), 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'evidentiary_deficit', 'high', 'Falta de prueba fecha de entrega', 'No ha adjuntado documento que compruebe la fecha de entrega.', 'Solicitar escritura pública o acta de entrega.'),
  (gen_random_uuid(), 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'procedural_deadline', 'medium', 'Verificar prescripción', 'Verificar que la acción no haya prescrito.', 'Calcular término desde el incumplimiento.');

SELECT 'OK' as status;
