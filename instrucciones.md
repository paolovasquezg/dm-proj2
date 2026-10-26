# Proyecto de minería de datos: contrataciones públicas en Perú (2023 - 2025)

Estoy realizando un proyecto de minería de datos sobre las contrataciones públicas en Perú en el periodo 2023 - 2025. Este proyecto incluye proceso de EDA, transformaciones, clustering y anomalías, sistemas de recomendación, análisis de enlaces (PageRank y HITS), grafos y detección de comunidades, aprendizaje y representación en grafos.

En esta primera etapa estoy realizando el EDA y las transformaciones. Para el EDA, sería específicamente la exploración, planteamiento y justificación de lo que se va a hacer y en qué se va a enfocar cada una de las etapas posteriores. Para las transformaciones, sería plantear las transformaciones que se harán para cada técnica y qué se hará con la data.

## Plan para esta primera etapa

Mi plan para esta primera etapa es realizar el entendimiento mediante el EDA, y luego las transformaciones. La estructura que tengo planteada es la siguiente:

### 1. EDA

1. Descripción del dataset con entendimiento del negocio
2. Describir las columnas del dataset e indicar qué información proporcionan
3. Ver la calidad de datos: nulos, outliers y demás
4. Análisis univariable
5. Análisis multivariable
6. Justificar la factibilidad de las técnicas con la data
   - Clustering y detección de anomalías
   - Sistemas de recomendación
   - Análisis de enlaces: PageRank y HITS
   - Grafos y detección de comunidades
   - Aprendizaje de representación en grafos
7. Detallar qué se quiere hallar con cada técnica
   - Clustering y detección de anomalías
   - Sistemas de recomendación
   - Análisis de enlaces: PageRank y HITS
   - Grafos y detección de comunidades
   - Aprendizaje de representación en grafos

### 2. Transformaciones

- Planteamiento de las transformaciones
- Transformaciones
- Detalle de las transformaciones (para qué se usa lo resultante)
- Recuento de lo que se hizo, y las columnas que se usan por fila y demás

## Requisitos de formato

- Lo que necesito es que tu desarrollo sea **conciso y puntual**, y que se entienda como si estuvieras leyendo un informe.
- No requiero muchísima información, solo lo necesario y justo para poder entenderlo.
- Tampoco quiero código muy extenso en las celdas; es decir, necesito que trates de **segmentar en diferentes celdas o incluso modularizar y reutilizar código**.
- Las cosas deben ser concisas y mayormente a manera de **bullet points**.

## Archivos previos

Estoy dejándote inicialmente los archivos de lo que tenía anteriormente:

- `docker.ipynb` (que maneja todo en Dockers con Spark)
- `00_EDA`
- `01_Trans`

Te sugiero que leas estos archivos, y también `file:///Users/paolovasquezgrahammer/Desktop/dm/dm-proj1` como proyecto pasado para guiarte de:

- La extensión del código y texto que estoy esperando.
- Cómo se ejecutan los Dockers con Spark dentro.

## Datos

- La data que se va a usar está en la carpeta `data`, cada una dentro de la carpeta de su año. Mira la data para que puedas apreciarla.
- Adicionalmente, te dejo el link directo a la data publicada por el gobierno peruano:
  https://contratacionesabiertas.oece.gob.pe/descargas?page=1&paginateBy=10

## Estructura de carpetas

Te dejo la estructura de carpetas inicial, pero eres libre de cambiarla si lo consideras mejor. Creería que sería bueno que en la carpeta `01_EDA` esté segmentado por partes (entendimiento, exploración, justificación), y luego en `02_Tran` quizás igual (planteamiento, transformaciones, recuento). Pero eso es solo mi idea.

```
00_EDA/
├── a_entendimiento.ipynb
├── b_exploracion.ipynb
└── c_justificacion.ipynb
01_Trans/
├── a_planteamiento
├── b_transformaciones
├── c_uso
└── d_recuento
```

## Requisitos de la sección de transformaciones (según el enunciado)

Te dejo adicionalmente lo que el enunciado pide para la sección de transformaciones, ya que la sección de EDA ya está como que implícita en el proyecto:

- **Uso de Spark:** obligatorio en toda esta parte.
- **Objetivo:** dejar lista, sobre Spark, la base relacional que alimentará a las demás partes.
- Aplanar y transformar los datos (OCDS en JSON o CSV relacional) al grano de análisis elegido. Se asume que la limpieza y el EDA ya fueron resueltos.
- Abordar la resolución de entidades de proveedores/compradores (identificadores duplicados).
- Construir y exportar los artefactos base: vectores de características, la matriz de interacción y el grafo, por co-participación o, cuando convenga, un grafo KNN sobre los vectores, documentando el criterio de aristas.
- Explicar el particionamiento y cómo afecta al plan de ejecución.

## Enunciado del proyecto

Adicionalmente te dejo el link al enunciado del proyecto, para que te guíes de mejor manera en caso lo necesites:

https://docs.google.com/document/d/1CwJscutDaYOB9zjGMHdtjEcsdN_C0USj/edit?usp=sharing&ouid=117787070913034951591&rtpof=true&sd=true

## Dudas

- Si tuvieras alguna duda adicional, por favor hazla y te aclararé lo que necesites.
- Si faltara alguna información de la que he detallado, o no pudieras acceder a algo, también házmelo saber.
- Cualquier aspecto o sección adicional que creas relevante de incluir puedes hacerlo, pero todo debe estar debidamente justificado.
- Recuerda que las cosas deben ser concisas y mayormente a manera de bullet points.
- Toma como referencia este proyecto anterior: https://github.com/paolovasquezg/dm-proj1.git