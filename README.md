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

- 01_Trans/KDD/a_planteamiento.ipynb
- 01_Trans/KDD/b_transformaciones.ipynb
- 01_Trans/KDD/c_uso.ipynb
- 01_Trans/KDD/d_recuento.ipynb