# Proyecto 01: Data Mining

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
