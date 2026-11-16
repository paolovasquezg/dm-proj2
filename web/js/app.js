// Navegación por etapas: flechas laterales, teclado y #número en la URL
import { diapos as portada } from "./vistas/00_portada.js";
import { diapos as contexto } from "./vistas/01_contexto.js";
import { diapos as datos } from "./vistas/02_datos.js";
import { diapos as clustering } from "./vistas/04_clustering.js";
import { diapos as recomendacion } from "./vistas/05_recomendacion.js";
import { diapos as pagerank } from "./vistas/06_pagerank.js";
import { diapos as comunidades } from "./vistas/07_comunidades.js";
import { diapos as representacion } from "./vistas/08_representacion.js";
import { diapos as analisis } from "./vistas/09_analisis.js";
import { diapos as cierre } from "./vistas/10_cierre.js";

const DIAPOS = [...portada, ...contexto, ...datos, ...clustering, ...recomendacion, ...pagerank, ...comunidades,
  ...representacion, ...analisis, ...cierre];
const TITULOS_INDICE = DIAPOS.map(d => d.titulo);
const NOMBRES_SECCION = new Map([
  ["1 · Contexto", "1 · Contexto y preguntas"],
  ["2 · Datos", "2 · Datos, EDA y transformaciones"],
  ["3 · Clustering (PQ1)", "3 · Clustering y cautividad"],
  ["4 · Recomendación (PQ3)", "4 · Sistemas de recomendación"],
  ["5 · PageRank y HITS (PQ1)", "5 · Análisis de enlaces"],
  ["6 · Comunidades (PQ2)", "6 · Grafos y comunidades"],
  ["7 · Representación (PQ2, PQ3)", "7 · Aprendizaje de representación"],
  ["8 · Análisis", "8 · Análisis integrado"],
  ["9 · Discusión", "9 · Discusión crítica y ética"],
]);

const $ = (id) => document.getElementById(id);
let actual = 0;
let renderToken = 0;

function limpiarGraficos(el) {
  if (!window.Plotly) return;
  el.querySelectorAll(".js-plotly-plot").forEach(g => Plotly.purge(g));
}

function mejorarControles(el) {
  el.querySelectorAll('input[type="range"]').forEach(input => {
    const output = input.parentElement?.querySelector(`output[for="${input.id}"]`)
      || input.nextElementSibling?.tagName === "OUTPUT" && input.nextElementSibling;
    if (!output || input.closest(".range-shell")) return;
    const shell = document.createElement("span");
    shell.className = "range-shell";
    input.before(shell);
    shell.append(input, output);
    const actualizar = () => {
      const min = Number(input.min || 0), max = Number(input.max || 100);
      const avance = max === min ? 0 : ((Number(input.value) - min) / (max - min)) * 100;
      shell.style.setProperty("--range-p", `${avance}%`);
      input.setAttribute("aria-valuetext", output.textContent || input.value);
    };
    input.addEventListener("input", actualizar);
    actualizar();
  });
}

function mejorarTipografia(el) {
  if (window.renderMathInElement) {
    renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }
  if (window.lucide) lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
}

function actualizarIndice() {
  document.querySelectorAll(".indice-item").forEach((b, i) => {
    b.setAttribute("aria-current", i === actual ? "true" : "false");
  });
}

async function mostrar(i) {
  const token = ++renderToken;
  actual = Math.max(0, Math.min(DIAPOS.length - 1, i));
  const d = DIAPOS[actual];
  const el = $("diapo");
  limpiarGraficos(el);
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  el.innerHTML = "";
  $("etapa").textContent = NOMBRES_SECCION.get(d.etapa) || d.etapa || "";
  $("contador").textContent = `Slide ${String(actual + 1).padStart(2, "0")} de ${DIAPOS.length}`;
  $("contador-nav").textContent = `${String(actual + 1).padStart(2, "0")} / ${DIAPOS.length}`;
  $("progreso").style.width = `${(actual / (DIAPOS.length - 1)) * 100}%`;
  $("anterior").disabled = actual === 0;
  $("siguiente").disabled = actual === DIAPOS.length - 1;
  actualizarIndice();
  if (location.hash !== `#${actual + 1}`) history.replaceState(null, "", `#${actual + 1}`);
  try {
    await d.render(el);
    if (token !== renderToken) return;
    mejorarControles(el);
    mejorarTipografia(el);
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  } catch (e) {
    if (token !== renderToken) return;
    el.innerHTML += `<p class="lectura">No se pudieron cargar los datos de esta etapa (${e.message}). Si abres el archivo directamente, sírvelo con <code>python -m http.server -d web</code>.</p>`;
    console.error(e);
  }
  el.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

$("anterior").addEventListener("click", () => mostrar(actual - 1));
$("siguiente").addEventListener("click", () => mostrar(actual + 1));

const indice = $("indice");
const abrirIndice = () => {
  actualizarIndice();
  indice.showModal();
  indice.querySelector('[aria-current="true"]')?.focus();
};
$("abrir-indice").addEventListener("click", abrirIndice);
$("cerrar-indice").addEventListener("click", () => indice.close());
indice.addEventListener("click", e => {
  if (e.target === indice) indice.close();
  const item = e.target.closest(".indice-item");
  if (item) {
    indice.close();
    mostrar(Number(item.dataset.indice));
  }
});
$("indice-rejilla").innerHTML = DIAPOS.map((d, i) => `
  <button class="indice-item" type="button" data-indice="${i}">
    <span class="indice-num">${String(i + 1).padStart(2, "0")}</span>
    <span class="indice-etapa">${TITULOS_INDICE[i] || d.etapa || "Vista del análisis"}</span>
  </button>`).join("");

async function alternarPantallaCompleta() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (e) {
    console.warn("El navegador no permitió cambiar a pantalla completa", e);
  }
}
$("pantalla-completa").addEventListener("click", alternarPantallaCompleta);
document.addEventListener("fullscreenchange", () => {
  $("pantalla-completa").innerHTML = `<i data-lucide="${document.fullscreenElement ? "minimize-2" : "maximize-2"}" aria-hidden="true"></i>`;
  if (window.lucide) lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
});

document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, select, textarea") || e.target.isContentEditable) return;
  if (e.key === "g" || e.key === "G") { e.preventDefault(); if (!indice.open) abrirIndice(); }
  if (e.key === "f" || e.key === "F") { e.preventDefault(); alternarPantallaCompleta(); }
  if (indice.open) return;
  if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); mostrar(actual + 1); }
  if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); mostrar(actual - 1); }
  if (e.key === "Home") { e.preventDefault(); mostrar(0); }
  if (e.key === "End") { e.preventDefault(); mostrar(DIAPOS.length - 1); }
});
window.addEventListener("hashchange", () => {
  const n = parseInt(location.hash.slice(1), 10);
  if (!Number.isNaN(n) && n - 1 !== actual) mostrar(n - 1);
});

if (window.lucide) lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
else window.addEventListener("load", () => mejorarTipografia(document.body), { once: true });
mostrar((parseInt(location.hash.slice(1), 10) || 1) - 1);
