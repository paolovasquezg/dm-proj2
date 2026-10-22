#!/bin/sh
set -e
cd "$(dirname "$0")"
TIMEOUT=7200
PARTES="${PARTES:-1 2}"     # p. ej. PARTES=2 sh pipeline.sh para correr solo la Parte II

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
docker compose exec -T jupyter sh -c 'chmod -R a+rwX /home/jovyan/work/data /home/jovyan/work/0*'

run() { docker compose exec -T -u jovyan jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT "$1"; }

for p in $PARTES; do
  case "$p" in
    1)
      echo "== 1. Parte I: EDA y KDD =="
      run 01_EDA_KDD/EDA/a_entendimiento.ipynb
      run 01_EDA_KDD/EDA/b_exploracion.ipynb
      run 01_EDA_KDD/EDA/c_justificacion.ipynb
      run 01_EDA_KDD/KDD/a_transformaciones.ipynb
      run 01_EDA_KDD/KDD/b_artefactos.ipynb
      run 01_EDA_KDD/KDD/c_recuento.ipynb
      ;;
    2)
      echo "== 2. Parte II: Clustering y anomalías =="
      run 02_Clustering/a_preparacion.ipynb
      run 02_Clustering/b_kmeans.ipynb
      run 02_Clustering/c_densidad.ipynb
      run 02_Clustering/d_jerarquico.ipynb
      run 02_Clustering/e_analisis.ipynb
      ;;
  esac
done

echo "== Pipeline terminado =="
