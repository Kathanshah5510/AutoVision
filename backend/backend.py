# backend.py
# ─────────────────────────────────────────────────────────────
# Phase 3 — FastAPI inference backend
# Run: uvicorn backend:app --host 0.0.0.0 --port 8000 --reload
# ─────────────────────────────────────────────────────────────

import io, base64, json
from pathlib import Path
from typing import List

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO  # type: ignore

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
MODEL_PATH = "D:/MTech/Sem-2/IT549-Deep_Learning-1/AutoVision/models/best.pt"
CONF_THRESH = 0.25
IMG_SIZE    = 640

CLASS_NAMES = ["dent", "scratch", "crack", "glass shatter", "tire flat", "lamp broken"]
PALETTE     = ["#e63946", "#2a9d8f", "#e9c46a", "#f4a261", "#264653", "#a8dadc"]

# ── Severity + cost heuristics ────────────────────────────────
# bbox_area is normalized (0–1). Thresholds tuned for CarDD images.
SEVERITY_THRESHOLDS = {"low": 0.01, "medium": 0.05}   # area fraction

# Base repair cost ranges (INR) per damage class per severity
COST_TABLE = {
    "dent":          {"low": (2000,  5000),  "medium": (5000, 15000),  "high": (15000, 40000)},
    "scratch":       {"low": (500,   2000),  "medium": (2000,  8000),  "high": (8000,  20000)},
    "crack":         {"low": (1000,  4000),  "medium": (4000, 12000),  "high": (12000, 35000)},
    "glass shatter": {"low": (3000,  8000),  "medium": (8000, 20000),  "high": (20000, 50000)},
    "tire flat":     {"low": (1500,  3000),  "medium": (3000,  6000),  "high": (6000,  15000)},
    "lamp broken":   {"low": (1000,  3000),  "medium": (3000,  8000),  "high": (8000,  20000)},
}


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
def get_severity(bbox_area_norm: float) -> str:
    if bbox_area_norm < SEVERITY_THRESHOLDS["low"]:
        return "low"
    elif bbox_area_norm < SEVERITY_THRESHOLDS["medium"]:
        return "medium"
    return "high"


def get_cost_range(class_name: str, severity: str):
    row = COST_TABLE.get(class_name, COST_TABLE["dent"])
    return row[severity]


def hex_to_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def annotate_image(img_pil: Image.Image, detections: list) -> str:
    """Draw boxes on image, return base64 JPEG string."""
    draw = ImageDraw.Draw(img_pil)
    W, H = img_pil.size

    for det in detections:
        x1, y1, x2, y2 = det["bbox_pixels"]
        cls_name  = det["class_name"]
        severity  = det["severity"]
        conf      = det["confidence"]
        color     = hex_to_rgb(PALETTE[det["class_id"] % len(PALETTE)])

        # Box
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

        # Label background
        label = f"{cls_name} [{severity}] {conf:.2f}"
        text_bbox = draw.textbbox((x1, y1 - 18), label)
        draw.rectangle(text_bbox, fill=color)
        draw.text((x1, y1 - 18), label, fill="white")

    buf = io.BytesIO()
    img_pil.save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode()


# ─────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="AutoVision — Car Damage Detector", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup
print(f"Loading model from {MODEL_PATH} ...")
model = YOLO(MODEL_PATH)  # type: ignore
print("Model loaded ✅")


# ─────────────────────────────────────────────────────────────
# RESPONSE SCHEMAS
# ─────────────────────────────────────────────────────────────
class Detection(BaseModel):
    class_id:     int
    class_name:   str
    confidence:   float
    severity:     str
    bbox_pixels:  List[int]        # [x1, y1, x2, y2]
    bbox_norm:    List[float]      # [x1, y1, x2, y2] normalized
    area_norm:    float
    cost_min:     int
    cost_max:     int


class PredictResponse(BaseModel):
    num_detections:   int
    detections:       List[Detection]
    total_cost_min:   int
    total_cost_max:   int
    annotated_image:  str           # base64 JPEG
    damage_summary:   dict          # class → count


# ─────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_PATH}


@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    # ── Validate file type ───────────────────────────────────
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload must be an image file.")

    # ── Load image ───────────────────────────────────────────
    contents = await file.read()
    img_pil  = Image.open(io.BytesIO(contents)).convert("RGB")
    W, H     = img_pil.size

    # ── Run YOLO inference ───────────────────────────────────
    results = model.predict(
        source    = img_pil,
        imgsz     = IMG_SIZE,
        conf      = CONF_THRESH,
        verbose   = False,
    )[0]

    boxes      = results.boxes
    detections = []
    total_min  = 0
    total_max  = 0
    summary    = {}

    for i in range(len(boxes)):
        cls_id   = int(boxes.cls[i].item())
        conf     = float(boxes.conf[i].item())
        x1, y1, x2, y2 = [int(v) for v in boxes.xyxy[i].tolist()]

        # Normalized bbox + area
        nx1, ny1 = x1 / W, y1 / H
        nx2, ny2 = x2 / W, y2 / H
        area_norm = (nx2 - nx1) * (ny2 - ny1)

        cls_name = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else f"class_{cls_id}"
        severity = get_severity(area_norm)
        cmin, cmax = get_cost_range(cls_name, severity)

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
    annotated_b64 = annotate_image(img_pil.copy(), [d.model_dump() if hasattr(d, 'model_dump') else d.dict() for d in detections])

    return PredictResponse(
        num_detections  = len(detections),
        detections      = detections,
        total_cost_min  = total_min,
        total_cost_max  = total_max,
        annotated_image = annotated_b64,
        damage_summary  = summary,
    )