# Nota de precisión y falsos positivos — Freddy Hg

**Última actualización:** Mayo 2026
**Cumple NF-10** (T09).

---

## Resumen

Freddy Hg detecta retrodispersión SAR > −10 dB sobre cuerpos de agua,
buscando objetos metálicos brillantes — típicamente dragas auríferas
fluviales en la Amazonía colombiana. El modelo es deliberadamente simple
y transparente. **Genera falsos positivos. Cada alerta requiere
verificación de un funcionario CAR o un guardián.**

## Tipos de falsos positivos conocidos

| Tipo | Causa | Frecuencia estimada |
|------|-------|--------------------|
| Embarcaciones legales (chalupas, lanchas) | También son metálicas y reflejan SAR. | Alta |
| Estructuras flotantes ajenas a minería (muelles, casas-balsa) | Reflectores de esquina similares. | Media |
| Reflejos por viento sobre agua en zonas estrechas | Geometría que retrodispersa señal. | Baja |
| Cambios de mascara de agua por crecientes | El umbral de agua falla con sedimento alto. | Baja-Media |

## Limitaciones conocidas

- Resolución 10 m: dragas <200 m² son detectables sólo si tienen ≥2 píxeles contiguos.
- Sin confirmación óptica Sentinel-2 (V2).
- Sin clasificación entre minería ilegal y semilegal (la dimensión legal
  se resuelve por geofencing ANM, no por el sensor).
- Frecuencia 6 días: una draga que llega y se va en menos de ese
  período puede no ser capturada.

## Cómo distinguir verdadero positivo en campo

1. Visitar el punto con respecto a las coordenadas WGS84 publicadas.
2. Verificar la presencia de infraestructura típica: motor diésel,
   chorro de agua, manguera de succión, panel de concentración.
3. Cruzar con concesiones ANM vigentes (campo `legal_status` en la
   alerta).
4. Si está dentro de un resguardo, activar el protocolo DDHH.

## Métricas históricas

| Período | Alertas generadas | Verdaderos positivos (verificados en campo) | Falsos positivos | Precisión |
|---------|-------------------|---------------------------------------------|------------------|-----------|
| MVP piloto (en curso) | — | — | — | — |

Esta tabla se actualizará mensualmente con los reportes de los
funcionarios CAR del piloto.

## Cómo reportar un falso positivo

Cualquier funcionario CAR puede marcar una alerta como
`falso_positivo` desde el dashboard. El dato se incorpora al
entrenamiento del modelo en la próxima iteración (Sprint post-piloto).
