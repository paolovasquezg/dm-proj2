# Proyecto 02: Data Mining

Mineria y análisis en las contrataciones abiertas de la compra pública en Perú durante los años 2023 a 2025

Fuente: https://contratacionesabiertas.oece.gob.pe/descargas?page=1&paginateBy=10

## Requerimientos

- Tener Docker Desktop (o Docker Engine + plugin compose) abierto y corriendo

## Dependencias

Para instalar las dependencias:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Data

Para descargar la data:

```bash
python3 data/download.py
```

O, alternativamente, descarga el zip desde este [link](https://drive.google.com/file/d/1hOH8VOX3JpZ3KjaiOaReZ37mXi0-Sg8J/view?usp=sharing), descomprimelo y colocalo en la carpeta [`data/`](data/)

## Pipeline

Ejecutar todo el flujo en orden, o alternativamente correr:

```bash
sh pipeline.sh
```

### Levantar el entorno

Levanta el cluster de Spark y Jupyter con Docker

- docker.ipynb
- Kernel picker → "Existing Jupyter Server..." → `http://localhost:8888`

### 0. EDA

- 00_EDA/a_entendimiento.ipynb
- 00_EDA/b_exploracion.ipynb
- 00_EDA/c_justificacion.ipynb

### 1. Transformaciones

- 01_Trans/a_planteamiento.ipynb
- 01_Trans/b_transformaciones.ipynb
- 01_Trans/c_uso.ipynb
- 01_Trans/d_recuento.ipynb

### 2. Clustering

- 02_Clustering/a_preparacion.ipynb
- 02_Clustering/b_kmeans.ipynb
- 02_Clustering/c_densidad.ipynb
- 02_Clustering/d_jerarquico.ipynb
- 02_Clustering/e_analisis.ipynb

### 3. Recomendación

- 03_Recomend/a_preparacion.ipynb
- 03_Recomend/b_vecindario.ipynb
- 03_Recomend/c_contenido.ipynb
- 03_Recomend/d_als.ipynb
- 03_Recomend/e_hibrido.ipynb
- 03_Recomend/f_analisis.ipynb

### 4. PageRank y HITS

- 04_PageRank/a_grafo.ipynb
- 04_PageRank/b_pagerank.ipynb
- 04_PageRank/c_hits.ipynb
- 04_PageRank/d_analisis.ipynb

### 5. Grafos y comunidades

- 05_Comunidad/a_grafo.ipynb
- 05_Comunidad/b_particion.ipynb
- 05_Comunidad/c_solapadas.ipynb
- 05_Comunidad/d_escalabilidad.ipynb
- 05_Comunidad/e_analisis.ipynb

### 6. Representación en grafos

- 06_Representacion/a_grafo.ipynb
- 06_Representacion/b_node2vec.ipynb
- 06_Representacion/c_proyeccion.ipynb
- 06_Representacion/d_enlaces.ipynb
- 06_Representacion/e_analisis.ipynb

### 7. Análisis

- 07_Analisis/a_recuento.ipynb
- 07_Analisis/b_hallazgos.ipynb
- 07_Analisis/c_insights.ipynb

### 8. Datos para la web

Exporta a `web/data/` los JSON que usa la página:

```bash
python data/exportar.py
```

## Web interactiva

Presentación por etapas del proceso y los resultados, en `web/`

```bash
python3 -m http.server -d web 8000
```

Abrir `http://localhost:8000`


## Acceso publico

Acceder a la web con los resultados en [paolovasquezg.github.io/dm-proj2](https://paolovasquezg.github.io/dm-proj2/)


## Reporte técnico

Documento con la metodología, los resultados y las conclusiones del proyecto, en [reporte.html](reporte.html)


```bash
python3 -m http.server 8001
```

Abrir `http://localhost:8001/reporte.html`


## Registro de aportes

| Sección | Actividades | Encargado |
|---|---|---|
| Entorno | Docker (Spark + Jupyter) y `pipeline.sh` | Paolo Vásquez, Oscar Chu |
| 0. EDA | Entendimiento, exploración y justificación de los datos | Paolo Vásquez, Oscar Chu |
| 1. Transformaciones | Capas staging, bronze y final, y recuento | Paolo Vásquez, Oscar Chu |
| 2. Clustering | K-means, HDBSCAN y jerárquico; cautividad | Paolo Vásquez, Oscar Chu |
| 3. Recomendación | Vecindario, contenido, ALS e híbrido; sustitutos | Paolo Vásquez, Oscar Chu |
| 4. PageRank y HITS | Grafo, PageRank, HITS y centralidad | Paolo Vásquez, Oscar Chu |
| 5. Comunidades | Louvain, Girvan-Newman, BigCLAM y escalabilidad | Paolo Vásquez, Oscar Chu |
| 6. Representación | Node2Vec, SVD, UMAP y predicción de enlaces | Josue Velo, Paolo Vásquez |
| 7. Análisis | Desempeño, hallazgos e insights | Paolo Vásquez |
| 8. Exportación | JSON para `web/data` | Paolo Vásquez |
| Web | Sitio interactivo y despliegue | Paolo Vásquez |
| Reporte | `reporte.html` | Paolo Vásquez |

