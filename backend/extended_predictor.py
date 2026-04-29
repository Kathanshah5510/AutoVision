# extended_predictor.py
"""
Full prediction pipeline combining:
  - YOLO damage detection (from image)
  - Vehicle metadata (from user input)
→ final_claim_amount (INR)
"""

import json
import numpy as np
import joblib
from pathlib import Path
from ultralytics import YOLO

# ── Car segment lookup (maps user-entered model → segment) ────────────────────
CAR_SEGMENT_MAP = {
    # hatchback
    "alto": "hatchback", "swift": "hatchback", "wagon r": "hatchback",
    "i10": "hatchback", "i20": "hatchback", "polo": "hatchback",
    "baleno": "hatchback", "tata tiago": "hatchback",
    # sedan
    "dzire": "sedan", "honda city": "sedan", "verna": "sedan",
    "ciaz": "sedan", "tata tigor": "sedan",
    # compact suv
    "brezza": "suv_compact", "venue": "suv_compact", "sonet": "suv_compact",
    "tata nexon": "suv_compact", "magnite": "suv_compact",
    # full suv
    "creta": "suv_full", "seltos": "suv_full", "tata harrier": "suv_full",
    "xuv700": "suv_full", "fortuner": "suv_full", "endeavour": "suv_full",
    # luxury
    "bmw": "luxury", "audi": "luxury", "mercedes": "luxury",
    "volvo": "luxury", "jaguar": "luxury",
}

SEGMENT_MULTIPLIERS = {
    "hatchback": 1.0, "sedan": 1.3, "suv_compact": 1.5,
    "suv_full": 2.0,  "luxury": 3.5,
}

DEPRECIATION = {0: 0.05, 1: 0.15, 2: 0.20, 3: 0.30, 4: 0.40, 5: 0.50, 6: 0.60}

BASE_COST_INR = {
    "dent": (3000, 10000), "scratch": (1500, 6000), "crack": (5000, 15000),
    "glass shatter": (8000, 25000), "tire flat": (2000, 8000), "lamp broken": (3500, 12000),
}
CLASS_NAMES = ["dent", "scratch", "crack", "glass shatter", "tire flat", "lamp broken"]


def resolve_segment(car_model: str) -> str:
    """Map user-entered car model string → segment key."""
    model_lower = car_model.lower().strip()
    for key, segment in CAR_SEGMENT_MAP.items():
        if key in model_lower:
            return segment
    return "sedan"  # safe default


def get_depreciation_factor(car_age: int) -> float:
    age = min(car_age, 6)
    return 1.0 - DEPRECIATION[age]


class ExtendedPredictor:

    def __init__(
        self,
        yolo_path: str,
        model_path: str = "models/extended_cost_model.pkl",
        scaler_path: str = "models/extended_scaler.pkl",
        metadata_path: str = "models/extended_model_metadata.json",
    ):
        self.yolo   = YOLO(yolo_path)
        self.model  = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        with open(metadata_path) as f:
            self.meta = json.load(f)
        self.feature_names = self.meta["feature_names"]

    def _run_yolo(self, image_path: str):
        results  = self.yolo(image_path, verbose=False)[0]
        img_h, img_w = results.orig_shape
        detections = []
        for box in results.boxes:
            cls_id = int(box.cls.item())
            conf   = float(box.conf.item())
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
            detections.append({
                "class":      CLASS_NAMES[cls_id],
                "class_id":   cls_id,
                "confidence": round(conf, 3),
                "bbox":       [round(x1), round(y1), round(x2), round(y2)],
            })
        return detections, img_w, img_h

    def _build_features(
        self,
        detections: list,
        img_w: int,
        img_h: int,
        car_model: str,
        car_age: int,
        km_driven: int,
    ) -> np.ndarray:
        img_area = img_w * img_h
        segment  = resolve_segment(car_model)
        seg_mult = SEGMENT_MULTIPLIERS[segment]
        dep_fac  = get_depreciation_factor(car_age)

        # Approximate IDV from segment (no exact price needed)
        segment_avg_price = {
            "hatchback": 550_000, "sedan": 900_000, "suv_compact": 1_200_000,
            "suv_full": 2_000_000, "luxury": 5_000_000,
        }
        est_purchase_price = segment_avg_price[segment]
        idv = est_purchase_price * dep_fac

        class_counts = {c: 0 for c in CLASS_NAMES}
        areas, confs, sev_scores = [], [], []
        sev_map = {"small": 1, "medium": 2, "large": 3}

        for det in detections:
            area_frac = (
                (det["bbox"][2] - det["bbox"][0]) *
                (det["bbox"][3] - det["bbox"][1])
            ) / img_area
            if area_frac < 0.05:   sev = "small"
            elif area_frac < 0.15: sev = "medium"
            else:                  sev = "large"

            class_counts[det["class"]] += 1
            areas.append(area_frac)
            confs.append(det["confidence"])
            sev_scores.append(sev_map[sev])

        n = len(detections)
        km_per_year = km_driven / max(car_age, 1)

        features = {
            # Vehicle
            "car_age":             car_age,
            "km_driven":           km_driven,
            "km_per_year":         km_per_year,
            "purchase_price":      est_purchase_price,
            "idv":                 idv,
            "is_luxury":           int(segment == "luxury"),
            "is_premium":          int(segment in ["suv_full", "luxury"]),
            "segment_multiplier":  seg_mult,
            "depreciation_factor": dep_fac,
            "is_high_mileage":     int(km_driven > 80_000),
            "is_old_car":          int(car_age > 5),
            # Damage
            "damage_count":        n,
            "total_area_frac":     sum(areas),
            "max_area_frac":       max(areas) if areas else 0,
            "avg_area_frac":       sum(areas) / n if n else 0,
            "avg_confidence":      sum(confs) / n if n else 0,
            "min_confidence":      min(confs) if confs else 0,
            "max_severity_score":  max(sev_scores) if sev_scores else 0,
            "avg_severity_score":  sum(sev_scores) / n if n else 0,
            # Damage type counts
            **{f"count_{c.replace(' ', '_')}": class_counts[c] for c in CLASS_NAMES},
            # Binary flags
            "has_glass_shatter":   int(class_counts["glass shatter"] > 0),
            "has_crack":           int(class_counts["crack"] > 0),
            "has_lamp_broken":     int(class_counts["lamp broken"] > 0),
            "damage_value_ratio":  sum(areas) * est_purchase_price / 100_000,
        }

        vec = np.array([[features[f] for f in self.feature_names]])
        return self.scaler.transform(vec)

    def predict(
        self,
        image_path: str,
        car_model: str,
        car_age: int,
        km_driven: int,
    ) -> dict:

        detections, img_w, img_h = self._run_yolo(image_path)

        if not detections:
            return {
                "detections":      [],
                "damage_count":    0,
                "claim_amount":    0,
                "claim_min":       0,
                "claim_max":       0,
                "severity":        "No damage detected",
                "claim_recommended": False,
                "vehicle_info":    {
                    "car_model": car_model, "car_age": car_age,
                    "km_driven": km_driven, "segment": "unknown",
                },
            }

        feature_vec   = self._build_features(
            detections, img_w, img_h, car_model, car_age, km_driven
        )
        claim_amount  = max(0, float(self.model.predict(feature_vec)[0]))

        # ±20% confidence interval
        claim_min = round(claim_amount * 0.80)
        claim_max = round(claim_amount * 1.20)
        claim_amount  = round(claim_amount)

        # Severity label
        if claim_amount < 5_000:     severity, rec = "Minor",    False
        elif claim_amount < 20_000:  severity, rec = "Moderate", True
        elif claim_amount < 60_000:  severity, rec = "Severe",   True
        else:                         severity, rec = "Major",    True

        segment = resolve_segment(car_model)
        dep_fac = get_depreciation_factor(car_age)

        return {
            "detections":       detections,
            "damage_count":     len(detections),
            "claim_amount":     claim_amount,
            "claim_min":        claim_min,
            "claim_max":        claim_max,
            "severity":         severity,
            "claim_recommended": rec,
            "vehicle_info": {
                "car_model":           car_model,
                "car_age":             car_age,
                "km_driven":           km_driven,
                "segment":             segment,
                "depreciation_factor": round(dep_fac, 2),
                "idv_estimate":        round(
                    {"hatchback": 550_000, "sedan": 900_000, "suv_compact": 1_200_000,
                     "suv_full": 2_000_000, "luxury": 5_000_000}[segment] * dep_fac
                ),
            },
        }