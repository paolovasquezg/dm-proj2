import { cifras } from "../comun.js";

export const diapos = [{
  etapa: "",
  titulo: "Portada y escala del estudio",
  render(el) {
    el.innerHTML = `<section class="portada">
      <span class="etiqueta">Proyecto 02 · Minería de datos</span>
      <h1>Mercados y Competencia en las Compras Públicas</h1>
      <p class="bajada">Clustering, recomendación, PageRank, comunidades y embeddings sobre quién le compra a quién y quién compite con quién en 236 mil procesos de contratación del Perú (2023–2025)</p>
      ${cifras([["236,229", "procesos (36 meses)"], ["2,992", "entidades compradoras"], ["86,017", "proveedores que ganaron"], ["1.64 M", "pares que compitieron"]])}
      <p class="pie">Fuente: Contrataciones Abiertas — OECE (estándar OCDS) · Usa ← → o los controles inferiores para avanzar · <kbd>G</kbd> abre el índice</p>
    </section>`;
  },
}];
