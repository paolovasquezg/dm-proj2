import { datos, encabezado, puntos, caja, chips, formula, graficar, barra, barraH, puntosXY, num, pct, C, CATEGORIA, $ } from "../comun.js";

const D = "07_comunidades";

export const diapos = [
  {
    etapa: "6 · Comunidades (PQ2)",
    titulo: "Louvain: resolución γ",
    async render(el) {
      el.innerHTML = encabezado("¿Qué Mercados Emergen de la Competencia?",
        "Louvain sobre el núcleo de co-participación (7,114 proveedores que compitieron en ≥ 20 procesos, sin los 61 postores masivos). La resolución γ controla el tamaño de las comunidades")
        + `<div class="fila"><div>
            ${formula("Q_\\gamma = \\sum_c \\left[ \\frac{e_c}{2m} - \\gamma \\left( \\frac{vol_c}{2m} \\right)^2 \\right]", "modularidad con resolución γ")}
            <div class="controles"><label>γ <input type="range" id="c-g" min="0" max="9" value="4"><output id="o-g" for="c-g"></output></label></div>
            ${chips([["comunidades", '<span id="k-c"></span>'], ["Q (γ = 1)", '<span id="k-q"></span>'], ["estabilidad", '<span id="k-e"></span>'], ["la mayor", '<span id="k-m"></span>']])}
            ${caja("g-curva", "Q y estabilidad entre semillas según γ")}
          </div>${caja("g-com", "", "color = categoría dominante (bienes, servicios, obras)", "alto")}</div><p class="lectura" id="lectura"></p>`;
      const [lg, gc] = await Promise.all([datos(`${D}/b_particion/louvain_gamma`), datos(`${D}/b_particion/gamma_comunidades`)]);
      const gs = lg.map(r => r.gamma);
      graficar("g-curva", [puntosXY(gs, lg.map(r => r.Q), { name: "Q" }), puntosXY(gs, lg.map(r => r.estabilidad), { name: "estabilidad", line: { color: C.aqua, width: 2 } })],
        { xaxis: { type: "log", title: "γ (log)", tickvals: gs }, yaxis: { range: [.6, 1] } });
      const dibujar = () => {
        const g = gs[+$("c-g").value]; $("o-g").textContent = g;
        const s = lg.find(r => r.gamma === g), com = gc.filter(r => r.gamma === g).sort((a, b) => b.tamano - a.tamano), top = com.slice(0, 25).reverse();
        $("k-c").textContent = num(com.length); $("k-q").textContent = num(s.Q, 3); $("k-e").textContent = num(s.estabilidad, 3); $("k-m").textContent = pct(s.mayor);
        $("g-com").previousElementSibling.textContent = `Las ${top.length} comunidades más grandes con γ = ${g}`;
        graficar("g-com", [barraH(top.map(r => `c${r.comunidad} · ${r.region || "—"}`), top.map(r => r.tamano), {
          marker: { color: top.map(r => CATEGORIA[r.categoria] || C.gris) }, text: top.map(r => `${num(r.tamano)} · ${pct(r.pureza_categoria * 100, 0)} ${r.categoria || ""}`),
          textposition: "outside", hovertemplate: "%{y}: %{x} proveedores<extra></extra>" })], { xaxis: { title: "proveedores" }, margin: { l: 150 } });
        const pc = com.reduce((a, r) => a + r.pureza_categoria * r.tamano, 0) / com.reduce((a, r) => a + r.tamano, 0);
        const pr = com.reduce((a, r) => a + r.pureza_region * r.tamano, 0) / com.reduce((a, r) => a + r.tamano, 0);
        $("lectura").innerHTML = `<b>γ = ${g}:</b> ${num(com.length)} comunidades; pureza media de <b>categoría ${pct(pc * 100, 0)}</b> vs <b>región ${pct(pr * 100, 0)}</b>. `
          + (g === 1.25 ? "Es el γ elegido: Q dentro del 1% del máximo y el más estable entre semillas." : g > 3 ? "Con γ alto aparecen grupos chicos (así se buscan los grupos cerrados), pero baja Q." : "La Q casi no cambia entre γ = 0.5 y 2: la partición no depende de afinar γ.");
      };
      $("c-g").addEventListener("input", dibujar); dibujar();
    },
  },
  {
    etapa: "6 · Comunidades (PQ2)",
    titulo: "BigCLAM: comunidades solapadas",
    async render(el) {
      el.innerHTML = encabezado("Proveedores en Varios Mercados · BigCLAM",
        "Cada proveedor tiene una afiliación F ≥ 0 a 100 comunidades; está en la comunidad c si F_uc ≥ δ. Mueve el umbral δ")
        + `<div class="fila"><div>
            ${formula("P(u,v) = 1 - e^{-F_u \\cdot F_v}, \\qquad \\delta = \\sqrt{-\\log(1-\\varepsilon)}", "modelo y umbral teórico")}
            <div class="controles"><label>δ (× teórico) <input type="range" id="c-f" min="0" max="5" value="2"><output id="o-f" for="c-f"></output></label></div>
            ${chips([["cobertura", '<span id="k-cob"></span>'], ["solapados (≥ 2)", '<span id="k-sol"></span>'], ["membresías medias", '<span id="k-mem"></span>'], ["conductancia mediana", '<span id="k-con"></span>']])}
            ${puntos(["<b>δ bajo:</b> todos en muchas comunidades; porosas.", "<b>δ alto:</b> comunidades limpias, pero se pierde cobertura.",
                      "<b>δ teórico (1×):</b> 72% de cobertura y 10% de proveedores puente."])}
          </div>${caja("g-tam", "Tamaño de las 40 comunidades BigCLAM más grandes", "", "alto")}</div>`;
      const [bd, ed] = await Promise.all([datos(`${D}/c_solapadas/bigclam_delta_web`), datos(`${D}/c_solapadas/eleccion_delta`)]);
      const fs = ed.map(r => r.factor);
      const dibujar = () => {
        const f = fs[+$("c-f").value], e = ed.find(r => r.factor === f); $("o-f").textContent = `${f}×`;
        $("k-cob").textContent = pct(e.cobertura * 100); $("k-sol").textContent = pct(e.pct_solapados); $("k-mem").textContent = num(e.membresias_media, 2);
        $("k-con").textContent = e.conductancia_med == null ? "—" : num(e.conductancia_med, 2);
        const t = bd.filter(r => r.factor === f).sort((a, b) => b.tamano - a.tamano).slice(0, 40);
        graficar("g-tam", [barra(t.map((_, i) => String(i + 1)), t.map(r => r.tamano), { marker: { color: f === 1 ? C.azul : C.gris }, hovertemplate: "comunidad %{x}: %{y} proveedores<extra></extra>" })],
          { xaxis: { title: "comunidad (ordenada por tamaño)", type: "category", showticklabels: false }, yaxis: { title: "proveedores" } });
      };
      $("c-f").addEventListener("input", dibujar); dibujar();
    },
  },
  {
    etapa: "6 · Comunidades (PQ2)",
    titulo: "Mercados por rubro y grupos cerrados",
    async render(el) {
      el.innerHTML = encabezado("Mercados por Rubro, Luego por Región",
        "El grafo de las 34 comunidades grandes y qué atributo las explica mejor (AMI = información mutua ajustada por azar)")
        + `<div class="fila">${caja("g-red", "Grafo de comunidades", "tamaño = proveedores · color = categoría dominante · grosor = competencia entre comunidades", "alto")}
            <div>${caja("g-ami", "AMI entre las comunidades y cada atributo")}${caja("g-gc", "11 grupos cerrados: procesos en que coinciden vs % que ganan", "señales para revisar, no conclusiones")}</div></div>`;
      const [nod, ari, ex, gc] = await Promise.all([datos(`${D}/e_analisis/comunidades_web_nodos`), datos(`${D}/e_analisis/comunidades_web_aristas`),
        datos(`${D}/e_analisis/explica`), datos(`${D}/e_analisis/grupos_cerrados`)]);
      const pos = Object.fromEntries(nod.map(n => [n.comunidad, n])), maxP = Math.max(...ari.map(a => a.peso));
      const aristas = ari.filter(a => a.peso > maxP * .02).map(a => ({ type: "scatter", mode: "lines", x: [pos[a.c1].x, pos[a.c2].x], y: [pos[a.c1].y, pos[a.c2].y],
        line: { color: "rgba(100,116,139,.35)", width: .5 + 5 * a.peso / maxP }, hoverinfo: "skip", showlegend: false }));
      graficar("g-red", [...aristas, { type: "scatter", mode: "markers+text", x: nod.map(n => n.x), y: nod.map(n => n.y), text: nod.map(n => n.region.slice(0, 8)),
        textposition: "middle center", textfont: { size: 8, color: "#fff" }, marker: { size: nod.map(n => 10 + 40 * Math.sqrt(n.tamano / 876)), color: nod.map(n => CATEGORIA[n.categoria] || C.gris), line: { color: "#fff", width: 1 } },
        customdata: nod.map(n => `c${n.comunidad}: ${n.tamano} proveedores, ${n.categoria}, ${n.region}`), hovertemplate: "%{customdata}<extra></extra>", showlegend: false }],
        { xaxis: { visible: false }, yaxis: { visible: false }, margin: { l: 10, r: 10, t: 10, b: 10 } });
      const e = ex.filter(r => r.particion === "louvain" && r.sin_dato === "excluido");
      const etq = { region_dom: "región", categoria_dom: "categoría", familia_dom: "familia", tipologia: "tipología (II)", es_consorcio: "consorcio" };
      graficar("g-ami", [barra(e.map(r => etq[r.atributo]), e.map(r => r.ami), { marker: { color: e.map(r => (["categoria_dom", "familia_dom"].includes(r.atributo) ? C.aqua : C.gris)) } })], { yaxis: { range: [0, .7] } });
      graficar("g-gc", [{ type: "scatter", mode: "markers", x: gc.map(r => r.procesos_juntos), y: gc.map(r => r.tasa_victoria_juntos * 100),
        marker: { size: gc.map(r => 8 + 4 * r.tamano), color: gc.map(r => r.hhi_entidades), colorscale: "Reds", cmin: 0, cmax: 1, line: { color: C.tinta, width: .5 }, showscale: true, colorbar: { title: "HHI", thickness: 8 } },
        text: gc.map(r => `${r.tamano} proveedores · ${r.region} · ${r.categoria}`), hovertemplate: "%{text}<br>%{x} procesos juntos · %{y:.1f}% ganados<extra></extra>" }],
        { xaxis: { type: "log", title: "procesos en que coinciden" }, yaxis: { title: "% que ganan", ticksuffix: "%" } });
    },
  },
  {
    etapa: "6 · Comunidades (PQ2)",
    titulo: "Escalabilidad de los métodos",
    async render(el) {
      el.innerHTML = encabezado("¿Qué Escala y Qué Exige Submuestra?",
        "Tiempo medido en subgrafos crecientes del núcleo; el exponente b de t ∝ m^b dice cómo crece el costo con las aristas")
        + `<div class="fila">${caja("g-exp", "Exponente b por método")}${caja("g-gn", "Girvan–Newman completo, extrapolado (horas, log)")}</div>`
        + `<div class="fila"><div>${puntos(["<b>Lineales (b ≈ 1):</b> Louvain y LPA; LPA corre en Spark sobre las 1.6 M aristas.",
            "<b>Girvan–Newman:</b> un paso crece con m^2.9; completo tomaría ~7,300 h en el núcleo: solo corre en una muestra de 300 nodos.",
            "<b>Betweenness aproximado</b> (25 pivotes) acierta la arista a cortar ~57× más rápido, pero no reduce el número de pasos."])}</div><div class="tarjeta" id="t-res"></div></div>`;
      const [aj, gn, rm] = await Promise.all([datos(`${D}/d_escalabilidad/ajuste_costo`), datos(`${D}/d_escalabilidad/gn_extrapolacion`), datos(`${D}/d_escalabilidad/resumen_metodos`)]);
      const a = [...aj].sort((x, y) => x.exponente - y.exponente);
      graficar("g-exp", [barraH(a.map(r => r.metodo), a.map(r => r.exponente), { marker: { color: a.map(r => (r.exponente < 1.5 ? C.aqua : r.exponente < 2.5 ? C.naranja : C.rojo)) } })], { xaxis: { title: "b" } });
      graficar("g-gn", [barra(gn.map(r => r.grafo), gn.map(r => r.horas_minimo), { name: "cota mínima", marker: { color: C.gris } }),
        barra(gn.map(r => r.grafo), gn.map(r => r.horas_cota_superior), { name: "cota superior", marker: { color: C.rojo } })], { barmode: "group", yaxis: { type: "log", title: "horas" } });
      document.getElementById("t-res").innerHTML = "<h3>Calidad y costo</h3>" + rm.map(r => `<p><b>${r.metodo}</b> · ${r.grafo}: Q ${r.Q == null ? "—" : num(r.Q, 3)} en ${num(r.seg, 1)} s</p>`).join("");
    },
  },
];
