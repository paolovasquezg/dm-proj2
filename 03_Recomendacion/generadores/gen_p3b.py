import sys
sys.argv = sys.argv[:2]
exec(open(__file__.replace("gen_p3b.py", "gen_p3a.py"), encoding="utf-8").read().split("M, C = ")[0])
M, C = "markdown", "code"

nb([
(M, """
## Recomendación: Línea base y ALS

- **Línea base:** popularidad global y popularidad dentro de las familias UNSPSC de la entidad

- **ALS implícito** (Spark MLlib): factores latentes entidad × proveedor con confianza $c_{ui} = 1 + \\alpha r_{ui}$

- Hiperparámetros elegidos en el split **ajuste** (2023 → 2024); el split **final** (2023-2024 → 2025) se usa una sola vez

- Las conclusiones con cifras se **calculan** en celdas `display(Markdown(...))`: si se re-ejecuta y los números cambian, el texto cambia con ellos
"""),
(M, """
### Reenfoque de PQ3.2

`a_preparacion_split` mostró que en 2025 la mayoría de los pares son **nuevos**, y que la mayor parte de los pares nuevos va a proveedores que **ofertaron pero nunca ganaron** en train (no a la cola larga de ganadores). ALS solo conoce ganadores.

**PQ3.2 reformulada:** ¿cuánto del sesgo de popularidad del filtrado colaborativo se corrige al incorporar a los **oferentes que nunca ganaron**, y cuánto acierto se gana con ello?

- Este notebook mide el lado colaborativo: su acierto y su **% no ganadores = 0 por construcción**
"""),
(M, """
### Constantes

- `RANGO_RANK`, `RANGO_REG`, `RANGO_ALPHA`: grilla de ALS (factores, λ, α)
    - El rango pedido era [10, 50]; se extiende hasta 200 para **comprobar que el óptimo no quede en el borde** de la grilla

- `ALPHA_INICIAL`: α fijo en la primera etapa de la grilla

- `SEMILLAS`: semillas para medir cuánto cambia ALS con la inicialización
"""),
(C, """
RANGO_RANK = [10, 20, 30, 50, 70, 100, 150, 200]
RANGO_REG = [0.01, 0.1, 1.0]
RANGO_ALPHA = [1, 10, 40]
ALPHA_INICIAL = 10
SEMILLAS = [42, 7, 13, 21, 99]
"""),
(M, "### Utilidades"),
(C, """
NOTEBOOK = "b_baseline_als"
%run ../funciones.ipynb
%run funciones.ipynb
"""),
(C, """
spark = crear_spark(NOTEBOOK)
verificar_cluster(spark)
"""),
(C, """
from IPython.display import Markdown, display
lim = pd.read_parquet(Path.cwd() / "temp" / "a_preparacion_split" / "tablas" / "limites_cold_start").set_index(["split", "pares_test"])
ses = pd.read_parquet(Path.cwd() / "temp" / "a_preparacion_split" / "tablas" / "sesgo_popularidad_test").set_index(["split", "pares_test"])
l, s_ = lim.loc[("final", "nuevos")], ses.loc[("final", "nuevos")]
display(Markdown(
    f"- Pares nuevos en 2025: **{l.pares / lim.loc[('final', 'todos'), 'pares']:.0%}** del test\\n"
    f"- De ellos, **{s_.pct_a_cola_larga:.1%}** van a la cola larga de ganadores y **{s_.pct_a_no_ganadores:.1%}** a oferentes que nunca ganaron\\n"
    f"- Alcanzables por ALS: **{l.pct_alcanzable_als:.1%}**; por contenido: **{l.pct_alcanzable_contenido:.1%}**"))
"""),
(C, """
from scipy import sparse

ctx = {s: contexto(s) for s in SPLITS}
for s, c in ctx.items():
    print(f"{s}: {c.n_u:,} entidades × {c.n_i:,} proveedores en train | {len(c.ev_idx):,} entidades evaluables "
          f"| {len(c.cautivas):,} cautivas")
"""),
(M, """
---
### **1. Línea base**

#### a. Popularidad global

- Puntaje = n.º de entidades clientes del proveedor en train

- Recomienda lo mismo a todas las entidades: es el piso que un modelo personalizado debe superar
"""),
(C, """
def puntaje_global(c):
    pop = np.bincount(c.train.proveedor_idx, minlength=c.n_i).astype(np.float32)
    return lambda b: np.broadcast_to(pop, (len(b), c.n_i))
"""),
(M, """
#### b. Popularidad por familia

$$s(u, i) = \\sum_f w_{uf} \\cdot \\frac{e_{fi}}{\\sum_{j} e_{fj}}$$

- $w_{uf}$: fracción de los procesos de la entidad $u$ en la familia $f$ (train)

- $e_{fi}$: entidades a las que el proveedor $i$ adjudicó en la familia $f$ (train)

- **Cuota** del proveedor dentro de cada familia, no su conteo bruto: con el conteo, un generalista presente en muchas familias acumula puntaje en todas y la línea base termina copiando a la popularidad global

- Personaliza por **rubro**, sin factores latentes
"""),
(C, """
def matrices_familia(c, s):
    h = (leer(final_dir, "hechos").where(F.col("anio").isin(SPLITS[s]["train"]) & (F.col("familia") != "SIN"))
         .select("ocid", "entidad_key", "proveedor_key", "familia"))
    ef = h.groupBy("entidad_key", "familia").agg(F.countDistinct("ocid").alias("n")).toPandas()
    pf = h.groupBy("proveedor_key", "familia").agg(F.countDistinct("entidad_key").alias("n")).toPandas()
    fam = {f: j for j, f in enumerate(sorted(set(ef.familia) | set(pf.familia)))}
    e_idx = {k: i for i, k in enumerate(c.key_e)}; p_idx = {k: i for i, k in enumerate(c.key_p)}
    ef = ef[ef.entidad_key.isin(e_idx)].copy(); pf = pf[pf.proveedor_key.isin(p_idx)].copy()
    ef["w"] = ef.n / ef.groupby("entidad_key").n.transform("sum")
    pf["cuota"] = pf.n / pf.groupby("familia").n.transform("sum")
    W = sparse.csr_matrix((ef.w, (ef.entidad_key.map(e_idx), ef.familia.map(fam))), shape=(c.n_u, len(fam)))
    P = sparse.csr_matrix((pf.cuota, (pf.familia.map(fam), pf.proveedor_key.map(p_idx))), shape=(len(fam), c.n_i))
    return W, P

def puntaje_familia(W, P):
    return lambda b: (W[b] @ P).toarray()
"""),
(M, """
##### Comprobación de la fórmula

- Cada fila de $W$ suma 1 (pesos de la entidad) y cada fila de $P$ suma 1 (cuotas de la familia): el puntaje de una entidad suma 1 sobre todos los proveedores

- Ejemplo a mano: entidad con 3 procesos en la familia A y 1 en B; en A, $p_1$ tiene 3 clientes y $p_2$ 1; en B solo $p_2$ con 2

$$s(u, p_1) = 0.75 \\cdot 0.75 = 0.5625 \\qquad s(u, p_2) = 0.75 \\cdot 0.25 + 0.25 \\cdot 1 = 0.4375$$
"""),
(C, """
W_t = sparse.csr_matrix(np.array([[0.75, 0.25]])); P_t = sparse.csr_matrix(np.array([[0.75, 0.25], [0.0, 1.0]]))
assert np.allclose(puntaje_familia(W_t, P_t)(np.array([0])), [[0.5625, 0.4375]])

base, mat_fam = {}, {}
for s, c in ctx.items():
    W, P = mat_fam[s] = matrices_familia(c, s)
    assert np.allclose(np.asarray(W.sum(1)).ravel()[np.asarray(W.sum(1)).ravel() > 0], 1)
    assert np.allclose(np.asarray(P.sum(1)).ravel()[np.asarray(P.sum(1)).ravel() > 0], 1)
    for nombre, f in [("popularidad_global", puntaje_global(c)), ("popularidad_familia", puntaje_familia(W, P))]:
        base[(s, nombre)] = {reg: rankear(c, f, excluir=(reg == "nuevos"), n=N_CAND) for reg in ["todos", "nuevos"]}
print("fórmula OK | candidatos de línea base:", list(base))
"""),
(M, """
---
### **2. ALS implícito**

- Spark MLlib `ALS(implicitPrefs=True)`: preferencia $p_{ui} = 1$ si hubo adjudicación; confianza $c_{ui} = 1 + \\alpha r_{ui}$

$$\\min_{X,Y} \\sum_{u,i} c_{ui}(p_{ui} - x_u^\\top y_i)^2 + \\lambda\\Big(\\sum_u \\lVert x_u\\rVert^2 + \\sum_i \\lVert y_i\\rVert^2\\Big)$$

- Celdas vacías con $c = 1$: no adjudicar no prueba desinterés (el proveedor pudo no ofertar)

- Los factores se bajan al driver y el puntaje $x_u^\\top y_i$ se calcula en NumPy por lotes, sobre **todos** los proveedores
"""),
(C, """
ratings = {s: spark.read.parquet(str(datos_dir / f"{s}_train")).select("entidad_idx", "proveedor_idx", "r_frec", "r_mix").cache()
           for s in SPLITS}

def ajustar_als(s, rank, reg, alpha, col, seed=SEED):
    return entrenar_als(ratings[s], ctx[s], rank, reg, alpha, col, seed)

def candidatos_als(s, U, V, regimenes=("todos", "nuevos"), n=N_CAND):
    return {reg: rankear(ctx[s], lambda b: U[b] @ V.T, excluir=(reg == "nuevos"), n=n) for reg in regimenes}

def ndcg10(s, cand):
    r = pd.DataFrame(evaluar_modelo(ctx[s], "als", cand))
    q = r[(r.grupo == "todas") & (r.k == 10)].set_index("regimen")
    return q.loc["nuevos", "ndcg"], q.loc["todos", "ndcg"], q.loc["nuevos", "recall"]
"""),
(M, """
#### a. Grilla, etapa 1: factores × λ

- Con α = `ALPHA_INICIAL` y la señal de frecuencia (β = 0)

- Criterio: **NDCG@10 en pares nuevos** del split ajuste (la pregunta es por sustitutos)
"""),
(C, """
grilla = []
for rank in RANGO_RANK:
    for reg in RANGO_REG:
        U, V, seg = ajustar_als("ajuste", rank, reg, ALPHA_INICIAL, "r_frec")
        n_nue, n_tod, rec_nue = ndcg10("ajuste", candidatos_als("ajuste", U, V, n=50))
        grilla.append({"etapa": 1, "rank": rank, "reg": reg, "alpha": ALPHA_INICIAL, "senal": "r_frec",
                       "ndcg10_nuevos": n_nue, "ndcg10_todos": n_tod, "recall10_nuevos": rec_nue, "seg": seg})
grilla1 = pd.DataFrame(grilla)
grilla1.sort_values("ndcg10_nuevos", ascending=False).head(6).round(4)
"""),
(C, """
fig, ax = plt.subplots(1, 3, figsize=(15, 3.6))
for i, met in enumerate(["ndcg10_nuevos", "ndcg10_todos"]):
    t = grilla1.pivot(index="rank", columns="reg", values=met)
    ax[i].imshow(t, cmap="viridis", aspect="auto")
    ax[i].set(xticks=range(len(t.columns)), xticklabels=t.columns, yticks=range(len(t.index)), yticklabels=t.index,
              xlabel="λ", ylabel="factores", title=met.replace("10_", "@10 "))
    for (y, x), v in np.ndenumerate(t.to_numpy()):
        ax[i].text(x, y, f"{v:.3f}", ha="center", va="center", color="w", fontsize=8)
for reg, g in grilla1.groupby("reg"):
    ax[2].plot(g["rank"], g.ndcg10_nuevos, "o-", label=f"λ={reg}")
ax[2].set(title="NDCG@10 nuevos según factores", xlabel="factores"); ax[2].legend()
mostrar_fig("als_grilla_rank_reg")
"""),
(C, """
mejor1 = grilla1.sort_values("ndcg10_nuevos", ascending=False).iloc[0]
por_rank = grilla1.groupby("rank").ndcg10_nuevos.max()
borde = int(mejor1["rank"]) == max(RANGO_RANK)
display(Markdown(
    f"- NDCG@10 nuevos va de **{grilla1.ndcg10_nuevos.min():.3f}** a **{grilla1.ndcg10_nuevos.max():.3f}**; "
    f"mejor: **{int(mejor1['rank'])} factores, λ = {mejor1.reg}**\\n"
    f"- Mejor NDCG por n.º de factores: " + ", ".join(f"{r}: {v:.3f}" for r, v in por_rank.items()) + "\\n"
    + ("- ⚠ **El óptimo sigue en el borde de la grilla**: habría que probar más factores\\n" if borde else
       f"- **El óptimo está dentro de la grilla**: con {max(RANGO_RANK)} factores ya no mejora ({por_rank.iloc[-1]:.3f})\\n")
    + f"- λ = 1.0 es el peor en {int((grilla1.loc[grilla1.groupby('rank').ndcg10_nuevos.idxmin(), 'reg'] == 1.0).sum())} de {len(RANGO_RANK)} tamaños"))
"""),
(M, """
#### b. Grilla, etapa 2: α × señal

Con los mejores factores y λ de la etapa 1, se varían la confianza α y la señal (`r_frec`: solo frecuencia; `r_mix`: frecuencia + monto winsorizado)
"""),
(C, """
for alpha in RANGO_ALPHA:
    for col in ["r_frec", "r_mix"]:
        U, V, seg = ajustar_als("ajuste", int(mejor1["rank"]), float(mejor1.reg), alpha, col)
        n_nue, n_tod, rec_nue = ndcg10("ajuste", candidatos_als("ajuste", U, V, n=50))
        grilla.append({"etapa": 2, "rank": int(mejor1["rank"]), "reg": float(mejor1.reg), "alpha": alpha, "senal": col,
                       "ndcg10_nuevos": n_nue, "ndcg10_todos": n_tod, "recall10_nuevos": rec_nue, "seg": seg})
grilla = pd.DataFrame(grilla)
grilla2 = grilla[grilla.etapa == 2]
grilla2.round(4)
"""),
(C, """
fig, ax = plt.subplots(1, 2, figsize=(11, 3.2))
for i, met in enumerate(["ndcg10_nuevos", "ndcg10_todos"]):
    grilla2.pivot(index="alpha", columns="senal", values=met).plot.bar(ax=ax[i], rot=0)
    ax[i].set(title=met.replace("10_", "@10 "), xlabel="α")
mostrar_fig("als_grilla_alpha_senal")
"""),
(C, """
g2 = grilla2.set_index(["alpha", "senal"])
mejor2 = grilla2.sort_values("ndcg10_nuevos", ascending=False).iloc[0]
a_max = max(RANGO_ALPHA)
display(Markdown(
    f"- Mejor en nuevos: **α = {mejor2.alpha:g}, señal `{mejor2.senal}`** (NDCG@10 {mejor2.ndcg10_nuevos:.3f})\\n"
    f"- Con α = {a_max} y `r_frec`: NDCG@10 todos = {g2.loc[(a_max, 'r_frec'), 'ndcg10_todos']:.3f} vs. "
    f"{g2.loc[(mejor2.alpha, mejor2.senal), 'ndcg10_todos']:.3f} del elegido; en nuevos {g2.loc[(a_max, 'r_frec'), 'ndcg10_nuevos']:.3f}: "
    "más confianza refuerza las relaciones existentes más que los sustitutos\\n"
    f"- Monto (`r_mix`) vs. frecuencia (`r_frec`), promedio sobre α: todos "
    f"{grilla2.groupby('senal').ndcg10_todos.mean().diff().iloc[-1]:+.3f}, nuevos "
    f"{grilla2.groupby('senal').ndcg10_nuevos.mean().diff().iloc[-1]:+.3f}"))
"""),
(M, """
#### c. Estabilidad entre semillas

- ALS parte de factores aleatorios: la diferencia entre las dos mejores configuraciones debe ser mayor que la variación por semilla

- Se repiten las 2 mejores configuraciones con `SEMILLAS` en el split ajuste
"""),
(C, """
top2 = grilla.sort_values("ndcg10_nuevos", ascending=False).drop_duplicates(["rank", "reg", "alpha", "senal"]).head(2)
semillas = []
for _, r in top2.iterrows():
    for sd in SEMILLAS:
        U, V, _ = ajustar_als("ajuste", int(r["rank"]), float(r.reg), float(r.alpha), r.senal, seed=sd)
        n_nue, n_tod, _ = ndcg10("ajuste", candidatos_als("ajuste", U, V, n=50))
        semillas.append({"config": f"{int(r['rank'])}f λ={r.reg} α={r.alpha:g} {r.senal}", "rank": int(r["rank"]), "reg": float(r.reg),
                         "alpha": float(r.alpha), "senal": r.senal, "seed": sd, "ndcg10_nuevos": n_nue, "ndcg10_todos": n_tod})
semillas = pd.DataFrame(semillas)
estab = semillas.groupby("config", sort=False).ndcg10_nuevos.agg(["mean", "std", "min", "max"]).round(4)
estab
"""),
(C, """
m = estab["mean"].to_numpy(); sd = estab["std"].max()
separadas = abs(m[0] - m[1]) > 2 * sd
mejor = semillas.groupby(["rank", "reg", "alpha", "senal"]).ndcg10_nuevos.mean().idxmax()
ALS_PARAMS = {"rank": int(mejor[0]), "reg": float(mejor[1]), "alpha": float(mejor[2]), "senal": mejor[3]}
display(Markdown(
    f"- Desviación entre semillas: hasta **{sd:.4f}**; diferencia entre las dos mejores configuraciones: **{abs(m[0] - m[1]):.4f}**\\n"
    + ("- La diferencia supera 2σ: la elección **no es ruido de inicialización**\\n" if separadas else
       "- La diferencia **no supera 2σ**: ambas configuraciones son equivalentes; se elige la de mayor media entre semillas\\n")
    + f"- Configuración final: **{ALS_PARAMS['rank']} factores, λ = {ALS_PARAMS['reg']}, α = {ALS_PARAMS['alpha']:g}, señal `{ALS_PARAMS['senal']}`**"))
config = leer_config(); config["als"] = ALS_PARAMS; guardar_config(config)
"""),
(M, """
---
### **3. Evaluación en el hold-out 2025**

- ALS se reentrena con 2023-2024 y los parámetros elegidos en ajuste

- Se guardan también los candidatos del split ajuste con esos parámetros: el peso `w` del híbrido se calibra ahí

- ALS se ajusta con las 5 `SEMILLAS` en el split final: se reporta media ± desviación; los candidatos guardados son los de `SEED`
"""),
(C, """
cand_als = {}
for s in SPLITS:
    U, V, seg = ajustar_als(s, ALS_PARAMS["rank"], ALS_PARAMS["reg"], ALS_PARAMS["alpha"], ALS_PARAMS["senal"])
    cand_als[s] = candidatos_als(s, U, V)
    print(f"{s}: ALS en {seg} s")

c = ctx["final"]
res = []
for nombre in ["popularidad_global", "popularidad_familia"]:
    res += evaluar_modelo(c, nombre, base[("final", nombre)], universos=("completo", "alcanzable"), conocidos=c.ganadores)
res += evaluar_modelo(c, "als", cand_als["final"], universos=("completo", "alcanzable"), conocidos=c.ganadores)
res = pd.DataFrame(res)
cols = ["modelo", "precision", "recall", "ndcg", "map", "cobertura", "pct_cola_larga", "pct_no_ganadores", "popularidad_media"]
"""),
(C, """
sem_final = []
for sd in SEMILLAS:
    U, V, _ = ajustar_als("final", ALS_PARAMS["rank"], ALS_PARAMS["reg"], ALS_PARAMS["alpha"], ALS_PARAMS["senal"], seed=sd)
    r = pd.DataFrame(evaluar_modelo(c, "als", candidatos_als("final", U, V, n=50)))
    sem_final += r[r.grupo == "todas"].assign(seed=sd).to_dict("records")
sem_final = pd.DataFrame(sem_final)
var_semilla = sem_final.groupby(["regimen", "k"])[["ndcg", "recall", "map"]].agg(["mean", "std"]).round(4)
var_semilla
"""),
(M, """
#### a. Todas las entidades
"""),
(C, """
for reg in ["nuevos", "todos"]:
    for k in KS:
        print(f"régimen {reg}, K = {k}")
        display(res[(res.regimen == reg) & (res.grupo == "todas") & (res.universo == "completo") & (res.k == k)][cols].round(4))
"""),
(C, """
fig, ax = plt.subplots(1, 3, figsize=(14, 3.4))
q = res[(res.grupo == "todas") & (res.universo == "completo") & (res.k == 10)]
for i, met in enumerate(["ndcg", "recall", "cobertura"]):
    q.pivot(index="regimen", columns="modelo", values=met).plot.bar(ax=ax[i], rot=0, legend=(i == 0))
    ax[i].set(title=f"{met}@10 (2025)", xlabel="")
mostrar_fig("final_comparacion")
"""),
(M, """
#### b. Intervalos de confianza (bootstrap por entidad)

- NDCG@10 de cada modelo con IC 95%, y la **diferencia pareada** de ALS contra la mejor línea base
"""),
(C, """
recs_f = {(m, reg): a_recs(cd[reg]) for m, cd in [("popularidad_global", base[("final", "popularidad_global")]),
                                                  ("popularidad_familia", base[("final", "popularidad_familia")]),
                                                  ("als", cand_als["final"])] for reg in ["todos", "nuevos"]}
ic = []
for reg in ["nuevos", "todos"]:
    v = {m: por_entidad(recs_f[(m, reg)], c.verdad[reg], 10) for m in ["popularidad_global", "popularidad_familia", "als"]}
    mejor_base = max(["popularidad_global", "popularidad_familia"], key=lambda m: v[m].mean())
    for m in v:
        ic.append({"regimen": reg, "comparacion": m, **dict(zip(["media", "ic_inf", "ic_sup"], ic_bootstrap(v[m])))})
    ic.append({"regimen": reg, "comparacion": f"als − {mejor_base}", **dict(zip(["media", "ic_inf", "ic_sup"], ic_bootstrap(v["als"], v[mejor_base])))})
ic = pd.DataFrame(ic).round(4)
ic
"""),
(C, """
q = res[(res.grupo == "todas") & (res.universo == "completo") & (res.k == 10)].set_index(["regimen", "modelo"])
d = ic[ic.comparacion.str.startswith("als −")].set_index("regimen")
fam_vs_glob = {reg: q.loc[(reg, "popularidad_familia"), "ndcg"] - q.loc[(reg, "popularidad_global"), "ndcg"] for reg in ["nuevos", "todos"]}
display(Markdown("\\n".join(
    [f"- **{reg}:** ALS NDCG@10 = {q.loc[(reg, 'als'), 'ndcg']:.3f} "
     f"(± {var_semilla.loc[(reg, 10), ('ndcg', 'std')]:.4f} entre semillas) vs. mejor línea base "
     f"{max(q.loc[(reg, 'popularidad_global'), 'ndcg'], q.loc[(reg, 'popularidad_familia'), 'ndcg']):.3f}; "
     f"diferencia {d.loc[reg, 'media']:+.3f}, IC 95% [{d.loc[reg, 'ic_inf']:+.3f}, {d.loc[reg, 'ic_sup']:+.3f}]"
     + (" → **significativa**" if d.loc[reg, "ic_inf"] > 0 else " → no significativa") for reg in ["nuevos", "todos"]]
    + [f"- Popularidad por familia − global: nuevos {fam_vs_glob['nuevos']:+.3f}, todos {fam_vs_glob['todos']:+.3f}"
       + (" (el rubro personaliza bien relaciones existentes, pero al excluir a los proveedores ya vistos pierde a los grandes de su rubro)"
          if fam_vs_glob["todos"] > 0 >= fam_vs_glob["nuevos"] else ""),
       f"- **Sesgo de popularidad:** cobertura de ALS = {q.loc[('nuevos', 'als'), 'cobertura']:.2%} del catálogo; "
       f"popularidad media de lo recomendado = {q.loc[('nuevos', 'als'), 'popularidad_media']:.0f} clientes",
       f"- **% no ganadores = {q.loc[('nuevos', 'als'), 'pct_no_ganadores']:.0%}** en los tres modelos, por construcción"])))
"""),
(M, """
#### c. Techo de *cold-start*

Recall con la verdad completa vs. restringida a proveedores que ganaron en train (los únicos que estos modelos pueden recomendar)
"""),
(C, """
techo = (res[(res.grupo == "todas") & (res.k == 10)]
         .pivot_table(index=["modelo", "regimen"], columns="universo", values="recall").round(4))
t = techo.loc[("als", "nuevos")]
display(techo)
display(Markdown(
    f"- En pares nuevos, ALS recupera el **{t.alcanzable:.1%}** de lo que puede alcanzar, pero el **{t.completo:.1%}** del total\\n"
    f"- Una parte grande de la brecha es *cold-start*, no error del modelo: el contenido debe ampliar el **universo alcanzable**, no solo reordenar"))
"""),
(M, """
#### d. Entidades cautivas (PQ3.1)
"""),
(C, """
caut = res[(res.regimen == "nuevos") & (res.universo == "completo") & (res.k == 10)].pivot_table(
    index="modelo", columns="grupo", values=["ndcg", "recall"]).round(4)
display(caut)
a = caut.loc["als"]
display(Markdown(
    f"- En entidades cautivas, ALS encuentra sustitutos reales del año de test con NDCG@10 = **{a[('ndcg', 'cautivas')]:.3f}** "
    f"y recall@10 = **{a[('recall', 'cautivas')]:.3f}** (todas: {a[('ndcg', 'todas')]:.3f} y {a[('recall', 'todas')]:.3f})\\n"
    "- Los casos concretos (GR Loreto, postor único) se analizan en `e_analisis_sustitutos`"))
"""),
(M, """
---
### **4. Escritura de datos**

- `temp/datos/<split>_cand_als`: top-`N_CAND` de ALS por entidad y régimen (entrada del híbrido)

- `temp/datos/<split>_cand_<línea base>`: ídem para las líneas base
"""),
(C, """
def guardar_cand(cand, nombre):
    pd.concat([df.assign(regimen=reg) for reg, df in cand.items()]).to_parquet(datos_dir / nombre, index=False)

for s in SPLITS:
    guardar_cand(cand_als[s], f"{s}_cand_als")
    for nombre in ["popularidad_global", "popularidad_familia"]:
        guardar_cand(base[(s, nombre)], f"{s}_cand_{nombre}")
"""),
(M, """
#### a. Verificación

- Candidatos sin duplicados por entidad y régimen

- En régimen `nuevos` ningún candidato fue proveedor de la entidad en train
"""),
(C, """
for s in SPLITS:
    c = ctx[s]
    for nombre in ["als", "popularidad_global", "popularidad_familia"]:
        d = pd.read_parquet(datos_dir / f"{s}_cand_{nombre}")
        assert not d.duplicated(["regimen", "entidad_key", "proveedor_key"]).any(), (s, nombre)
        nue = d[d.regimen == "nuevos"]
        assert not any(p in c.vistos_key.get(u, ()) for u, p in zip(nue.entidad_key, nue.proveedor_key)), (s, nombre)
        assert d.groupby(["regimen", "entidad_key"]).size().max() <= N_CAND
    print(f"{s}: OK")
"""),
(M, "### **5. Escritura de resultados**"),
(C, """
escritos = guardar_tablas({"grilla_als": grilla, "semillas_ajuste": semillas, "semillas_final": sem_final,
                           "evaluacion_final": res, "ic_bootstrap": ic, "techo_cold_start": techo.reset_index(),
                           "parametros_als": pd.DataFrame([ALS_PARAMS])})
"""),
(M, "#### a. Verificación"),
(C, "verificar_salidas(escritos)"),
(M, """
---
### **6. Cerrar sesión**
"""),
(C, "spark.stop()"),
], "b_baseline_als.ipynb")
print("ok")
