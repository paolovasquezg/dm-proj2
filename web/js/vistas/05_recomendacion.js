import { datos, encabezado, puntos, caja, chips, cifras, graficar, barra, barraH, puntosXY, num, pct, C, $, opciones } from "../comun.js";

const D = "05_recomendacion";
const METRICAS = [["precision@10", "precisión"], ["recall@10", "recall"], ["ndcg@10", "NDCG"], ["hit@10", "hit"], ["cobertura", "cobertura"]];

export const diapos = [
  {
    etapa: "4 · Recomendación (PQ3)",
    titulo: "Híbrido y ALS en vivo",
    async render(el) {
      el.innerHTML = encabezado("¿Qué Proveedores le Corresponden a una Entidad?",
        "Protocolo temporal: se entrena con 2023 (validación) o 2023–2024 (test) y se evalúa con las relaciones nuevas del año siguiente. Ajusta el híbrido y los factores de ALS")
        + `<div class="fila"><div>
            <h2>Peso del híbrido</h2>
            <div class="controles"><label>w (peso de ALS) <input type="range" id="c-w" min="0" max="10" value="7"><output id="o-w" for="c-w"></output></label></div>
            <p class="nota">puntaje = w · ALS + (1 − w) · contenido · validación 2024</p>
            ${caja("g-w", "NDCG@10 según w")}
          </div><div>
            <h2>Factores de ALS</h2>
            <div class="controles">
              <label>rank <select id="c-r">${opciones([32, 64, 128], 64)}</select></label>
              <label>reg <select id="c-reg">${opciones([0.1, 1, 10], 1)}</select></label>
              <label>alpha <select id="c-a">${opciones([10, 40, 100], 40)}</select></label>
            </div>
            ${caja("g-als", "Métricas de ALS con estos factores (validación 2024)")}
          </div></div><p class="lectura" id="lectura"></p>`;
      const [ph, ga] = await Promise.all([datos(`${D}/e_hibrido/peso_hibrido`), datos(`${D}/d_als/grilla_als`)]);
      const dibujar = () => {
        const w = +$("c-w").value / 10; $("o-w").textContent = w.toFixed(1);
        const sel = ph.find(r => Math.abs(r.w - w) < 1e-9);
        graficar("g-w", [puntosXY(ph.map(r => r.w), ph.map(r => r["ndcg@10"]), { name: "NDCG@10", hovertemplate: "w = %{x}: %{y:.3f}<extra></extra>" }),
          { type: "scatter", mode: "markers", x: [w], y: [sel["ndcg@10"]], marker: { size: 14, color: C.naranja }, name: "tu w", hoverinfo: "skip" }],
          { xaxis: { title: "w", dtick: .1 }, yaxis: { title: "NDCG@10" } });
        const r = +$("c-r").value, reg = +$("c-reg").value, a = +$("c-a").value;
        const g = ga.find(x => x.rank === r && Math.abs(x.reg - reg) < 1e-9 && x.alpha === a);
        graficar("g-als", [barra(METRICAS.map(m => m[1]), METRICAS.map(m => g[m[0]]), { hovertemplate: "%{x}: %{y:.3f}<extra></extra>" })], { yaxis: { range: [0, Math.max(.8, g.cobertura + .1)] } });
        const mejorW = ph.reduce((x, y) => (y["ndcg@10"] > x["ndcg@10"] ? y : x)), mejorG = ga.reduce((x, y) => (y["ndcg@10"] > x["ndcg@10"] ? y : x));
        $("lectura").innerHTML = `<b>Híbrido w = ${w.toFixed(1)}:</b> NDCG ${num(sel["ndcg@10"], 3)} (máximo ${num(mejorW["ndcg@10"], 3)} en w = ${mejorW.w}). `
          + `<b>ALS:</b> NDCG ${num(g["ndcg@10"], 3)} y cobertura ${pct(g.cobertura * 100)} en ${num(g.seg)} s; la mejor combinación es rank ${mejorG.rank}, reg ${mejorG.reg}, alpha ${mejorG.alpha}. `
          + "Solo ALS (w = 1) ordena mejor, pero el contenido amplía la cobertura: la mezcla gana a los dos.";
      };
      ["c-w", "c-r", "c-reg", "c-a"].forEach(id => $(id).addEventListener("input", dibujar));
      dibujar();
    },
  },
  {
    etapa: "4 · Recomendación (PQ3)",
    titulo: "Sustitutos y alternativas",
    async render(el) {
      el.innerHTML = encabezado("Sustitutos que Compiten de Verdad",
        "Un buen sustituto de un proveedor debería competir con él. Se valida contra la co-participación real, que el modelo no vio")
        + `<div id="c-cifras"></div><div class="fila">${caja("g-test", "NDCG@10 en test (2025) por modelo")}${caja("g-fam", "% de sustitutos que co-participan, por familia UNSPSC")}</div>
          <p class="lectura" id="lectura"></p>`;
      const [ct, sf, sr, alt, af] = await Promise.all(["e_hibrido/comparacion_test", "f_analisis/sustitutos_por_familia", "f_analisis/sustitutos_resumen",
        "f_analisis/pq1_alternativas", "f_analisis/afinidades_inusuales"].map(t => datos(`${D}/${t}`)));
      const S = Object.fromEntries(sr.map(r => [r.metodo, r.pct_coparticipan])), cau = alt.find(r => r.cautiva === "cautiva");
      const inu = af.find(r => r.grupo === "p ≤ 5%"), resto = af.find(r => r.grupo === "resto");
      $("c-cifras").innerHTML = cifras([[pct(S.als), "sustitutos ALS que compiten"], [pct(S.contenido), "sustitutos por contenido"], [pct(S["azar (misma familia)"]), "pares al azar del rubro"],
        [num(cau.alt_mercado_mediana), "alternativas de una cautiva en su mercado"]]);
      const t = [...ct].sort((a, b) => a["ndcg@10"] - b["ndcg@10"]);
      graficar("g-test", [barraH(t.map(r => r.modelo), t.map(r => r["ndcg@10"]), { marker: { color: t.map(r => r.modelo === "híbrido" ? C.azul : C.gris) } })]);
      graficar("g-fam", [barra(sf.map(r => r.familia), sf.map(r => r.als), { name: "ALS", marker: { color: C.azul } }),
        barra(sf.map(r => r.familia), sf.map(r => r.contenido), { name: "contenido", marker: { color: C.aqua } }),
        barra(sf.map(r => r.familia), sf.map(r => r["azar (misma familia)"]), { name: "azar", marker: { color: C.gris } })],
        { barmode: "group", xaxis: { type: "category", title: "familia UNSPSC" }, yaxis: { ticksuffix: "%" } });
      $("lectura").innerHTML = `<b>PQ3:</b> los sustitutos son competidores reales (${pct(S.als)}–${pct(S.contenido)} vs ${pct(S["azar (misma familia)"])} al azar). `
        + `<b>Afinidades inusuales</b> (5% de menor puntaje ALS): ${pct(inu.pct_consorcio)} consorcios vs ${pct(resto.pct_consorcio)} en el resto, casi siempre de una sola entidad: relaciones únicas, no irregulares. `
        + `<b>PQ1:</b> una entidad cautiva tiene una mediana de ${num(cau.alt_mercado_mediana)} proveedores en su rubro y región: no falta oferta.`;
    },
  },
];
