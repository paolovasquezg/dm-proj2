import { datos, encabezado, puntos, caja, cifras, proceso, chips, graficar, barra, barraH, tabla, num, pct, C } from "../comun.js";

const D = "02_datos";

export const diapos = [
  {
    etapa: "2 · Datos",
    titulo: "Volumen y artefactos",
    async render(el) {
      el.innerHTML = encabezado("Del JSON Anidado a Tablas y Grafos",
        "Los 36 archivos mensuales se aplanan en Spark a tablas por proceso; de ahí salen las features, las matrices y los dos grafos")
        + proceso([
          ["raw", "JSON OCDS mensual (3.9 GB)"], ["bronze", "Parquet anidado"], ["staging", "procesos, adjudicaciones, oferentes, ítems, contratos"],
          ["final", "grano entidad–proveedor–familia", true], ["artefactos", "features, matrices y grafos (150 MB)", true],
        ])
        + `<div class="fila">${caja("g-tablas", "Filas por tabla de staging", "oferentes: una fila por postor de cada proceso (13.5 por proceso)")}
            <div><div class="tarjeta" id="t-art"></div></div></div>`;
      const [st, art] = await Promise.all([datos(`${D}/a_entendimiento/conteos_staging`), datos(`${D}/c_uso/resumen_artefactos`)]);
      const s = st.filter(r => r.tabla !== "partes").sort((a, b) => a.filas - b.filas);
      graficar("g-tablas", [barraH(s.map(r => r.tabla), s.map(r => r.filas), {
        text: s.map(r => r.filas >= 1e6 ? `${num(r.filas / 1e6, 2)} M` : `${num(r.filas / 1e3)} mil`), textposition: "outside",
        hovertemplate: "%{y}: %{x:,} filas<extra></extra>" })], { xaxis: { title: "filas" }, margin: { l: 120 } });
      const v = Object.fromEntries(art.map(r => [r.medida, r.valor]));
      document.getElementById("t-art").innerHTML = "<h3>Artefactos para las técnicas</h3>" + tabla([
        { a: "Matriz entidad × proveedor", d: `${num(v["pares entidad × proveedor"])} pares`, p: pct(v["densidad entidad × proveedor"] * 100, 3) },
        { a: "Matriz entidad × familia", d: `${num(v["pares entidad × familia"])} pares`, p: pct(v["densidad entidad × familia"] * 100, 1) },
        { a: "Grafo bipartito", d: `${num(v["vértices bipartito"])} nodos`, p: `${num(v["aristas bipartito"])} aristas` },
        { a: "Grafo de co-participación", d: `${num(v["vértices co-participación"])} nodos`, p: `${num(v["aristas co-participación"])} aristas` },
      ], [["a", "Artefacto"], ["d", "Tamaño"], ["p", "Densidad / aristas"]])
        + puntos(["<b>Matrices muy dispersas:</b> una entidad le compra a pocos de los 86 mil proveedores.",
                  "<b>Consorcios</b> llegan como un solo actor: la fuente no publica sus miembros."]);
    },
  },
  {
    etapa: "2 · Datos",
    titulo: "Cola larga y competencia",
    async render(el) {
      el.innerHTML = encabezado("Una Cola Larga que Condiciona Todo",
        "La mayoría de proveedores aparece una sola vez; la competencia depende sobre todo del método de contratación")
        + `<div id="c-cifras"></div><div class="fila">${caja("g-grado", "Proveedores según cuántas entidades les compran", "escala log en ambos ejes")}
            ${caja("g-metodo", "% de procesos con un solo postor por método")}</div>`;
      const [bip, gr, met, mul, hhi] = await Promise.all(["b_exploracion/resumen_bipartito", "b_exploracion/grado_proveedores",
        "b_exploracion/metodo_competencia", "b_exploracion/multi_pertenencia", "b_exploracion/hhi_resumen"].map(t => datos(`${D}/${t}`)));
      document.getElementById("c-cifras").innerHTML = cifras([[pct(bip[0].pct_prov_grado1 * 100), "proveedores con una sola entidad"],
        [pct(hhi[0].pct_hhi_alto * 100), "entidades con HHI > 0.25"], [pct(mul[0].pct_multi_region), "proveedores en varias regiones"], [pct(mul[0].pct_multi_segmento), "en varios segmentos"]]);
      graficar("g-grado", [{ type: "scatter", mode: "markers", x: gr.map(r => r.grado), y: gr.map(r => r.count), marker: { color: C.azul, size: 6 },
        hovertemplate: "%{x} entidades: %{y:,} proveedores<extra></extra>" }], { xaxis: { type: "log", title: "entidades a las que vende" }, yaxis: { type: "log", title: "proveedores" } });
      const m = met.filter(r => r.procesos >= 1000).sort((a, b) => a.pct_postor_unico - b.pct_postor_unico);
      graficar("g-metodo", [barraH(m.map(r => r.metodo_detalle), m.map(r => r.pct_postor_unico), {
        marker: { color: m.map(r => r.pct_postor_unico > 50 ? C.naranja : C.azul) }, hovertemplate: "%{y}: %{x:.1f}% postor único<extra></extra>" })],
        { xaxis: { ticksuffix: "%", range: [0, 110] } });
    },
  },
];
