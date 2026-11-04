import json, sys
from pathlib import Path

DEST = Path(sys.argv[1])
META = {"kernelspec": {"display_name": "Python 3 (ipykernel)", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.11.8"}}

def nb(cells, nombre):
    if len(sys.argv) > 2 and nombre not in sys.argv[2:]:
        return
    out = []
    for t, s in cells:
        s = s.strip("\n")
        c = {"cell_type": t, "metadata": {}, "source": s.splitlines(keepends=True)}
        if t == "code":
            c.update(execution_count=None, outputs=[])
        out.append(c)
    (DEST / nombre).write_text(json.dumps({"cells": out, "metadata": META, "nbformat": 4, "nbformat_minor": 5},
                                          indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

M, C = "markdown", "code"

# ---------------------------------------------------------------- funciones
nb([
(M, """
## Recomendación: Funciones

Constantes, splits temporales, configuración y métricas de ranking compartidas
"""),
(M, "### Imports"),
(C, """
import json
import numpy as np
"""),
(M, """
### Constantes

- `SEED` = 42: misma semilla en muestras y modelos

- `SPLITS`: años de entrenamiento y de prueba
    - **ajuste** (2023 → 2024): se eligen hiperparámetros y el peso `w` del híbrido
    - **final** (2023-2024 → 2025): se mide **una sola vez** con lo elegido en ajuste

- `KS`: cortes del ranking que se reportan

- `N_CAND`: candidatos por entidad que cada modelo entrega al híbrido

- `Q_WINSOR`: cuantil de $\\log(1 + \\text{monto})$ en que se recorta la señal (obras gigantes)

- `UMBRAL_HHI`: HHI desde el que una entidad es cautiva (el mismo de la Parte II)

- `MAX_ITER_ALS`: iteraciones de ALS

- `datos_dir`: datos que pasan de un notebook al siguiente
"""),
(C, """
SEED = 42
SPLITS = {"ajuste": {"train": [2023], "test": [2024]},
          "final":  {"train": [2023, 2024], "test": [2025]}}
KS = [5, 10]
N_CAND = 200
Q_WINSOR = 0.99
UMBRAL_HHI = 0.25
MAX_ITER_ALS = 10
datos_dir = Path.cwd() / "temp" / "datos"
datos_dir.mkdir(parents=True, exist_ok=True)
"""),
(M, """
### Parámetros elegidos

Se eligen con el split **ajuste** y se guardan en `temp/datos/config.json`; los notebooks siguientes los leen de ahí

| Parámetro | Qué es | Criterio | Sección |
|---|---|---|---|
| `als.rank`, `als.reg`, `als.alpha`, `als.senal` | Factores, λ, α y señal de ALS | NDCG@10 en pares nuevos; empates por media entre semillas | `b_baseline_als` |
| `contenido.dim` | Dimensiones de la SVD | NDCG@10 en pares nuevos, búsqueda exacta | `c_contenido_ann` |
| `contenido.gamma` | Exponente del factor de actividad | NDCG@10 en pares nuevos | `c_contenido_ann` |
| `contenido.prof` | Vecinos que HNSW recupera antes de reordenar | recall@200 ≥ 95% frente al exacto | `c_contenido_ann` |
| `hibrido.w` | Peso de ALS en cada variante del híbrido | NDCG@10 en pares nuevos | `d_hibrido_evaluacion` |
"""),
(M, """
### Configuración entre notebooks

`config.json` guarda lo que cada notebook decide (cuantil de winsorización, hiperparámetros, `w`…)
"""),
(C, """
def leer_config():
    ruta = datos_dir / "config.json"
    return json.loads(ruta.read_text()) if ruta.exists() else {}

def guardar_config(config):
    (datos_dir / "config.json").write_text(json.dumps(config, indent=1, ensure_ascii=False))
"""),
(M, """
### Señal implícita

$$r_{ui} = \\log(1 + n_{ui}) + \\beta \\cdot \\frac{\\min(\\log(1 + m_{ui}),\\, q)}{q}$$

- $n_{ui}$: adjudicaciones de la entidad $u$ al proveedor $i$; $m_{ui}$: monto en soles

- $q$: cuantil `Q_WINSOR` de $\\log(1+m)$, calculado **solo con train**

- ALS usa la confianza $c_{ui} = 1 + \\alpha\\, r_{ui}$
"""),
(C, """
def senal(n, m, q, beta):
    return F.log1p(n) + F.lit(beta) * F.least(F.log1p(F.coalesce(m, F.lit(0.0))), F.lit(q)) / F.lit(q)
"""),
(M, """
### ALS

`entrenar_als`: ajusta ALS implícito en Spark y baja los factores al driver como matrices NumPy (filas = índices enteros de train)
"""),
(C, """
from pyspark.ml.recommendation import ALS

def factores(df, n, k):
    p = df.toPandas(); Mx = np.zeros((n, k), dtype=np.float32)
    Mx[p.id.to_numpy()] = np.vstack(p.features.to_numpy()); return Mx

def entrenar_als(ratings, ctx, rank, reg, alpha, col, seed=SEED):
    t0 = time.time()
    m = ALS(rank=rank, regParam=reg, alpha=alpha, implicitPrefs=True, maxIter=MAX_ITER_ALS, seed=seed,
            userCol="entidad_idx", itemCol="proveedor_idx", ratingCol=col).fit(ratings)
    return factores(m.userFactors, ctx.n_u, rank), factores(m.itemFactors, ctx.n_i, rank), round(time.time() - t0, 1)
"""),
(M, """
### Documentos de texto

`doc_procesos`: texto de cada proceso = `descripcion` + `items_desc` (solo si difiere) + un token `fam<código>` por familia UNSPSC adjudicada; lo usan `c_contenido_ann` y `e_analisis_sustitutos`
"""),
(C, """
def doc_procesos(procesos, anios):
    p = procesos.select("ocid", "entidad_key", F.concat_ws(" ", F.coalesce("descripcion", F.lit("")),
                        F.when(F.col("items_desc") != F.col("descripcion"), F.col("items_desc")).otherwise(F.lit(""))).alias("texto"))
    fam = (leer(final_dir, "hechos").where(F.col("anio").isin(anios) & (F.col("familia") != "SIN"))
           .groupBy("ocid").agg(F.concat_ws(" ", F.collect_set(F.concat(F.lit("fam"), "familia"))).alias("fams")))
    d = p.join(fam, "ocid", "left").toPandas()
    d["doc"] = d.texto.str.slice(0, 3000) + " " + d.fams.fillna("")
    return d
"""),
(M, """
### Candidatos guardados

`leer_cand(split, modelo)`: top-`N_CAND` de un modelo, como `{régimen: DataFrame}`
"""),
(C, """
def leer_cand(split, modelo):
    d = pd.read_parquet(datos_dir / f"{split}_cand_{modelo}")
    return {reg: g.drop(columns="regimen").reset_index(drop=True) for reg, g in d.groupby("regimen")}
"""),
(M, """
### Métricas de ranking

- `recs`: entidad → lista ordenada de proveedores recomendados; `verdad`: entidad → conjunto de proveedores adjudicados en test

- **Precision@K** = aciertos en el top-K / K

- **Recall@K** = aciertos en el top-K / relevantes

- **NDCG@K**: aciertos descontados por posición (1 / log2(pos + 1)), dividido entre el ideal

- **MAP@K**: promedio de la precisión en cada posición con acierto, dividido entre min(K, relevantes)

- Solo se evalúan entidades con al menos un relevante
"""),
(C, """
def metricas_entidad(rec, rel, k):
    top = rec[:k]
    hits = np.array([p in rel for p in top], dtype=float)
    n_hit = hits.sum()
    desc = 1 / np.log2(np.arange(2, len(top) + 2))
    ideal = desc[:min(len(rel), k)].sum()
    prec_pos = np.cumsum(hits) / np.arange(1, len(top) + 1)
    return {"precision": n_hit / k, "recall": n_hit / len(rel),
            "ndcg": float((hits * desc).sum() / ideal) if ideal > 0 else 0.0,
            "map": float((prec_pos * hits).sum() / min(len(rel), k))}

def evaluar(recs, verdad, k):
    filas = [metricas_entidad(recs.get(u, []), rel, k) for u, rel in verdad.items() if rel]
    return {m: float(np.mean([f[m] for f in filas])) for m in ["precision", "recall", "ndcg", "map"]} | {"entidades": len(filas)}

def por_entidad(recs, verdad, k, metrica="ndcg"):
    # valor de la métrica en cada entidad, en orden de `verdad` (para bootstrap pareado)
    return np.array([metricas_entidad(recs.get(u, []), rel, k)[metrica] for u, rel in verdad.items() if rel])
"""),
(M, """
### Incertidumbre

- `ic_bootstrap`: intervalo al 95% de la media, remuestreando **entidades** con reemplazo

- Con `base` se remuestrea la **diferencia pareada** entre dos modelos en las mismas entidades: si el intervalo no contiene 0, la diferencia no es ruido
"""),
(C, """
def ic_bootstrap(v, base=None, n=1000, seed=SEED):
    v = np.asarray(v, dtype=float) - (0 if base is None else np.asarray(base, dtype=float))
    rng = np.random.default_rng(seed)
    medias = v[rng.integers(0, len(v), size=(n, len(v)))].mean(axis=1)
    return float(v.mean()), float(np.quantile(medias, .025)), float(np.quantile(medias, .975))
"""),
(M, """
### Diversidad

- **Cobertura**: % del catálogo que aparece en algún top-K

- **% cola larga**: % de las recomendaciones que son proveedores con **un solo cliente** en train

- **% no ganadores**: % de las recomendaciones que son proveedores que ofertaron en train pero **nunca ganaron** (reenfoque de PQ3.2: el 66% de los pares nuevos de test va a ellos)

- **Popularidad media**: n.º medio de entidades clientes (en train) de lo recomendado
"""),
(C, """
def diversidad(recs, k, catalogo, cola_larga, no_ganadores, popularidad):
    todas = [p for r in recs.values() for p in r[:k]]
    if not todas:
        return {"cobertura": 0.0, "pct_cola_larga": 0.0, "pct_no_ganadores": 0.0, "popularidad_media": 0.0}
    return {"cobertura": len(set(todas)) / len(catalogo),
            "pct_cola_larga": float(np.mean([p in cola_larga for p in todas])),
            "pct_no_ganadores": float(np.mean([p in no_ganadores for p in todas])),
            "popularidad_media": float(np.mean([popularidad.get(p, 0) for p in todas]))}
"""),
(M, """
### Ranking por lotes

- `rankear`: arma el top-`n` de cada entidad evaluable a partir de una función de puntaje sobre **todo** el catálogo del modelo

- `excluir = True` quita los proveedores que la entidad ya tenía en train (régimen **nuevos**: sustitutos)

- Lotes de 512 entidades: la matriz entidades × proveedores completa no cabe en memoria
"""),
(C, """
def rankear(ctx, puntaje, excluir, n=N_CAND, lote=512):
    filas = []
    for s in range(0, len(ctx.ev_idx), lote):
        b = ctx.ev_idx[s:s + lote]
        S = np.array(puntaje(b), dtype=np.float32)  # copia: el puntaje puede ser una vista de solo lectura
        if excluir:
            for j, u in enumerate(b):
                if u in ctx.vistos:
                    S[j, ctx.vistos[u]] = -np.inf
        top = np.argpartition(-S, n - 1, axis=1)[:, :n]
        sc = np.take_along_axis(S, top, 1); o = np.argsort(-sc, 1)
        top, sc = np.take_along_axis(top, o, 1), np.take_along_axis(sc, o, 1)
        for j, u in enumerate(b):
            ok = np.isfinite(sc[j])
            filas.append(pd.DataFrame({"entidad_key": ctx.ent_key[u], "proveedor_key": ctx.key_p[top[j][ok]],
                                       "score": sc[j][ok], "rank": np.arange(1, ok.sum() + 1)}))
    return pd.concat(filas, ignore_index=True)

def a_recs(cand):
    return cand.sort_values(["entidad_key", "rank"]).groupby("entidad_key").proveedor_key.apply(list).to_dict()
"""),
(M, """
### Contexto de un split

`contexto(split)` reúne lo que necesitan todos los modelos: índices, vistos en train, verdad de test por régimen y conjuntos de diversidad
"""),
(C, """
from types import SimpleNamespace

def contexto(split):
    tr  = pd.read_parquet(datos_dir / f"{split}_train")
    te  = pd.read_parquet(datos_dir / f"{split}_test")
    cat = pd.read_parquet(datos_dir / f"{split}_catalogo")
    ev  = pd.read_parquet(datos_dir / f"{split}_evaluables")
    ks = set(ev.entidad_key)
    te = te[te.entidad_key.isin(ks)]
    return SimpleNamespace(
        split=split, train=tr, test=te, catalogo=cat, evaluables=ev,
        n_u=int(tr.entidad_idx.max()) + 1, n_i=int(tr.proveedor_idx.max()) + 1,
        key_p=tr.drop_duplicates("proveedor_idx").set_index("proveedor_idx").proveedor_key.sort_index().to_numpy(),
        key_e=tr.drop_duplicates("entidad_idx").set_index("entidad_idx").entidad_key.sort_index().to_numpy(),
        vistos=tr.groupby("entidad_idx").proveedor_idx.apply(np.array).to_dict(),
        vistos_key=tr.groupby("entidad_key").proveedor_key.apply(set).to_dict(),
        ev_idx=ev.entidad_idx.to_numpy(), ent_key=dict(zip(ev.entidad_idx, ev.entidad_key)),
        verdad={"todos": te.groupby("entidad_key").proveedor_key.apply(set).to_dict(),
                "nuevos": te[te.nuevo == 1].groupby("entidad_key").proveedor_key.apply(set).to_dict()},
        cautivas=set(ev.loc[ev.cautiva == 1, "entidad_key"]),
        ganadores=set(cat.loc[cat.gano_train == 1, "proveedor_key"]),
        cola_larga=set(cat.loc[cat.cola_larga == 1, "proveedor_key"]),
        no_ganadores=set(cat.loc[cat.gano_train == 0, "proveedor_key"]),
        popularidad=dict(zip(cat.proveedor_key, cat.popularidad)),
        catalogo_keys=set(cat.proveedor_key))
"""),
(M, """
### Evaluación completa

`evaluar_modelo`: métricas de ranking y diversidad por régimen (`todos` / `nuevos`), grupo (`todas` / `cautivas`) y K

- `universo = "alcanzable"`: la verdad se restringe a proveedores que el modelo podía conocer, para separar el error del modelo del techo de *cold-start*
"""),
(C, """
def evaluar_modelo(ctx, modelo, cand, universos=("completo",), conocidos=None):
    filas = []
    for reg, df in cand.items():
        recs = a_recs(df)
        for uni in universos:
            for grupo, ents in [("todas", None), ("cautivas", ctx.cautivas)]:
                ver = {u: (r & conocidos if uni == "alcanzable" else r) for u, r in ctx.verdad[reg].items()
                       if ents is None or u in ents}
                for k in KS:
                    filas.append({"modelo": modelo, "regimen": reg, "universo": uni, "grupo": grupo, "k": k,
                                  **evaluar(recs, ver, k),
                                  **diversidad(recs, k, ctx.catalogo_keys, ctx.cola_larga, ctx.no_ganadores, ctx.popularidad)})
    return filas
"""),
(M, """
### Normalización para el híbrido

Min-max de los scores de **cada entidad**, sobre sus candidatos: lleva ALS y contenido a la misma escala [0, 1]
"""),
(C, """
def minmax_por_entidad(df, col, por="entidad_key"):
    g = df.groupby(por)[col]
    mn, mx = g.transform("min"), g.transform("max")
    return ((df[col] - mn) / (mx - mn).replace(0, np.nan)).fillna(1.0)
"""),
], "funciones.ipynb")

# ---------------------------------------------------------------- a_preparacion_split
nb([
(M, """
## Recomendación: Preparación y split temporal

- Se separan train y test **por año**, sin fuga: todo lo que usa un modelo sale de los años de train

- Se construye la señal implícita entidad × proveedor y se miden los límites del problema (*cold-start*, cola larga)
"""),
(M, """
### Preguntas

- **PQ3.1 - Sustitutos:** ¿se pueden identificar proveedores técnicamente afines para entidades cautivas (HHI ≥ 0.25) o procesos con postor único?

- **PQ3.2 - Cola larga:** con el 84.9% de proveedores con un solo cliente, ¿cuánto supera un híbrido (ALS + contenido con HNSW) el sesgo de popularidad del filtrado colaborativo?

- **Encuadre:** las recomendaciones son proveedores con **afinidad técnica** para un estudio de mercado previo a la convocatoria; no indican a quién se debe contratar
"""),
(M, "### Utilidades"),
(C, """
NOTEBOOK = "a_preparacion_split"
%run ../funciones.ipynb
%run funciones.ipynb
"""),
(C, """
spark = crear_spark(NOTEBOOK)
verificar_cluster(spark)
"""),
(M, """
---
### **1. Carga**

- `hechos`: una fila por award × proveedor × familia; se colapsa a award × proveedor sumando `monto_asignado`

- `participantes`: quién ofertó en cada proceso (base del contenido para proveedores que nunca ganaron)
"""),
(C, """
hechos = leer(final_dir, "hechos").where(F.col("anio").isin(anios))
part   = leer(final_dir, "participantes").where(F.col("anio").isin(anios))

hp = (hechos.groupBy("ocid", "award_id", "entidad_key", "proveedor_key", "anio")
            .agg(F.sum("monto_asignado").alias("monto"))).cache()
ep = (hp.groupBy("entidad_key", "proveedor_key", "anio")
        .agg(F.count("*").alias("n_adj"), F.sum("monto").alias("monto"))).cache()
print(f"award × proveedor: {hp.count():,} | entidad × proveedor × año: {ep.count():,}")
ep.groupBy("anio").agg(F.count("*").alias("pares"), F.countDistinct("entidad_key").alias("entidades"),
                       F.countDistinct("proveedor_key").alias("proveedores")).orderBy("anio").show()
"""),
(M, """
---
### **2. Winsorización del monto**

- El monto tiene cola pesada (obras de cientos de millones): sin recorte, un par dominaría la confianza de ALS

- El cuantil se calcula **solo con train** de cada split
"""),
(C, """
q_split = {}
for nombre, sp in SPLITS.items():
    tr = ep.where(F.col("anio").isin(sp["train"])).groupBy("entidad_key", "proveedor_key").agg(F.sum("monto").alias("m"))
    q_split[nombre] = tr.where("m > 0").select(F.log1p("m").alias("lm")).approxQuantile("lm", [Q_WINSOR], .001)[0]
    print(f"{nombre}: q{int(Q_WINSOR * 100)} de log1p(monto) = {q_split[nombre]:.2f} (S/{np.expm1(q_split[nombre]):,.0f})")
"""),
(C, """
lm = ep.where(F.col("anio").isin(SPLITS["final"]["train"]) & (F.col("monto") > 0)).select(F.log1p("monto").alias("lm")).toPandas()
fig, ax = plt.subplots(1, 2, figsize=(11, 3.2))
ax[0].hist(lm.lm, bins=60, color="tab:blue", alpha=.8)
ax[0].axvline(q_split["final"], color="red", ls="--", label=f"q{int(Q_WINSOR * 100)}")
ax[0].set(title="log1p(monto) por par, train final", xlabel="log1p(S/)"); ax[0].legend()
n = ep.where(F.col("anio").isin(SPLITS["final"]["train"])).groupBy("entidad_key", "proveedor_key").agg(F.sum("n_adj").alias("n")).groupBy("n").count().toPandas().sort_values("n")
ax[1].loglog(n.n, n["count"], "o", ms=3)
ax[1].set(title="adjudicaciones por par (log-log)", xlabel="n_adj", ylabel="pares")
mostrar_fig("senal_distribucion")
"""),
(M, """
---
### **3. Split temporal**

Para cada split:

- **train**: pares entidad × proveedor de los años de train, con `n_adj`, `monto`, `r_frec` (β = 0) y `r_mix` (β = 1)

- **índices enteros** (`entidad_idx`, `proveedor_idx`) ajustados **solo con train**: el orden del `StringIndexer` no ve el año de test

- **test**: pares del año de test, con `nuevo = 1` si el par no existía en train (sustituto real)
"""),
(C, """
from pyspark.ml.feature import StringIndexer

def construir_split(nombre, sp):
    q = q_split[nombre]
    tr = (ep.where(F.col("anio").isin(sp["train"]))
            .groupBy("entidad_key", "proveedor_key").agg(F.sum("n_adj").alias("n_adj"), F.sum("monto").alias("monto"))
            .withColumn("r_frec", senal(F.col("n_adj"), F.col("monto"), q, 0))
            .withColumn("r_mix",  senal(F.col("n_adj"), F.col("monto"), q, 1)))
    for k, i in [("entidad_key", "entidad_idx"), ("proveedor_key", "proveedor_idx")]:
        tr = StringIndexer(inputCol=k, outputCol=i).fit(tr).transform(tr).withColumn(i, F.col(i).cast("int"))
    te = (ep.where(F.col("anio").isin(sp["test"]))
            .groupBy("entidad_key", "proveedor_key").agg(F.sum("n_adj").alias("n_adj"), F.sum("monto").alias("monto"))
            .join(tr.select("entidad_key", "proveedor_key").withColumn("visto", F.lit(1)), ["entidad_key", "proveedor_key"], "left")
            .withColumn("nuevo", F.col("visto").isNull().cast("int")).drop("visto"))
    return tr.cache(), te.cache()

split = {n: construir_split(n, sp) for n, sp in SPLITS.items()}
for n, (tr, te) in split.items():
    print(f"{n}: train {tr.count():,} pares | test {te.count():,} pares, {te.where('nuevo = 1').count():,} nuevos")
"""),
(M, """
---
### **4. Límites del problema**

#### a. Cold-start

Un modelo solo puede recomendar a quien conoce:

- **ALS** conoce a los proveedores que **ganaron** en train

- **Contenido** conoce además a los que solo **ofertaron** en train (tienen descripciones de procesos)

- Un proveedor que aparece por primera vez en test es inalcanzable para todos: fija el **techo** del recall
"""),
(C, """
def limites(nombre, sp, tr, te):
    ent_tr = tr.select("entidad_key").distinct().withColumn("ent_train", F.lit(1))
    gano   = tr.select("proveedor_key").distinct().withColumn("gano_train", F.lit(1))
    oferto = (part.where(F.col("anio").isin(sp["train"])).select("proveedor_key").distinct()
                  .unionByName(tr.select("proveedor_key")).distinct().withColumn("oferto_train", F.lit(1)))
    t = (te.join(ent_tr, "entidad_key", "left").join(gano, "proveedor_key", "left").join(oferto, "proveedor_key", "left")
           .fillna(0, ["ent_train", "gano_train", "oferto_train"]))
    filas = []
    for sub, d in [("todos", t), ("nuevos", t.where("nuevo = 1"))]:
        r = d.agg(F.count("*").alias("pares"), F.avg("ent_train").alias("pct_entidad_conocida"),
                  F.avg("gano_train").alias("pct_alcanzable_als"), F.avg("oferto_train").alias("pct_alcanzable_contenido")).first().asDict()
        filas.append({"split": nombre, "pares_test": sub, **r})
    return filas, oferto

lim, oferentes_train = [], {}
for n, sp in SPLITS.items():
    f, oferentes_train[n] = limites(n, sp, *split[n]); lim += f
limites_df = pd.DataFrame(lim).round(3)
limites_df
"""),
(C, """
fig, ax = plt.subplots(figsize=(9, 3.2))
d = limites_df.set_index(["split", "pares_test"])[["pct_entidad_conocida", "pct_alcanzable_als", "pct_alcanzable_contenido"]]
d.plot.bar(ax=ax, rot=0)
ax.set(title="Pares de test alcanzables por cada familia de modelos", ylabel="proporción", ylim=(0, 1))
mostrar_fig("cold_start")
"""),
(M, """
#### b. Cola larga y popularidad

- `popularidad`: entidades clientes del proveedor en train

- `cola_larga = 1` si tiene **un solo** cliente en train
"""),
(C, """
catalogo = {}
for n, (tr, te) in split.items():
    catalogo[n] = (oferentes_train[n].select("proveedor_key")
        .join(tr.groupBy("proveedor_key", "proveedor_idx").agg(F.countDistinct("entidad_key").alias("popularidad"),
                                                                  F.sum("n_adj").alias("n_adj_train")), "proveedor_key", "left")
        .fillna(0, ["popularidad", "n_adj_train"])
        .withColumn("gano_train", (F.col("popularidad") > 0).cast("int"))
        .withColumn("cola_larga", (F.col("popularidad") == 1).cast("int"))).cache()

cola = pd.DataFrame([{"split": n, **c.agg(F.count("*").alias("catalogo"), F.sum("gano_train").alias("ganadores_train"),
                                          F.sum("cola_larga").alias("cola_larga")).first().asDict()} for n, c in catalogo.items()])
cola["pct_cola_larga_ganadores"] = (cola.cola_larga / cola.ganadores_train).round(3)
cola
"""),
(M, """
#### c. Sesgo de popularidad en test

¿Los pares nuevos de test van a proveedores populares o a la cola larga?
"""),
(C, """
sesgo = []
for n, (tr, te) in split.items():
    t = te.join(catalogo[n].select("proveedor_key", "popularidad", "cola_larga"), "proveedor_key", "left").fillna(0, ["popularidad", "cola_larga"])
    for sub, d in [("todos", t), ("nuevos", t.where("nuevo = 1"))]:
        r = d.agg(F.avg("cola_larga").alias("pct_a_cola_larga"), F.expr("percentile_approx(popularidad, 0.5)").alias("popularidad_mediana"),
                  F.avg((F.col("popularidad") == 0).cast("int")).alias("pct_a_no_ganadores")).first().asDict()
        sesgo.append({"split": n, "pares_test": sub, **r})
sesgo = pd.DataFrame(sesgo).round(3)
sesgo
"""),
(M, """
---
### **5. Entidades evaluables**

- Una entidad se evalúa si es conocida en train y tiene al menos un par en test

- Se guarda también el subconjunto de **cautivas** (HHI ≥ `UMBRAL_HHI` en train) para PQ3.1
"""),
(C, """
evaluables = {}
for n, (tr, te) in split.items():
    w = Window.partitionBy("entidad_key")
    hhi = (tr.where("monto > 0").withColumn("s", F.col("monto") / F.sum("monto").over(w))
             .groupBy("entidad_key").agg(F.sum(F.col("s") ** 2).alias("hhi_train")))
    evaluables[n] = (te.select("entidad_key").distinct()
        .join(tr.select("entidad_key", "entidad_idx").distinct(), "entidad_key")
        .join(hhi, "entidad_key", "left").fillna(0, ["hhi_train"])
        .withColumn("cautiva", (F.col("hhi_train") >= UMBRAL_HHI).cast("int"))
        .join(te.groupBy("entidad_key").agg(F.count("*").alias("relevantes"), F.sum("nuevo").alias("relevantes_nuevos")), "entidad_key")).cache()

entidades_eval = pd.DataFrame([{"split": n, **e.agg(F.count("*").alias("entidades"), F.sum("cautiva").alias("cautivas"),
                                                    F.expr("percentile_approx(relevantes, 0.5)").alias("relevantes_mediana"),
                                                    F.sum((F.col("relevantes_nuevos") > 0).cast("int")).alias("con_relevantes_nuevos")).first().asDict()}
                               for n, e in evaluables.items()])
entidades_eval
"""),
(M, """
---
### **6. Escritura de datos**

`temp/datos/<split>_<tabla>`: lo que leen `b_baseline_als`, `c_contenido_ann` y `d_hibrido_evaluacion`

| Tabla | Grano | Columnas |
|---|---|---|
| `train` | entidad × proveedor | `entidad_key`, `proveedor_key`, `entidad_idx`, `proveedor_idx`, `n_adj`, `monto`, `r_frec`, `r_mix` |
| `test` | entidad × proveedor | `entidad_key`, `proveedor_key`, `n_adj`, `monto`, `nuevo` |
| `catalogo` | proveedor | `proveedor_key`, `proveedor_idx`, `popularidad`, `gano_train`, `cola_larga` |
| `evaluables` | entidad | `entidad_key`, `entidad_idx`, `hhi_train`, `cautiva`, `relevantes`, `relevantes_nuevos` |
"""),
(C, """
for n in SPLITS:
    tr, te = split[n]
    for nombre, df in [("train", tr), ("test", te), ("catalogo", catalogo[n]), ("evaluables", evaluables[n])]:
        df.write.mode("overwrite").parquet(str(datos_dir / f"{n}_{nombre}"))

config = leer_config()
config.update(splits=SPLITS, q_winsor=Q_WINSOR, q_log_monto=q_split, umbral_hhi=UMBRAL_HHI, ks=KS)
guardar_config(config)
"""),
(M, """
#### a. Verificación

- Ningún par de train tiene año de test

- Índices enteros contiguos desde 0

- Las llaves de test y train no se pisan
"""),
(C, """
for n, sp in SPLITS.items():
    tr = pd.read_parquet(datos_dir / f"{n}_train")
    te = pd.read_parquet(datos_dir / f"{n}_test")
    assert not tr.duplicated(["entidad_key", "proveedor_key"]).any(), n
    assert tr.entidad_idx.min() == 0 and tr.entidad_idx.max() == tr.entidad_key.nunique() - 1, n
    assert tr.proveedor_idx.min() == 0 and tr.proveedor_idx.max() == tr.proveedor_key.nunique() - 1, n
    vistos = set(zip(tr.entidad_key, tr.proveedor_key))
    assert (te.nuevo == [int(p not in vistos) for p in zip(te.entidad_key, te.proveedor_key)]).all(), n
    print(f"{n}: OK | train {len(tr):,} | test {len(te):,} ({te.nuevo.mean():.1%} nuevos)")
"""),
(M, "### **7. Escritura de resultados**"),
(C, """
escritos = guardar_tablas({"limites_cold_start": limites_df, "cola_larga": cola, "sesgo_popularidad_test": sesgo,
                           "entidades_evaluables": entidades_eval})
"""),
(M, "#### a. Verificación"),
(C, "verificar_salidas(escritos)"),
(M, """
---
### **8. Cerrar sesión**
"""),
(C, "spark.stop()"),
], "a_preparacion_split.ipynb")
print("ok")
