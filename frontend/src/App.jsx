import { useState } from "react";
import Navbar from "./Navbar";
import UploadZone from "./UploadZone";
import AnalyzingState from "./AnalyzingState";
import AnnotatedImage from "./AnnotatedImage";
import SummaryCards from "./SummaryCards";
import DetectionTable from "./DetectionTable";
import { detectDamage } from "../utils/api";

function App() {
  const [darkMode, setDarkMode] = useState(true);

  // Detection state
  const [status, setStatus] = useState("idle"); // idle | uploading | analyzing | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAnalyze = async (file) => {
    setStatus("uploading");
    setError(null);
    setResult(null);
    setUploadProgress(0);

    try {
      const data = await detectDamage(file, (progressEvent) => {
        const pct = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        setUploadProgress(pct);
        if (pct >= 100) setStatus("analyzing");
      });

      setResult(data);
      setStatus("done");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to connect to backend. Make sure the API is running on http://localhost:8000";
      setError(msg);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setResult(null);
    setError(null);
    setUploadProgress(0);
  };

  const isLoading = status === "uploading" || status === "analyzing";

  return (
    <div className={darkMode ? "dark bg-black text-white min-h-screen" : ""}>
      <Navbar darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />

      <div className="pt-20 max-w-6xl mx-auto px-4 space-y-6 pb-12">
        <UploadZone onAnalyze={handleAnalyze} isLoading={isLoading} onReset={handleReset} />

        {isLoading && (
          <AnalyzingState status={status} uploadProgress={uploadProgress} />
        )}

        {status === "error" && (
          <div className="glass rounded-2xl p-6 border border-red-500/30 text-center space-y-2">
            <p className="text-red-400 font-display text-sm tracking-wider uppercase">
              Analysis Failed
            </p>
            <p className="text-slate-400 text-sm font-mono">{error}</p>
            <button
              onClick={handleReset}
              className="mt-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono hover:bg-red-500/20 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {result && status === "done" && (
          <>
            <SummaryCards result={result} />
            <AnnotatedImage
              base64Image={result.annotated_image}
              numDetections={result.num_detections}
            />
            <DetectionTable
              detections={result.detections}
              confidenceThreshold={0.0}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;