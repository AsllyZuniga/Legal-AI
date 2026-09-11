"""
Generador de Plantillas Juridicas Colombianas (.docx)
Genera 160 archivos Word reales con contenido juridico colombiano.
"""
import os
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'apps', 'api', 'public', 'templates', 'default')

BLUE = RGBColor(0, 0, 180)
GRAY = RGBColor(100, 100, 100)

def placeholder(doc, text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.color.rgb = BLUE
    return p

def setup(doc):
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(11)
    style.paragraph_format.space_after = Pt(6)

def header(doc, title, area, dtype):
    setup(doc)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(title.upper())
    r.bold = True
    r.font.size = Pt(14)
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r2 = p2.add_run(area)
    r2.font.size = Pt(10)
    r2.font.color.rgb = GRAY
    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r3 = p3.add_run(f'Tipo: {dtype}')
    r3.font.size = Pt(10)
    r3.font.color.rgb = GRAY
    doc.add_paragraph()

def city_date(doc):
    p = doc.add_paragraph()
    p.add_run('Ciudad y fecha: ')
    r = p.add_run('[CIUDAD], [DIA] de [MES] de [ANO]')
    r.bold = True
    r.font.color.rgb = BLUE

def section(doc, title):
    p = doc.add_paragraph()
    r = p.add_run(title.upper())
    r.bold = True
    r.font.size = Pt(12)
    p.paragraph_format.space_before = Pt(12)

def signature(doc, role=''):
    doc.add_paragraph()
    doc.add_paragraph('_' * 50)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('[NOMBRE COMPLETO]')
    r.bold = True
    r.font.color.rgb = BLUE
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.add_run('C.C. [NUMERO DOCUMENTO]')
    if role:
        p3 = doc.add_paragraph()
        p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p3.add_run(role)

def norms(doc, norms_list):
    section(doc, 'Fundamentos juridicos')
    for n in norms_list:
        doc.add_paragraph(f'- {n}', style='List Bullet')

def notifications(doc):
    section(doc, 'Notificaciones')
    for label in ['Direccion', 'Telefono', 'Correo electronico']:
        p = doc.add_paragraph()
        p.add_run(f'{label}: ')
        r = p.add_run(f'[{label.upper()}]')
        r.font.color.rgb = BLUE

def gen_demanda(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Demanda')
    city_date(doc)
    doc.add_paragraph()
    section(doc, 'Senor')
    doc.add_paragraph('[JUZGADO / TRIBUNAL COMPETENTE]')
    doc.add_paragraph('[CIUDAD]')
    doc.add_paragraph()
    section(doc, 'Referencia')
    p = doc.add_paragraph()
    p.add_run('Proceso: ').bold = True
    p.add_run(f'[TIPO DE PROCESO - {sub or title}]')
    p2 = doc.add_paragraph()
    p2.add_run('Demandante: ').bold = True
    r = p2.add_run('[NOMBRE DEL DEMANDANTE]')
    r.font.color.rgb = BLUE
    p3 = doc.add_paragraph()
    p3.add_run('Demandado: ').bold = True
    r = p3.add_run('[NOMBRE DEL DEMANDADO]')
    r.font.color.rgb = BLUE
    doc.add_paragraph()
    section(doc, 'Hechos')
    for i in range(1, 6):
        doc.add_paragraph(f'{i}. [DESCRIBIR HECHO {i}]')
    doc.add_paragraph()
    section(doc, 'Pretensiones')
    doc.add_paragraph('El demandante solicita respetuosamente:')
    doc.add_paragraph('1. [PRETENSION PRINCIPAL]', style='List Number')
    doc.add_paragraph('2. [PRETENSION SECUNDARIA]', style='List Number')
    doc.add_paragraph('3. Condena en costas y gastos del proceso.', style='List Number')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    section(doc, 'Pruebas')
    doc.add_paragraph('1. [DOCUMENTO 1]', style='List Number')
    doc.add_paragraph('2. [DOCUMENTO 2]', style='List Number')
    doc.add_paragraph('3. [TESTIMONIAL]', style='List Number')
    doc.add_paragraph()
    section(doc, 'Cuantia')
    doc.add_paragraph('[INDICAR CUANTIA]')
    doc.add_paragraph()
    notifications(doc)
    doc.add_paragraph()
    signature(doc, 'Demandante')

def gen_contrato(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Contrato')
    city_date(doc)
    doc.add_paragraph()
    section(doc, 'Partes')
    doc.add_paragraph('Entre los suscritos:')
    p1 = doc.add_paragraph()
    p1.add_run('PARTE A: ').bold = True
    r1 = p1.add_run('[NOMBRE / RAZON SOCIAL]')
    r1.font.color.rgb = BLUE
    doc.add_paragraph('Identificado con [NIT/CC] No. [NUMERO]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('PARTE B: ').bold = True
    r2 = p2.add_run('[NOMBRE / RAZON SOCIAL]')
    r2.font.color.rgb = BLUE
    doc.add_paragraph('Identificado con [NIT/CC] No. [NUMERO]')
    doc.add_paragraph()
    doc.add_paragraph('Se ha celebrado el presente contrato con las siguientes clausulas:')
    doc.add_paragraph()
    section(doc, 'Clausula Primera - Objeto')
    doc.add_paragraph('[DESCRIBIR OBJETO DEL CONTRATO]')
    section(doc, 'Clausula Segunda - Valor')
    doc.add_paragraph('[VALOR EN LETRAS] PESOS M/CTE ($[VALOR]).')
    section(doc, 'Clausula Tercera - Forma de pago')
    doc.add_paragraph('[DESCRIBIR FORMA DE PAGO]')
    section(doc, 'Clausula Cuarta - Plazo')
    doc.add_paragraph('[PLAZO] contados a partir de la firma.')
    section(doc, 'Clausula Quinta - Obligaciones')
    doc.add_paragraph('5.1 Parte A: [OBLIGACIONES]', style='List Bullet')
    doc.add_paragraph('5.2 Parte B: [OBLIGACIONES]', style='List Bullet')
    section(doc, 'Clausula Sexta - Garantia')
    doc.add_paragraph('[DESCRIBIR GARANTIAS]')
    section(doc, 'Clausula Septima - Terminacion')
    doc.add_paragraph('a) Cumplimiento del objeto', style='List Bullet')
    doc.add_paragraph('b) Mutuo acuerdo', style='List Bullet')
    doc.add_paragraph('c) Causales legales', style='List Bullet')
    section(doc, 'Clausula Octava - Solucion de controversias')
    doc.add_paragraph('[NEGOCIACION / CONCILIACION / ARBITRAJE / JURISDICCION]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    doc.add_paragraph('En constancia, se firma en dos ejemplares.')
    doc.add_paragraph()
    doc.add_paragraph('_' * 40)
    doc.add_paragraph('PARTE A - [NOMBRE] - C.C./NIT: [NUMERO]')
    doc.add_paragraph()
    doc.add_paragraph('_' * 40)
    doc.add_paragraph('PARTE B - [NOMBRE] - C.C./NIT: [NUMERO]')

def gen_poder(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Poder')
    city_date(doc)
    doc.add_paragraph()
    section(doc, 'PODER')
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('PODERDANTE: ').bold = True
    r = p.add_run('[NOMBRE COMPLETO]')
    r.font.color.rgb = BLUE
    doc.add_paragraph('C.C. No. [NUMERO] expedida en [LUGAR]')
    doc.add_paragraph('Domicilio: [DIRECCION, CIUDAD]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('APODERADO: ').bold = True
    r2 = p2.add_run('[NOMBRE DEL ABOGADO]')
    r2.font.color.rgb = BLUE
    doc.add_paragraph('T.P. No. [NUMERO] C.S. de la Judicatura')
    doc.add_paragraph()
    doc.add_paragraph('Otorgo poder especial para representarme en:')
    doc.add_paragraph()
    section(doc, 'Asunto')
    doc.add_paragraph('[DESCRIBIR PROCESO O ASUNTO]')
    doc.add_paragraph()
    section(doc, 'Facultades')
    for f in ['Representarme en diligencias y actuaciones.',
              'Presentar demandas, contestaciones, recursos.',
              'Conciliar, transigir.',
              'Recibir notificaciones.',
              'Interponer recursos.',
              'Percibir valores.']:
        doc.add_paragraph(f, style='List Bullet')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    doc.add_paragraph('Vigencia hasta [FECHA].')
    doc.add_paragraph()
    signature(doc, 'Poderdante')

def gen_peticion(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Derecho de Peticion')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senores:').bold = True
    doc.add_paragraph('[ENTIDAD O PERSONA]')
    doc.add_paragraph('[DIRECCION]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run('Derecho de peticion - Art. 23 CP, Ley 1755 de 2015')
    doc.add_paragraph()
    doc.add_paragraph('Respetados senores:')
    doc.add_paragraph()
    p3 = doc.add_paragraph()
    p3.add_run('Yo, ')
    r = p3.add_run('[NOMBRE COMPLETO]')
    r.bold = True
    r.font.color.rgb = BLUE
    p3.add_run(', C.C. [NUMERO], presento:')
    doc.add_paragraph()
    section(doc, 'Peticion')
    doc.add_paragraph('[DESCRIBIR LO QUE SE SOLICITA]')
    doc.add_paragraph()
    section(doc, 'Hechos')
    for i in range(1, 4):
        doc.add_paragraph(f'{i}. [HECHO {i}]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    section(doc, 'Anexos')
    doc.add_paragraph('1. [DOCUMENTO]')
    doc.add_paragraph()
    notifications(doc)
    doc.add_paragraph()
    doc.add_paragraph('Solicito respuesta dentro de los terminos de la Ley 1755 de 2015.')
    doc.add_paragraph()
    signature(doc)

def gen_recurso(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Recurso')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senor:').bold = True
    doc.add_paragraph('[JUZGADO / TRIBUNAL]')
    doc.add_paragraph('[CIUDAD]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run('[PROCESO] - Rad: [NUMERO]')
    doc.add_paragraph()
    doc.add_paragraph('Respetado juez:')
    doc.add_paragraph()
    p3 = doc.add_paragraph()
    r = p3.add_run('[NOMBRE]')
    r.bold = True
    r.font.color.rgb = BLUE
    p3.add_run(', en calidad de [ROL], interpongo RECURSO contra providencia de [FECHA]:')
    doc.add_paragraph()
    section(doc, 'Fundamentos')
    doc.add_paragraph('1. [ARGUMENTO 1]')
    doc.add_paragraph('2. [ARGUMENTO 2]')
    doc.add_paragraph()
    section(doc, 'Pretensiones')
    doc.add_paragraph('1. [REVOQUE / MODIFIQUE LA DECISION]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    signature(doc)

def gen_solicitud(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Solicitud')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senores:').bold = True
    doc.add_paragraph('[ENTIDAD]')
    doc.add_paragraph('[DIRECCION]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run(title)
    doc.add_paragraph()
    doc.add_paragraph('Respetados senores:')
    doc.add_paragraph()
    p3 = doc.add_paragraph()
    r = p3.add_run('[NOMBRE]')
    r.bold = True
    r.font.color.rgb = BLUE
    p3.add_run(', C.C. [NUMERO], solicito:')
    doc.add_paragraph()
    section(doc, 'Solicitud')
    doc.add_paragraph('[DESCRIBIR SOLICITUD]')
    doc.add_paragraph()
    section(doc, 'Razones')
    doc.add_paragraph('1. [RAZON 1]')
    doc.add_paragraph('2. [RAZON 2]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    notifications(doc)
    doc.add_paragraph()
    signature(doc)

def gen_memorial(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Memorial')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senor:').bold = True
    doc.add_paragraph('[JUZGADO / TRIBUNAL]')
    doc.add_paragraph('E.S.D.')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run('[PROCESO] - Rad: [NUMERO]')
    doc.add_paragraph()
    p3 = doc.add_paragraph()
    r = p3.add_run('[NOMBRE]')
    r.bold = True
    r.font.color.rgb = BLUE
    p3.add_run(', en calidad de [ROL], manifiesto:')
    doc.add_paragraph()
    section(doc, 'Manifestaciones')
    doc.add_paragraph('1. [MANIFESTACION 1]')
    doc.add_paragraph('2. [MANIFESTACION 2]')
    doc.add_paragraph()
    section(doc, 'Peticion')
    doc.add_paragraph('[LO QUE SE SOLICITA]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    signature(doc)

def gen_acta(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Acta')
    doc.add_paragraph()
    section(doc, 'ACTA No. [NUMERO]')
    doc.add_paragraph()
    doc.add_paragraph('En [CIUDAD], [FECHA], reunidos en [LUGAR]:')
    doc.add_paragraph()
    section(doc, 'Asistentes')
    doc.add_paragraph('1. [NOMBRE] - [CARGO] - C.C. [NUMERO]')
    doc.add_paragraph('2. [NOMBRE] - [CARGO] - C.C. [NUMERO]')
    doc.add_paragraph()
    section(doc, 'Orden del dia')
    doc.add_paragraph('1. Verificacion quorum')
    doc.add_paragraph('2. [TEMA 1]')
    doc.add_paragraph('3. [TEMA 2]')
    doc.add_paragraph()
    section(doc, 'Desarrollo')
    doc.add_paragraph('[DESARROLLO DE CADA PUNTO]')
    doc.add_paragraph()
    section(doc, 'Decisiones')
    doc.add_paragraph('[DECISIONES TOMADAS]')
    doc.add_paragraph()
    doc.add_paragraph('Se levanta la sesion a las [HORA FIN].')
    doc.add_paragraph()
    section(doc, 'Firmas')
    for i in range(3):
        doc.add_paragraph('_' * 40)
        doc.add_paragraph(f'[NOMBRE {i+1}] - C.C. [NUMERO]')
        doc.add_paragraph()
    norms(doc, norms_list)

def gen_carta(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Carta')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senor(a):').bold = True
    doc.add_paragraph('[DESTINATARIO]')
    doc.add_paragraph('[CARGO]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run(title)
    doc.add_paragraph()
    doc.add_paragraph('Cordial saludo,')
    doc.add_paragraph()
    doc.add_paragraph('Yo [NOMBRE], C.C. [NUMERO], comunico:')
    doc.add_paragraph()
    doc.add_paragraph('[CONTENIDO]')
    doc.add_paragraph()
    doc.add_paragraph('Agradezco atencion.')
    doc.add_paragraph()
    signature(doc)
    norms(doc, norms_list)

def gen_requerimiento(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Requerimiento')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senor(a):').bold = True
    doc.add_paragraph('[DEUDOR]')
    doc.add_paragraph('[DIRECCION]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run(f'Requerimiento - {title}')
    doc.add_paragraph()
    doc.add_paragraph('Requiero pago de:')
    doc.add_paragraph()
    section(doc, 'Obligacion')
    doc.add_paragraph('Valor: $[VALOR]')
    doc.add_paragraph('Origen: [CONTRATO/FACTURA]')
    doc.add_paragraph('Vencimiento: [FECHA]')
    doc.add_paragraph()
    doc.add_paragraph('Pago en [NUMERO] dias en cuenta [NUMERO] banco [BANCO].')
    doc.add_paragraph()
    doc.add_paragraph('De no pagar, iniciare acciones legales.')
    doc.add_paragraph()
    signature(doc)
    norms(doc, norms_list)

def gen_denuncia(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Denuncia')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senor').bold = True
    doc.add_paragraph('FISCAL DELEGADO')
    doc.add_paragraph('[CIUDAD]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run(f'Denuncia - {title}')
    doc.add_paragraph()
    doc.add_paragraph('Respetado fiscal:')
    doc.add_paragraph()
    p3 = doc.add_paragraph()
    r = p3.add_run('[NOMBRE]')
    r.bold = True
    r.font.color.rgb = BLUE
    p3.add_run(', C.C. [NUMERO], denuncio contra:')
    doc.add_paragraph()
    section(doc, 'Denunciado')
    doc.add_paragraph('[NOMBRE / PERSONAS INDETERMINADAS]')
    doc.add_paragraph()
    section(doc, 'Hechos')
    for i in range(1, 6):
        doc.add_paragraph(f'{i}. [HECHO {i}]')
    doc.add_paragraph()
    section(doc, 'Delito')
    doc.add_paragraph('[TIPO PENAL]')
    doc.add_paragraph()
    section(doc, 'Pruebas')
    doc.add_paragraph('[LISTAR]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    notifications(doc)
    doc.add_paragraph()
    signature(doc)

def gen_formulario(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Formulario')
    doc.add_paragraph()
    section(doc, 'DATOS DEL SOLICITANTE')
    doc.add_paragraph('Nombre: ___________________________________________')
    doc.add_paragraph('Documento: ____________ No.: _____________________')
    doc.add_paragraph('Direccion: ________________________________________')
    doc.add_paragraph('Telefono: __________________ Email: ________________')
    doc.add_paragraph()
    section(doc, 'DATOS DEL ASUNTO')
    doc.add_paragraph('Tipo: _____________________________________________')
    doc.add_paragraph('Descripcion: ______________________________________')
    doc.add_paragraph('___________________________________________________')
    doc.add_paragraph()
    section(doc, 'DOCUMENTOS')
    doc.add_paragraph('1. ________________________________________________')
    doc.add_paragraph('2. ________________________________________________')
    doc.add_paragraph()
    section(doc, 'DECLARACION')
    doc.add_paragraph('Declaro que la informacion es veridica.')
    doc.add_paragraph()
    doc.add_paragraph('Firma: ____________________ Fecha: ________________')
    doc.add_paragraph()
    norms(doc, norms_list)

def gen_declaracion(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Declaracion')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('ANTE MI, ').bold = True
    doc.add_paragraph('[NOTARIO]')
    doc.add_paragraph('NOTARIO [NUMERO] DE [CIUDAD]')
    doc.add_paragraph()
    doc.add_paragraph('Comparecio:')
    p2 = doc.add_paragraph()
    r = p2.add_run('[NOMBRE]')
    r.bold = True
    r.font.color.rgb = BLUE
    p2.add_run(', C.C. [NUMERO], declaro:')
    doc.add_paragraph()
    section(doc, 'Declaracion')
    doc.add_paragraph('[CONTENIDO]')
    doc.add_paragraph()
    doc.add_paragraph('Lo afirmo bajo juramento, art. 412 Codigo Penal.')
    doc.add_paragraph()
    signature(doc)
    norms(doc, norms_list)

def gen_alegato(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Alegato')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senor').bold = True
    doc.add_paragraph('[JUZGADO / TRIBUNAL]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run('[PROCESO]')
    doc.add_paragraph()
    p3 = doc.add_paragraph()
    r = p3.add_run('[NOMBRE]')
    r.bold = True
    r.font.color.rgb = BLUE
    p3.add_run(', presento ALEGATOS DE CONCLUSION:')
    doc.add_paragraph()
    section(doc, 'Resumen')
    doc.add_paragraph('[RESUMEN DEL CASO]')
    doc.add_paragraph()
    section(doc, 'Pruebas')
    doc.add_paragraph('[ANALISIS DE PRUEBAS]')
    doc.add_paragraph()
    section(doc, 'Argumentos')
    doc.add_paragraph('[ARGUMENTO 1]')
    doc.add_paragraph('[ARGUMENTO 2]')
    doc.add_paragraph()
    section(doc, 'Conclusiones')
    doc.add_paragraph('1. [PRETENSION 1]')
    doc.add_paragraph('2. [PRETENSION 2]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    signature(doc, 'Apoderado')

def gen_minuta(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Minuta')
    doc.add_paragraph()
    section(doc, 'MINUTA DE ESCRITURA PUBLICA')
    doc.add_paragraph()
    doc.add_paragraph('En [CIUDAD], ante [NOTARIO], comparecieron:')
    doc.add_paragraph()
    p1 = doc.add_paragraph()
    p1.add_run('COMPARECIENTE 1: ').bold = True
    r1 = p1.add_run('[NOMBRE]')
    r1.font.color.rgb = BLUE
    doc.add_paragraph('C.C. [NUMERO]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('COMPARECIENTE 2: ').bold = True
    r2 = p2.add_run('[NOMBRE]')
    r2.font.color.rgb = BLUE
    doc.add_paragraph('C.C. [NUMERO]')
    doc.add_paragraph()
    doc.add_paragraph('Solicitan elevar a escritura publica:')
    doc.add_paragraph()
    section(doc, 'Clausulas')
    doc.add_paragraph('PRIMERA: [OBJETO]')
    doc.add_paragraph('SEGUNDA: [VALOR]')
    doc.add_paragraph('TERCERA: [CONDICIONES]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    doc.add_paragraph('Asi lo manifestaron y firman.')
    doc.add_paragraph()
    doc.add_paragraph('_' * 40)
    doc.add_paragraph('[NOMBRE 1] C.C. [NUMERO]')
    doc.add_paragraph()
    doc.add_paragraph('_' * 40)
    doc.add_paragraph('[NOMBRE 2] C.C. [NUMERO]')

def gen_accion_constitucional(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Accion Constitucional')
    city_date(doc)
    doc.add_paragraph()
    section(doc, 'Senor')
    doc.add_paragraph('[JUEZ DE LA REPUBLICA (REPARTO)]')
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Ref: ').bold = True
    p.add_run(title)
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    r = p2.add_run('[NOMBRE]')
    r.bold = True
    r.font.color.rgb = BLUE
    p2.add_run(', C.C. [NUMERO], interpongo:')
    doc.add_paragraph()
    r2 = doc.add_paragraph()
    r2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rb = r2.add_run(title.upper())
    rb.bold = True
    rb.font.size = Pt(13)
    doc.add_paragraph()
    section(doc, 'Hechos')
    for i in range(1, 5):
        doc.add_paragraph(f'{i}. [HECHO {i}]')
    doc.add_paragraph()
    section(doc, 'Derecho vulnerado')
    doc.add_paragraph('[DERECHO FUNDAMENTAL]')
    doc.add_paragraph()
    section(doc, 'Pretensiones')
    doc.add_paragraph('1. Se tutele el derecho fundamental.')
    doc.add_paragraph('2. Se ordene a [ENTIDAD] [ACCION].')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    notifications(doc)
    doc.add_paragraph()
    signature(doc)

def gen_reclamacion(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Reclamacion')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senores:').bold = True
    doc.add_paragraph('[ENTIDAD / EMPRESA]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run(f'Reclamacion - {title}')
    doc.add_paragraph()
    doc.add_paragraph('Cordial saludo,')
    doc.add_paragraph()
    p3 = doc.add_paragraph()
    r = p3.add_run('[NOMBRE]')
    r.bold = True
    r.font.color.rgb = BLUE
    p3.add_run(', C.C. [NUMERO], presento RECLAMACION:')
    doc.add_paragraph()
    section(doc, 'Motivos')
    doc.add_paragraph('1. [MOTIVO 1]')
    doc.add_paragraph('2. [MOTIVO 2]')
    doc.add_paragraph()
    section(doc, 'Solicito')
    doc.add_paragraph('[LO QUE SE SOLICITA]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    signature(doc)

def gen_querella(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Querella')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senor').bold = True
    doc.add_paragraph('FISCAL DELEGADO')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run(f'Querella - {title}')
    doc.add_paragraph()
    p3 = doc.add_paragraph()
    r = p3.add_run('[NOMBRE]')
    r.bold = True
    r.font.color.rgb = BLUE
    p3.add_run(', C.C. [NUMERO], presento QUERELLA contra [NOMBRE]:')
    doc.add_paragraph()
    section(doc, 'Hechos')
    for i in range(1, 5):
        doc.add_paragraph(f'{i}. [HECHO {i}]')
    doc.add_paragraph()
    section(doc, 'Delito')
    doc.add_paragraph('[DELITO]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    signature(doc)

def gen_respuesta(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Respuesta')
    city_date(doc)
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run('Senores:').bold = True
    doc.add_paragraph('[ENTIDAD]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('Ref: ').bold = True
    p2.add_run(f'Respuesta - {title}')
    doc.add_paragraph('Radicado: [NUMERO]')
    doc.add_paragraph()
    doc.add_paragraph('En atencion a su requerimiento, respondo:')
    doc.add_paragraph()
    section(doc, 'Respuesta')
    doc.add_paragraph('[CONTENIDO]')
    doc.add_paragraph()
    section(doc, 'Sustentacion')
    doc.add_paragraph('[ARGUMENTOS]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    signature(doc)

def gen_acuerdo(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Acuerdo')
    city_date(doc)
    doc.add_paragraph()
    section(doc, 'ACUERDO / CONVENIO')
    doc.add_paragraph()
    doc.add_paragraph('Entre:')
    p1 = doc.add_paragraph()
    p1.add_run('PARTE A: ').bold = True
    r1 = p1.add_run('[NOMBRE]')
    r1.font.color.rgb = BLUE
    doc.add_paragraph('C.C./NIT: [NUMERO]')
    doc.add_paragraph()
    p2 = doc.add_paragraph()
    p2.add_run('PARTE B: ').bold = True
    r2 = p2.add_run('[NOMBRE]')
    r2.font.color.rgb = BLUE
    doc.add_paragraph('C.C./NIT: [NUMERO]')
    doc.add_paragraph()
    doc.add_paragraph('Acuerdan:')
    doc.add_paragraph()
    section(doc, 'Clausulas')
    doc.add_paragraph('PRIMERA - Objeto: [DESCRIBIR]')
    doc.add_paragraph('SEGUNDA - Obligaciones: [DESCRIBIR]')
    doc.add_paragraph('TERCERA - Plazo: [DESCRIBIR]')
    doc.add_paragraph('CUARTA - Valor: [DESCRIBIR]')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    doc.add_paragraph('Se firma en duplicado.')
    doc.add_paragraph()
    doc.add_paragraph('_' * 40)
    doc.add_paragraph('PARTE A')
    doc.add_paragraph()
    doc.add_paragraph('_' * 40)
    doc.add_paragraph('PARTE B')

def gen_otrosi(doc, title, area, norms_list, sub=''):
    header(doc, title, area, 'Otrosi')
    city_date(doc)
    doc.add_paragraph()
    section(doc, 'OTROSI AL CONTRATO No. [NUMERO]')
    doc.add_paragraph()
    doc.add_paragraph('Entre:')
    doc.add_paragraph('PARTE A: [NOMBRE] - C.C./NIT: [NUMERO]')
    doc.add_paragraph('PARTE B: [NOMBRE] - C.C./NIT: [NUMERO]')
    doc.add_paragraph()
    doc.add_paragraph('Que celebraron contrato No. [NUMERO] de [FECHA],')
    doc.add_paragraph()
    doc.add_paragraph('Acuerdan:')
    doc.add_paragraph()
    section(doc, 'Modificaciones')
    doc.add_paragraph('1. [MODIFICACION 1]')
    doc.add_paragraph('2. [MODIFICACION 2]')
    doc.add_paragraph()
    doc.add_paragraph('Las demas clausulas permanecen inmodificadas.')
    doc.add_paragraph()
    norms(doc, norms_list)
    doc.add_paragraph()
    doc.add_paragraph('_' * 40)
    doc.add_paragraph('PARTE A')
    doc.add_paragraph()
    doc.add_paragraph('_' * 40)
    doc.add_paragraph('PARTE B')

GENERATORS = {
    'Demanda': gen_demanda,
    'Contestacion de demanda': gen_demanda,
    'Contrato': gen_contrato,
    'Poder': gen_poder,
    'Derecho de peticion': gen_peticion,
    'Recurso': gen_recurso,
    'Solicitud': gen_solicitud,
    'Memorial': gen_memorial,
    'Acta': gen_acta,
    'Carta': gen_carta,
    'Requerimiento': gen_requerimiento,
    'Denuncia': gen_denuncia,
    'Formulario': gen_formulario,
    'Formulario institucional': gen_formulario,
    'Declaracion': gen_declaracion,
    'Alegato': gen_alegato,
    'Minuta': gen_minuta,
    'Accion constitucional': gen_accion_constitucional,
    'Accion administrativa': gen_accion_constitucional,
    'Reclamacion': gen_reclamacion,
    'Querella': gen_querella,
    'Respuesta': gen_respuesta,
    'Acuerdo': gen_acuerdo,
    'Convenio': gen_acuerdo,
    'Otrosi': gen_otrosi,
}

# Lista completa de plantillas: (filename, title, area, doc_type, norms, subcategory)
TEMPLATES = [
    # DERECHO CONSTITUCIONAL (13)
    ('accion-tutela.docx', 'Accion de Tutela', 'Derecho Constitucional', 'Accion constitucional', ['Art. 86 CP', 'Decreto 2591 de 1991'], 'Accion de tutela'),
    ('impugnacion-tutela.docx', 'Impugnacion de Tutela', 'Derecho Constitucional', 'Recurso', ['Decreto 2591 de 1991, Art. 31'], 'Impugnacion de tutela'),
    ('cumplimiento-fallo-tutela.docx', 'Cumplimiento de Fallo de Tutela', 'Derecho Constitucional', 'Solicitud', ['Decreto 2591 de 1991, Art. 33'], 'Cumplimiento de fallo de tutela'),
    ('incidente-desacato.docx', 'Incidente de Desacato', 'Derecho Constitucional', 'Memorial', ['Decreto 2591 de 1991, Art. 33'], 'Desacato'),
    ('accion-cumplimiento.docx', 'Accion de Cumplimiento', 'Derecho Constitucional', 'Accion constitucional', ['Art. 87 CP', 'Ley 393 de 2004'], 'Accion de cumplimiento'),
    ('accion-popular.docx', 'Accion Popular', 'Derecho Constitucional', 'Accion constitucional', ['Art. 88 CP', 'Ley 472 de 1998'], 'Accion popular'),
    ('accion-grupo.docx', 'Accion de Grupo', 'Derecho Constitucional', 'Accion constitucional', ['Art. 88 CP', 'Ley 472 de 1998'], 'Accion de grupo'),
    ('habeas-corpus.docx', 'Habeas Corpus', 'Derecho Constitucional', 'Accion constitucional', ['Art. 30 CP', 'Ley 1095 de 2006'], 'Habeas corpus'),
    ('habeas-data.docx', 'Habeas Data', 'Derecho Constitucional', 'Accion constitucional', ['Art. 15 CP', 'Ley 1581 de 2012'], 'Habeas data'),
    ('derecho-peticion-general.docx', 'Derecho de Peticion General', 'Derecho Constitucional', 'Derecho de peticion', ['Art. 23 CP', 'Ley 1755 de 2015'], 'Derechos de peticion'),
    ('derecho-peticion-informacion.docx', 'Derecho de Peticion de Informacion Publica', 'Derecho Constitucional', 'Derecho de peticion', ['Art. 23 CP', 'Ley 1755 de 2015', 'Ley 1712 de 2014'], 'Derechos de peticion'),
    ('incidente-tutela-ampliacion.docx', 'Incidente de Tutela - Ampliacion', 'Derecho Constitucional', 'Memorial', ['Decreto 2591 de 1991'], 'Incidentes relacionados con tutela'),
    ('solicitud-proteccion-derechos.docx', 'Solicitud de Proteccion de Derechos Fundamentales', 'Derecho Constitucional', 'Solicitud', ['Art. 86 CP'], 'Solicitudes de proteccion de derechos fundamentales'),

    # DERECHO CIVIL (22)
    ('demanda-civil-ordinaria.docx', 'Demanda Civil Ordinaria', 'Derecho Civil', 'Demanda', ['Ley 1564 de 2012 CGP'], 'Demandas civiles'),
    ('contestacion-demanda-civil.docx', 'Contestacion de Demanda Civil', 'Derecho Civil', 'Contestacion de demanda', ['Art. 133 Ley 1564 de 2012'], 'Contestaciones'),
    ('excepciones-merito-civil.docx', 'Excepciones de Merito', 'Derecho Civil', 'Memorial', ['Art. 100 Ley 1564 de 2012'], 'Excepciones'),
    ('apelacion-civil.docx', 'Recurso de Apelacion Civil', 'Derecho Civil', 'Recurso', ['Art. 306 Ley 1564 de 2012'], 'Recursos'),
    ('solicitud-civil.docx', 'Solicitud en Proceso Civil', 'Derecho Civil', 'Solicitud', ['Ley 1564 de 2012'], 'Solicitudes'),
    ('resp-civil-contractual.docx', 'Demanda de Responsabilidad Civil Contractual', 'Derecho Civil', 'Demanda', ['Art. 1602, 1613, 1738 CC'], 'Responsabilidad civil contractual'),
    ('resp-civil-extra.docx', 'Demanda de Responsabilidad Civil Extracontractual', 'Derecho Civil', 'Demanda', ['Art. 2341 CC', 'Ley 1564 de 2012'], 'Responsabilidad civil extracontractual'),
    ('incumplimiento-contractual.docx', 'Demanda de Incumplimiento Contractual', 'Derecho Civil', 'Demanda', ['Art. 1546, 1602 CC'], 'Incumplimiento contractual'),
    ('demanda-ejecutiva.docx', 'Demanda Ejecutiva', 'Derecho Civil', 'Demanda', ['Art. 422 Ley 1564 de 2012'], 'Procesos ejecutivos'),
    ('demanda-declarativa.docx', 'Demanda Declarativa', 'Derecho Civil', 'Demanda', ['Ley 1564 de 2012 CGP'], 'Procesos declarativos'),
    ('prescripcion-dominio.docx', 'Prescripcion Adquisitiva de Dominio', 'Derecho Civil', 'Demanda', ['Art. 2512 CC', 'Art. 375 Ley 1564 de 2012'], 'Prescripcion adquisitiva de dominio'),
    ('restitucion-inmueble.docx', 'Restitucion de Inmueble', 'Derecho Civil', 'Demanda', ['Ley 820 de 2003'], 'Restitucion de inmueble'),
    ('compraventa-civil.docx', 'Contrato de Compraventa Civil', 'Derecho Civil', 'Contrato', ['Art. 1849 CC'], 'Compraventa'),
    ('arrendamiento.docx', 'Contrato de Arrendamiento', 'Derecho Civil', 'Contrato', ['Art. 1973 CC', 'Ley 820 de 2003'], 'Arrendamiento'),
    ('permuta.docx', 'Contrato de Permuta', 'Derecho Civil', 'Contrato', ['Art. 1931 CC'], 'Permuta'),
    ('donacion.docx', 'Contrato de Donacion', 'Derecho Civil', 'Contrato', ['Art. 1443 CC'], 'Donacion'),
    ('mutuo-prestamo.docx', 'Contrato de Mutuo (Prestamo)', 'Derecho Civil', 'Contrato', ['Art. 2220 CC'], 'Prestamo'),
    ('poder-general-judicial.docx', 'Poder General Judicial', 'Derecho Civil', 'Poder', ['Art. 71 Ley 1564 de 2012'], 'Poderes'),
    ('conciliacion-extrajudicial.docx', 'Conciliacion Extrajudicial', 'Derecho Civil', 'Solicitud', ['Ley 640 de 2001'], 'Conciliaciones'),
    ('transaccion.docx', 'Transaccion Extrajudicial', 'Derecho Civil', 'Acuerdo', ['Art. 2469 CC'], 'Transacciones'),
    ('requerimiento-pago.docx', 'Requerimiento de Pago', 'Derecho Civil', 'Requerimiento', ['Art. 1602 CC'], 'Requerimientos'),
    ('cobro-obligaciones.docx', 'Cobro de Obligaciones', 'Derecho Civil', 'Requerimiento', ['Art. 1602 CC'], 'Cobro de obligaciones'),

    # DERECHO DE FAMILIA (21)
    ('divorcio-contencioso.docx', 'Demanda de Divorcio Contencioso', 'Derecho de Familia', 'Demanda', ['Art. 154 CC', 'Ley 25 de 1992'], 'Divorcio'),
    ('cesacion-efectos-civiles.docx', 'Cesacion de Efectos Civiles', 'Derecho de Familia', 'Demanda', ['Ley 25 de 1992'], 'Cesacion de efectos civiles'),
    ('separacion-cuerpos.docx', 'Separacion de Cuerpos', 'Derecho de Familia', 'Demanda', ['Art. 154 CC'], 'Separacion de cuerpos'),
    ('custodia-menores.docx', 'Custodia de Menores', 'Derecho de Familia', 'Demanda', ['Ley 1098 de 2006'], 'Custodia'),
    ('regulacion-visitas.docx', 'Regulacion de Visitas', 'Derecho de Familia', 'Demanda', ['Ley 1098 de 2006'], 'Regulacion de visitas'),
    ('fijacion-cuota-alimentaria.docx', 'Fijacion de Cuota Alimentaria', 'Derecho de Familia', 'Demanda', ['Ley 1098 de 2006'], 'Fijacion de cuota alimentaria'),
    ('aumento-cuota-alimentaria.docx', 'Aumento de Cuota Alimentaria', 'Derecho de Familia', 'Demanda', ['Ley 1098 de 2006'], 'Aumento de cuota alimentaria'),
    ('disminucion-cuota-alimentaria.docx', 'Disminucion de Cuota Alimentaria', 'Derecho de Familia', 'Demanda', ['Ley 1098 de 2006'], 'Disminucion de cuota alimentaria'),
    ('exoneracion-alimentos.docx', 'Exoneracion de Cuota Alimentaria', 'Derecho de Familia', 'Demanda', ['Ley 1098 de 2006'], 'Exoneracion de alimentos'),
    ('filiacion.docx', 'Filiacion', 'Derecho de Familia', 'Demanda', ['Art. 333 CC', 'Ley 75 de 1968'], 'Filiacion'),
    ('impugnacion-paternidad.docx', 'Impugnacion de Paternidad', 'Derecho de Familia', 'Demanda', ['Art. 333 CC'], 'Impugnacion de paternidad'),
    ('investigacion-paternidad.docx', 'Investigacion de Paternidad', 'Derecho de Familia', 'Demanda', ['Ley 75 de 1968'], 'Investigacion de paternidad'),
    ('sucesion-intestada.docx', 'Sucesion Intestada', 'Derecho de Familia', 'Demanda', ['Art. 1008 CC'], 'Sucesiones'),
    ('testamento-abierto.docx', 'Testamento Abierto', 'Derecho de Familia', 'Minuta', ['Art. 1050 CC', 'Decreto 960 de 1970'], 'Testamentos'),
    ('liquidacion-sociedad-conyugal.docx', 'Liquidacion de Sociedad Conyugal', 'Derecho de Familia', 'Demanda', ['Art. 1754 CC'], 'Liquidacion de sociedad conyugal'),
    ('liquidacion-sociedad-patrimonial.docx', 'Liquidacion de Sociedad Patrimonial', 'Derecho de Familia', 'Demanda', ['Ley 54 de 1990'], 'Liquidacion de sociedad patrimonial'),
    ('declaracion-union-marital.docx', 'Declaracion de Union Marital de Hecho', 'Derecho de Familia', 'Demanda', ['Ley 54 de 1990'], 'Union marital de hecho'),
    ('adopcion.docx', 'Adopcion', 'Derecho de Familia', 'Solicitud', ['Ley 1098 de 2006'], 'Adopcion'),
    ('permiso-salida-menor.docx', 'Permiso de Salida del Pais para Menor', 'Derecho de Familia', 'Solicitud', ['Ley 1098 de 2006'], 'Permisos de salida del pais de menores'),

    # DERECHO LABORAL (22)
    ('demanda-laboral-ordinaria.docx', 'Demanda Laboral Ordinaria', 'Derecho Laboral y Seguridad Social', 'Demanda', ['CST', 'Ley 712 de 2001'], 'Demandas laborales'),
    ('contestacion-demanda-laboral.docx', 'Contestacion de Demanda Laboral', 'Derecho Laboral y Seguridad Social', 'Contestacion de demanda', ['CST'], 'Contestacion de demandas'),
    ('contrato-termino-fijo.docx', 'Contrato de Trabajo a Termino Fijo', 'Derecho Laboral y Seguridad Social', 'Contrato', ['Art. 46 CST'], 'Contrato a termino fijo'),
    ('contrato-termino-indefinido.docx', 'Contrato de Trabajo a Termino Indefinido', 'Derecho Laboral y Seguridad Social', 'Contrato', ['Art. 46 CST'], 'Contrato a termino indefinido'),
    ('contrato-obra-labor.docx', 'Contrato por Obra o Labor', 'Derecho Laboral y Seguridad Social', 'Contrato', ['Art. 46 CST'], 'Contrato por obra o labor'),
    ('contrato-ocasional.docx', 'Contrato de Trabajo Ocasional', 'Derecho Laboral y Seguridad Social', 'Contrato', ['Art. 47 CST'], 'Contrato de trabajo ocasional'),
    ('terminacion-contrato-laboral.docx', 'Terminacion de Contrato Laboral', 'Derecho Laboral y Seguridad Social', 'Carta', ['Art. 62 CST'], 'Terminacion de contrato'),
    ('carta-renuncia.docx', 'Carta de Renuncia', 'Derecho Laboral y Seguridad Social', 'Carta', ['Art. 69 CST'], 'Carta de renuncia'),
    ('carta-despido.docx', 'Carta de Despido', 'Derecho Laboral y Seguridad Social', 'Carta', ['Art. 62 CST'], 'Carta de despido'),
    ('liquidacion-prestaciones.docx', 'Liquidacion de Prestaciones Sociales', 'Derecho Laboral y Seguridad Social', 'Formulario', ['Art. 249 CST'], 'Liquidacion laboral'),
    ('solicitud-pago-acreencias.docx', 'Solicitud de Pago de Acreencias', 'Derecho Laboral y Seguridad Social', 'Solicitud', ['CST'], 'Solicitud de pago de acreencias'),
    ('reclamacion-laboral.docx', 'Reclamacion Laboral', 'Derecho Laboral y Seguridad Social', 'Reclamacion', ['CST'], 'Reclamaciones laborales'),
    ('conciliacion-laboral.docx', 'Conciliacion Laboral', 'Derecho Laboral y Seguridad Social', 'Solicitud', ['Ley 640 de 2001'], 'Conciliacion laboral'),
    ('derecho-peticion-laboral.docx', 'Derecho de Peticion Laboral', 'Derecho Laboral y Seguridad Social', 'Derecho de peticion', ['Art. 23 CP', 'Ley 1755 de 2015'], 'Derechos de peticion laborales'),
    ('solicitud-incapacidad.docx', 'Solicitud de Incapacidad Laboral', 'Derecho Laboral y Seguridad Social', 'Solicitud', ['Ley 100 de 1993'], 'Incapacidades'),
    ('solicitud-fuero-laboral.docx', 'Solicitud de Fuero Laboral', 'Derecho Laboral y Seguridad Social', 'Solicitud', ['Art. 239 CST'], 'Fuero laboral'),
    ('queja-acoso-laboral.docx', 'Queja por Acoso Laboral', 'Derecho Laboral y Seguridad Social', 'Reclamacion', ['Ley 1010 de 2006'], 'Acoso laboral'),
    ('solicitud-pension-vejez.docx', 'Solicitud de Pension de Vejez', 'Derecho Laboral y Seguridad Social', 'Solicitud', ['Ley 100 de 1993'], 'Solicitudes pensionales'),
    ('reconocimiento-pension.docx', 'Reconocimiento de Pension', 'Derecho Laboral y Seguridad Social', 'Solicitud', ['Ley 100 de 1993'], 'Reconocimiento de pension'),
    ('reliquidacion-pension.docx', 'Reliquidacion de Pension', 'Derecho Laboral y Seguridad Social', 'Solicitud', ['Ley 100 de 1993'], 'Reliquidacion'),
    ('indemnizacion-sustitutiva.docx', 'Indemnizacion Sustitutiva', 'Derecho Laboral y Seguridad Social', 'Solicitud', ['Art. 37 Ley 100 de 1993'], 'Indemnizacion'),
    ('historia-laboral.docx', 'Solicitud de Historia Laboral', 'Derecho Laboral y Seguridad Social', 'Solicitud', ['Ley 100 de 1993'], 'Historia laboral'),

    # DERECHO ADMINISTRATIVO (15)
    ('derecho-peticion-administrativo.docx', 'Derecho de Peticion Administrativo', 'Derecho Administrativo', 'Derecho de peticion', ['Art. 23 CP', 'Ley 1755 de 2015'], 'Derecho de peticion'),
    ('reposicion-administrativo.docx', 'Recurso de Reposicion', 'Derecho Administrativo', 'Recurso', ['Art. 74 CPACA'], 'Recurso de reposicion'),
    ('apelacion-administrativo.docx', 'Recurso de Apelacion Administrativo', 'Derecho Administrativo', 'Recurso', ['Art. 76 CPACA'], 'Recurso de apelacion'),
    ('recurso-queja.docx', 'Recurso de Queja', 'Derecho Administrativo', 'Recurso', ['CPACA'], 'Recurso de queja'),
    ('revocatoria-directa.docx', 'Revocatoria Directa', 'Derecho Administrativo', 'Solicitud', ['Art. 93 CPACA'], 'Revocatoria directa'),
    ('silencio-administrativo.docx', 'Silencio Administrativo', 'Derecho Administrativo', 'Solicitud', ['Art. 94 CPACA'], 'Silencio administrativo'),
    ('nulidad-administrativo.docx', 'Demanda de Nulidad', 'Derecho Administrativo', 'Demanda', ['Art. 137 CPACA'], 'Nulidad'),
    ('nulidad-restablecimiento.docx', 'Demanda de Nulidad y Restablecimiento', 'Derecho Administrativo', 'Demanda', ['Art. 138 CPACA'], 'Nulidad y restablecimiento del derecho'),
    ('reparacion-directa.docx', 'Demanda de Reparacion Directa', 'Derecho Administrativo', 'Demanda', ['Art. 140 CPACA'], 'Reparacion directa'),
    ('controversias-contractuales.docx', 'Demanda de Controversias Contractuales', 'Derecho Administrativo', 'Demanda', ['Art. 142 CPACA', 'Ley 80 de 1993'], 'Controversias contractuales'),
    ('solicitud-entidad-publica.docx', 'Solicitud ante Entidad Publica', 'Derecho Administrativo', 'Solicitud', ['Ley 1755 de 2015'], 'Solicitudes ante entidades publicas'),
    ('recursos-actos-administrativos.docx', 'Recursos contra Actos Administrativos', 'Derecho Administrativo', 'Recurso', ['CPACA'], 'Recursos contra actos administrativos'),
    ('conciliacion-administrativa.docx', 'Conciliacion Administrativa', 'Derecho Administrativo', 'Solicitud', ['Art. 64 CPACA'], 'Conciliacion administrativa'),
    ('poder-administrativo.docx', 'Poder Administrativo', 'Derecho Administrativo', 'Poder', ['CPACA'], 'Poderes'),
    ('reclamacion-administrativa.docx', 'Reclamacion Administrativa', 'Derecho Administrativo', 'Reclamacion', ['Ley 1755 de 2015'], 'Reclamaciones administrativas'),

    # DERECHO PENAL (16)
    ('denuncia-penal.docx', 'Denuncia Penal', 'Derecho Penal', 'Denuncia', ['Ley 906 de 2004'], 'Denuncia penal'),
    ('querella-penal.docx', 'Querella Penal', 'Derecho Penal', 'Querella', ['Ley 906 de 2004'], 'Querella'),
    ('poder-penal.docx', 'Poder para Actuacion Penal', 'Derecho Penal', 'Poder', ['Ley 906 de 2004'], 'Poder penal'),
    ('solicitud-audiencia-penal.docx', 'Solicitud de Audiencia', 'Derecho Penal', 'Solicitud', ['Ley 906 de 2004'], 'Solicitud de audiencia'),
    ('solicitud-libertad-penal.docx', 'Solicitud de Libertad', 'Derecho Penal', 'Solicitud', ['Ley 906 de 2004'], 'Solicitud de libertad'),
    ('solicitud-medidas-penal.docx', 'Solicitud de Medidas Cautelares', 'Derecho Penal', 'Solicitud', ['Ley 906 de 2004'], 'Solicitud de medidas'),
    ('solicitud-preclusion.docx', 'Solicitud de Preclusion', 'Derecho Penal', 'Solicitud', ['Art. 332 Ley 906 de 2004'], 'Solicitud de preclusion'),
    ('solicitud-archivo-penal.docx', 'Solicitud de Archivo', 'Derecho Penal', 'Solicitud', ['Ley 906 de 2004'], 'Solicitud de archivo'),
    ('alegatos-conclusion-penal.docx', 'Alegatos de Conclusion', 'Derecho Penal', 'Alegato', ['Ley 906 de 2004'], 'Alegatos'),
    ('reposicion-penal.docx', 'Recurso de Reposicion Penal', 'Derecho Penal', 'Recurso', ['Ley 906 de 2004'], 'Recurso de reposicion'),
    ('apelacion-penal.docx', 'Recurso de Apelacion Penal', 'Derecho Penal', 'Recurso', ['Ley 906 de 2004'], 'Recurso de apelacion'),
    ('impugnacion-penal.docx', 'Impugnacion Penal', 'Derecho Penal', 'Recurso', ['Ley 906 de 2004'], 'Impugnacion'),
    ('incidente-penal.docx', 'Incidente en Proceso Penal', 'Derecho Penal', 'Memorial', ['Ley 906 de 2004'], 'Incidentes'),
    ('memorial-fiscalia.docx', 'Memorial ante Fiscalia', 'Derecho Penal', 'Memorial', ['Ley 906 de 2004'], 'Solicitudes ante Fiscalia'),
    ('memorial-juez-penal.docx', 'Memorial ante Juez Penal', 'Derecho Penal', 'Memorial', ['Ley 906 de 2004'], 'Solicitudes ante jueces penales'),
    ('representacion-victimas.docx', 'Representacion de Victimas', 'Derecho Penal', 'Memorial', ['Ley 906 de 2004', 'Ley 1448 de 2011'], 'Representacion de victimas'),

    # DERECHO COMERCIAL (16)
    ('constitucion-sas.docx', 'Constitucion de Sociedad SAS', 'Derecho Comercial', 'Minuta', ['Ley 1258 de 2008'], 'Constitucion de sociedades'),
    ('reforma-estatutaria.docx', 'Reforma Estatutaria', 'Derecho Comercial', 'Minuta', ['Ley 222 de 1995'], 'Reformas estatutarias'),
    ('acta-asamblea-accionistas.docx', 'Acta de Asamblea de Accionistas', 'Derecho Comercial', 'Acta', ['Codigo de Comercio'], 'Accionistas'),
    ('acta-junta-socios.docx', 'Acta de Junta de Socios', 'Derecho Comercial', 'Acta', ['Codigo de Comercio'], 'Socios'),
    ('compraventa-comercial.docx', 'Contrato de Compraventa Comercial', 'Derecho Comercial', 'Contrato', ['Codigo de Comercio'], 'Compraventa comercial'),
    ('contrato-suministro.docx', 'Contrato de Suministro', 'Derecho Comercial', 'Contrato', ['Codigo de Comercio'], 'Suministro'),
    ('contrato-distribucion.docx', 'Contrato de Distribucion', 'Derecho Comercial', 'Contrato', ['Codigo de Comercio'], 'Distribucion'),
    ('agencia-comercial.docx', 'Contrato de Agencia Comercial', 'Derecho Comercial', 'Contrato', ['Art. 1317 Codigo de Comercio'], 'Agencia comercial'),
    ('prestacion-servicios.docx', 'Contrato de Prestacion de Servicios', 'Derecho Comercial', 'Contrato', ['Codigo de Comercio'], 'Prestacion de servicios'),
    ('nda-confidencialidad.docx', 'Contrato de Confidencialidad (NDA)', 'Derecho Comercial', 'Contrato', ['Codigo de Comercio'], 'Confidencialidad'),
    ('cobro-cartera.docx', 'Cobro de Cartera', 'Derecho Comercial', 'Requerimiento', ['Codigo de Comercio'], 'Cobro de cartera'),
    ('pagare.docx', 'Pagare', 'Derecho Comercial', 'Formulario', ['Art. 621 Codigo de Comercio'], 'Pagare'),
    ('letra-cambio.docx', 'Letra de Cambio', 'Derecho Comercial', 'Formulario', ['Art. 621 Codigo de Comercio'], 'Letra de cambio'),
    ('endoso.docx', 'Endoso de Titulo Valor', 'Derecho Comercial', 'Formulario', ['Codigo de Comercio'], 'Endoso'),
    ('protesto.docx', 'Protesto de Titulo Valor', 'Derecho Comercial', 'Solicitud', ['Codigo de Comercio'], 'Protesto'),
    ('insolvencia-empresarial.docx', 'Insolvencia Empresarial', 'Derecho Comercial', 'Solicitud', ['Ley 1116 de 2006'], 'Insolvencia empresarial'),

    # DERECHO EMPRESARIAL (8)
    ('constitucion-empresa.docx', 'Constitucion de Empresa', 'Derecho Empresarial', 'Minuta', ['Ley 1258 de 2008'], 'Constitucion de empresa'),
    ('estatutos-empresa.docx', 'Estatutos de Empresa', 'Derecho Empresarial', 'Minuta', ['Codigo de Comercio'], 'Estatutos'),
    ('acta-junta-accionistas-emp.docx', 'Acta de Junta de Accionistas', 'Derecho Empresarial', 'Acta', ['Codigo de Comercio'], 'Actas de junta'),
    ('acta-asamblea-general.docx', 'Acta de Asamblea General', 'Derecho Empresarial', 'Acta', ['Codigo de Comercio'], 'Actas de asamblea'),
    ('nombramiento-representante.docx', 'Nombramiento de Representante Legal', 'Derecho Empresarial', 'Acta', ['Codigo de Comercio'], 'Nombramientos'),
    ('renuncia-administrador.docx', 'Renuncia de Administrador', 'Derecho Empresarial', 'Carta', ['Codigo de Comercio'], 'Renuncias'),
    ('politicas-internas.docx', 'Politicas Internas de Empresa', 'Derecho Empresarial', 'Formulario', ['Codigo de Comercio'], 'Politicas internas'),
    ('acuerdo-comercial.docx', 'Acuerdo Comercial', 'Derecho Empresarial', 'Acuerdo', ['Codigo de Comercio'], 'Acuerdos comerciales'),

    # DERECHO TRIBUTARIO (7)
    ('derecho-peticion-tributario.docx', 'Derecho de Peticion Tributario', 'Derecho Tributario', 'Derecho de peticion', ['Estatuto Tributario'], 'Derechos de peticion tributarios'),
    ('reconsideracion-tributario.docx', 'Recurso de Reconsideracion', 'Derecho Tributario', 'Recurso', ['Art. 720 Estatuto Tributario'], 'Recursos de reconsideracion'),
    ('respuesta-requerimiento-dian.docx', 'Respuesta a Requerimiento DIAN', 'Derecho Tributario', 'Respuesta', ['Estatuto Tributario'], 'Respuestas a requerimientos'),
    ('solicitud-dian.docx', 'Solicitud ante DIAN', 'Derecho Tributario', 'Solicitud', ['Estatuto Tributario'], 'Solicitudes ante DIAN'),
    ('acuerdo-pago-tributario.docx', 'Acuerdo de Pago Tributario', 'Derecho Tributario', 'Solicitud', ['Art. 814 Estatuto Tributario'], 'Acuerdos de pago'),
    ('contestacion-tributaria.docx', 'Contestacion Tributaria', 'Derecho Tributario', 'Contestacion de demanda', ['Estatuto Tributario'], 'Contestaciones'),
    ('memorial-tributario.docx', 'Memorial Tributario', 'Derecho Tributario', 'Memorial', ['Estatuto Tributario'], 'Memoriales tributarios'),

    # DERECHO AMBIENTAL (6)
    ('solicitud-ambiental.docx', 'Solicitud Ambiental', 'Derecho Ambiental', 'Solicitud', ['Decreto 1076 de 2015'], 'Solicitudes ambientales'),
    ('licencia-ambiental.docx', 'Licencia Ambiental', 'Derecho Ambiental', 'Solicitud', ['Decreto 1076 de 2015'], 'Licencias ambientales'),
    ('permiso-ambiental.docx', 'Permiso Ambiental', 'Derecho Ambiental', 'Solicitud', ['Decreto 1076 de 2015'], 'Permisos'),
    ('reclamacion-ambiental.docx', 'Reclamacion Ambiental', 'Derecho Ambiental', 'Reclamacion', ['Ley 1333 de 2009'], 'Reclamaciones'),
    ('accion-popular-ambiental.docx', 'Accion Popular Ambiental', 'Derecho Ambiental', 'Accion constitucional', ['Ley 472 de 1998'], 'Acciones populares ambientales'),
    ('denuncia-ambiental.docx', 'Denuncia Ambiental', 'Derecho Ambiental', 'Denuncia', ['Ley 1333 de 2009'], 'Denuncias ambientales'),

    # DERECHO AGRARIO (6)
    ('arrendamiento-rural.docx', 'Arrendamiento Rural', 'Derecho Agrario y Rural', 'Contrato', ['Ley 160 de 1994'], 'Arrendamiento rural'),
    ('compraventa-rural.docx', 'Compraventa de Predio Rural', 'Derecho Agrario y Rural', 'Contrato', ['Ley 160 de 1994'], 'Compraventa de predios rurales'),
    ('servidumbre-paso.docx', 'Servidumbre de Paso', 'Derecho Agrario y Rural', 'Contrato', ['Art. 1035 CC'], 'Servidumbres'),
    ('restitucion-tierras.docx', 'Restitucion de Tierras', 'Derecho Agrario y Rural', 'Solicitud', ['Ley 1448 de 2011'], 'Restitucion de tierras'),
    ('formalizacion-tierras.docx', 'Formalizacion de Tierras', 'Derecho Agrario y Rural', 'Solicitud', ['Ley 160 de 1994'], 'Formalizacion'),
    ('saneamiento-propiedad.docx', 'Saneamiento de Propiedad Rural', 'Derecho Agrario y Rural', 'Solicitud', ['Ley 160 de 1994'], 'Saneamiento de propiedad'),

    # DERECHO MINERO (4)
    ('solicitud-titulo-minero.docx', 'Solicitud de Titulo Minero', 'Derecho Minero', 'Solicitud', ['Ley 685 de 2001'], 'Solicitudes mineras'),
    ('concesion-minera.docx', 'Contrato de Concesion Minera', 'Derecho Minero', 'Contrato', ['Ley 685 de 2001'], 'Contratos'),
    ('recurso-minero.docx', 'Recurso Minero', 'Derecho Minero', 'Recurso', ['Ley 685 de 2001'], 'Recursos'),
    ('reclamacion-minera.docx', 'Reclamacion Minera', 'Derecho Minero', 'Reclamacion', ['Ley 685 de 2001'], 'Reclamaciones'),

    # TRANSITO (3)
    ('impugnacion-comparendo.docx', 'Impugnacion de Comparendo', 'Derecho de Transito y Transporte', 'Memorial', ['Ley 769 de 2002'], 'Impugnacion de comparendos'),
    ('derecho-peticion-transito.docx', 'Derecho de Peticion de Transito', 'Derecho de Transito y Transporte', 'Derecho de peticion', ['Ley 769 de 2002'], 'Derechos de peticion'),
    ('reclamacion-accidente-transito.docx', 'Reclamacion por Accidente de Transito', 'Derecho de Transito y Transporte', 'Reclamacion', ['Ley 769 de 2002'], 'Reclamaciones'),

    # PROPIEDAD INTELECTUAL (4)
    ('registro-marca.docx', 'Solicitud de Registro de Marca', 'Derecho de Propiedad Intelectual', 'Solicitud', ['Decision 486 CAN'], 'Registro de marca'),
    ('oposicion-marca.docx', 'Oposicion a Registro de Marca', 'Derecho de Propiedad Intelectual', 'Memorial', ['Decision 486 CAN'], 'Oposicion'),
    ('licencia-marca.docx', 'Contrato de Licencia de Marca', 'Derecho de Propiedad Intelectual', 'Contrato', ['Decision 486 CAN'], 'Contratos de licencia'),
    ('cesion-derechos-autor.docx', 'Cesion de Derechos de Autor', 'Derecho de Propiedad Intelectual', 'Contrato', ['Ley 23 de 1982'], 'Cesion de derechos'),

    # CONSUMIDOR (4)
    ('reclamacion-consumidor.docx', 'Reclamacion Directa al Proveedor', 'Derecho del Consumidor', 'Reclamacion', ['Ley 1480 de 2011'], 'Reclamacion directa'),
    ('queja-sic-consumidor.docx', 'Queja ante SIC', 'Derecho del Consumidor', 'Reclamacion', ['Ley 1480 de 2011'], 'Quejas'),
    ('demanda-consumidor.docx', 'Demanda del Consumidor', 'Derecho del Consumidor', 'Demanda', ['Ley 1480 de 2011'], 'Demandas'),
    ('solicitud-devolucion.docx', 'Solicitud de Devolucion', 'Derecho del Consumidor', 'Solicitud', ['Ley 1480 de 2011'], 'Solicitudes de devolucion'),

    # PROTECCION DE DATOS (5)
    ('habeas-data-proteccion.docx', 'Habeas Data', 'Derecho de Proteccion de Datos', 'Accion constitucional', ['Ley 1581 de 2012'], 'Habeas data'),
    ('autorizacion-datos.docx', 'Autorizacion de Tratamiento de Datos', 'Derecho de Proteccion de Datos', 'Formulario', ['Ley 1581 de 2012'], 'Autorizacion de tratamiento de datos'),
    ('politica-datos.docx', 'Politica de Tratamiento de Datos', 'Derecho de Proteccion de Datos', 'Formulario institucional', ['Ley 1581 de 2012'], 'Politica de tratamiento'),
    ('aviso-privacidad.docx', 'Aviso de Privacidad', 'Derecho de Proteccion de Datos', 'Formulario institucional', ['Ley 1581 de 2012'], 'Aviso de privacidad'),
    ('solicitud-supresion-datos.docx', 'Solicitud de Supresion de Datos', 'Derecho de Proteccion de Datos', 'Solicitud', ['Ley 1581 de 2012'], 'Solicitud de supresion'),

    # CONTRATACION ESTATAL (8)
    ('estudios-previos.docx', 'Estudios Previos', 'Contratacion Estatal', 'Minuta', ['Ley 80 de 1993'], 'Estudios y documentos previos'),
    ('contrato-estatal.docx', 'Contrato Estatal', 'Contratacion Estatal', 'Contrato', ['Ley 80 de 1993'], 'Contratos estatales'),
    ('otrosi-estatal.docx', 'Otrosi a Contrato Estatal', 'Contratacion Estatal', 'Otrosi', ['Ley 80 de 1993'], 'Otrosi'),
    ('adicion-estatal.docx', 'Adicion a Contrato Estatal', 'Contratacion Estatal', 'Otrosi', ['Ley 80 de 1993'], 'Adiciones'),
    ('prorroga-estatal.docx', 'Prorroga de Contrato Estatal', 'Contratacion Estatal', 'Otrosi', ['Ley 80 de 1993'], 'Prorrogas'),
    ('liquidacion-estatal.docx', 'Acta de Liquidacion de Contrato Estatal', 'Contratacion Estatal', 'Acta', ['Ley 80 de 1993'], 'Liquidacion'),
    ('informe-supervision.docx', 'Informe de Supervision', 'Contratacion Estatal', 'Formulario', ['Ley 80 de 1993'], 'Supervision'),
    ('informe-interventoria.docx', 'Informe de Interventoria', 'Contratacion Estatal', 'Formulario', ['Ley 80 de 1993'], 'Interventoria'),

    # NOTARIAL (4)
    ('poder-notarial.docx', 'Poder Notarial', 'Derecho Notarial y Registral', 'Poder', ['Decreto 960 de 1970'], 'Poderes'),
    ('declaracion-extrajuicio.docx', 'Declaracion Extrajuicio', 'Derecho Notarial y Registral', 'Declaracion', ['Decreto 960 de 1970'], 'Declaraciones extrajuicio'),
    ('escritura-compraventa.docx', 'Escritura Publica de Compraventa', 'Derecho Notarial y Registral', 'Minuta', ['Decreto 960 de 1970'], 'Escrituras'),
    ('solicitud-registro.docx', 'Solicitud de Registro', 'Derecho Notarial y Registral', 'Solicitud', ['Decreto 1250 de 1970'], 'Solicitudes de registro'),

    # MIGRATORIO (3)
    ('solicitud-visa.docx', 'Solicitud de Visa', 'Derecho Migratorio', 'Solicitud', ['Decreto 1066 de 2015'], 'Solicitudes'),
    ('permiso-permanencia.docx', 'Permiso de Permanencia', 'Derecho Migratorio', 'Solicitud', ['Decreto 1066 de 2015'], 'Permisos'),
    ('regularizacion-migratoria.docx', 'Regularizacion Migratoria', 'Derecho Migratorio', 'Solicitud', ['Decreto 1066 de 2015'], 'Regularizacion'),

    # INTERNACIONAL (2)
    ('peticion-organismo-internacional.docx', 'Peticion ante Organismo Internacional', 'Derecho Internacional', 'Solicitud', ['Convencion Americana DDHH'], 'Peticiones'),
    ('documento-organismo-internacional.docx', 'Documento para Organismo Internacional', 'Derecho Internacional', 'Memorial', ['Sistema Interamericano DDHH'], 'Documentos para organismos internacionales'),
]


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f'Generando {len(TEMPLATES)} plantillas en: {OUTPUT_DIR}')
    print()

    for i, (filename, title, area, doc_type, norms_list, subcategory) in enumerate(TEMPLATES, 1):
        try:
            doc = Document()
            generator = GENERATORS.get(doc_type, gen_solicitud)
            generator(doc, title, area, norms_list, subcategory)
            filepath = os.path.join(OUTPUT_DIR, filename)
            doc.save(filepath)
            print(f'  [{i}/{len(TEMPLATES)}] OK: {filename}')
        except Exception as e:
            print(f'  [{i}/{len(TEMPLATES)}] ERROR: {filename} - {e}')

    print(f'\nCompletado: {len(TEMPLATES)} archivos generados en {OUTPUT_DIR}')


if __name__ == '__main__':
    main()
