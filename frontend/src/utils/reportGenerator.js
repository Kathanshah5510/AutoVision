import { jsPDF } from 'jspdf';
import { BASE_COST } from './constants';

// ── PDF Report Generator ──────────────────────────────────
export function downloadReport(allDetections, canvas, userData, apiData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Colors ──
  const PRIMARY    = [0, 212, 170];
  const DARK       = [15, 21, 32];
  const TEXT_DARK  = [30, 30, 30];
  const TEXT_MID   = [100, 100, 100];
  const WHITE      = [255, 255, 255];
  const SEV_COLORS = {
    high:   [239, 68,  68],
    medium: [245, 158, 11],
    low:    [34,  197, 94],
  };

  function drawHR(yPos, color) {
    doc.setDrawColor(...(color || [220, 220, 220]));
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageW - margin, yPos);
  }

  // ── Header bar ──
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 36, 'F');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('AutoVision', margin, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PRIMARY);
  doc.text('AI Damage Inspection Report', margin, 23);

  const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(dateStr + '  |  ' + timeStr, pageW - margin, 16, { align: 'right' });
  doc.text('Report ID: AV-' + Date.now().toString(36).toUpperCase(), pageW - margin, 23, { align: 'right' });

  y = 44;

  // ── Inspector & Vehicle Details ──
  const user = userData || {};
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);
  doc.text('Inspector & Vehicle Information', margin, y);
  y += 6;

  const detailRows = [
    ['Inspector Name', user.fullname || '-', 'Email', user.email || '-'],
    ['Phone', user.phone || '-', 'Organisation', user.company || '-'],
    ['Vehicle Reg. No.', user.vehicleReg || '-', 'Make / Model', user.vehicleModel || '-'],
    ['Vehicle Owner', user.ownerName || '-', 'Inspection Date', dateStr + ' ' + timeStr],
  ];

  const colLabelW = 32;

  detailRows.forEach((row) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MID);
    doc.text(row[0] + ':', margin, y + 4);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_DARK);
    doc.text(row[1], margin + colLabelW, y + 4);

    const rx = margin + contentW / 2 + 4;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MID);
    doc.text(row[2] + ':', rx, y + 4);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_DARK);
    doc.text(row[3], rx + colLabelW, y + 4);

    y += 7;
  });

  y += 4;
  drawHR(y, [220, 220, 220]);
  y += 8;

  // ── Summary section ──
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);
  doc.text('Inspection Summary', margin, y);
  y += 7;

  const totalMin = apiData ? apiData.total_cost_min : allDetections.reduce((s, d) => s + (d.cost_min || 5000), 0);
  const totalMax = apiData ? apiData.total_cost_max : Math.round(totalMin * 1.35);
  const highCount = allDetections.filter(d => d.severity === 'high').length;
  const medCount  = allDetections.filter(d => d.severity === 'medium').length;
  const lowCount  = allDetections.filter(d => d.severity === 'low').length;

  const cardW = (contentW - 6) / 3;
  const cards = [
    { label: 'Total Damages',      value: String(allDetections.length),                                                 color: PRIMARY },
    { label: 'Est. Repair Cost',   value: 'Rs.' + totalMin.toLocaleString('en-IN') + ' - Rs.' + totalMax.toLocaleString('en-IN'), color: [14, 165, 233] },
    { label: 'Severity Breakdown', value: highCount + ' High / ' + medCount + ' Med / ' + lowCount + ' Low',           color: [245, 158, 11] },
  ];

  cards.forEach((card, i) => {
    const cx = margin + i * (cardW + 3);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(cx, y, cardW, 22, 2, 2, 'F');
    doc.setFillColor(...card.color);
    doc.rect(cx, y, cardW, 1.5, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MID);
    doc.text(card.label.toUpperCase(), cx + 4, y + 7);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_DARK);
    doc.text(card.value, cx + 4, y + 16);
  });
  y += 30;

  // ── Annotated Image ──
  if (canvas) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_DARK);
    doc.text('Annotated Image', margin, y);
    y += 3;

    const imgData    = canvas.toDataURL('image/jpeg', 0.92);
    const imgAspect  = canvas.height / canvas.width;
    const maxImgH    = 100;
    const finalW     = imgAspect > maxImgH / contentW ? maxImgH / imgAspect : contentW;
    const finalH     = Math.min(contentW * imgAspect, maxImgH);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, finalW, finalH);
    doc.addImage(imgData, 'JPEG', margin, y, finalW, finalH);
    y += finalH + 8;
  }

  if (y > pageH - 80) { doc.addPage(); y = margin; }

  // ── Detection Details Table ──
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);
  doc.text('Detection Details', margin, y);
  y += 6;

  const cols = [
    { label: '#',             w: 8  },
    { label: 'DAMAGE TYPE',   w: 36 },
    { label: 'CONFIDENCE',    w: 28 },
    { label: 'SEVERITY',      w: 24 },
    { label: 'AREA %',        w: 20 },
    { label: 'EST. COST (Rs.)', w: contentW - 8 - 36 - 28 - 24 - 20 },
  ];

  const rowH = 8;
  doc.setFillColor(...DARK);
  doc.rect(margin, y, contentW, rowH, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  let cx = margin + 2;
  cols.forEach(col => { doc.text(col.label, cx, y + 5.5); cx += col.w; });
  y += rowH;

  allDetections.forEach((d, i) => {
    if (y > pageH - 25) { doc.addPage(); y = margin; }

    if (i % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, y, contentW, rowH, 'F');
    }

    const cls     = (d.class || '').replace(/\b\w/g, c => c.toUpperCase());
    const conf    = Math.round(d.confidence * 100) + '%';
    const sev     = d.severity || '—';
    const area    = d.area_norm ? (d.area_norm * 100).toFixed(1) + '%' : '—';
    const cost    = d.cost_min || BASE_COST[d.class] || 5000;
    const costMax = d.cost_max || Math.round(cost * 1.4);
    const costStr = 'Rs.' + cost.toLocaleString('en-IN') + ' - Rs.' + costMax.toLocaleString('en-IN');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_DARK);
    cx = margin + 2;

    doc.text(String(i + 1), cx, y + 5.5); cx += cols[0].w;

    doc.setFont('helvetica', 'bold');
    doc.text(cls, cx, y + 5.5);
    doc.setFont('helvetica', 'normal');
    cx += cols[1].w;

    doc.text(conf, cx, y + 5.5); cx += cols[2].w;

    const sevColor = SEV_COLORS[sev] || [150, 150, 150];
    doc.setFillColor(...sevColor);
    const sevText = sev.toUpperCase();
    const sevTW = doc.getTextWidth(sevText);
    doc.roundedRect(cx, y + 1.5, sevTW + 4, 5, 1, 1, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(sevText, cx + 2, y + 5);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_DARK);
    cx += cols[3].w;

    doc.text(area, cx, y + 5.5); cx += cols[4].w;

    doc.setFont('helvetica', 'bold');
    doc.text(costStr, cx, y + 5.5);

    y += rowH;
  });

  y += 6;
  drawHR(y, [200, 200, 200]);
  y += 6;

  // ── Total cost row ──
  if (y > pageH - 30) { doc.addPage(); y = margin; }
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);
  doc.text('Total Estimated Repair Cost:', margin, y);
  doc.setTextColor(...PRIMARY);
  doc.text('Rs.' + totalMin.toLocaleString('en-IN') + ' - Rs.' + totalMax.toLocaleString('en-IN'), margin + 65, y);
  y += 10;

  // ── Disclaimer ──
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...TEXT_MID);
  const disclaimer = 'Disclaimer: This report is generated by an AI model and the cost estimates are approximate. Actual repair costs may vary based on location, vehicle model, parts availability, and workshop rates. Please consult a certified mechanic for an accurate assessment.';
  const splitDisclaimer = doc.splitTextToSize(disclaimer, contentW);
  doc.text(splitDisclaimer, margin, y);
  y += splitDisclaimer.length * 3.5 + 6;

  // ── Footer ──
  const footerY = pageH - 10;
  drawHR(footerY - 4, [220, 220, 220]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text('Generated by AutoVision AI Inspection System', margin, footerY);
  doc.text(dateStr + ' ' + timeStr, pageW - margin, footerY, { align: 'right' });

  doc.save('AutoVision_Report.pdf');
}
