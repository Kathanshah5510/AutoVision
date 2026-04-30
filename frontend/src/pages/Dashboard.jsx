import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar            from '../components/Navbar';
import ImagePanel        from '../components/ImagePanel';
import StatsRow          from '../components/StatsRow';
import DetectionFeed     from '../components/DetectionFeed';
import DamageDistribution from '../components/DamageDistribution';
import CostBreakdownChart from '../components/CostBreakdownChart';
import EditProfileModal  from '../components/EditProfileModal';
import Toast             from '../components/Toast';
import { mockDetections } from '../utils/imageHelpers';
import { drawBoxes }      from '../utils/imageHelpers';
import '../styles/dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STEP_LABELS = [
  'Uploading image…',
  'Running detection…',
  'Classifying damage…',
  'Estimating cost…',
  'Generating report…',
];

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  // Auth guard
  useEffect(() => {
    const stored = sessionStorage.getItem('autovision_user');
    if (!stored) { navigate('/', { replace: true }); return; }
    setUserData(JSON.parse(stored));
  }, [navigate]);

  // State
  const [detections, setDetections] = useState([]);
  const [apiData, setApiData]       = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [toastMsg, setToastMsg]       = useState('');
  const [modalOpen, setModalOpen]     = useState(false);

  const [steps, setSteps] = useState(
    STEP_LABELS.map(label => ({ label, state: 'idle' }))
  );

  // Refs for canvas/img access from highlight
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);

  const showError = useCallback((msg) => setToastMsg(msg), []);

  // ── Pipeline ─────────────────────────────────────────────
  const runPipeline = useCallback(async (file, canvas, img) => {
    canvasRef.current = canvas;
    imgRef.current    = img;

    setIsLoading(true);
    setShowResults(true);

    // Start API call
    const fd = new FormData();
    fd.append('file', file);
    if (userData) {
      fd.append('car_model', userData.vehicleModel || 'Swift');
      fd.append('car_age', String(userData.purchaseYear ? new Date().getFullYear() - userData.purchaseYear : 3));
      fd.append('km_driven', String(userData.kmDriven || 40000));
    } else {
      fd.append('car_model', 'Swift');
      fd.append('car_age', '3');
      fd.append('km_driven', '40000');
    }

    const apiPromise = fetch(`${API_URL}/predict`, { method: 'POST', body: fd });

    // Animate loading steps
    const newSteps = STEP_LABELS.map(label => ({ label, state: 'idle' }));
    for (let i = 0; i < STEP_LABELS.length; i++) {
      newSteps[i].state = 'active';
      setSteps([...newSteps]);
      await delay(500 + Math.random() * 300);
      newSteps[i].state = 'done';
      setSteps([...newSteps]);
    }

    // Wait for API
    let dets;
    let respData = null;
    try {
      const res = await apiPromise;
      if (!res.ok) throw new Error('API returned ' + res.status);
      respData = await res.json();
      dets = (respData.detections || []).map(d => ({
        class:      d.class_name,
        confidence: d.confidence,
        bbox:       d.bbox_pixels,
        severity:   d.severity,
        cost_min:   d.cost_min,
        cost_max:   d.cost_max,
        class_id:   d.class_id,
        area_norm:  d.area_norm,
      }));
    } catch (err) {
      showError('Backend error: ' + err.message + '. Using mock data.');
      dets = mockDetections(img.naturalWidth, img.naturalHeight);
    }

    // Filter by 35% minimum confidence
    dets = dets.filter(d => d.confidence * 100 >= 35);

    setDetections(dets);
    setApiData(respData);
    setIsLoading(false);
  }, [userData, showError]);

  // ── File picked handler ──────────────────────────────────
  const handleFilePicked = useCallback((file, error, canvas, img) => {
    if (error) { showError(error); return; }
    if (!file) return;
    runPipeline(file, canvas, img);
  }, [runPipeline, showError]);

  // ── Highlight detection on click ─────────────────────────
  const handleDetectionClick = useCallback((idx) => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');

    // Redraw all boxes first
    drawBoxes(ctx, canvas, detections, img);

    // Highlight the clicked one
    const det = detections[idx];
    if (!det || !det.bbox) return;
    const [x1, y1, x2, y2] = det.bbox;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 4;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur  = 20;
    ctx.strokeRect(x1 - 2, y1 - 2, x2 - x1 + 4, y2 - y1 + 4);
    ctx.shadowBlur  = 0;
  }, [detections]);

  // ── Reset (New Scan) ─────────────────────────────────────
  const handleNewScan = useCallback(() => {
    setShowResults(false);
    setDetections([]);
    setApiData(null);
    setIsLoading(false);
    setSteps(STEP_LABELS.map(label => ({ label, state: 'idle' })));
  }, []);

  // ── Logout ───────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('autovision_user');
    navigate('/', { replace: true });
  }, [navigate]);

  // ── Profile save ─────────────────────────────────────────
  const handleProfileSave = useCallback((updated) => {
    setUserData(updated);
    showError('Profile updated successfully!');
  }, [showError]);

  if (!userData) return null; // loading guard

  return (
    <>
      <Navbar
        userData={userData}
        onNewScan={handleNewScan}
        onLogout={handleLogout}
        onEditProfile={() => setModalOpen(true)}
      />

      <main>
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="left-col">
          <ImagePanel
            steps={steps}
            isLoading={isLoading}
            showResults={showResults}
            detections={detections}
            apiData={apiData}
            userData={userData}
            onFilePicked={handleFilePicked}
          />
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="right-col">
          <StatsRow detections={detections} apiData={apiData} />
          <DetectionFeed detections={detections} onItemClick={handleDetectionClick} />
          <DamageDistribution detections={detections} />
          <CostBreakdownChart detections={detections} />
        </div>
      </main>

      <EditProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleProfileSave}
        showError={showError}
      />

      <Toast message={toastMsg} onClear={() => setToastMsg('')} />
    </>
  );
}
