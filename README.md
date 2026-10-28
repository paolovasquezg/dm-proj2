# Proyecto 02: Grafos, clustering y aprendizaje de representación

Minería y análisis de las contrataciones abiertas de la compra pública en Perú, 2023 a 2025 (estándar OCDS)

Fuente: https://contratacionesabiertas.oece.gob.pe/descargas?page=1&paginateBy=10

## Requerimientos

- Docker Desktop (o Docker Engine + plugin compose) abierto y corriendo
- Python 3 en el host (solo para descargar la data y levantar los contenedores)

## Dependencias

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Data

La data no se versiona (`data/` está en `.gitignore`). Para descargarla:

```bash
python3 data/download.py
```

- Descarga los JSON OCDS mensuales de 2023 a 2025 (36 archivos) en `data/raw/`
- `data/cambios.csv`: tipo de cambio mensual a soles (se regenera si falta)

## Pipeline

Ejecuta todo el flujo en orden:

```bash
sh pipeline.sh
```

O paso a paso:

### Levantar el entorno

Levanta el cluster de Spark (1 master, 2 workers) y Jupyter con Docker

- `docker.ipynb`
- Kernel picker → "Existing Jupyter Server..." → `http://localhost:8888`
- Spark UI: `http://localhost:8080` (cluster) y `http://localhost:4040` (job activo)

### 0. EDA

- `00_EDA/a_entendimiento.ipynb`: OCDS → bronze → staging, calidad de datos
- `00_EDA/b_exploracion.ipynb`: análisis univariable y multivariable
- `00_EDA/c_justificacion.ipynb`: factibilidad y objetivo de cada técnica

### 1. Transformaciones (Parte I)

- `01_Trans/a_planteamiento.ipynb`: grano, capas y plan
- `01_Trans/b_transformaciones.ipynb`: limpieza, resolución de entidades (MinHash/LSH) y su evaluación, hechos en `data/final/`
- `01_Trans/c_uso.ipynb`: artefactos en `data/artefactos/`, particionamiento y validación de integridad
- `01_Trans/d_recuento.ipynb`: recuento y limitaciones

### 2. Clustering y anomalías (Parte II)

- `02_Clustering/a_preparacion.ipynb`: preguntas de interés, features, estandarización y PCA
- `02_Clustering/b_modelos.ipynb`: KMeans++ (selección de k), DBSCAN (calibración de eps) y jerárquico Ward
- `02_Clustering/c_interpretacion.ipynb`: arquetipos, anomalías, banderas de auditoría, encuadre ético y exportación

**Validación manual de la resolución de entidades:** `b_transformaciones` genera `01_Trans/er_validacion.csv` la
primera vez. Completar la columna `mismo_actor` (1 = mismo actor, 0 = distinto) y re-ejecutar el notebook para
obtener la precisión por estrato. El archivo no se sobrescribe.

## Artefactos (`data/artefactos/`)

| Artefacto | Contenido | Partes |
|---|---|---|
| `features_proveedor`, `features_entidad` | Vectores de características (`features_raw`, sin estandarizar) | II |
| `matriz_entidad_proveedor`, `matriz_entidad_familia` | Matrices de interacción en formato COO, una fila por año | III, VI |
| `indice_entidad`, `indice_proveedor`, `indice_familia` | Índice entero → clave | III, VI |
| `grafo_bipartito/{vertices,aristas}` | Entidad → proveedor | IV |
| `grafo_coparticipacion/{vertices,aristas}` | Proveedores que participan juntos en ≥ 2 procesos | V |
| `grafo_coparticipacion_sin_hubs/{vertices,aristas}` | Ídem, sin proveedores con grado sobre el p99 | V, VI |
| `grafo_knn/{vertices,aristas}` | k vecinos más cercanos sobre `features_proveedor` estandarizado | VI |
| `clustering_proveedores.parquet` | PCA 2D, arquetipo, clúster DBSCAN, banderas y etiquetas para k = 2…8 y la grilla de eps | VII (web) |

Lectura:

```python
spark.read.parquet("data/artefactos/grafo_bipartito/aristas")
spark.read.parquet("data/final/hechos").where("anio = 2025")   # poda por partición anio/mes
```

## Salidas de cada notebook

`<carpeta>/temp/<notebook>/`: `figs/` (PNG), `tablas/` (Parquet) y `web/` (JSON para el reporte interactivo)
