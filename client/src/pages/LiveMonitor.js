import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const COLORS = { Low: '#2ED573', Moderate: '#FFA502', High: '#FF4757' };
const AI_SERVER = 'http://localhost:5001';
const DETECT_INTERVAL_MS = 2500; // send frame every 2.5s

const LiveMonitor = () => {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const overlayRef  = useRef(null);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);
  const busyRef     = useRef(false); // prevent overlapping requests

  const [cameraOn,     setCameraOn]     = useState(false);
  const [monitoring,   setMonitoring]   = useState(false);
  const [aiReady,      setAiReady]      = useState(false);
  const [aiChecking,   setAiChecking]   = useState(false);
  const [detection,    setDetection]    = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceMsg,      setFaceMsg]      = useState('');
  const [multiFaceWarn,setMultiFaceWarn]= useState(false);
  const [studentId,    setStudentId]    = useState('S101');
  const [students,     setStudents]     = useState([]);
  const [history,      setHistory]      = useState([]);
  const [sessionStats, setSessionStats] = useState({ Low:0, Moderate:0, High:0, total:0 });
  const [camError,     setCamError]     = useState('');
  const [features,     setFeatures]     = useState(null);

  useEffect(() => {
    axios.get('/api/students').then(r => setStudents(r.data.data)).catch(() => {});
    checkAI();
    return () => stopAll();
  }, []);

  // ── AI server health check ─────────────────────────────────────────────────
  const checkAI = async () => {
    setAiChecking(true);
    try {
      const r = await fetch(`${AI_SERVER}/health`, { signal: AbortSignal.timeout(3000) });
      const d = await r.json();
      if (d.status === 'running') {
        setAiReady(true);
        toast.success(d.model_ready
          ? 'AI Server ready — real CNN model loaded!'
          : 'AI Server connected (fallback mode)');
      } else { setAiReady(false); }
    } catch {
      setAiReady(false);
      toast.warn('AI Server not reachable — run START_AI_SERVER.bat first');
    } finally { setAiChecking(false); }
  };

  // ── Camera ─────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCamError('');
    clearOverlay();
    try {
      // Prefer environment camera on mobile, user-facing on desktop
      const constraints = {
        video: {
          width:      { ideal: 640 },
          height:     { ideal: 480 },
          facingMode: 'user',
          frameRate:  { ideal: 15 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      toast.success('Camera started!');
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied — please allow camera access in browser settings.'
        : err.name === 'NotFoundError'
        ? 'No camera found — please connect a webcam.'
        : `Camera error: ${err.message}`;
      setCamError(msg);
      toast.error('Camera failed');
    }
  };

  const stopAll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    clearOverlay();
    setCameraOn(false);
    setMonitoring(false);
    setFaceDetected(false);
    setFaceMsg('');
    setMultiFaceWarn(false);
  }, []);

  // ── Overlay drawing ────────────────────────────────────────────────────────
  const clearOverlay = () => {
    if (!overlayRef.current) return;
    const ctx = overlayRef.current.getContext('2d');
    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
  };

  const drawFaceBox = useCallback((box, level, multiWarn) => {
    if (!overlayRef.current || !box || !videoRef.current) return;
    const ov  = overlayRef.current;
    ov.width  = videoRef.current.videoWidth  || 640;
    ov.height = videoRef.current.videoHeight || 480;
    const ctx = ov.getContext('2d');
    ctx.clearRect(0, 0, ov.width, ov.height);

    const color = COLORS[level] || '#6C63FF';
    // Glow rectangle around face
    ctx.shadowColor   = color;
    ctx.shadowBlur    = 18;
    ctx.strokeStyle   = color;
    ctx.lineWidth     = 3;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    // Corner markers
    ctx.shadowBlur = 0;
    const cs = 18;
    [[box.x,box.y],[box.x+box.w,box.y],[box.x,box.y+box.h],[box.x+box.w,box.y+box.h]].forEach(([cx,cy]) => {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx + (cx===box.x?cs:-cs), cy);
      ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + (cy===box.y?cs:-cs));
      ctx.stroke();
    });

    // Stress label above box
    const label = level.toUpperCase();
    ctx.font    = 'bold 14px Arial';
    const tw    = ctx.measureText(label).width;
    ctx.fillStyle = color + 'cc';
    ctx.fillRect(box.x - 1, box.y - 26, tw + 12, 22);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, box.x + 5, box.y - 9);

    // Multi-face warning
    if (multiWarn) {
      ctx.fillStyle = '#FF4757cc';
      ctx.fillRect(4, 60, 260, 28);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Arial';
      ctx.fillText('⚠ Multiple faces — using largest face only', 10, 79);
    }
  }, []);

  // ── Capture frame from video ───────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return null;
    const v   = videoRef.current;
    const c   = canvasRef.current;
    c.width   = v.videoWidth  || 640;
    c.height  = v.videoHeight || 480;
    const ctx = c.getContext('2d');
    ctx.drawImage(v, 0, 0);
    return c.toDataURL('image/jpeg', 0.85);
  }, []);

  // ── Main detection loop ────────────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    if (busyRef.current) return; // skip if still waiting for last response
    busyRef.current = true;

    try {
      const imageData = captureFrame();
      if (!imageData) { busyRef.current = false; return; }

      // Send to AI server
      const aiRes = await fetch(`${AI_SERVER}/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: imageData }),
        signal:  AbortSignal.timeout(5000)
      });
      const aiData = await aiRes.json();

      if (!aiData.face_detected) {
        setFaceDetected(false);
        setFaceMsg(aiData.message || 'No face detected');
        clearOverlay();
        busyRef.current = false;
        return;
      }

      // Face found
      setFaceDetected(true);
      setFaceMsg('');
      const multiWarn = aiData.multiple_faces === true;
      setMultiFaceWarn(multiWarn);
      drawFaceBox(aiData.face_box, aiData.stress_level, multiWarn);

      const d = {
        stress_level: aiData.stress_level,
        confidence:   aiData.confidence,
        features:     aiData.features
      };
      setDetection(d);
      setFeatures(d.features);
      setHistory(prev => [{ ...d, time: new Date() }, ...prev.slice(0, 19)]);
      setSessionStats(prev => ({
        ...prev,
        [d.stress_level]: prev[d.stress_level] + 1,
        total: prev.total + 1
      }));

      // Save to backend
      try {
        await axios.post('/api/detection', {
          student_id:   studentId,
          stress_level: d.stress_level,
          confidence:   d.confidence,
          features:     d.features,
          image_data:   imageData,
          timestamp:    new Date().toISOString(),
          session_id:   `web_${Math.floor(Date.now()/1000)}`
        });
      } catch { /* backend save failure is non-fatal */ }

      if (d.stress_level === 'High') {
        toast.error(`⚠️ HIGH STRESS detected — ${studentId}`, { autoClose: 5000 });
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        setAiReady(false);
      }
    } finally {
      busyRef.current = false;
    }
  }, [captureFrame, drawFaceBox, studentId]);

  const startMonitoring = () => {
    if (!cameraOn) return toast.warn('Start camera first!');
    if (!aiReady)  return toast.warn('AI Server not connected — run START_AI_SERVER.bat first!');
    setMonitoring(true);
    setSessionStats({ Low:0, Moderate:0, High:0, total:0 });
    setHistory([]);
    intervalRef.current = setInterval(runDetection, DETECT_INTERVAL_MS);
    toast.success('Stress monitoring started!');
  };

  const stopMonitoring = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMonitoring(false);
    clearOverlay();
    setFaceDetected(false);
    setFaceMsg('');
    setMultiFaceWarn(false);
    toast.info('Monitoring stopped.');
  };

  // ── Pie chart ──────────────────────────────────────────────────────────────
  const pieSegments = () => {
    const { Low, Moderate, High, total } = sessionStats;
    if (total === 0) return null;
    const r = 40, cx = 50, cy = 50;
    let angle = -Math.PI / 2;
    return [
      { val: Low,      color: COLORS.Low,      label: 'Low' },
      { val: Moderate, color: COLORS.Moderate,  label: 'Moderate' },
      { val: High,     color: COLORS.High,      label: 'High' }
    ].filter(s => s.val > 0).map((s, i) => {
      const sweep = (s.val / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      angle += sweep;
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      return (
        <path key={i}
          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
          fill={s.color} opacity={0.85}
        />
      );
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const stressColor = detection ? COLORS[detection.stress_level] : '#6C63FF';

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, Arial, sans-serif', background: '#0d0d1a', minHeight: '100vh', color: '#e0e0f0' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Live Stress Monitor</h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>
            Real-time stress level detection for autism students
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: aiReady ? '#1a3a1a' : '#3a1a1a',
            color: aiReady ? '#2ED573' : '#FF4757',
            border: `1px solid ${aiReady ? '#2ED573' : '#FF4757'}`
          }}>
            {aiChecking ? 'Checking...' : aiReady ? 'AI Ready' : 'AI Offline'}
          </span>
          <button onClick={checkAI} disabled={aiChecking}
            style={{ padding: '6px 14px', borderRadius: 8, background: '#1e1e35', border: '1px solid #333', color: '#ccc', cursor: 'pointer', fontSize: 12 }}>
            Refresh
          </button>
        </div>
      </div>

      {/* AI offline notice */}
      {!aiReady && (
        <div style={{ background: '#2a1515', border: '1px solid #FF4757', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 13 }}>
          <b style={{ color: '#FF4757' }}>AI Server Not Running</b>
          <br />Run <code style={{ background: '#1a1a2a', padding: '2px 6px', borderRadius: 4 }}>START_AI_SERVER.bat</code> first, then click Refresh.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* Left — camera panel */}
        <div>
          {/* Student selector */}
          <div style={{ marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 13, color: '#aaa' }}>Student:</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}
              style={{ background: '#1e1e35', border: '1px solid #333', borderRadius: 8, color: '#e0e0f0', padding: '6px 12px', fontSize: 13 }}>
              {students.length > 0
                ? students.map(s => <option key={s._id} value={s.student_id}>{s.name} ({s.student_id})</option>)
                : <option value="S101">Student S101</option>}
            </select>
          </div>

          {/* Camera view */}
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#0a0a18', border: '1.5px solid #1e1e3a', lineHeight: 0 }}>
            <video ref={videoRef} playsInline muted
              style={{ width: '100%', display: cameraOn ? 'block' : 'none', borderRadius: 14 }} />
            <canvas ref={overlayRef}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: cameraOn ? 'block' : 'none' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Placeholder when camera off */}
            {!cameraOn && (
              <div style={{ height: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
                <div style={{ fontSize: 15 }}>Camera is off</div>
                {camError && <div style={{ color: '#FF4757', fontSize: 13, marginTop: 10, padding: '0 24px', textAlign: 'center' }}>{camError}</div>}
              </div>
            )}

            {/* Status badge */}
            {cameraOn && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: monitoring ? '#1a3a1a88' : '#1e1e3588',
                color: monitoring ? '#2ED573' : '#aaa',
                border: `1px solid ${monitoring ? '#2ED573' : '#444'}`,
                backdropFilter: 'blur(4px)'
              }}>
                {monitoring ? '● MONITORING' : '○ PAUSED'}
              </div>
            )}

            {/* Face detection feedback */}
            {cameraOn && monitoring && !faceDetected && faceMsg && (
              <div style={{
                position: 'absolute', bottom: 12, left: 12, right: 12,
                background: '#1e1e3599', borderRadius: 8, padding: '8px 14px',
                color: '#aaa', fontSize: 13, textAlign: 'center', backdropFilter: 'blur(4px)'
              }}>
                {faceMsg}
              </div>
            )}
          </div>

          {/* Multi-face warning below camera */}
          {multiFaceWarn && (
            <div style={{ background: '#2a1515', border: '1px solid #FF4757', borderRadius: 8, padding: '8px 14px', marginTop: 8, fontSize: 12, color: '#FF8080' }}>
              ⚠ Multiple faces detected — monitoring the largest face only. For best results, only one student should be in front of the camera.
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {!cameraOn ? (
              <button onClick={startCamera}
                style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#6C63FF', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                📷 Start Camera
              </button>
            ) : (
              <button onClick={stopAll}
                style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#2a2a45', border: '1px solid #444', color: '#ccc', fontSize: 14, cursor: 'pointer' }}>
                Stop Camera
              </button>
            )}
            {cameraOn && !monitoring ? (
              <button onClick={startMonitoring} disabled={!aiReady}
                style={{ flex: 1, padding: '11px', borderRadius: 10, background: aiReady ? '#2ED573' : '#1a3a1a', border: 'none', color: aiReady ? '#0d1a0d' : '#555', fontSize: 14, fontWeight: 600, cursor: aiReady ? 'pointer' : 'not-allowed' }}>
                ▶ Start Monitoring
              </button>
            ) : cameraOn && monitoring ? (
              <button onClick={stopMonitoring}
                style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#FF4757', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                ⏹ Stop Monitoring
              </button>
            ) : null}
          </div>

          {/* Usage tips */}
          <div style={{ marginTop: 14, background: '#12122a', border: '1px solid #1e1e3a', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#666', lineHeight: 1.7 }}>
            <b style={{ color: '#888' }}>Tips for accurate detection:</b><br />
            • Ensure face is clearly visible and well-lit<br />
            • Only one student should face the camera at a time<br />
            • Sit 40–80 cm from the camera<br />
            • Avoid strong backlight or shadows on face
          </div>
        </div>

        {/* Right — stats panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Current stress card */}
          <div style={{ background: '#12122a', border: `1.5px solid ${stressColor}44`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>CURRENT STRESS LEVEL</div>
            {detection ? (
              <>
                <div style={{ fontSize: 36, fontWeight: 800, color: stressColor, letterSpacing: 1 }}>
                  {detection.stress_level.toUpperCase()}
                </div>
                <div style={{ marginTop: 8, height: 8, background: '#1e1e35', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${detection.confidence * 100}%`, background: stressColor, borderRadius: 4, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                  Confidence: {(detection.confidence * 100).toFixed(1)}%
                </div>
              </>
            ) : (
              <div style={{ color: '#444', fontSize: 15, marginTop: 8 }}>
                {monitoring ? 'Detecting...' : 'Not monitoring'}
              </div>
            )}
          </div>

          {/* Face detection status */}
          <div style={{ background: '#12122a', border: '1px solid #1e1e3a', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28 }}>{faceDetected ? '✅' : '👁️'}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: faceDetected ? '#2ED573' : '#aaa' }}>
                {faceDetected ? 'Face Detected' : 'Waiting for Face'}
              </div>
              <div style={{ fontSize: 11, color: '#555' }}>
                {faceDetected ? 'Monitoring active' : (monitoring ? faceMsg || 'Looking...' : 'Start monitoring')}
              </div>
            </div>
          </div>

          {/* Features */}
          {features && (
            <div style={{ background: '#12122a', border: '1px solid #1e1e3a', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>FACIAL FEATURES</div>
              {[
                ['Eye Openness',   features.eye_openness,   1],
                ['Mouth Openness', features.mouth_openness, 1],
                ['Eyebrow Raise',  features.eyebrow_raise,  1],
              ].map(([label, val, max]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#777', marginBottom: 4 }}>
                    <span>{label}</span><span>{(val * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 5, background: '#1e1e35', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${Math.min(val/max,1)*100}%`, background: '#6C63FF', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Session stats */}
          <div style={{ background: '#12122a', border: '1px solid #1e1e3a', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>SESSION STATS</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: 14 }}>
              {['Low', 'Moderate', 'High'].map(level => (
                <div key={level} style={{ flex: 1, textAlign: 'center', background: '#0d0d1a', borderRadius: 10, padding: '10px 4px', border: `1px solid ${COLORS[level]}44` }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS[level] }}>{sessionStats[level]}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{level}</div>
                </div>
              ))}
            </div>
            {sessionStats.total > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <svg width={100} height={100} viewBox="0 0 100 100">{pieSegments()}</svg>
                <div style={{ fontSize: 12, color: '#666' }}>
                  <div>{sessionStats.total} readings</div>
                  {['Low', 'Moderate', 'High'].map(l => sessionStats[l] > 0 && (
                    <div key={l} style={{ color: COLORS[l], marginTop: 3 }}>
                      {l}: {Math.round(sessionStats[l]/sessionStats.total*100)}%
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent history */}
          <div style={{ background: '#12122a', border: '1px solid #1e1e3a', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>RECENT READINGS</div>
            <div style={{ maxHeight: 160, overflowY: 'auto' }}>
              {history.length === 0 ? (
                <div style={{ color: '#444', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No readings yet</div>
              ) : history.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1a1a2a', fontSize: 12 }}>
                  <span style={{ color: COLORS[h.stress_level], fontWeight: 600 }}>{h.stress_level}</span>
                  <span style={{ color: '#555' }}>{(h.confidence * 100).toFixed(0)}%</span>
                  <span style={{ color: '#444' }}>{h.time.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
