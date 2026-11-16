import { datos, cifras, encabezado, puntos, tabla } from "../comun.js";

export const diapos = [
  {
    etapa: "9 · Discusión",
    titulo: "Ética: señales, no acusaciones",
    async render(el) {
      el.innerHTML = encabezado("Señales, No Acusaciones",
        "Todo lo que muestra el análisis es descriptivo: patrones de quién compra a quién y quién compite con quién")
        + `<div class="fila"><div class="tarjeta" id="t-sen"></div><div>
          <div class="tarjeta"><h3>Transparencia</h3>${puntos(["Datos abiertos OCDS (CC BY 4.0) y código reproducible con <code>pipeline.sh</code>.",
            "Cada parámetro está justificado y se muestra su variación: se ve cuánto depende cada conclusión de él."])}</div>
          <div class="tarjeta" style="margin-top:14px"><h3>Uso responsable</h3>${puntos(["Revisión humana con información que el OCDS no tiene (bases, contratos, ejecución) antes de afirmar algo.",
            "Personas naturales: la clave contiene el DNI; solo se publican nombres ya públicos y agregados. La web no lista miembros de grupos cerrados.",
            "Límites del dato: consorcios sin miembros, región del proveedor inferida, adjudicaciones sin estado y oferentes que quizá solo se registraron."])}</div>
        </div></div>`;
      const s = await datos("09_analisis/c_insights/senales");
      document.getElementById("t-sen").innerHTML = "<h3>Por qué cada señal no es una acusación</h3>" + tabla(s, [["senal", "Señal"], ["parte", "Parte"], ["por_que_no_es_acusacion", "Por qué no es acusación"]]);
    },
  },
  {
    etapa: "Fuentes",
    titulo: "Fuentes y referencias",
    render(el) {
      el.innerHTML = encabezado("Fuentes y Referencias Técnicas", "Datos, métodos y herramientas")
        + `<div class="fila">
          <div class="tarjeta"><h3>Datos</h3>${puntos([
            'OECE — Contrataciones Abiertas, descargas OCDS 2023–2025: <a href="https://contratacionesabiertas.oece.gob.pe/descargas">contratacionesabiertas.oece.gob.pe</a>',
            'Open Contracting Data Standard (OCDS): <a href="https://standard.open-contracting.org/">standard.open-contracting.org</a>',
            'BCRP — tipo de cambio para convertir montos a soles: <a href="https://estadisticas.bcrp.gob.pe/">estadisticas.bcrp.gob.pe</a>',
          ])}</div>
          <div class="tarjeta"><h3>Métodos y herramientas</h3>${puntos([
            'Leskovec, Rajaraman y Ullman — <i>Mining of Massive Datasets</i>: clustering, recomendación, PageRank, comunidades: <a href="http://www.mmds.org/">mmds.org</a>',
            'Blondel et al. (2008) — Louvain · Yang y Leskovec (2013) — BigCLAM · Grover y Leskovec (2016) — node2vec',
            'Hu, Koren y Volinsky (2008) — ALS implícito · Kleinberg (1999) — HITS · McInnes et al. (2018) — UMAP',
            'Apache Spark 3.5 (MLlib, GraphFrames) · scipy · networkx · gensim · scikit-learn · Plotly',
          ])}</div>
        </div>`;
    },
  },
  {
    etapa: "",
    titulo: "Cierre",
    render(el) {
      el.innerHTML = `<section class="portada">
        <span class="etiqueta">Gracias</span>
        <h1>Mercados por Rubro, Cautividad Local</h1>
        <p class="bajada">La competencia se organiza por rubro y luego por región; la cautividad es de entidades chicas atadas a consorcios de un solo proceso, no de grandes proveedores; y los sustitutos existen y compiten de verdad</p>
        ${cifras([["30%", "entidades cautivas (HHI ≥ 0.25)"], ["6", "mercados latentes que agrupan 41 comunidades"], ["×7", "lift de los enlaces predichos"]])}
        <p class="pie">Código y notebooks: <a href="https://github.com/paolovasquezg/dm-proj2">github.com/paolovasquezg/dm-proj2</a> · Datos: Contrataciones Abiertas — OECE</p>
      </section>`;
    },
  },
];
