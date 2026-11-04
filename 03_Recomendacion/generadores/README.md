# Generadores de notebooks (Parte III)

Cada `gen_p3<x>.py` escribe el notebook correspondiente de `03_Recomendacion/` (sin salidas):

| Script | Notebook |
|---|---|
| `gen_p3a.py` | `funciones.ipynb`, `a_preparacion_split.ipynb` |
| `gen_p3b.py` | `b_baseline_als.ipynb` |
| `gen_p3c.py` | `c_contenido_ann.ipynb` |
| `gen_p3d.py` | `d_hibrido_evaluacion.ipynb` |
| `gen_p3e.py` | `e_analisis_sustitutos.ipynb` |

Uso, desde esta carpeta:

```bash
python gen_p3a.py ..                       # funciones + a_preparacion_split
python gen_p3a.py .. funciones.ipynb       # solo funciones
python gen_p3b.py ..                       # b_baseline_als (igual c, d, e)
```

Regenerar **sobrescribe** el notebook y borra sus salidas: luego hay que ejecutarlo (`pipeline.sh` o Jupyter).
Para cambiar un notebook, edita el generador y regenera; así el código y el texto no se desincronizan.
