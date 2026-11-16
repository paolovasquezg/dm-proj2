import { datos, encabezado, puntos, caja, chips, formula, graficar, barraH, heatmap, tabla, pestanas, num, C } from "../comun.js";

const D = "09_analisis";

export const diapos = [
  {
    etapa: "8 · Análisis",
    titulo: "¿Convergen los resultados?",
    async render(el) {
      el.innerHTML = encabezado("¿Coinciden Clústeres, Comunidades y Embeddings?",
        "NMI y ARI entre las particiones de proveedores de las Partes II, V y VI, comparando solo los proveedores que tienen ambas etiquetas")
        + `<div class="pestanas" id="tabs"></div><div class="fila" style="grid-template-columns: 3fr 2fr">${caja("g-conv", "", "", "alto")}<div>${puntos([
            "<b>Grafos convergen entre sí:</b> Louvain–LPA 0.81, Louvain–BigCLAM 0.72.",
            "<b>Comunidades y embeddings convergen</b> (Louvain–grupos latentes 0.53): las 41 comunidades se anidan en 6 mercados.",
            "<b>Lo común es el rubro:</b> NMI con el segmento 0.37–0.65 vs 0.12–0.27 con la región.",
            "<b>Los clústeres de la Parte II no convergen con nada</b> (≤ 0.11): describen comportamiento, no con quién se compite. Son complementarios.",
          ])}</div></div>`;
      const cv = await datos(`${D}/c_insights/convergencia`);
      const nombres = [...new Set(cv.flatMap(r => [r.a, r.b]))];
      pestanas(document.getElementById("tabs"), [{ id: "nmi", texto: "NMI" }, { id: "ari", texto: "ARI" }], m => {
        const z = nombres.map(a => nombres.map(b => (a === b ? 1 : (cv.find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a)) || {})[m])));
        document.getElementById("g-conv").previousElementSibling.textContent = `${m.toUpperCase()} entre particiones de proveedores`;
        graficar("g-conv", [heatmap(z, nombres, nombres, { zmin: m === "ari" ? -0.05 : 0 })], { margin: { l: 160, b: 120 }, xaxis: { tickangle: -35 }, yaxis: { autorange: "reversed" } });
      });
    },
  },
  {
    etapa: "8 · Análisis",
    titulo: "Qué aportó cada técnica",
    async render(el) {
      el.innerHTML = encabezado("Qué Técnicas Aportaron Más (y Cuáles Poco)",
        "2 = responde la pregunta, 1 = la confirma o complementa, 0 = no aporta. Ninguna técnica responde sola una pregunta")
        + `<div class="fila" style="grid-template-columns: 1fr 1fr">${caja("g-val", "Aporte de cada técnica a PQ1–PQ3", "", "alto")}${caja("g-des", "Cada técnica frente a su línea base", "azul: técnica · gris: línea base (azar o modelo trivial)", "alto")}</div>`;
      const [val, des] = await Promise.all([datos(`${D}/c_insights/valor_tecnicas`), datos(`${D}/a_recuento/desempeno`)]);
      const v = [...val].reverse(), et = v.map(r => `${r.tecnica} (${r.parte})`);
      graficar("g-val", [heatmap(v.map(r => [r.PQ1, r.PQ2, r.PQ3]), ["PQ1", "PQ2", "PQ3"], et, { colorscale: "Greens", zmin: 0, zmax: 2, showscale: false,
        text: v.map(r => [r.PQ1, r.PQ2, r.PQ3].map(x => ["—", "confirma", "responde"][x])), customdata: v.map(r => [r.aporte, r.aporte, r.aporte]),
        hovertemplate: "%{y} · %{x}: %{text}<br>%{customdata}<extra></extra>" })], { margin: { l: 190 } });
      const d = [...des].reverse(), e2 = d.map(r => `${r.tecnica} · ${r.metrica}`);
      graficar("g-des", [barraH(e2, d.map(r => r.valor), { name: "técnica", marker: { color: C.azul } }), barraH(e2, d.map(r => r.valor_ref), { name: "línea base", marker: { color: C.gris } })],
        { barmode: "group", xaxis: { range: [0, 1.1] }, margin: { l: 250 } });
    },
  },
  {
    etapa: "8 · Análisis",
    titulo: "Escala y volumen",
    async render(el) {
      el.innerHTML = encabezado("¿Qué Escaló y Qué Pasaría con Más Datos?",
        "Escala completa frente a submuestra o núcleo, y el costo proyectado con los exponentes medidos")
        + formula("t(f) = t_0 \\cdot f^{\\,b}", "t₀: tiempo en el núcleo · b: exponente · f: veces más aristas")
        + `<div class="pestanas" id="tabs"></div><div class="tarjeta" id="t-esc"></div>`;
      const [esc, pro] = await Promise.all([datos(`${D}/c_insights/escalabilidad`), datos(`${D}/c_insights/proyeccion`)]);
      pestanas(document.getElementById("tabs"), [{ id: "esc", texto: "Escala por técnica" }, { id: "pro", texto: "Proyección ×10 / ×100" }], id => {
        document.getElementById("t-esc").innerHTML = id === "esc"
          ? tabla(esc, [["tecnica", "Técnica"], ["corre_en", "Dónde"], ["escala", "Escala"], ["datos", "Datos"], ["se_gana", "Se gana"], ["se_pierde", "Se pierde"]], { destacar: f => f.escala !== "completa" })
          : tabla(pro, [["metodo", "Método"], ["exponente", "b"], ["×1", "núcleo"], ["×10", "×10"], ["×40", "grafo completo (×40)"], ["×100", "×100"]])
            + puntos(["<b>Lineales</b> (Louvain, LPA) siguen en minutos con 100×.", "<b>Girvan–Newman</b> se vuelve imposible; <b>Ward</b> pediría ~3 TB con 10× proveedores.",
                      "<b>Con más cobertura</b> (miembros de consorcios, dirección del proveedor) cambiaría la lectura de la cautividad."]);
      });
    },
  },
  {
    etapa: "8 · Análisis",
    titulo: "Respuestas por pregunta",
    async render(el) {
      el.innerHTML = encabezado("Respuestas a las Preguntas de Negocio", "Cada respuesta cruza varias técnicas")
        + `<div class="fila" style="--cols:3" id="c-resp"></div><p class="lectura" id="lectura"></p>`;
      const [resp, cons] = await Promise.all([datos(`${D}/b_hallazgos/respuestas`), datos(`${D}/c_insights/consorcios`)]);
      document.getElementById("c-resp").innerHTML = resp.map(r => `<div class="tarjeta"><span class="etiqueta">${r.pregunta}</span><p>${r.respuesta}</p><p class="nota">${r.evidencia}</p></div>`).join("");
      const c = Object.fromEntries(cons.map(r => [r.index, r]));
      document.getElementById("lectura").innerHTML = "<b>Verdad oculta:</b> el <b>consorcio de un solo proceso</b> aparece en tres partes: proveedor típico de las cautivas (II), "
        + `${num(c["más monto que centralidad (IV)"]["grupo señalado"], 0)}% de "más monto que centralidad" (IV) y ${num(c["afinidades inusuales (III)"]["grupo señalado"], 0)}% de las afinidades inusuales (III).`;
    },
  },
];
