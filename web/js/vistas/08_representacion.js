import { datos, encabezado, puntos, caja, chips, formula, graficar, barra, barraH, heatmap, tabla, pestanas, num, pct, C, PALETA, $, opciones } from "../comun.js";

const D = "08_representacion";
const MERCADO = (seg, reg, pctSeg) => seg.startsWith("81") ? "Consultoría de ingeniería" : seg.startsWith("50") || seg.startsWith("15") ? "Alimentos y combustibles"
  : reg.startsWith("CUSCO") ? "Sur andino" : seg.startsWith("72") && pctSeg >= 80 ? "Obras civiles" : seg.startsWith("72") ? "Servicios y construcción en Lima" : "Bienes diversos en Lima";

export const diapos = [
  {
    etapa: "7 · Representación (PQ2, PQ3)",
    titulo: "UMAP de Node2Vec (p, q, k)",
    async render(el) {
      el.innerHTML = encabezado("El Mapa del Mercado Aprendido por Node2Vec",
        "Cada proveedor es un vector de 32 dimensiones aprendido de paseos aleatorios por la co-participación; UMAP lo proyecta a 2D. Cambia p, q, el número de grupos y el color")
        + `<div class="controles">
            <label>p <select id="c-p">${opciones(["0.25", "1", "4"], "1")}</select></label>
            <label>q <select id="c-q">${opciones(["0.25", "1", "4"], "1")}</select></label>
            <label><input type="checkbox" id="c-svd"> usar SVD</label>
            <label>k grupos <select id="c-k">${opciones([4, 6, 8, 10, 12, 15, 20], 6)}</select></label>
            <label>Color <select id="c-col">${opciones(["grupo latente", "segmento UNSPSC", "región", "tipología (II)"], "grupo latente")}</select></label>
          </div>`
        + `<div class="fila" style="--cols:3; grid-template-columns: 2fr 1fr">${caja("g-umap", "", "5,000 proveedores al azar · pasa el mouse para ver el nombre", "alto")}
            <div>${formula("\\alpha_{pq}(t,x) = \\begin{cases} 1/p & x = t \\\\ 1 & x \\sim t \\\\ 1/q & \\text{si no} \\end{cases}", "sesgo del paseo")}
            ${puntos(["<b>q &gt; 1 (BFS):</b> paseo local → <b>rol</b>.", "<b>q &lt; 1 (DFS):</b> se aleja → <b>mercado</b> (homofilia).",
                      "<b>En este grafo p y q casi no cambian el mapa:</b> cada proceso une a todos sus postores (clique), así que vecindario y mercado coinciden."])}
            <p class="lectura" id="lectura"></p></div></div>`;
      const [u, pl] = await Promise.all([datos(`${D}/c_proyeccion/umap`), datos(`${D}/c_proyeccion/perfiles_latentes`)]);
      const nombres = Object.fromEntries(pl.map(r => [r.grupo, MERCADO(String(r.segmento), String(r.region), parseFloat(String(r.segmento).split("(")[1]) || 0)]));
      const top = (col) => Object.entries(u.nodos[col].reduce((a, v) => (a[v ?? "—"] = (a[v ?? "—"] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);
      const dibujar = () => {
        const svd = $("c-svd").checked; $("c-p").disabled = $("c-q").disabled = svd;
        const cfg = svd ? "svd" : `p${$("c-p").value}_q${$("c-q").value}`, k = +$("c-k").value, colSel = $("c-col").value, c = u.configs[cfg];
        let grupos, etiqueta;
        if (colSel === "grupo latente") { grupos = c[`k${k}`]; etiqueta = g => (k === 6 && cfg === "p1_q1" ? `${g}: ${nombres[g]}` : `grupo ${g}`); }
        else {
          const campo = { "segmento UNSPSC": "segmento", "región": "region", "tipología (II)": "tipologia" }[colSel], t = new Set(top(campo));
          grupos = u.nodos[campo].map(v => (t.has(v ?? "—") ? (v ?? "—") : "otros")); etiqueta = g => g;
        }
        const cats = [...new Set(grupos)].sort((a, b) => (a === "otros") - (b === "otros") || String(a).localeCompare(String(b), "es", { numeric: true }));
        $("g-umap").previousElementSibling.textContent = `UMAP · ${cfg === "svd" ? "SVD" : `Node2Vec p = ${$("c-p").value}, q = ${$("c-q").value}`} · color: ${colSel}${colSel === "grupo latente" ? ` (k = ${k})` : ""}`;
        graficar("g-umap", cats.map((g, i) => {
          const ix = grupos.map((v, j) => (v === g ? j : -1)).filter(j => j >= 0);
          return { type: "scatter", mode: "markers", name: String(etiqueta(g)), x: ix.map(j => c.x[j]), y: ix.map(j => c.y[j]), text: ix.map(j => u.nodos.nombre[j]),
            marker: { size: 4, opacity: .7, color: g === "otros" ? "#cbd5e1" : PALETA[i % PALETA.length] }, hovertemplate: "%{text}<extra></extra>" };
        }), { xaxis: { visible: false }, yaxis: { visible: false }, legend: { orientation: "v", x: 1.02, y: 1, xanchor: "left", yanchor: "top", font: { size: 9 } }, margin: { r: 170 } });
        $("lectura").innerHTML = cfg === "svd" ? "<b>SVD:</b> separa rubros, pero con brazos largos y sin rol (Spearman 0.50 vs 0.80)."
          : `<b>${cfg}:</b> los mismos mercados aparecen con cualquier p y q (solo rotados). Con k = 6 y p = q = 1 los grupos son los <b>6 mercados</b>: obras, consultoría, sur andino, servicios en Lima, bienes diversos y alimentos.`;
      };
      ["c-p", "c-q", "c-svd", "c-k", "c-col"].forEach(id => $(id).addEventListener("change", dibujar));
      dibujar();
    },
  },
  {
    etapa: "7 · Representación (PQ2, PQ3)",
    titulo: "Qué capturan p y q",
    async render(el) {
      el.innerHTML = encabezado("¿Qué Aprende Cada Configuración?",
        "Para 5,000 proveedores se miran sus 10 vecinos en el embedding: ¿son del mismo mercado o tienen la misma posición (grado)?")
        + `<div class="pestanas" id="tabs"></div><div class="fila">${caja("g-pq", "", "filas: p · columnas: q")}<div id="c-txt"></div></div>`;
      const pf = await datos(`${D}/b_node2vec/perfil_pq`);
      const P = ["0.25", "1", "4"], Q = ["0.25", "1", "4"], fila = Object.fromEntries(pf.map(r => [r.config, r]));
      pestanas($("tabs"), [{ id: "% misma región", texto: "Misma región" }, { id: "% misma familia", texto: "Misma familia" }, { id: "rol (Spearman grado)", texto: "Rol (grado)" }], m => {
        const z = P.map(p => Q.map(q => fila[`p${p}_q${q}`][m])), rol = m.startsWith("rol");
        $("g-pq").previousElementSibling.textContent = `${m} entre los 10 vecinos`;
        graficar("g-pq", [heatmap(z, Q.map(q => `q = ${q}`), P.map(p => `p = ${p}`), { zmin: rol ? .78 : Math.min(...z.flat()) - 1, zmax: rol ? .84 : Math.max(...z.flat()) + 1,
          text: z.map(f => f.map(v => num(v, rol ? 3 : 1))) })], { xaxis: { side: "bottom" } });
        $("c-txt").innerHTML = chips([["SVD", num(fila.svd[m], rol ? 2 : 1)], ["al azar", num(fila["al azar"][m], rol ? 2 : 1)]]) + puntos([
          "<b>Todas capturan mercado:</b> ~60% de vecinos de la misma región (13% al azar) y ~54% de la misma familia (6%).",
          "<b>Dirección de la teoría:</b> q = 0.25 sube la homofilia regional y q = 4 sube el rol.",
          "<b>Efecto chico:</b> ~3 puntos de región y 0.03 de rol entre extremos: del orden del ruido entre semillas."]);
      }, "% misma región");
    },
  },
  {
    etapa: "7 · Representación (PQ2, PQ3)",
    titulo: "Predicción de enlaces",
    async render(el) {
      el.innerHTML = encabezado("¿Quiénes Empezarán a Competir?",
        "Embedding con el grafo 2023, clasificador entrenado con los pares nuevos de 2024 y evaluado con los de 2025 (sin fuga). Elige cuántos pares mirar")
        + `<div class="controles"><label>Top-N pares <input type="range" id="c-n" min="5" max="30" step="5" value="10"><output id="o-n" for="c-n"></output></label></div>`
        + `<div class="fila">${caja("g-mod", "PR-AUC en test 2025: embeddings vs heurísticas")}${caja("g-top", "% de los top-k candidatos que compitió en 2025", "línea: todos los candidatos (300 mil pares a 2 saltos)")}</div>
          <div class="tarjeta" id="t-pares"></div>`;
      const [res, pt, tp] = await Promise.all([datos(`${D}/d_enlaces/resultados`), datos(`${D}/d_enlaces/precision_top`), datos(`${D}/d_enlaces/top_pares`)]);
      const r = [...res].sort((a, b) => b.pr_auc - a.pr_auc).filter((x, i, a) => a.findIndex(y => y.modelo === x.modelo && y.config === x.config) === i).slice(0, 8).reverse();
      graficar("g-mod", [barraH(r.map(x => `${x.modelo} · ${x.config}${x.operador !== "—" ? " · " + x.operador : ""}`), r.map(x => x.pr_auc), {
        marker: { color: r.map(x => (x.modelo === "base" ? C.gris : C.azul)) } })], { xaxis: { range: [.4, .8] } });
      const p = pt.slice(0, -1), base = pt[pt.length - 1]["% aparece en 2025"];
      graficar("g-top", [barra(p.map(x => num(x.top)), p.map(x => x["% aparece en 2025"]), { marker: { color: C.aqua } }),
        { type: "scatter", mode: "lines", x: p.map(x => num(x.top)), y: p.map(() => base), line: { color: C.rojo, dash: "dot" }, name: "todos", hoverinfo: "skip" }],
        { xaxis: { type: "category", title: "top-k" }, yaxis: { ticksuffix: "%" } });
      const dibujar = () => {
        const n = +$("c-n").value; $("o-n").textContent = n;
        const filas = tp.slice(0, n).map(x => ({ ...x, par: `${x.nombre_a.slice(0, 32)} ↔ ${x.nombre_b.slice(0, 32)}`, fam: `${x.familia_a} / ${x.familia_b}`, reg: x.region_a === x.region_b ? x.region_a : `${x.region_a} / ${x.region_b}`, ok: x.aparece_2025 ? "sí" : "—" }));
        $("t-pares").innerHTML = `<h3>Los ${n} pares más probables que aún no competían (sustitutos potenciales, PQ3)</h3>`
          + tabla(filas, [["par", "Par de proveedores"], ["fam", "Familias"], ["reg", "Región"], ["probabilidad", "Prob.", v => num(v, 3)], ["ok", "¿Compitió en 2025?"]])
          + `<p class="nota">${num(filas.filter(x => x.aparece_2025).length)} de ${n} compitieron en 2025. Una afinidad estructural no implica que deban competir.</p>`;
      };
      $("c-n").addEventListener("input", dibujar); dibujar();
    },
  },
];
