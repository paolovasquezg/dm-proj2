# Reporte técnico

## Contexto

- El EDA (planteamiento) y las transformaciones ya están realizados, por lo que se pueden hacer los demás procesos.
- Por ahora me enfoco en el **reporte técnico**.
- **Primer paso:** leer el README e informarte sobre:
  - Lo hecho y planteado.
  - Lo que he hallado.
- Te dejo las indicaciones a continuación.

## Enunciado

- Al igual que en el primer proyecto, el reporte técnico se entrega como una **página web interactiva** donde cada hallazgo pueda verse y explorarse.
- El texto de análisis (metodología, interpretación y discusión) va **embebido en la propia página**.

### Estructura por hallazgo

- Cada hallazgo se presenta como un módulo:
  - Pregunta de interés.
  - Visualización.
  - Controles interactivos (donde apliquen).
  - Interpretación escrita.

### Arquitectura recomendada: "calcular una vez, explorar muchas"

- Lo pesado (Spark, grafos, embeddings) se calcula **offline** y se exporta como artefactos ligeros (Parquet/CSV/JSON); la página los lee y responde al instante.
- La recomputación en vivo se reserva para lo barato:
  - Reasignar puntos a clústeres.
  - Filtrar comunidades.
  - Recalcular un ranking con otro parámetro.
- Conviene dejar interactivos los parámetros clave:
  - k en K-means.
  - eps y min_samples en DBSCAN/HDBSCAN.
  - Número de factores o de recomendaciones.
  - Factor de amortiguamiento de PageRank.
  - Resolución o número de comunidades.
  - Parámetros p y q de Node2Vec.

### Requisitos mínimos

- Al menos **tres hallazgos con parámetros ajustables en vivo**; el resto, como visualizaciones estáticas exportadas.
- Texto embebido de:
  - Metodología.
  - Interpretación por hallazgo.
  - Discusión crítica.
- **Enlace publicado o video corto de demostración**, además del código.

## Formato esperado

- Seguir la estructura y el formato de lo realizado en el proyecto anterior.
- Se hace un **script dentro de `data`** que exporta la data necesaria para la web.
- Este reporte incluye:
  - Una **página web interactiva**.
  - Un **reporte en HTML**, más que nada conciso.
- Revisar cómo se hizo en el proyecto anterior.
- **Parámetros:** cualquier parámetro que tomes (por ejemplo, soporte mínimo, confianza mínima) debe quedar **justificado**, de forma puntual y concisa, sin ser largo.

## Referencias

- **Enunciado completo del proyecto:**
  https://docs.google.com/document/d/1CwJscutDaYOB9zjGMHdtjEcsdN_C0USj/edit?usp=sharing&ouid=117787070913034951591&rtpof=true&sd=true
- **Proyecto anterior** (donde miré `06_Analisis` para darme una idea):
  https://github.com/paolovasquezg/dm-proj1

## Libertad

- Eres libre de agregar lo que consideres necesario a lo que tengo planteado.