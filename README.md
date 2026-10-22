# Proyecto 02: Data Mining

Grafos, clustering y aprendizaje de representación sobre las contrataciones públicas del Perú (2023-2025)

Fuente: <https://contratacionesabiertas.oece.gob.pe/descargas?page=1&paginateBy=10> — OCDS OECE/OSCE, licencia CC BY 4.0
(<https://data.open-contracting.org/es/publication/135>)

## Requerimientos

- Tener Docker Desktop (o Docker Engine + plugin compose) abierto y corriendo

## Dependencias

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt


## Data

python3 data/download.py

## Pipeline

Ejecutar todo el flujo en orden, o alternativamente correr:

sh pipeline.sh


### 0. Levantar el entorno

Levanta el cluster de Spark y Jupyter con Docker

- docker.ipynb
- Kernel picker → "Existing Jupyter Server..." → `http://localhost:8888`

### 1. Parte I — EDA y KDD

#### 1.1 EDA

Aplana el OCDS a un modelo relacional, revisa su calidad y explora la estructura de la red

- 01_EDA_KDD/EDA/a_entendimiento.ipynb
- 01_EDA_KDD/EDA/b_exploracion.ipynb
- 01_EDA_KDD/EDA/c_justificacion.ipynb

#### 1.2 KDD

Limpia, resuelve entidades (MinHash/LSH) y construye features, matrices de interacción y grafos

- 01_EDA_KDD/KDD/a_transformaciones.ipynb
- 01_EDA_KDD/KDD/b_artefactos.ipynb
- 01_EDA_KDD/KDD/c_recuento.ipynb

### 2. Clustering y anomalías (Parte II)

Tipologías de entidades y proveedores y actores atípicos. KMeans++ en Spark; DBSCAN/HDBSCAN y jerárquico en local
sobre todas las entidades y una muestra de proveedores (métodos O(n²))

- 02_Clustering/a_preparacion.ipynb — features, filtro de actividad, estandarización y PCA (Spark)
- 02_Clustering/b_kmeans.ipynb — KMeans++ con codo y silueta, perfiles y distancia al centroide (Spark)
- 02_Clustering/c_densidad.ipynb — k-distancia, grilla DBSCAN, HDBSCAN y outliers (local)
- 02_Clustering/d_jerarquico.ipynb — Ward/average/complete/single, dendrograma y cofenética (local)
- 02_Clustering/e_analisis.ipynb — tipologías, segmento cautivo (PQ1), convergencia ARI, ética y escalabilidad

Solo esta parte: `PARTES=2 sh pipeline.sh`

### Capas de datos

| Carpeta | Contenido |
|---|---|
| `data/raw/` | JSON OCDS mensual |
| `data/bronze/` | OCDS anidado en Parquet (sin documentos) |
| `data/staging/` | procesos, adjudicaciones, oferentes, items, contratos, partes (partición `anio`) |
| `data/final/` | tablas limpias, entidades resueltas y hechos entidad–proveedor–ítem (partición `anio/mes`) |
| `data/artefactos/` | features, matrices de interacción y grafos para las Partes II–VI |
