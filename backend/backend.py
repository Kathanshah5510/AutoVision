# # backend.py
# import tempfile, os, base64, io
# from fastapi import FastAPI, File, UploadFile, Form
# from fastapi.middleware.cors import CORSMiddleware
# from extended_predictor import ExtendedPredictor
# from PIL import Image, ImageDraw

# app = FastAPI(title="AutoVision Extended API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"]
# )

# # Initialize Predictor
# predictor = ExtendedPredictor(
#     yolo_path="../models/best.pt",
#     model_path="../models/extended_cost_model.pkl",
#     scaler_path="../models/extended_scaler.pkl",
#     metadata_path="../models/extended_model_metadata.json"
# )

# PALETTE = ["#e63946", "#2a9d8f", "#e9c46a", "#f4a261", "#264653", "#a8dadc"]

# def hex_to_rgb(h: str):
#     h = h.lstrip("#")
#     return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

# def annotate_image(img_path: str, detections: list) -> str:
#     """Draw boxes on image, return base64 JPEG string."""
#     img_pil = Image.open(img_path).convert("RGB")
#     draw = ImageDraw.Draw(img_pil)
    
#     for det in detections:
#         x1, y1, x2, y2 = det["bbox"]
#         cls_name  = det["class"]
#         conf      = det["confidence"]
#         color     = hex_to_rgb(PALETTE[det["class_id"] % len(PALETTE)])

#         # Box
#         draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

#         # Label background
#         label = f"{cls_name} {conf:.2f}"
#         text_bbox = draw.textbbox((x1, y1 - 18), label)
#         draw.rectangle(text_bbox, fill=color)
#         draw.text((x1, y1 - 18), label, fill="white")

#     buf = io.BytesIO()
#     img_pil.save(buf, format="JPEG", quality=90)
#     return base64.b64encode(buf.getvalue()).decode()

# @app.get("/health")
# def health():
#     return {"status": "ok"}

# @app.post("/predict")
# async def predict(
#     file: UploadFile = File(...),
#     car_model: str = Form("Swift"),
#     car_age: int = Form(3),
#     km_driven: int = Form(40000),
# ):
#     # Save uploaded image to temp file
#     with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
#         tmp.write(await file.read())
#         tmp_path = tmp.name

#     try:
#         result = predictor.predict(
#             image_path=tmp_path,
#             car_model=car_model,
#             car_age=car_age,
#             km_driven=km_driven,
#         )

#         # Add image annotation base64
#         result["annotated_image"] = annotate_image(tmp_path, result.get("detections", []))

#         # Map fields so frontend doesn't break
#         summary = {}
#         for d in result.get("detections", []):
#             d["class_name"] = d["class"]
#             d["bbox_pixels"] = d["bbox"]
#             summary[d["class"]] = summary.get(d["class"], 0) + 1
            
#             # The frontend falls back to BASE_COST if these are not here, 
#             # but we can set them to 0 as global cost is handled separately
#             d["cost_min"] = 0 
#             d["cost_max"] = 0
#             d["severity"] = "unknown"

#         result["damage_summary"] = summary
#         result["total_cost_min"] = result.get("claim_min", 0)
#         result["total_cost_max"] = result.get("claim_max", 0)
        
#         return result
#     finally:
#         os.unlink(tmp_path)

# backend.py
# ─────────────────────────────────────────────────────────────
# Phase 3 — FastAPI inference backend (Extended: vehicle-aware)
# Run: uvicorn backend:app --host 0.0.0.0 --port 8000 --reload
# ─────────────────────────────────────────────────────────────

import io, base64, json
from pathlib import Path
from typing import List, Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO  # type: ignore

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
# MODEL_PATH  = "D:/MTech/Sem-2/IT549-Deep_Learning-1/AutoVision/models/best.pt"
MODEL_PATH = "../models/best.pt"
CONF_THRESH = 0.25
IMG_SIZE    = 640

CLASS_NAMES = ["dent", "scratch", "crack", "glass shatter", "tire flat", "lamp broken"]
PALETTE     = ["#e63946", "#2a9d8f", "#e9c46a", "#f4a261", "#264653", "#a8dadc"]

# ── Severity thresholds (unchanged) ──────────────────────────
SEVERITY_THRESHOLDS = {"low": 0.01, "medium": 0.05}

# ── Base repair cost ranges (INR) — unchanged ─────────────────
COST_TABLE = {
    "dent":          {"low": (2000,  5000),  "medium": (5000, 15000),  "high": (15000, 40000)},
    "scratch":       {"low": (500,   2000),  "medium": (2000,  8000),  "high": (8000,  20000)},
    "crack":         {"low": (1000,  4000),  "medium": (4000, 12000),  "high": (12000, 35000)},
    "glass shatter": {"low": (3000,  8000),  "medium": (8000, 20000),  "high": (20000, 50000)},
    "tire flat":     {"low": (1500,  3000),  "medium": (3000,  6000),  "high": (6000,  15000)},
    "lamp broken":   {"low": (1000,  3000),  "medium": (3000,  8000),  "high": (8000,  20000)},
}

# ── NEW: Vehicle segment multipliers ─────────────────────────
# Maps car model keywords → repair cost multiplier
CAR_SEGMENT_MAP = {
    # hatchback (1.0x)
    "alto": "hatchback", "swift": "hatchback", "wagon r": "hatchback",
    "i10": "hatchback", "polo": "hatchback", "tiago": "hatchback",
    "baleno": "hatchback", "celerio": "hatchback", "kwid": "hatchback",
    # sedan (1.3x)
    "dzire": "sedan", "city": "sedan", "verna": "sedan",
    "ciaz": "sedan", "tigor": "sedan", "amaze": "sedan",
    # compact suv (1.5x)
    "brezza": "suv_compact", "venue": "suv_compact", "sonet": "suv_compact",
    "nexon": "suv_compact", "magnite": "suv_compact", "ecosport": "suv_compact",
    # full suv (2.0x)
    "creta": "suv_full", "seltos": "suv_full", "harrier": "suv_full",
    "xuv700": "suv_full", "fortuner": "suv_full", "endeavour": "suv_full",
    "scorpio": "suv_full", "safari": "suv_full",
    # luxury (3.5x)
    "bmw": "luxury", "audi": "luxury", "mercedes": "luxury",
    "volvo": "luxury", "jaguar": "luxury", "land rover": "luxury",
}

SEGMENT_MULTIPLIERS = {
    "hatchback":   1.0,
    "sedan":       1.3,
    "suv_compact": 1.5,
    "suv_full":    2.0,
    "luxury":      3.5,
}

# ── NEW: IDV depreciation schedule (IRDAI standard) ──────────
DEPRECIATION_SCHEDULE = {
    0: 0.05, 1: 0.15, 2: 0.20, 3: 0.30,
    4: 0.40, 5: 0.50, 6: 0.60,
}

# Average purchase price per segment (INR) — used to estimate IDV
SEGMENT_AVG_PRICE = {
    "hatchback":   550_000,
    "sedan":       900_000,
    "suv_compact": 1_200_000,
    "suv_full":    2_000_000,
    "luxury":      5_000_000,
}


# ─────────────────────────────────────────────────────────────
# NEW: VEHICLE HELPERS
# ─────────────────────────────────────────────────────────────
def resolve_segment(car_model: str) -> str:
    """Map user-entered car model string → segment key."""
    lower = car_model.lower().strip()
    for keyword, segment in CAR_SEGMENT_MAP.items():
        if keyword in lower:
            return segment
    return "sedan"  # safe default


def get_depreciation_factor(car_age: int) -> float:
    age = min(car_age, 6)
    return 1.0 - DEPRECIATION_SCHEDULE[age]


def get_km_multiplier(km_driven: int) -> float:
    """Higher km = more wear = higher repair cost."""
    if km_driven < 20_000:  return 0.90
    if km_driven < 50_000:  return 1.00
    if km_driven < 80_000:  return 1.10
    if km_driven < 120_000: return 1.20
    return 1.35


def get_age_parts_multiplier(car_age: int) -> float:
    """Older cars: parts scarcity drives up cost."""
    if car_age <= 2:  return 1.00
    if car_age <= 4:  return 1.08
    if car_age <= 6:  return 1.18
    if car_age <= 9:  return 1.30
    return 1.45


def compute_vehicle_multiplier(car_model: str, car_age: int, km_driven: int) -> float:
    """Combined cost multiplier from vehicle features."""
    seg_mult      = SEGMENT_MULTIPLIERS[resolve_segment(car_model)]
    km_mult       = get_km_multiplier(km_driven)
    age_parts_mul = get_age_parts_multiplier(car_age)
    return seg_mult * km_mult * age_parts_mul


# ─────────────────────────────────────────────────────────────
# EXISTING HELPERS (unchanged)
# ─────────────────────────────────────────────────────────────
def get_severity(bbox_area_norm: float) -> str:
    if bbox_area_norm < SEVERITY_THRESHOLDS["low"]:
        return "low"
    elif bbox_area_norm < SEVERITY_THRESHOLDS["medium"]:
        return "medium"
    return "high"


def get_cost_range(class_name: str, severity: str, vehicle_multiplier: float = 1.0):
    """Returns cost range scaled by vehicle multiplier."""
    row = COST_TABLE.get(class_name, COST_TABLE["dent"])
    base_min, base_max = row[severity]
    return round(base_min * vehicle_multiplier), round(base_max * vehicle_multiplier)


def hex_to_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def annotate_image(img_pil: Image.Image, detections: list) -> str:
    """Draw boxes on image, return base64 JPEG string."""
    draw = ImageDraw.Draw(img_pil)

    for det in detections:
        x1, y1, x2, y2 = det["bbox_pixels"]
        cls_name = det["class_name"]
        severity = det["severity"]
        conf     = det["confidence"]
        color    = hex_to_rgb(PALETTE[det["class_id"] % len(PALETTE)])

        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

        label     = f"{cls_name} [{severity}] {conf:.2f}"
        text_bbox = draw.textbbox((x1, y1 - 18), label)
        draw.rectangle(text_bbox, fill=color)
        draw.text((x1, y1 - 18), label, fill="white")

    buf = io.BytesIO()
    img_pil.save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode()


def get_claim_recommendation(total_cost_max: int) -> str:
    if total_cost_max == 0:     return "No damage detected"
    if total_cost_max < 5_000:  return "Self-pay recommended"
    if total_cost_max < 20_000: return "Consider filing a claim"
    return "File insurance claim"


# ─────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="AutoVision — Car Damage Detector", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"Loading model from {MODEL_PATH} ...")
model = YOLO(MODEL_PATH)
print("Model loaded ✅")


# ─────────────────────────────────────────────────────────────
# RESPONSE SCHEMAS
# ─────────────────────────────────────────────────────────────
class Detection(BaseModel):
    class_id:    int
    class_name:  str
    confidence:  float
    severity:    str
    bbox_pixels: List[int]
    bbox_norm:   List[float]
    area_norm:   float
    cost_min:    int
    cost_max:    int


# NEW: vehicle info block returned in response
class VehicleInfo(BaseModel):
    car_model:            str
    car_age:              int
    km_driven:            int
    segment:              str
    depreciation_factor:  float
    idv_estimate:         int
    vehicle_multiplier:   float


class PredictResponse(BaseModel):
    num_detections:       int
    detections:           List[Detection]
    total_cost_min:       int
    total_cost_max:       int
    annotated_image:      str
    damage_summary:       dict
    # NEW fields
    vehicle_info:         Optional[VehicleInfo] = None
    claim_recommendation: Optional[str]         = None


# ─────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_PATH, "version": "2.0"}


@app.post("/predict", response_model=PredictResponse)
async def predict(
    file:       UploadFile = File(...),
    # NEW optional vehicle fields — defaults keep old behaviour if not sent
    car_model:  str = Form("Swift"),
    car_age:    int = Form(3),
    km_driven:  int = Form(40_000),
):
    # ── Validate ─────────────────────────────────────────────
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload must be an image file.")

    if car_age < 0 or car_age > 30:
        raise HTTPException(status_code=400, detail="car_age must be between 0 and 30.")

    if km_driven < 0 or km_driven > 500_000:
        raise HTTPException(status_code=400, detail="km_driven must be between 0 and 500000.")

    # ── Load image ───────────────────────────────────────────
    contents = await file.read()
    img_pil  = Image.open(io.BytesIO(contents)).convert("RGB")
    W, H     = img_pil.size

    # ── Compute vehicle multiplier (NEW) ─────────────────────
    vehicle_mult = compute_vehicle_multiplier(car_model, car_age, km_driven)
    segment      = resolve_segment(car_model)
    dep_factor   = get_depreciation_factor(car_age)
    idv_estimate = round(SEGMENT_AVG_PRICE[segment] * dep_factor)

    # ── Run YOLO inference ───────────────────────────────────
    results = model.predict(
        source  = img_pil,
        imgsz   = IMG_SIZE,
        conf    = CONF_THRESH,
        verbose = False,
    )[0]

    boxes      = results.boxes
    detections = []
    total_min  = 0
    total_max  = 0
    summary    = {}

    for i in range(len(boxes)):
        cls_id      = int(boxes.cls[i].item())
        conf        = float(boxes.conf[i].item())
        x1, y1, x2, y2 = [int(v) for v in boxes.xyxy[i].tolist()]

        nx1, ny1 = x1 / W, y1 / H
        nx2, ny2 = x2 / W, y2 / H
        area_norm = (nx2 - nx1) * (ny2 - ny1)

        cls_name = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else f"class_{cls_id}"
        severity = get_severity(area_norm)

        # CHANGED: pass vehicle_mult into cost calculation
        cmin, cmax = get_cost_range(cls_name, severity, vehicle_mult)

        total_min += cmin
        total_max += cmax
        summary[cls_name] = summary.get(cls_name, 0) + 1

        detections.append(Detection(
            class_id    = cls_id,
            class_name  = cls_name,
            confidence  = round(conf, 4),
            severity    = severity,
            bbox_pixels = [x1, y1, x2, y2],
            bbox_norm   = [round(nx1,4), round(ny1,4), round(nx2,4), round(ny2,4)],
            area_norm   = round(area_norm, 6),
            cost_min    = cmin,
            cost_max    = cmax,
        ))

    # ── Annotate image ───────────────────────────────────────
    annotated_b64 = annotate_image(img_pil.copy(), [d.dict() for d in detections])

    # ── Build vehicle info block (NEW) ───────────────────────
    vehicle_info = VehicleInfo(
        car_model           = car_model,
        car_age             = car_age,
        km_driven           = km_driven,
        segment             = segment,
        depreciation_factor = round(dep_factor, 2),
        idv_estimate        = idv_estimate,
        vehicle_multiplier  = round(vehicle_mult, 3),
    )

    return PredictResponse(
        num_detections       = len(detections),
        detections           = detections,
        total_cost_min       = total_min,
        total_cost_max       = total_max,
        annotated_image      = annotated_b64,
        damage_summary       = summary,
        vehicle_info         = vehicle_info,
        claim_recommendation = get_claim_recommendation(total_max),
    )
