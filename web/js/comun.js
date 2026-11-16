// Utilidades compartidas: carga de datos, formato, bloques de HTML y gráficos (Plotly)

export const C = {
  azul: "#2563eb", naranja: "#d97706", aqua: "#0f766e", rojo: "#dc2626",
  gris: "#94a3b8", tenue: "#64748b", tinta: "#0f172a", tinta2: "#475569", linea: "rgba(15,23,42,.065)",
};

const cache = new Map();
export function datos(ruta) {
  if (!cache.has(ruta)) cache.set(ruta, fetch(`data/${ruta}.json`).then(r => {
    if (!r.ok) throw new Error(`No se pudo leer data/${ruta}.json`);
    return r.json();
  }));
  return cache.get(ruta);
}

const nf = (d) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: d, minimumFractionDigits: 0 });
export const num = (v, d = 0) => nf(d).format(v);
export const pct = (v, d = 1) => `${nf(d).format(v)}%`;

// ---- HTML ----
export const h = (strings, ...vals) => strings.reduce((a, s, i) => a + s + (i < vals.length ? vals[i] : ""), "");
export const puntos = (items) => `<ul class="puntos">${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
export const cifras = (items) => `<div class="cifras">${items.map(([v, t]) => `<div class="cifra"><b>${v}</b><span>${t}</span></div>`).join("")}</div>`;
export const proceso = (pasos) => `<div class="proceso">${pasos.map(([t, d, clave]) =>
  `<div class="paso${clave ? " clave" : ""}"><b>${t}</b><span>${d}</span></div>`).join("")}</div>`;
export const chips = (items) => `<div class="chips">${items.map(([k, v]) => `<span class="chip">${k} <b>${v}</b></span>`).join("")}</div>`;
export const formula = (latex, etiqueta = "") =>
  `<div class="formula">${etiqueta ? `<span>${etiqueta}</span>` : ""}<div>$$${latex}$$</div></div>`;
export const caja = (id, titulo, nota = "", clase = "") =>
  `<div class="grafico"><h3>${titulo}</h3>${nota ? `<p class="nota">${nota}</p>` : ""}<div class="plot ${clase}" id="${id}"></div></div>`;
export const encabezado = (titulo, bajada) => `<h1>${titulo}</h1>${bajada ? `<p class="bajada">${bajada}</p>` : ""}`;

export function tabla(filas, columnas, { destacar } = {}) {
  const th = columnas.map(([, t]) => `<th>${t}</th>`).join("");
  const tr = filas.map(f => `<tr${destacar && destacar(f) ? ' class="destacada"' : ""}>${columnas.map(([k, , fmt]) =>
    `<td${fmt ? ' class="num"' : ""}>${fmt ? fmt(f[k], f) : f[k]}</td>`).join("")}</tr>`).join("");
  return `<table class="tabla"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

// pestañas: [{id, texto}], al elegir llama a fn(id)
export function pestanas(el, opciones, fn, inicial = opciones[0].id) {
  el.setAttribute("role", "tablist");
  el.setAttribute("aria-label", "Parámetros de análisis");
  el.innerHTML = opciones.map(o => `<button type="button" role="tab" tabindex="-1" data-id="${o.id}">${o.texto}</button>`).join("");
  const elegir = (id, enfocar = false) => {
    el.querySelectorAll("button").forEach(b => {
      const activo = b.dataset.id === id;
      b.setAttribute("aria-selected", activo);
      b.tabIndex = activo ? 0 : -1;
      if (activo && enfocar) b.focus();
    });
    fn(id);
  };
  el.addEventListener("click", e => { const b = e.target.closest("button"); if (b) elegir(b.dataset.id); });
  el.addEventListener("keydown", e => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const tabs = [...el.querySelectorAll("button")], pos = tabs.indexOf(document.activeElement);
    const siguiente = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1
      : (pos + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    elegir(tabs[siguiente].dataset.id, true);
  });
  elegir(inicial);
}

// ---- gráficos ----
const base = () => ({
  margin: { l: 58, r: 22, t: 34, b: 48 },
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { family: "Inter, system-ui, sans-serif", size: 11, color: C.tinta2 },
  xaxis: {
    showgrid: false, showline: true, linecolor: "rgba(15,23,42,.18)", linewidth: 1,
    zeroline: true, zerolinecolor: "rgba(15,23,42,.25)", zerolinewidth: 1, automargin: true,
    tickfont: { size: 10, color: C.tenue }, titlefont: { size: 10, color: C.tenue },
  },
  yaxis: {
    showgrid: true, gridcolor: C.linea, gridwidth: 1, showline: false,
    zeroline: true, zerolinecolor: "rgba(15,23,42,.25)", zerolinewidth: 1, automargin: true,
    tickfont: { size: 10, color: C.tenue }, titlefont: { size: 10, color: C.tenue },
  },
  hoverlabel: {
    bgcolor: "rgba(15,23,42,.96)", bordercolor: "#0f172a",
    font: { family: "Inter, system-ui, sans-serif", size: 11, color: "#f8fafc" },
    namelength: -1,
  },
  legend: {
    orientation: "h", y: 1.14, yanchor: "bottom", x: 1, xanchor: "right",
    font: { size: 10, color: C.tinta2 }, traceorder: "normal",
    bgcolor: "rgba(255,255,255,0)", borderwidth: 0,
  },
  bargap: 0.32,
  hovermode: "closest",
  separators: ",.",
});
const fusion = (a, b) => {
  for (const [k, v] of Object.entries(b || {}))
    a[k] = v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" ? fusion({ ...a[k] }, v) : v;
  return a;
};

const envolverEtiqueta = (valor, limite = 28) => {
  const texto = String(valor);
  if (texto.length <= limite || texto.includes("<br>")) return texto;
  const lineas = [];
  let linea = "";
  for (const palabra of texto.split(/\s+/)) {
    if (linea && `${linea} ${palabra}`.length > limite) {
      lineas.push(linea);
      linea = palabra;
    } else linea = linea ? `${linea} ${palabra}` : palabra;
  }
  if (linea) lineas.push(linea);
  return lineas.join("<br>");
};

const etiquetaValor = (valor, eje = {}) => {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return String(valor ?? "");
  if (String(eje.tickformat || "").includes("%")) return pct(valor * 100, valor * 100 < 10 ? 1 : 0);
  if (eje.ticksuffix === "%") return pct(valor, valor < 10 ? 1 : 0);
  if (Math.abs(valor) >= 1000) return num(valor);
  return num(valor, Number.isInteger(valor) ? 0 : 2);
};

export function graficar(id, trazas, layout = {}) {
  const el = typeof id === "string" ? document.getElementById(id) : id;
  if (!el) return;
  let finalLayout = fusion(base(), layout);
  let maxFilasEtiqueta = 1;
  const refinadas = trazas.map(t => {
    if (t.type === "bar") {
      const { etiquetasDensas = false, ...traza } = t;
      const horizontal = t.orientation === "h";
      const valores = horizontal ? t.x : t.y;
      const categorias = horizontal ? t.y : t.x;
      const eje = horizontal ? finalLayout.xaxis : finalLayout.yaxis;
      const mostrarEtiquetas = etiquetasDensas || (valores?.length || 0) <= 6;
      const etiquetas = mostrarEtiquetas ? (t.text || valores?.map(v => etiquetaValor(v, eje))) : undefined;
      const categoriasEnv = horizontal ? categorias?.map(v => envolverEtiqueta(v)) : categorias;
      if (horizontal && categoriasEnv?.length) {
        maxFilasEtiqueta = Math.max(maxFilasEtiqueta, ...categoriasEnv.map(v => String(v).split("<br>").length));
        const margenNecesario = Math.min(320, 118 + maxFilasEtiqueta * 24);
        finalLayout = fusion(finalLayout, { margin: { l: Math.max(finalLayout.margin.l || 0, margenNecesario), r: Math.max(finalLayout.margin.r || 0, 34) } });
      }
      return {
        hoverlabel: { align: "left" }, textfont: { size: 9, color: C.tinta2 },
        constraintext: "none", ...traza,
        ...(horizontal ? { y: categoriasEnv } : {}),
        text: etiquetas,
        textposition: mostrarEtiquetas ? (t.textposition || "outside") : undefined,
      };
    }
    const esElegido = String(t.name || "").toLowerCase() === "elegido" || t.etiquetaSeleccionada;
    if (t.type === "scatter" && String(t.mode || "").includes("markers") && esElegido) {
      const { etiquetaSeleccionada, ...traza } = t;
      const textoHover = t.text;
      const hovertemplate = textoHover && t.hovertemplate
        ? t.hovertemplate.replaceAll("%{text}", "%{customdata}")
        : t.hovertemplate;
      return {
        ...traza, mode: t.mode.includes("text") ? t.mode : `${t.mode}+text`,
        text: t.y.map(v => etiquetaValor(v, finalLayout.yaxis)),
        ...(textoHover ? { customdata: textoHover } : {}),
        ...(hovertemplate ? { hovertemplate } : {}),
        textposition: t.textposition || "top right", textfont: t.textfont || { size: 9, color: C.tinta2 },
      };
    }
    return t;
  });
  const nombresColor = new Map([
    [C.azul, "Base / seleccionado"],
    [C.gris, "Contexto / alternativas"],
    ["#cbd5e1", "Contexto"],
    [C.naranja, "Alerta / destacado"],
    [C.rojo, "Dato crítico"],
    [C.aqua, "Comparación"],
  ]);
  const tieneLeyendaColor = t => {
    if (t.name || !Array.isArray(t.marker?.color)) return false;
    return [...new Set(t.marker.color)].filter(c => nombresColor.has(c)).length >= 2;
  };
  const trazasBase = refinadas.map(t => tieneLeyendaColor(t) ? { ...t, showlegend: false } : t);
  const leyendasColor = refinadas.flatMap(t => {
    if (t.name || !Array.isArray(t.marker?.color)) return [];
    const coloresUnicos = [...new Set(t.marker.color)].filter(c => nombresColor.has(c));
    if (coloresUnicos.length < 2) return [];
    return coloresUnicos.map(color => ({
      type: "scatter", mode: "markers", x: [null], y: [null],
      name: nombresColor.get(color), marker: { color, size: 8 },
      hoverinfo: "skip", showlegend: true,
    }));
  });
  const trazasFinales = [...trazasBase, ...leyendasColor];
  const barrasH = trazasFinales.filter(t => t.type === "bar" && t.orientation === "h");
  const seriesConLeyenda = trazasFinales.filter(t => t.name && t.showlegend !== false);
  if (seriesConLeyenda.length > 1 && finalLayout.showlegend !== false) {
    finalLayout = fusion(finalLayout, { margin: { t: Math.max(finalLayout.margin.t || 0, 48) } });
  }
  if (barrasH.length) {
    const n = Math.max(...barrasH.map(t => t.y?.length || 0));
    const altoNecesario = Math.min(760, 112 + n * Math.max(28, maxFilasEtiqueta * 15));
    if (altoNecesario > el.clientHeight) el.style.height = `${altoNecesario}px`;
  }
  Plotly.react(el, trazasFinales, finalLayout, {
    displayModeBar: false,
    responsive: true,
    scrollZoom: false,
    doubleClick: false,
  });
}

// barra con valor destacado: colores = azul si destacado(i), gris si no
export const colores = (n, destacado) => Array.from({ length: n }, (_, i) => destacado(i) ? C.azul : C.gris);

export const barra = (x, y, extra = {}) => ({ type: "bar", x, y, marker: { color: C.azul, line: { width: 0 } }, cliponaxis: false, ...extra });
export const barraH = (y, x, extra = {}) => ({ type: "bar", orientation: "h", x, y, marker: { color: C.azul, line: { width: 0 } }, cliponaxis: false, ...extra });
export const linea = (x, y, extra = {}) => ({ type: "scatter", mode: "lines", x, y, line: { color: C.azul, width: 2 }, ...extra });
export const puntosXY = (x, y, extra = {}) => ({ type: "scatter", mode: "lines+markers", x, y, line: { color: C.azul, width: 2 }, marker: { size: 7, line: { color: "#fff", width: 1 } }, ...extra });

// ---- controles ----
export const $ = (id) => document.getElementById(id);
export const opciones = (vals, sel, fmt = (v) => v) =>
  vals.map(v => `<option value="${v}"${String(v) === String(sel) ? " selected" : ""}>${fmt(v)}</option>`).join("");
export const PALETA = ["#2563eb", "#d97706", "#0f766e", "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#65a30d", "#94a3b8", "#475569"];
export const CATEGORIA = { GOODS: "#2563eb", SERVICES: "#0f766e", WORKS: "#d97706" };
export const heatmap = (z, x, y, extra = {}) => ({
  type: "heatmap", z, x, y, colorscale: "Viridis", zmin: 0, zmax: 1, showscale: true, xgap: 2, ygap: 2,
  text: z.map(f => f.map(v => (v == null ? "" : num(v, 2)))), texttemplate: "%{text}", textfont: { size: 10 },
  hovertemplate: "%{y} · %{x}: %{z:.3f}<extra></extra>", colorbar: { thickness: 10, len: .9 }, ...extra,
});
