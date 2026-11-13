Con el EDA (planteamiento) y las transformaciones ya realizadas, se puede realizar el resto de los procesos. Voy a hacer por ahora lo de grafos y deteccion de comunidades. Entonces, primero lo que necesito que hagas es que leas el README, y te informes sobre lo planteado y avanzado, y lo que necesito hallar; especificamente sobre lo relacionado a grafos y detccion de comunidades.

La idea que tengo es seguir lo planteado en el EDA y transformaciones. Igualmente te dejo las indicaciones del enunciado.

## PARTE V. GRAFOS Y DETECCIÓN DE COMUNIDADES

Uso de Spark: opcional (métodos exactos sobre subgrafo; variantes escalables sobre el grafo completo).

Objetivo: segmentar el mercado en comunidades y evaluar su calidad.

- Aplicar al menos un método de partición (Girvan-Newman / XXXimp betweenness o clustering espectral) sobre un subgrafo manejable, evaluando con modularidad Q.
- Abordar comunidades solapadas con AGM o BigCLAM (al menos sobre un subgrafo), dado que un proveedor suele participar en varios mercados o consorcios.
- Discutir la escalabilidad: por qué los métodos exactos exigen submuestra y qué variantes permiten mayor escala.
- Interpretar las comunidades (mercados, regiones, agrupaciones a revisar), con encuadre ético.

Lo que pretendo es que sigas la estructura a manera de formato de los notebooks que ya he hecho: la numeracion, la extension de texto y de codigo, y la cantidad de graficas que sea razonable (guiate de lo que ya realizado). Procurar que el texto, a menos que no sea necesario, sea a manera de bullet points concisos para transmitir la información puntual y necesaria.

La estructura de carpetas que tengo planteada es la que encontraras dentro de 05_Recomend, pero es una base que tengo, no implica que no pueda ser cambiada o reestructurada.

Para cualquier parametro que tomes (por ejemplo el soporte minimo, confianza minima) dejalo justificado. No tiene que ser largo, solo puntual y conciso.

La idea es que cada notebook genere data que alimente el siguiente (en caso sea necesario), dentro de la misma carpeta de `05_Recomend` tener una carpeta de `temp` donde esta esa data temporal con la que se hace la alimentacion de un notebook a otro.

La data a usar esta en `data` y adicionalmente tambien te dejo el enunciado del trabajo a realizar en caso tengas dudas. Cualquier duda que tengas, porfavor hazmela saber y te la aclaro.

https://docs.google.com/document/d/1CwJscutDaYOB9zjGMHdtjEcsdN_C0USj/edit?usp=sharing&ouid=117787070913034951591&rtpof=true&sd=true

Eres libre de agregar lo que consideres neceseario a lo que tengo planteado.