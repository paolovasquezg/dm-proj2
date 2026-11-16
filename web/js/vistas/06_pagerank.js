import { datos, encabezado, puntos, caja, chips, formula, graficar, barra, barraH, num, pct, C, PALETA, $, opciones } from "../comun.js";

const D = "06_pagerank";
const DS = [0.5, 0.65, 0.75, 0.85, 0.9, 0.95, 0.99];

export const diapos = [
  {
    etapa: "5 · PageRank y HITS (PQ1)",
    titulo: "PageRank según el damping",
    async render(el) {
      el.innerHTML = encabezado("¿Quién Es Central en la Red de Compras?",
        "PageRank sobre el bipartito no dirigido entidad ↔ proveedor (peso = adjudicaciones). Mueve el damping d y mira cómo cambia el ranking")
        + `<div class="fila"><div>
            ${formula("r = d \\cdot M\\,r + \\frac{1-d}{N}", "PageRank con teletransporte")}
            <div class="controles">
              <label>Actor <select id="c-t">${opciones(["proveedor", "entidad"], "proveedor")}</select></label>
              <label>damping d <input type="range" id="c-d" min="0" max="6" value="3"><output id="o-d" for="c-d"></output></label>
            </div>
            ${chips([["Spearman vs d = 0.85", '<span id="k-sp"></span>'], ["top-20 igual que 0.85", '<span id="k-top"></span>'], ["iteraciones", '<span id="k-it"></span>'], ["cuota del top 1%", '<span id="k-cuota"></span>']])}
            ${puntos(["<b>d → 0:</b> el teletransporte domina y el ranking se aplana.", "<b>d → 1:</b> converge lento y se vuelve la fuerza (cuántas adjudicaciones).",
                      "<b>d = 0.85</b> está en la zona estable (0.75–0.90)."])}
          </div>${caja("g-top", "", "", "alto")}</div><p class="lectura" id="lectura"></p>`;
      const [pr, sens] = await Promise.all([datos(`${D}/b_pagerank/pagerank_damping_web`), datos(`${D}/b_pagerank/sensibilidad_damping`)]);
      const dibujar = () => {
        const t = $("c-t").value, d = DS[+$("c-d").value]; $("o-d").textContent = d;
        const top = pr.filter(r => r.tipo === t && r.d === d).sort((a, b) => a.posicion - b.posicion).slice(0, 15).reverse();
        const ref = new Set(pr.filter(r => r.tipo === t && r.d === 0.85 && r.posicion <= 15).map(r => r.clave));
        $("g-top").previousElementSibling.textContent = `Top 15 ${t === "proveedor" ? "proveedores" : "entidades"} con d = ${d}`;
        graficar("g-top", [barraH(top.map(r => r.nombre.slice(0, 42)), top.map(r => r.pr * 100), {
          marker: { color: top.map(r => (ref.has(r.clave) ? C.azul : C.naranja)) }, hovertemplate: "%{y}: %{x:.3f}%<extra></extra>" })],
          { xaxis: { title: "PageRank (%)" }, margin: { l: 280 } });
        const s = sens.find(r => r.tipo === t && r.d === d);
        $("k-sp").textContent = num(s.spearman_vs_085, 3); $("k-top").textContent = pct(s.top20_vs_085 * 100, 0);
        $("k-it").textContent = num(s.iteraciones); $("k-cuota").textContent = pct(s.cuota_top1pct * 100);
        const nuevos = top.filter(r => !ref.has(r.clave)).length;
        $("lectura").innerHTML = `<b>d = ${d}:</b> ${nuevos ? `${nuevos} del top 15 (naranja) no estaban con d = 0.85` : "mismo top 15 que con d = 0.85"}; Spearman ${num(s.spearman_vs_085, 3)} con el ranking de referencia. `
          + (t === "proveedor" ? "Arriba quedan los <b>grandes multicliente</b> (Grupo Santa Fe, Diagnóstica Peruana)." : "Arriba quedan las <b>grandes compradoras diversificadas</b> (EsSalud, OEFA, Ejército).");
      };
      ["c-t", "c-d"].forEach(id => $(id).addEventListener("input", dibujar));
      dibujar();
    },
  },
  {
    etapa: "5 · PageRank y HITS (PQ1)",
    titulo: "Centralidad vs monto",
    async render(el) {
      el.innerHTML = encabezado("Centralidad Frente a Monto",
        "Los 3,000 proveedores con más adjudicaciones. Arriba a la izquierda: muy centrales con poco monto. Abajo a la derecha: mucho monto con pocos clientes")
        + `<div class="controles"><label>Tipología <select id="c-tip"></select></label></div>`
        + `<div class="fila">${caja("g-sc", "Percentil de PageRank vs monto adjudicado", "un punto por proveedor; color = tipología de KMeans", "alto")}
            <div>${caja("g-con", "% de consorcios según centralidad vs monto")}<div id="c-cau"></div></div></div>`;
      const [cen, con, cau] = await Promise.all([datos(`${D}/d_analisis/centralidad`), datos(`${D}/d_analisis/contraste_monto`), datos(`${D}/d_analisis/cautividad`)]);
      const tips = [...new Set(cen.map(r => r.tipologia || "sin tipología"))];
      $("c-tip").innerHTML = opciones(["todas", ...tips], "todas");
      const col = Object.fromEntries(tips.map((t, i) => [t, PALETA[i % PALETA.length]]));
      const dibujar = () => {
        const f = $("c-tip").value, sel = f === "todas" ? tips : [f];
        graficar("g-sc", sel.map(t => {
          const d = cen.filter(r => (r.tipologia || "sin tipología") === t);
          return { type: "scatter", mode: "markers", name: t, x: d.map(r => r.monto), y: d.map(r => r.pct_pr * 100), text: d.map(r => r.nombre),
            marker: { size: 5, color: col[t], opacity: .65 }, hovertemplate: "%{text}<br>S/ %{x:,.0f} · percentil %{y:.1f}<extra></extra>" };
        }), { xaxis: { type: "log", title: "monto adjudicado (S/, log)" }, yaxis: { title: "percentil de PageRank" } });
      };
      $("c-tip").addEventListener("change", dibujar); dibujar();
      const c = [...con].reverse();
      graficar("g-con", [barraH(c.map(r => `${r.grupo} (${num(r.proveedores)})`), c.map(r => r.pct_consorcio), { marker: { color: c.map(r => (r.pct_consorcio > 60 ? C.naranja : C.azul)) } })],
        { xaxis: { ticksuffix: "%", range: [0, 100] } });
      const si = cau.find(r => r.cautiva === 1), no = cau.find(r => r.cautiva === 0);
      $("c-cau").innerHTML = puntos([`<b>Más monto que centralidad:</b> ${pct(con.find(r => r.grupo.startsWith("más monto")).pct_consorcio)} consorcios con una adjudicación grande a una sola entidad.`,
        `<b>Cautivas = periféricas (PQ1):</b> percentil mediano de PageRank ${num(si.pct_pr_med * 100, 0)} vs ${num(no.pct_pr_med * 100, 0)} de las no cautivas; ${num(si.grado_med)} proveedores vs ${num(no.grado_med)}.`,
        "<b>La cautividad es local:</b> no la producen los proveedores centrales."]);
    },
  },
];
