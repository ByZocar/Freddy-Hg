# Uso del PDF en procesos sancionatorios — Freddy Hg

**Cumple NF-12 (Ley 1333/2009 y CGP).**

## Qué genera el sistema

Cada alerta produce un PDF auto-contenido con:

1. **Origen de la detección**: sensor, escena Sentinel-1, fecha UTC, colección, algoritmo y versión.
2. **Localización geoespacial**: latitud/longitud WGS84 (6 decimales), backscatter VV, área en m².
3. **Calificación legal**: estado ANM, concesión asociada, territorio indígena (RAISG),
   pueblo, protocolo DDHH requerido, nivel de confianza.
4. **Cadena de custodia digital**: SHA-256 de los datos canónicos. Hash
   reproducible sobre los metadatos por cualquier tercero.
5. **Cita recomendada**: texto listo para insertar en un Auto de Apertura.
6. **Limitaciones del modelo**: enlace a la nota de precisión.

## Cómo se cita una alerta

```
Freddy Hg (2026). Alerta satelital <id-corto>. Sistema de monitoreo SAR
de minería ilegal en la Amazonía colombiana.
URL: https://app.freddyhg.org/alert/<id>
SHA-256: <hash>
```

## Cómo verifica un tercero la integridad

1. Descargar la escena Sentinel-1 GRD original (gratis, ESA Copernicus, ID en el PDF).
2. Recomputar el hash con el algoritmo `freddy-hg-v1.0` (open source bajo
   Apache 2.0, en este repo en `backend/services/sha256_chain.py`).
3. Comparar con el hash del PDF. Si coincide, la cadena de custodia está
   intacta.

## Limitaciones legales

- El PDF acompaña pero no sustituye la verificación de campo.
- La calificación de ilegalidad depende de la API ANM
  (`datos.gov.co/resource/si2v-pbq5.json`), que es la fuente oficial.
- Para procesos ante la Fiscalía DEMA, recomendamos acompañar el PDF
  con la imagen SAR fuente (descargable desde el dashboard) y un
  testimonio del funcionario verificador.

## Marco normativo aplicable

- **Ley 1333 de 2009** — Procedimiento Sancionatorio Ambiental.
- **Código General del Proceso, Ley 1564/2012** — admisibilidad de
  evidencia digital (Arts. 243 y 244).
- **Sentencia T-106/25** — protección del territorio amazónico y de
  los pueblos indígenas en relación con minería ilegal.
- **NTC 5613:2008** — citación bibliográfica colombiana.
