---
license: apache-2.0
language:
- es
tags:
- remote-sensing
- sar
- sentinel-1
- illegal-mining
- environmental-monitoring
- amazon
- colombia
- gold-mining
- mercury-contamination
datasets:
- copernicus/s1-grd-amazon-colombia-2018-2026
pipeline_tag: image-segmentation
library_name: earthengine
model-index:
- name: freddy-hg-sar-mining-detector
  results:
  - task:
      type: object-detection
      name: Fluvial dredge detection (proxy)
    dataset:
      type: maap-program/manual-annotations
      name: MAAP/Armada Colombia (ground truth)
    metrics:
    - type: true-positive-rate
      value: 78
      name: TPR (proxy, Schwartz et al. 2019)
    - type: false-positive-rate
      value: 22
      name: FPR (proxy, Schwartz et al. 2019)
---

# ☿ Freddy Hg — SAR Mining Detector

> **Open-source detector of illegal fluvial gold dredges in the Colombian
> Amazon, based on Sentinel-1 SAR imagery and Google Earth Engine.**

## Model description

Freddy Hg detects metallic dredges over Amazon rivers using a thresholded
backscatter algorithm on **Sentinel-1 SAR GRD** (C-band, VV polarization).
Dredges (15–25 m vessels with metallic decks and dredging gear) act as
**dihedral corner reflectors**, returning 17–30 dB more backscatter than
the specular water surface around them.

The system enriches each detection with:

1. **ANM geofencing** — checks if the point falls within an active mining
   concession (legal vs. presumptive illegal).
2. **RAISG indigenous territory check** — escalates alerts that intersect
   protected indigenous reserves (T-106/25 protocol).
3. **Confidence level (1/2/3)** combining SAR signal, historical change
   detection, and indigenous overlay.
4. **SHA-256 chain of custody** of source data + metadata for digital
   evidence admissibility under Colombian Law 1333/2009.
5. **Mistral AI contextual enrichment** — adds a natural-language summary
   and proxy impact metrics (Hg estimated, USD damage, people at risk).

This is **not a deep learning model with downloadable weights**. It is a
deterministic geospatial pipeline whose code is open-source. The "model
card" exists to document its algorithm, intended use, evaluation, and
known limitations following the same transparency standards used for
trained models.

## Intended use

### Primary use case

- Early-warning detection of illegal fluvial gold mining for environmental
  authorities (CARs) in the Colombian Amazon.
- Generation of legally-admissible evidence (PDF + SHA-256) for
  sanctioning procedures under Law 1333/2009.
- Push notifications via WhatsApp/SMS to indigenous guardians.

### Out-of-scope use cases

- **Terrestrial mining detection** — Freddy Hg targets fluvial dredges
  specifically. Use Amazon Mining Watch or MapBiomas for deforestation
  signatures.
- **Sub-meter detection** — Sentinel-1 resolution is 10 m. Objects smaller
  than ~200 m² cannot be reliably detected.
- **Real-time detection** — Sentinel-1 revisit is 6 days (Sentinel-1C
  restored). The system is *near-real-time*, not live.
- **Automatic legal action** — alerts must be field-verified by competent
  authorities before any sanction is issued.

## Algorithm overview

```python
# Pseudocode of the core detection
roi = ee.Geometry.Rectangle([xmin, ymin, xmax, ymax])

# 1. Load Sentinel-1 IW GRD, VV polarization, last 60 days
s1 = (ee.ImageCollection("COPERNICUS/S1_GRD")
      .filterBounds(roi)
      .filterDate(start, end)
      .filter(ee.Filter.eq("instrumentMode", "IW"))
      .select("VV"))

# 2. Median composite reduces speckle and transient noise
median_current = s1.median()

# 3. Water mask: pixels where VV < -15 dB (specular reflector)
water_mask = median_current.lt(-15.0)

# 4. Bright targets: pixels where VV > -12 dB (corner reflector)
bright = median_current.gt(-12.0)

# 5. Candidates: bright AND on water AND ≥ MIN_PIXELS contiguous
candidates = bright.And(water_mask)
min_size_mask = candidates.connectedPixelCount(MIN_PIXELS + 1).gte(MIN_PIXELS)
candidates_filtered = candidates.And(min_size_mask)

# 6. Change detection vs 2018-2019 historical baseline
s1_baseline = (ee.ImageCollection("COPERNICUS/S1_GRD")
               .filterBounds(roi)
               .filterDate("2018-01-01", "2019-12-31")
               .select("VV")).median()
change = median_current.subtract(s1_baseline)
new_activity = change.gt(5)

# 7. Vectorize centroids of candidate clusters
detections = candidates_filtered.reduceToVectors(geometryType="centroid")
```

Full implementation:
[github.com/ByZocar/Freddy-Hg/blob/main/pipeline/freddy_detection.py](https://github.com/ByZocar/Freddy-Hg/blob/main/pipeline/freddy_detection.py)

## Training data

This is not a trained model. The detection rules are based on:

- **Physical principles** of SAR backscatter on dihedral corner reflectors
  in water environments.
- **Empirical thresholds** from peer-reviewed literature:
  - Schwartz et al. (2019) — Madeira basin, Brazil
  - Goncalves et al. (2021) — Tapajós basin, Brazil

The pilot ROIs used for system testing include ground truth from:

- **MAAP #228** (May 2025): 56 dragas documentadas en el río Puré.
- **Armada Nacional de Colombia** (Feb–Mar 2026): 27 dredges destroyed in
  the Atrato river, providing position references.
- **Sentencia T-106/25** Constitutional Court: zones affected in the
  Jaguares del Yuruparí macro-territory (Caquetá and Apaporis rivers).

## Evaluation metrics

Empirically validated metrics for the **Colombian Amazon basin** are
**not yet available**. The system is in pilot. Proxy metrics from
analogous studies (Brazilian Amazon, same sensor, same vessel type):

| Source | Region | TPR | FPR | Threshold |
|--------|--------|-----|-----|-----------|
| Schwartz et al. 2019 | Madeira | 78% | 22% | VV > -10 dB |
| Goncalves et al. 2021 | Tapajós | 74% | 31% | VV > -10 dB |

Calibration work in progress with Corpoamazonía and CDA Guainía pilots.
First field-validation report expected Q3 2026.

## Limitations and biases

### Known false positives

| Source | Mitigation |
|--------|-----------|
| Sandbars in braided rivers (dry season) | Historical baseline (2018-2019) change detection |
| Legitimate boats in transit | Median multi-temporal compositing |
| Permanent riverside infrastructure (docks, camps) | Excluded by baseline comparison |
| Layover in narrow forested canyons | Documented; affected pixels excluded |
| Flooded vegetation with double-bounce | Strict water mask (VV < -15 dB) |

### Known false negatives

- **Dredges smaller than ~200 m²** — below Sentinel-1 resolution.
- **Dredges actively masked by tree canopy** — possible in narrow tributaries.
- **First-pass dredges in zones not covered by baseline** — change
  detection misses them in the first 6-day cycle.

### Geographic bias

The system has only been tuned for three Colombian Amazon basins:

- Caquetá / Apaporis (Amazonas-Caquetá)
- Inírida (Guainía)
- Atrato (Chocó)

Performance outside these basins is unknown. Different river morphology,
sediment loads, or vegetation density may require threshold recalibration.

### Environmental bias

The model implicitly assumes:

- **Tropical wet climate** with characteristic Amazon hydrology.
- **Dredges with metallic decks** ≥ 200 m².
- **No prior major hydraulic interventions** (large dams change SAR signature).

## Ethical considerations

This model identifies coordinates where **illegal activity may be
occurring**. That data is sensitive:

- **Field verification is mandatory** before sanctions or armed
  interventions — false positives could expose innocent communities.
- **Indigenous territory alerts** (Level 3) activate human-rights
  protocols. The system never replaces FPIC (Free, Prior and Informed
  Consent) procedures.
- **Guardian alerts** are sent without storing recipient phone numbers
  identifiable in logs. The hash → secret-ref design protects guardians
  in conflict zones.
- **The pipeline is open-source** to allow independent audit by
  journalists, prosecutors, and academia.

## Recommendations

For environmental authorities (CARs):
- Always verify in field before issuing cautionary measures.
- Conserve the SHA-256 hash from the PDF as legal proof.
- Document confirmed false positives back to the system for retraining.

For journalists and researchers:
- Public alerts at `/public` are 30 days delayed (CC BY 4.0).
- Cite by alert ID + SHA-256 + Sentinel-1 scene ID.
- Read `/docs/accuracy` before publishing impact figures.

## Citation

```bibtex
@software{freddy_hg_2026,
  title  = {Freddy Hg: SAR-based detection of illegal fluvial gold dredges
            in the Colombian Amazon},
  author = {Cardozo, Andrés Felipe and contributors},
  year   = {2026},
  url    = {https://github.com/ByZocar/Freddy-Hg},
  license = {Apache-2.0},
  version = {1.1.0}
}
```

## Contact and contributions

- **Repository:** https://github.com/ByZocar/Freddy-Hg
- **Live demo:** https://freddy-hg.vercel.app
- **API documentation:** https://freddy-hg-backend-production.up.railway.app/docs
- **Issues:** https://github.com/ByZocar/Freddy-Hg/issues

Contributions are welcome under Apache 2.0. See `CONTRIBUTING.md` in the
repository for guidelines.

## Acknowledgments

- **ESA / Copernicus** for free open access to Sentinel-1 SAR imagery.
- **Google Earth Engine** for free compute for conservation projects.
- **ANM Colombia** for the public mining concession registry.
- **RAISG** for the indigenous territory polygons of the Amazon basin.
- **Mistral AI** for context enrichment via OpenRouter.
- **Corpoamazonía, CDA Guainía, FCDS, Gaia Amazonas, OPIAC** as pilot partners.

---

*Last updated: May 2026 · v1.1.0*
