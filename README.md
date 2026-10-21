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

## Pipeline

### 0. Levantar el entorno

Levanta el cluster de Spark y Jupyter con Docker

- docker.ipynb
- Kernel picker → "Existing Jupyter Server..." → `http://localhost:8888`
