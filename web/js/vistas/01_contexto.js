import { datos, encabezado, puntos, caja, graficar, barra, tabla, C } from "../comun.js";

export const diapos = [
  {
    etapa: "1 · Contexto",
    titulo: "Compras públicas como red",
    async render(el) {
      el.innerHTML = encabezado("Las Compras Públicas como una Red",
        "Cada proceso une a una entidad que compra con los proveedores que se presentan y con el que gana. Esas uniones forman dos redes")
        + `<div class="fila">
          <div>${puntos([
            "<b>Fuente:</b> OECE publica cada mes los procesos del SEACE en el estándar OCDS (licencia CC BY 4.0).",
            "<b>Red de compras:</b> entidad → proveedor que gana (adjudicación). Responde <i>quién depende de quién</i>.",
            "<b>Red de competencia:</b> proveedor — proveedor que se presentaron juntos. Responde <i>quién compite con quién</i>.",
            "<b>Escala:</b> ~80 mil procesos al año y 13.5 postores por proceso: imposible revisarlo a mano.",
          ])}</div>
          ${caja("g-mes", "Procesos por mes de convocatoria")}
        </div>`;
      const m = await datos("02_datos/b_exploracion/procesos_por_mes");
      graficar("g-mes", [barra(m.map(r => r.mes), m.map(r => r.count), { hovertemplate: "%{x}: %{y:,} procesos<extra></extra>" })],
        { xaxis: { type: "category", tickangle: -45, nticks: 12 }, yaxis: { title: "procesos" } });
    },
  },
  {
    etapa: "1 · Contexto",
    titulo: "Preguntas PQ1–PQ3 y técnicas",
    render(el) {
      const T = [
        { t: "Clustering (KMeans, DBSCAN, Ward)", p: "PQ1, PQ2", a: "features de entidades y proveedores" },
        { t: "Recomendación (vecindario, contenido, ALS, híbrido)", p: "PQ3, PQ1", a: "matriz entidad × proveedor y texto" },
        { t: "PageRank y HITS", p: "PQ1", a: "grafo bipartito entidad ↔ proveedor" },
        { t: "Comunidades (Louvain, espectral, BigCLAM, LPA)", p: "PQ2", a: "grafo de co-participación" },
        { t: "Representación (Node2Vec, SVD, enlaces)", p: "PQ2, PQ3", a: "grafo de co-participación" },
      ];
      el.innerHTML = encabezado("Tres Preguntas de Negocio",
        "Cada técnica se eligió para responder una pregunta concreta sobre concentración, mercados o alternativas")
        + `<div class="fila">
          <div style="display:grid; gap:14px">
            <div class="tarjeta"><span class="etiqueta">PQ1 · Concentración y cautividad</span><p>¿Qué entidades <b>dependen de pocos proveedores</b> y qué proveedores concentran el gasto de muchas entidades?</p></div>
            <div class="tarjeta"><span class="etiqueta">PQ2 · Mercados y competencia</span><p>¿Qué <b>mercados</b> emergen de la co-participación? ¿Son regionales o por rubro? ¿Qué grupos compiten siempre entre sí?</p></div>
            <div class="tarjeta"><span class="etiqueta">PQ3 · Sustitutos y afinidades</span><p>Para una entidad, ¿qué proveedores son <b>alternativas</b> y qué relaciones son <b>atípicas</b>?</p></div>
          </div>
          <div class="tarjeta"><h3>Técnica → pregunta → artefacto</h3>${tabla(T, [["t", "Técnica"], ["p", "Pregunta"], ["a", "Artefacto"]])}</div>
        </div>`;
    },
  },
];
