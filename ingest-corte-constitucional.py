"""
Ingesta de sentencias de Corte Constitucional desde datos.gov.co
"""
import urllib.request
import json
import time
import subprocess

DATASET_ID = "v2k4-2t8s"
BASE_URL = "www.datos.gov.co"
LIMIT = 50
MAX_RECORDS = 1000

def fetch_page(offset=0, limit=LIMIT):
    url = f"https://{BASE_URL}/resource/{DATASET_ID}.json?$limit={limit}&$offset={offset}&$order=fecha_sentencia%20DESC"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode('utf-8'))

def parse_record(record):
    sentencia = record.get('sentencia', '')
    expediente_tipo = record.get('expediente_tipo', '')
    expediente_numero = record.get('expediente_numero', '')
    magistrado = record.get('magistrado_a', '')
    sala = record.get('sala', '')
    fecha = record.get('fecha_sentencia', '')
    proceso = record.get('proceso', '')
    sentencia_tipo = record.get('sentencia_tipo', '')

    if fecha and 'T' in fecha:
        fecha = fecha.split('T')[0]

    ruling_type = 'sentencia'
    if sentencia_tipo == 'A':
        ruling_type = 'auto'
    elif sentencia_tipo == 'SU':
        ruling_type = 'sentencia_unificacion'
    elif sentencia_tipo == 'T':
        ruling_type = 'sentencia_tutela'
    elif sentencia_tipo == 'C':
        ruling_type = 'sentencia_constitucionalidad'

    radicado = f"{expediente_tipo}-{expediente_numero}" if expediente_tipo and expediente_numero else ''

    source_url = ''
    if sentencia and fecha:
        try:
            year = fecha[:4]
            sent_clean = sentencia.replace('/', '-').replace(' ', '-')
            source_url = f'https://www.corteconstitucional.gov.co/relatoria/{year}/{sent_clean}.htm'
        except:
            pass

    return {
        'sentencia': sentencia,
        'ruling_type': ruling_type,
        'proceso': proceso,
        'sala': sala,
        'magistrado': magistrado,
        'fecha': fecha if fecha else None,
        'radicado': radicado,
        'source_url': source_url,
        'summary': f'Sentencia {sentencia}. Proceso: {proceso}. Magistrado ponente: {magistrado}. Sala: {sala}.',
    }

def insert_batch(records):
    if not records:
        return 0

    values_parts = []
    for r in records:
        def q(s):
            if s is None: return 'NULL'
            return "'" + str(s).replace("'", "''") + "'"

        val = f"(gen_random_uuid(), {q(r['sentencia'])}, {q(r['ruling_type'])}, {q(r['proceso'])}, 'corte_constitucional', {q(r['sala'])}, NULL, {q(r['magistrado'])}, NULL, {q(r['fecha'])}, NULL, 'constitucional', '[]', '[]', {q(r['summary'])}, NULL, NULL, {q(r['source_url'])}, 'official', NULL, {q(r['radicado'])}, '[]', '[]', '[]', NULL, NULL, 'pending', NOW())"
        values_parts.append(val)

    sql = "INSERT INTO rulings (id, citation, ruling_type, process_type, corporation, chamber, section, magistrate_ponent, magistrates, ruling_date, publication_date, legal_area, themes, subthemes, summary, full_text, resuelve, source_url, source_type, pdf_url, radicado, referenced_norms, cited_rulings, citing_rulings, similarity_score, ai_analysis, embedding_status, updated_at) VALUES " + ", ".join(values_parts) + " ON CONFLICT DO NOTHING;"

    result = subprocess.run(
        ['docker', 'exec', '-i', 'legal-ai-postgres', 'psql', '-U', 'legal_user', '-d', 'legal_ai'],
        input=sql.encode('utf-8'),
        capture_output=True
    )
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr.decode()[:200]}")
        return 0
    return len(records)

def main():
    print("=== INGESTA CORTE CONSTITUCIONAL ===")

    all_records = []
    offset = 0
    while offset < MAX_RECORDS:
        print(f"  Fetching offset {offset}...")
        records = fetch_page(offset, LIMIT)
        if not records:
            break
        for rec in records:
            parsed = parse_record(rec)
            all_records.append(parsed)
        offset += LIMIT
        print(f"  Got {len(records)} (total: {len(all_records)})")
        time.sleep(0.3)

    print(f"\nTotal: {len(all_records)} sentencias")

    batch_size = 25
    inserted = 0
    for i in range(0, len(all_records), batch_size):
        batch = all_records[i:i+batch_size]
        n = insert_batch(batch)
        inserted += n
        print(f"  Batch {i//batch_size + 1}: inserted {n}")
        time.sleep(0.1)

    # Verify
    result = subprocess.run(
        ['docker', 'exec', '-i', 'legal-ai-postgres', 'psql', '-U', 'legal_user', '-d', 'legal_ai', '-c',
         "SELECT count(*) as total FROM rulings; SELECT citation, ruling_date::text FROM rulings ORDER BY ruling_date DESC LIMIT 5;"],
        capture_output=True
    )
    print(f"\n=== RESULTADO ===\n{result.stdout.decode()}")

if __name__ == '__main__':
    main()
