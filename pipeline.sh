#!/bin/sh
set -e
cd "$(dirname "$0")"

TIMEOUT=7200

echo "== Activar ambiente =="
PYTHON=""
for c in python3 python py; do
    if "$c" --version >/dev/null 2>&1; then PYTHON="$c"; break; fi
done
[ -n "$PYTHON" ] || { echo "No se encontró python3, python ni py"; exit 1; }
"$PYTHON" -m venv venv
if [ -f venv/bin/activate ]; then . venv/bin/activate; else . venv/Scripts/activate; fi

echo "== Instalar dependencias =="
python -m pip install -r "requirements.txt"

echo "== 0. Levantar contenedores =="
jupyter nbconvert --to notebook --execute --inplace docker.ipynb

docker compose exec -T jupyter sh -c 'chmod -R a+rwX /home/jovyan/work/data /home/jovyan/work/0* /home/jovyan/work/funciones.ipynb'

echo "== 1. EDA =="

# 1. EDA
docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 00_EDA/a_entendimiento.ipynb
docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 00_EDA/b_exploracion.ipynb
docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 00_EDA/c_justificacion.ipynb

echo "== 2. Transformaciones =="

# 2. Transformaciones
docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 01_Trans/a_planteamiento.ipynb
docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 01_Trans/b_transformaciones.ipynb
docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 01_Trans/c_uso.ipynb
docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 01_Trans/d_recuento.ipynb

echo "== 3. Clustering =="

# 3. Clustering
docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 02_Clustering/a_preparacion.ipynb
docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 02_Clustering/b_modelos.ipynb
docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 02_Clustering/c_interpretacion.ipynb

echo "== Pipeline terminado =="
