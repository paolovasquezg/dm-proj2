Con el EDA (planteamiento) y las transformaciones ya realizadas, se puede realiza el resto de los procesos. Voy a hacer por ahora lo de sistemas de recomendacion. Entonces, primero lo que necesito que hagas es que leas es el EDA (00_EDA), y te informes sobre todo lo planteado y lo que necesito hallar; especificamente sobre sistemas de recomendación.

La idea que tengo es seguir lo planteado en el EDA y transformaciones. Igualmente te dejo las indicaciones del enunciado.

## Indicaciones del enunciado

**Objetivo:** modelar la relación entidad–proveedor/categoría y analizar la estructura del mercado.

- Construir la matriz de interacción implícita (señal, p. ej., número de contratos o monto).
- Implementar al menos dos enfoques entre: filtrado colaborativo de vecindario (user-user / XXXimp-item), basado en contenido (TF-IDF de descripciones o clasificación de ítems) y factores latentes (factorización de matrices / ALS).
- Para el filtrado por contenido a gran escala pueden usar búsqueda aproximada de vecinos (IVF o HNSW) sobre los vectores de ítems; se valora ensamblar filtrado colaborativo y por contenido en un recomendador híbrido.
- Evaluar (p. ej. Hold-out, métricas de ranking) e interpretar: proveedores sustitutos por categoría, afinidades inusuales. Mantener el encuadre analítico, no prescriptivo sobre a quién contratar.

Lo que pretendo es que sigas la estructura a manera de formato de los notebooks que ya he hecho: la numeracion, la extension de texto y de codigo. Procurar que el texto, a menos que no sea necesario, sea a manera de bullet points concisos para transmitir la información puntual y necesaria.

La estructura de carpetas que tengo planteada es la que encontraras dentro de 03_Recomend, pero es una base que tengo, no implica que no pueda ser cambiada o reestructurada.

Para cualquier parametro que tomes (por ejemplo el soporte minimo, confianza minima) dejalo justificado. No tiene que ser largo, solo puntual y conciso.

La idea es que cada notebook genere data que alimente el siguiente (en caso sea necesario), dentro de la misma carpeta de `03_Recomend` tener una carpeta de `temp` donde esta esa data temporal con la que se hace la alimentacion de un notebook a otro.

La data a usar esta en `data` y adicionalmente tambien te dejo el enunciado del trabajo a realizar en caso tengas dudas. Cualquier duda que tengas, porfavor hazmela saber y te la aclaro.

https://docs.google.com/document/d/1CwJscutDaYOB9zjGMHdtjEcsdN_C0USj/edit?usp=sharing&ouid=117787070913034951591&rtpof=true&sd=true

Eres libre de agregar lo que consideres neceseario a lo que tengo planteado.