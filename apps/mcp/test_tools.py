"""Prueba de las herramientas del servidor MCP contra la base real."""

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import server as srv


def titulo(t):
    print()
    print("=" * 70)
    print(t)
    print("=" * 70)


async def main():
    titulo("1. estadisticas()")
    est = await srv.estadisticas()
    print("sentencias:", json.dumps(est["sentencias"], ensure_ascii=False, default=str))
    print("normativa: ", json.dumps(est["normativa"], ensure_ascii=False, default=str))
    print("plantillas:", est["plantillas"])

    titulo("2. buscar_sentencias()")
    for consulta in ["derecho a la vida", "contaminacion de aguas recurso natural", "vulneracion"]:
        r = await srv.buscar_sentencias(consulta, limite=3)
        print("consulta:", repr(consulta), "-> encontrado:", r["encontrado"],
              "| total:", r["total_devuelto"])
        for x in r["resultados"]:
            print("   -", x["cita"], "|", x["fecha"], "|", x["proceso"],
                  "| citas:", len(x["providencias_citadas"]))
        if r["resultados"]:
            cita = r["resultados"][0]["cita"]
            break
    else:
        cita = None

    titulo("3. obtener_sentencia() con variantes de formato")
    for variante in [cita, "T-760 de 2008", "t 760 08", "C-041/2017"]:
        if not variante:
            continue
        o = await srv.obtener_sentencia(variante, incluir_texto=False)
        estado = "OK" if o.get("encontrado") else "NO ENCONTRADO"
        print("  ", repr(variante).ljust(24), "->", estado, o.get("cita", ""))

    titulo("4. obtener_sentencia() inexistente (debe ser honesto)")
    print(json.dumps(await srv.obtener_sentencia("T-999/99"), ensure_ascii=False, indent=2))

    if cita:
        titulo("5. jurisprudencia_relacionada(%r)" % cita)
        jr = await srv.jurisprudencia_relacionada(cita, limite=10)
        print("encontrado:", jr["encontrado"], "| total citadas:", jr.get("total_citadas"))
        print("disponibles:   ", [d["cita"] for d in jr.get("disponibles", [])])
        print("no disponibles:", jr.get("no_disponibles", [])[:12])

        titulo("6. normas_referenciadas(cita=%r)" % cita)
        nr = await srv.normas_referenciadas(cita=cita)
        print("normas citadas:", nr.get("normas_citadas", [])[:15])

        titulo("7. normas_referenciadas(norma=...) sentido inverso")
        if nr.get("normas_citadas"):
            inv = await srv.normas_referenciadas(norma=nr["normas_citadas"][0], limite=5)
            print("norma:", inv.get("norma"))
            print("providencias que la citan:", inv.get("total_providencias_que_la_citan"))
            for p in inv.get("providencias", [])[:5]:
                print("  -", p["cita"], p["fecha"])

        titulo("8. fragmento_sentencia(%r)" % cita)
        fr = await srv.fragmento_sentencia(cita, indice=0, largo=700)
        print("encontrado:", fr.get("encontrado"), "| total:", fr.get("total_caracteres"))
        print("hay_mas:", fr.get("hay_mas"))
        print("inicio:", (fr.get("fragmento") or "")[:200].replace("\n", " "))

    titulo("9. buscar_normas('Ley 599')")
    bn = await srv.buscar_normas("Ley 599 de 2000", limite=3)
    print("encontrado:", bn["encontrado"])
    for n in bn["resultados"]:
        print("  -", n["nombre"], "| articulos:", n["numero_articulos"], "| vigente:", n["vigente"])

    titulo("10. obtener_ley(599, 2000) y honestidad sobre articulos")
    ley = await srv.obtener_ley("599", 2000)
    print("encontrado:", ley["encontrado"], "|", ley.get("nombre"))
    print("articulos en ficha:", ley.get("numero_articulos_segun_fuente"))
    print("articulos con texto en base:", ley.get("articulos_disponibles_en_base"))
    print("advertencia:", ley.get("advertencia"))

    titulo("11. obtener_articulo(599, '304')")
    art = await srv.obtener_articulo("599", "304", 2000)
    print("encontrado:", art["encontrado"])
    if not art["encontrado"]:
        print("advertencia:", art.get("advertencia"))

    titulo("12. buscar_plantillas(area='Derecho Laboral y Seguridad Social')")
    pl = await srv.buscar_plantillas(area="Derecho Laboral y Seguridad Social", limite=3)
    print("encontrado:", pl["encontrado"], "| total:", pl["total_devuelto"])
    for p in pl["plantillas"]:
        print("  -", p["nombre"], "|", p["tipo_documento"], "|", p["etiquetas"])

    titulo("13. autocita filtrada (C-341/17 no debe citarse a si misma)")
    jr = await srv.jurisprudencia_relacionada("C-341/17")
    print("total citadas:", jr["total_citadas"])
    print("disponibles:", [d["cita"] for d in jr["disponibles"]])
    print("¿se cita a si misma?", any(
        d["cita"].lower() == "c-341/17" for d in jr["disponibles"]
    ))

    if _pool := getattr(srv, "_pool", None):
        await _pool.close()


asyncio.run(main())
