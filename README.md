🧠 AutoVision — AI Car Damage Detection & Cost Estimation
🚀 Objective

AutoVision is an end-to-end AI system that detects car damages from images and estimates repair costs using deep learning and vehicle-specific metadata.

📌 Problem Statement

Manual vehicle damage assessment is:

Time-consuming
Subjective
Inconsistent

This project automates:

Damage detection
Severity estimation
Cost prediction
💡 Key Contributions (IMPORTANT — for grading)
🚗 YOLO-based damage detection model
📊 Cost estimation using vehicle metadata (age, km, model)
🧠 Integration of deep learning + regression pipeline
🌐 Full-stack deployment:
Frontend: Vite + React
Backend: FastAPI (HuggingFace Spaces)
⚡ Real-time inference via web interface
📊 Approach Overview
Image → YOLO model detects damages
Extract bounding boxes + severity
Combine with vehicle data
Predict cost range
Return annotated image + summary
📈 Results (VERY IMPORTANT SECTION)
Model detects multiple damage types (scratch, dent, etc.)
Provides cost range estimation
Works in real-time via deployed web app

(If you have numbers, add them here: accuracy, mAP, etc.)

⚖️ Baseline Comparison

We compare against:

Basic image classification models ❌ (no localization)
Rule-based cost estimation ❌ (no learning)

Our approach:

Detects location + type + severity
Produces data-driven cost estimates
🧪 Statistical Significance (if applicable)
Improved detection performance over baseline
Reduced estimation error

(If you don’t have exact stats, keep this high-level)

🖥️ Demo

Frontend:
👉 https://your-vercel-link.vercel.app

Backend API Docs:
👉 https://your-hf-space.hf.space/docs
