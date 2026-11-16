import { datos, encabezado, puntos, caja, chips, graficar, barra, barraH, puntosXY, tabla, pestanas, num, pct, C, $, opciones } from "../comun.js";

const D = "04_clustering";
const ELEGIDO = { entidad: { ms: 5, q: 0.95, mcs: 10, hms: 1 }, proveedor: { ms: 5, q: 0.95, mcs: 100, hms: 5 } };

export const diapos = [
  {
    etapa: "3 · Clustering (PQ1)",
    titulo: "KMeans: elegir k",
    async render(el) {
      el.innerHTML = encabezado("¿Cuántas Tipologías Hay? · KMeans",
        "KMeans++ en Spark sobre las features estandarizadas y reducidas con PCA. Mueve k y observa la silueta: el máximo común a ambos sujetos es k = 4")
        + `<div class="controles">
            <label>Sujeto <select id="c-suj">${opciones(["proveedor", "entidad"], "proveedor")}</select></label>
            <label>k <input type="range" id="c-k" min="2" max="10" value="4"><output id="o-k" for="c-k"></output></label>
          </div>`
        + chips([["silueta", '<span id="k-sil"></span>'], ["WSSSE", '<span id="k-w"></span>'], ["k elegido", "4"]])
        + `<div class="fila">${caja("g-sil", "Silueta según k (más alto = grupos más separados)")}
            <div class="tarjeta" id="t-tip"></div></div><p class="lectura" id="lectura"></p>`;
      const [cur, tip] = await Promise.all([datos(`${D}/b_kmeans/curvas_k`), datos(`${D}/e_analisis/tipologias`)]);
      const dibujar = () => {
        const s = $("c-suj").value, k = +$("c-k").value; $("o-k").textContent = k;
        const c = cur.filter(r => r.sujeto === s), sel = c.find(r => r.k === k);
        $("k-sil").textContent = num(sel.silueta, 3); $("k-w").textContent = num(sel.wssse);
        graficar("g-sil", [puntosXY(c.map(r => r.k), c.map(r => r.silueta), { name: "silueta", hovertemplate: "k = %{x}: %{y:.3f}<extra></extra>" }),
          { type: "scatter", mode: "markers", x: [k], y: [sel.silueta], marker: { size: 14, color: C.naranja }, name: "tu k", hoverinfo: "skip" }],
          { xaxis: { title: "k", dtick: 1 }, yaxis: { title: "silueta" } });
        const t = tip.filter(r => r.sujeto === s);
        $("t-tip").innerHTML = `<h3>Tipologías con k = 4 (${s}s)</h3>` + tabla(t, [["tipologia", "Tipología"], ["pct_actores", "% actores", v => pct(v)], ["pct_monto", "% monto", v => pct(v)]]);
        const mejor = c.reduce((a, b) => (b.silueta > a.silueta ? b : a));
        $("lectura").innerHTML = `<b>k = ${k}:</b> silueta ${num(sel.silueta, 3)}. ` + (k === 4 ? "Es el máximo común a entidades y proveedores: <b>4 tipologías interpretables</b>."
          : `El máximo para ${s}s está en k = ${mejor.k}; k = 4 se elige porque es el único buen valor en ambos sujetos.`);
      };
      ["c-suj", "c-k"].forEach(id => $(id).addEventListener("input", dibujar));
      dibujar();
    },
  },
  {
    etapa: "3 · Clustering (PQ1)",
    titulo: "DBSCAN y HDBSCAN",
    async render(el) {
      el.innerHTML = encabezado("Densidad: ¿Hay Islas Separadas?",
        "DBSCAN y HDBSCAN buscan grupos densos y marcan el resto como ruido. Cambia los parámetros: o queda un grupo gigante, o casi todo es ruido")
        + `<div class="pestanas" id="tabs"></div><div class="controles" id="ctrl"></div>`
        + chips([["grupos", '<span id="k-n"></span>'], ["% ruido", '<span id="k-r"></span>'], ["silueta", '<span id="k-s"></span>']])
        + `<div class="fila">${caja("g-den", "", "", "")}<div>${puntos([
            "<b>eps</b> (DBSCAN): radio del vecindario, como cuantil de la distancia al k-ésimo vecino; <b>min_samples</b>: vecinos para ser núcleo.",
            "<b>min_cluster_size</b> (HDBSCAN): tamaño mínimo de un grupo; <b>leaf</b> da grupos más finos que <b>eom</b>.",
            "<b>Lectura:</b> la densidad de los actores es pareja; no hay islas, por eso KMeans (que no exige densidad) describe mejor.",
          ])}<p class="lectura" id="lectura"></p></div></div>`;
      const [gd, gh] = await Promise.all([datos(`${D}/c_densidad/grid_dbscan`), datos(`${D}/c_densidad/grid_hdbscan`)]);
      const titulo = (t) => ($("g-den").previousElementSibling.textContent = t);
      let metodo = "dbscan";
      const dibujar = () => {
        const s = $("c-suj").value, e = ELEGIDO[s];
        if (metodo === "dbscan") {
          const ms = +$("c-ms").value, q = +$("c-q").value;
          const fila = gd.find(r => r.sujeto === s && r.min_samples === ms && r.q_eps === q), serie = gd.filter(r => r.sujeto === s && r.min_samples === ms);
          $("k-n").textContent = fila.n_clusters; $("k-r").textContent = pct(fila.pct_ruido); $("k-s").textContent = fila.silueta == null ? "—" : num(fila.silueta, 3);
          titulo(`DBSCAN · ${s}s, min_samples = ${ms}: grupos y ruido según eps`);
          graficar("g-den", [barra(serie.map(r => `q ${r.q_eps} (eps ${num(r.eps, 2)})`), serie.map(r => r.pct_ruido), { name: "% ruido", marker: { color: serie.map(r => r.q_eps === q ? C.naranja : C.gris) } }),
            puntosXY(serie.map(r => `q ${r.q_eps} (eps ${num(r.eps, 2)})`), serie.map(r => r.n_clusters), { name: "grupos", yaxis: "y2" })],
            { yaxis: { title: "% ruido", ticksuffix: "%" }, yaxis2: { title: "grupos", overlaying: "y", side: "right", showgrid: false } });
          $("lectura").innerHTML = `<b>Elegido:</b> min_samples = ${e.ms}, eps en el cuantil ${e.q}. ` + (fila.n_clusters <= 2 ? "Con estos valores queda <b>un grupo gigante</b> más ruido." : "Aparecen varios grupos, pero muy desiguales.");
        } else {
          const mcs = +$("c-mcs").value, ms = +$("c-hms").value, sel = $("c-sel").value;
          const fila = gh.find(r => r.sujeto === s && r.min_cluster_size === mcs && r.min_samples === ms && r.seleccion === sel), serie = gh.filter(r => r.sujeto === s && r.min_samples === ms && r.seleccion === sel);
          $("k-n").textContent = fila.n_clusters; $("k-r").textContent = pct(fila.pct_ruido); $("k-s").textContent = fila.silueta == null ? "—" : num(fila.silueta, 3);
          titulo(`HDBSCAN · ${s}s, min_samples = ${ms}, ${sel}: ruido según min_cluster_size`);
          graficar("g-den", [barra(serie.map(r => String(r.min_cluster_size)), serie.map(r => r.pct_ruido), { name: "% ruido", marker: { color: serie.map(r => r.min_cluster_size === mcs ? C.naranja : C.gris) } }),
            puntosXY(serie.map(r => String(r.min_cluster_size)), serie.map(r => r.n_clusters), { name: "grupos", yaxis: "y2" })],
            { xaxis: { title: "min_cluster_size", type: "category" }, yaxis: { title: "% ruido", ticksuffix: "%" }, yaxis2: { title: "grupos", overlaying: "y", side: "right", showgrid: false } });
          $("lectura").innerHTML = `<b>Elegido:</b> min_cluster_size = ${e.mcs}, min_samples = ${e.hms}, eom. Con densidad pareja, HDBSCAN deja <b>19–27% de ruido</b> incluso en su mejor configuración.`;
        }
      };
      const controles = () => {
        const s = $("c-suj")?.value || "proveedor", e = ELEGIDO[s];
        $("ctrl").innerHTML = `<label>Sujeto <select id="c-suj">${opciones(["proveedor", "entidad"], s)}</select></label>` + (metodo === "dbscan"
          ? `<label>min_samples <select id="c-ms">${opciones([5, 10, 20], e.ms)}</select></label><label>cuantil de eps <select id="c-q">${opciones([0.8, 0.85, 0.9, 0.95, 0.98], e.q)}</select></label>`
          : `<label>min_cluster_size <select id="c-mcs">${opciones([10, 25, 50, 100], e.mcs)}</select></label><label>min_samples <select id="c-hms">${opciones([1, 5, 10], e.hms)}</select></label><label>selección <select id="c-sel">${opciones(["eom", "leaf"], "eom")}</select></label>`);
        $("ctrl").querySelectorAll("select").forEach(x => x.addEventListener("change", x.id === "c-suj" ? () => { controles(); } : dibujar));
        dibujar();
      };
      pestanas($("tabs"), [{ id: "dbscan", texto: "DBSCAN" }, { id: "hdbscan", texto: "HDBSCAN" }], id => { metodo = id; controles(); });
    },
  },
  {
    etapa: "3 · Clustering (PQ1)",
    titulo: "Cautividad (PQ1)",
    async render(el) {
      el.innerHTML = encabezado("¿Quiénes Son Cautivas y de Quién Dependen?",
        "Una entidad es cautiva si concentra su gasto en pocos proveedores: HHI = Σ (cuota de cada proveedor)². Elige el umbral")
        + `<div class="pestanas" id="tabs"></div>`
        + chips([["entidades cautivas", '<span id="k-n"></span>'], ["% de entidades", '<span id="k-p"></span>'], ["mediana de postor único", '<span id="k-pu"></span>']])
        + `<div class="fila">${caja("g-tip", "% de cautivas por tipología de entidad (HHI ≥ 0.25)")}${caja("g-at", "Tipología del proveedor principal de las cautivas")}</div>
          <p class="lectura">La cautividad es de <b>entidades chicas y de obras</b>, y depende de proveedores <b>esporádicos</b> (< 3 procesos; 89% consorcios de un solo proceso), no de grandes proveedores recurrentes.</p>`;
      const [um, ct, at] = await Promise.all([datos(`${D}/e_analisis/cautivas_umbral`), datos(`${D}/e_analisis/cautivas_por_tipologia`), datos(`${D}/e_analisis/atienden_cautivas`)]);
      pestanas($("tabs"), um.map(r => ({ id: String(r.umbral_hhi), texto: `HHI ≥ ${r.umbral_hhi}` })), id => {
        const r = um.find(x => String(x.umbral_hhi) === id);
        $("k-n").textContent = num(r.entidades); $("k-p").textContent = pct(r.pct_entidades); $("k-pu").textContent = pct(r.postor_unico_med * 100, 0);
      }, "0.25");
      const c = [...ct].sort((a, b) => a.pct_cautivas - b.pct_cautivas);
      graficar("g-tip", [barraH(c.map(r => r.tipologia), c.map(r => r.pct_cautivas), { marker: { color: c.map(r => r.pct_cautivas > 40 ? C.naranja : C.azul) } })], { xaxis: { ticksuffix: "%" } });
      const a = [...at].sort((x, y) => x.pct - y.pct);
      graficar("g-at", [barraH(a.map(r => r.tipologia_proveedor), a.map(r => r.pct), { marker: { color: a.map(r => r.pct > 50 ? C.naranja : C.gris) } })], { xaxis: { ticksuffix: "%" } });
    },
  },
];
