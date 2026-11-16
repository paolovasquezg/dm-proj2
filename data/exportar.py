import json
import shutil
import sys
from pathlib import Path

import pandas as pd

PROYECTO = Path(__file__).resolve().parents[1]
SALIDA = PROYECTO / "web" / "data"

VISTAS = {
    "02_datos": [
        ("00_EDA", "a_entendimiento", "conteos_staging"),
        ("00_EDA", "b_exploracion", "procesos_por_mes"),
        ("00_EDA", "b_exploracion", "metodo_competencia"),
        ("00_EDA", "b_exploracion", "grado_proveedores"),
        ("00_EDA", "b_exploracion", "grado_entidades"),
        ("00_EDA", "b_exploracion", "resumen_bipartito"),
        ("00_EDA", "b_exploracion", "multi_pertenencia"),
        ("00_EDA", "b_exploracion", "hhi_resumen"),
        ("01_Trans", "b_transformaciones", "impacto_resolucion"),
        ("01_Trans", "c_uso", "resumen_artefactos"),
        ("01_Trans", "c_uso", "grado_coparticipacion"),
    ],
    "04_clustering": [
        ("02_Clustering", "b_kmeans", "curvas_k"),
        ("02_Clustering", "b_kmeans", "perfiles_kmeans"),
        ("02_Clustering", "c_densidad", "grid_dbscan"),
        ("02_Clustering", "c_densidad", "grid_hdbscan"),
        ("02_Clustering", "e_analisis", "tecnicas"),
        ("02_Clustering", "e_analisis", "tipologias"),
        ("02_Clustering", "e_analisis", "ari_metodos"),
        ("02_Clustering", "e_analisis", "cautivas_umbral"),
        ("02_Clustering", "e_analisis", "cautivas_por_tipologia"),
        ("02_Clustering", "e_analisis", "atienden_cautivas"),
        ("02_Clustering", "e_analisis", "consenso_outliers"),
    ],
    "05_recomendacion": [
        ("03_Recomend", "d_als", "grilla_als"),
        ("03_Recomend", "e_hibrido", "peso_hibrido"),
        ("03_Recomend", "e_hibrido", "comparacion_test"),
        ("03_Recomend", "e_hibrido", "ndcg_por_tramo"),
        ("03_Recomend", "f_analisis", "sustitutos_resumen"),
        ("03_Recomend", "f_analisis", "sustitutos_por_familia"),
        ("03_Recomend", "f_analisis", "pq1_alternativas"),
        ("03_Recomend", "f_analisis", "afinidades_inusuales"),
    ],
    "06_pagerank": [
        ("04_PageRank", "b_pagerank", "pagerank_damping_web"),
        ("04_PageRank", "b_pagerank", "sensibilidad_damping"),
        ("04_PageRank", "c_hits", "cuadrantes"),
        ("04_PageRank", "d_analisis", "correlaciones"),
        ("04_PageRank", "d_analisis", "por_tipologia"),
        ("04_PageRank", "d_analisis", "cautividad"),
        ("04_PageRank", "d_analisis", "contraste_monto"),
    ],
    "07_comunidades": [
        ("05_Comunidad", "a_grafo", "barrido_nucleo"),
        ("05_Comunidad", "a_grafo", "resumen_grafo"),
        ("05_Comunidad", "b_particion", "louvain_gamma"),
        ("05_Comunidad", "b_particion", "referencias"),
        ("05_Comunidad", "b_particion", "comparacion"),
        ("05_Comunidad", "b_particion", "girvan_newman"),
        ("05_Comunidad", "c_solapadas", "bigclam_delta_web"),
        ("05_Comunidad", "c_solapadas", "eleccion_delta"),
        ("05_Comunidad", "c_solapadas", "eleccion_k"),
        ("05_Comunidad", "d_escalabilidad", "ajuste_costo"),
        ("05_Comunidad", "d_escalabilidad", "resumen_metodos"),
        ("05_Comunidad", "d_escalabilidad", "gn_extrapolacion"),
        ("05_Comunidad", "d_escalabilidad", "betweenness_aprox"),
        ("05_Comunidad", "e_analisis", "comunidades_web_nodos"),
        ("05_Comunidad", "e_analisis", "comunidades_web_aristas"),
        ("05_Comunidad", "e_analisis", "explica"),
        ("05_Comunidad", "e_analisis", "perfil_comunidades"),
        ("05_Comunidad", "e_analisis", "hubs_vs_nucleo"),
    ],
    "08_representacion": [
        ("06_Representacion", "a_grafo", "umbral_hub"),
        ("06_Representacion", "a_grafo", "por_anio"),
        ("06_Representacion", "b_node2vec", "perfil_pq"),
        ("06_Representacion", "b_node2vec", "dimension"),
        ("06_Representacion", "c_proyeccion", "estabilidad_k"),
        ("06_Representacion", "c_proyeccion", "convergencia"),
        ("06_Representacion", "c_proyeccion", "cruce_v"),
        ("06_Representacion", "c_proyeccion", "perfiles_latentes"),
        ("06_Representacion", "d_enlaces", "resultados"),
        ("06_Representacion", "d_enlaces", "precision_top"),
        ("06_Representacion", "d_enlaces", "por_decil"),
        ("06_Representacion", "d_enlaces", "por_tipo_negativo"),
        ("06_Representacion", "d_enlaces", "top_pares"),
    ],
    "09_analisis": [
        ("07_Analisis", "a_recuento", "desempeno"),
        ("07_Analisis", "b_hallazgos", "respuestas"),
        ("07_Analisis", "c_insights", "valor_tecnicas"),
        ("07_Analisis", "c_insights", "convergencia"),
        ("07_Analisis", "c_insights", "escalabilidad"),
        ("07_Analisis", "c_insights", "proyeccion"),
        ("07_Analisis", "c_insights", "senales"),
        ("07_Analisis", "c_insights", "consorcios"),
    ],
}

DECIMALES_XY = 2 


def origen(parte, nb):
    return PROYECTO / parte / "temp" / nb / "web"


def leer(parte, nb, tabla):
    ruta = origen(parte, nb) / f"{tabla}.json"
    if not ruta.exists():
        sys.exit(f"Falta {ruta.relative_to(PROYECTO)}: corre {parte}/{nb}.ipynb")
    return pd.read_json(ruta, dtype=False)


def escribir(obj, vista, nombre, fuente, manifiesto):
    destino = SALIDA / vista / f"{nombre}.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(obj, pd.DataFrame):
        obj.to_json(destino, orient="records", force_ascii=False)
        filas = len(obj)
    else:
        destino.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
        filas = len(obj) if isinstance(obj, list) else 1
    manifiesto.setdefault(vista, []).append({"archivo": f"{vista}/{nombre}.json", "origen": fuente, "filas": filas})


def compactar_umap(manifiesto):
    u = leer("06_Representacion", "c_proyeccion", "umap_web")
    n = leer("06_Representacion", "c_proyeccion", "nodos_web")
    ks = [c for c in u.columns if c.startswith("k")]
    orden = n.idx.tolist()
    salida = {"idx": orden, "ks": [int(k[1:]) for k in ks], "configs": {}}
    for cfg, d in u.groupby("config"):
        d = d.set_index("idx").loc[orden]
        salida["configs"][cfg] = {"x": d.x.round(DECIMALES_XY).tolist(), "y": d.y.round(DECIMALES_XY).tolist(),
                                  **{k: d[k].astype(int).tolist() for k in ks}}
    salida["nodos"] = {c: n[c].where(n[c].notna(), None).tolist()
                       for c in ("nombre", "region", "segmento", "tipologia", "grado", "n_procesos", "n_ganados")}
    escribir(salida, "08_representacion", "c_proyeccion/umap", "06_Representacion/temp/c_proyeccion/web/umap_web + nodos_web (columnar)", manifiesto)


def compactar_gamma(manifiesto):
    p = leer("05_Comunidad", "b_particion", "particion_gamma_web")
    nod = leer("05_Comunidad", "e_analisis", "nodos_web")[["clave", "region_dom", "categoria_dom"]]
    p = p.merge(nod, on="clave", how="left")
    filas = []
    for g, d in p.groupby("gamma"):
        for c, dc in d.groupby("comunidad"):
            reg, cat = dc.region_dom.value_counts(), dc.categoria_dom.value_counts()
            filas.append({"gamma": g, "comunidad": int(c), "tamano": len(dc),
                          "region": reg.index[0] if len(reg) else None, "pureza_region": round(reg.iloc[0] / len(dc), 3) if len(reg) else None,
                          "categoria": cat.index[0] if len(cat) else None, "pureza_categoria": round(cat.iloc[0] / len(dc), 3) if len(cat) else None})
    escribir(pd.DataFrame(filas), "07_comunidades", "b_particion/gamma_comunidades",
             "05_Comunidad/temp/b_particion/web/particion_gamma_web + e_analisis/nodos_web (agregado por γ)", manifiesto)


def extras(manifiesto):
    compactar_umap(manifiesto)
    compactar_gamma(manifiesto)
    c = leer("04_PageRank", "d_analisis", "centralidad_web")[["nombre", "tipologia", "es_consorcio", "grado", "monto", "pct_pr", "pct_hits", "residuo"]]
    c = c.assign(monto=c.monto.round(0), pct_pr=c.pct_pr.round(4), pct_hits=c.pct_hits.round(4), residuo=c.residuo.round(3))
    escribir(c, "06_pagerank", "d_analisis/centralidad", "04_PageRank/temp/d_analisis/web/centralidad_web (columnas del gráfico)", manifiesto)
    g = leer("05_Comunidad", "e_analisis", "grupos_cerrados").drop(columns=["miembros"], errors="ignore")
    escribir(g, "07_comunidades", "e_analisis/grupos_cerrados", "05_Comunidad/temp/e_analisis/web/grupos_cerrados (sin miembros)", manifiesto)


def main():
    faltan = [f"{p}/temp/{nb}/web/{t}.json" for tablas in VISTAS.values() for p, nb, t in tablas
              if not (origen(p, nb) / f"{t}.json").exists()]
    if faltan:
        sys.exit("Faltan tablas (corre los notebooks correspondientes):\n  " + "\n  ".join(faltan))

    if SALIDA.exists():
        shutil.rmtree(SALIDA)
    manifiesto = {}
    for vista, tablas in VISTAS.items():
        for parte, nb, tabla in tablas:
            destino = SALIDA / vista / nb / f"{tabla}.json"
            destino.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(origen(parte, nb) / f"{tabla}.json", destino)
            filas = len(json.loads(destino.read_text()))
            manifiesto.setdefault(vista, []).append({"archivo": f"{vista}/{nb}/{tabla}.json",
                                                    "origen": f"{parte}/temp/{nb}/web/{tabla}.json", "filas": filas})
    extras(manifiesto)

    (SALIDA / "manifest.json").write_text(json.dumps(manifiesto, ensure_ascii=False, indent=1))
    n = sum(len(v) for v in manifiesto.values())
    mb = sum(p.stat().st_size for p in SALIDA.rglob("*.json")) / 1024 ** 2
    print(f"web/data: {n} archivos en {len(manifiesto)} vistas ({mb:.1f} MB)")
    for vista, archivos in manifiesto.items():
        print(f"  {vista}: {len(archivos)}")

if __name__ == "__main__":
    main()
