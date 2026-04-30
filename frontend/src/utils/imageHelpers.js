import { CLASS_COLORS, CONF_THRESHOLD } from './constants';

// ── Draw bounding boxes on canvas ────────────────────────
export function drawBoxes(ctx, canvas, detections, img) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  detections.forEach((det) => {
    if (det.confidence * 100 < CONF_THRESHOLD) return;
    const [x1, y1, x2, y2] = det.bbox;
    const w = x2 - x1;
    const h = y2 - y1;
    const col = CLASS_COLORS[det.class] || CLASS_COLORS['scratch'];

    // Fill
    ctx.fillStyle = col.fill;
    ctx.fillRect(x1, y1, w, h);

    // Border
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = Math.max(2, canvas.width * 0.003);
    ctx.strokeRect(x1, y1, w, h);

    // Corner ticks
    const t = Math.min(w, h) * 0.18;
    ctx.lineWidth = Math.max(3, canvas.width * 0.004);
    [[x1, y1, 1, 1], [x2, y1, -1, 1], [x1, y2, 1, -1], [x2, y2, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * t, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * t);
      ctx.stroke();
    });

    // Label box
    const cls = (det.class || '').replace(/_/g, ' ');
    const pct = Math.round(det.confidence * 100);
    const text = cls.toUpperCase() + '  ' + pct + '%';
    const fs = Math.max(11, Math.min(16, canvas.width * 0.022));
    ctx.font = `600 ${fs}px 'DM Mono', monospace`;
    const tw = ctx.measureText(text).width;
    const lh = fs + 8;
    const lw = tw + 18;
    const lx = x1;
    const ly = y1 - lh - 2 < 2 ? y1 + 2 : y1 - lh - 2;
    ctx.fillStyle = col.stroke;
    roundRect(ctx, lx, ly, lw, lh, 4);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText(text, lx + 9, ly + lh - 5);
  });
}

// ── Rounded rectangle path helper ────────────────────────
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Mock detections for fallback demo ────────────────────
export function mockDetections(imgW, imgH) {
  return [
    {
      class: 'dent',
      confidence: 0.92,
      bbox: [
        Math.round(imgW * 0.12), Math.round(imgH * 0.48),
        Math.round(imgW * 0.38), Math.round(imgH * 0.78),
      ],
    },
    {
      class: 'scratch',
      confidence: 0.78,
      bbox: [
        Math.round(imgW * 0.48), Math.round(imgH * 0.30),
        Math.round(imgW * 0.78), Math.round(imgH * 0.58),
      ],
    },
  ];
}
