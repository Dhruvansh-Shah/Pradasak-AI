'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Upload, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface CameraCaptureProps {
  title: string;
  description?: string;
  onPhotoSet: (dataUrl: string | null) => void;
  isDocument?: boolean;
}

interface UiState {
  message: string;
  color: string;
  canCapture: boolean;
  showScanner: boolean;
  isLoading: boolean;
}

const CHALLENGES = [
  { id: 'blink', instruction: 'Please blink both eyes', check: (blendshapes: any[]) => getScore(blendshapes, 'eyeBlinkLeft') > 0.4 && getScore(blendshapes, 'eyeBlinkRight') > 0.4 },
  { id: 'smile', instruction: 'Please smile', check: (blendshapes: any[]) => getScore(blendshapes, 'mouthSmileLeft') > 0.5 && getScore(blendshapes, 'mouthSmileRight') > 0.5 },
  { id: 'mouth', instruction: 'Please open your mouth slightly', check: (blendshapes: any[]) => getScore(blendshapes, 'jawOpen') > 0.4 }
];

function getScore(blendshapes: any[], name: string): number {
  const shape = blendshapes.find((b) => b.categoryName === name);
  return shape ? shape.score : 0;
}

export default function CameraCapture({ title, description, onPhotoSet, isDocument = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // MediaPipe & Detection Refs
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  
  // Real-time mutable state (avoids React render thrashing)
  const liveState = useRef({
    faceCount: 0,
    livenessPassed: false,
    livenessPassedAt: 0,
    isCentered: false,
    challenge: null as any,
    isProcessing: false,
    lastVideoTime: -1,
  });

  const [mode, setMode] = useState<'options' | 'camera' | 'preview'>('options');
  const [photo, setPhoto] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Derived UI state updated only when changed
  const [uiState, setUiState] = useState<UiState>({
    message: 'Starting camera...',
    color: '#e2e8f0',
    canCapture: false,
    showScanner: false,
    isLoading: true
  });

  const stopCamera = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
    };
  }, [stopCamera]);

  const initAI = async () => {
    if (faceLandmarkerRef.current) return true;
    try {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/face_landmarker.task",
          delegate: "CPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 2, 
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
      });
      faceLandmarkerRef.current = landmarker;
      return true;
    } catch (e) {
      console.error("AI Init Error:", e);
      setErrorMsg("Failed to initialize verification AI. Please try uploading a photo instead.");
      return false;
    }
  };

  const updateUI = useCallback((newState: Partial<UiState>) => {
    setUiState(prev => {
      // Only update if something actually changed to prevent render loops
      if (
        prev.message !== newState.message || 
        prev.color !== newState.color || 
        prev.canCapture !== newState.canCapture || 
        prev.showScanner !== newState.showScanner ||
        prev.isLoading !== newState.isLoading
      ) {
        return { ...prev, ...newState };
      }
      return prev;
    });
  }, []);

  const processVideoFrame = useCallback(async () => {
    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;
    const state = liveState.current;
    
    // Safety checks
    if (!video || !landmarker || video.readyState < 2 || !streamRef.current) {
      requestRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    if (state.isProcessing) {
      requestRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    const startTimeMs = performance.now();
    if (startTimeMs <= state.lastVideoTime) {
      requestRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }
    
    state.lastVideoTime = startTimeMs;
    state.isProcessing = true;

    try {
      const results = landmarker.detectForVideo(video, startTimeMs);
      const numFaces = results.faceBlendshapes?.length || 0;
      state.faceCount = numFaces;

      if (numFaces === 1) {
        // Check positioning (nose tip should be roughly centered)
        const nose = results.faceLandmarks[0][1];
        state.isCentered = (nose.x > 0.25 && nose.x < 0.75 && nose.y > 0.25 && nose.y < 0.75);

        // Liveness validity window (expires after 15 seconds)
        if (state.livenessPassed && (startTimeMs - state.livenessPassedAt > 15000)) {
          state.livenessPassed = false;
        }

        if (!state.isCentered) {
          // If not centered, don't allow passing challenges
          updateUI({ message: 'Center your face inside the frame', color: '#eab308', canCapture: false, showScanner: false, isLoading: false });
        } else if (!state.livenessPassed) {
          if (!state.challenge) {
            state.challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
          }
          
          const blendshapes = results.faceBlendshapes[0].categories;
          const passed = state.challenge.check(blendshapes);
          
          if (passed) {
            state.livenessPassed = true;
            state.livenessPassedAt = startTimeMs;
            state.challenge = null;
          } else {
            updateUI({ message: state.challenge.instruction, color: '#3b82f6', canCapture: false, showScanner: true, isLoading: false });
          }
        }
        
        // If everything is perfectly valid
        if (state.isCentered && state.livenessPassed) {
          updateUI({ message: 'Ready to capture ✓', color: '#34d399', canCapture: true, showScanner: false, isLoading: false });
        }

      } else {
        // 0 or multiple faces -> Immediately revoke liveness to force re-verification if they return
        state.livenessPassed = false;
        state.challenge = null;
        state.isCentered = false;
        
        if (numFaces === 0) {
          updateUI({ message: 'No face detected. Please position your face inside the frame.', color: '#ef4444', canCapture: false, showScanner: false, isLoading: false });
        } else {
          updateUI({ message: 'Only one person should be visible.', color: '#ef4444', canCapture: false, showScanner: false, isLoading: false });
        }
      }
    } catch (e) {
      console.error("Detection error:", e);
    } finally {
      state.isProcessing = false;
      requestRef.current = requestAnimationFrame(processVideoFrame);
    }
  }, [updateUI]);

  const startCamera = () => {
    stopCamera();
    setErrorMsg(null);
    setMode('camera');
    
    // Reset mutable state completely
    liveState.current = {
      faceCount: 0,
      livenessPassed: false,
      livenessPassedAt: 0,
      isCentered: false,
      challenge: null,
      isProcessing: false,
      lastVideoTime: -1,
    };
    
    updateUI({ message: 'Loading AI Model...', color: '#e2e8f0', canCapture: false, showScanner: false, isLoading: true });
    
    setTimeout(async () => {
      try {
        if (!isDocument) {
          const aiReady = await initAI();
          if (!aiReady) {
            setMode('options');
            return;
          }
        }
        
        updateUI({ message: 'Starting camera...', color: '#e2e8f0', canCapture: false, showScanner: false, isLoading: true });
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: isDocument ? 'environment' : 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        
        if (!isDocument) {
          requestRef.current = requestAnimationFrame(processVideoFrame);
        } else {
          updateUI({ message: 'Ready to capture', color: '#34d399', canCapture: true, showScanner: false, isLoading: false });
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMsg("Camera access was denied. Please allow camera access in your browser settings, or upload a photo from your device.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMsg("No camera device found. Please upload a photo from your device.");
        } else {
          setErrorMsg("We couldn't access your camera. Please check that another application isn't using it.");
        }
        setMode('options');
      }
    }, 50);
  };

  const capturePhoto = () => {
    // SECURITY GATE: Fresh validation on the exact frame of capture
    if (!isDocument) {
      const state = liveState.current;
      if (state.faceCount !== 1 || !state.isCentered || !state.livenessPassed) {
        alert("Cannot capture: Face verification failed on current frame. Please follow the instructions on screen.");
        return;
      }
    }

    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 640, 480);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        setPhoto(dataUrl);
        onPhotoSet(dataUrl);
        stopCamera();
        setMode('preview');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const dataUrl = ev.target.result as string;
          setPhoto(dataUrl);
          onPhotoSet(dataUrl);
          setMode('preview');
          setErrorMsg(null);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCancel = () => {
    stopCamera();
    setMode('options');
  };

  return (
    <div style={{ padding: 24, borderRadius: 16, border: `1.5px solid ${photo ? '#34d399' : '#e2e8f0'}`, background: photo ? '#ecfdf5' : '#f8fafc' }}>
      <style>{`
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(52, 211, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
        }
        @keyframes scan {
          0% { top: 15%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
      `}</style>

      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{title}</h3>
      {description && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{description}</p>}

      {errorMsg && (
        <div style={{ display: 'flex', gap: 12, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 16, alignItems: 'center' }}>
          <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 500, lineHeight: 1.4 }}>{errorMsg}</span>
        </div>
      )}

      {mode === 'options' && (
        <div style={{ display: 'flex', gap: 16 }}>
          <button type="button" onClick={startCamera} style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#0f172a', transition: 'all 0.2s' }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={24} color="#0b1f3a" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 4 }}>Take Photo</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>Use your device camera</span>
            </div>
          </button>
          
          {isDocument && (
            <label style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#0f172a', transition: 'all 0.2s' }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={24} color="#0b1f3a" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 4 }}>Upload File</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>From your device storage</span>
              </div>
              <input type="file" accept="image/jpeg,image/png,image/jpg" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          )}
        </div>
      )}

      {mode === 'camera' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: 400, 
            aspectRatio: isDocument ? '4/3' : '3/4', 
            background: '#000', 
            borderRadius: 16, 
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isDocument ? 'none' : 'scaleX(-1)' }} 
            />

            {/* Selfie Overlay / Face Guide */}
            {!isDocument && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '65%',
                  height: '55%',
                  borderRadius: '50%',
                  border: `3px solid ${uiState.color}`,
                  animation: uiState.canCapture ? 'pulse-border 2s infinite' : 'none',
                  position: 'relative',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                }}>
                  {uiState.showScanner && (
                    <div style={{
                      position: 'absolute',
                      left: '10%',
                      right: '10%',
                      height: '3px',
                      background: '#34d399',
                      boxShadow: '0 0 8px #34d399',
                      animation: 'scan 2.5s infinite ease-in-out'
                    }} />
                  )}
                </div>
                
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: 24,
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  padding: '8px 20px',
                  borderRadius: 24,
                  color: uiState.color,
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'color 0.3s ease'
                }}>
                  {uiState.isLoading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {uiState.canCapture && <CheckCircle2 size={18} />}
                  {uiState.message}
                </div>
              </div>
            )}
            
            {/* Document Guide */}
            {isDocument && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '90%', height: '85%', border: '2px dashed rgba(255,255,255,0.6)', borderRadius: 8 }} />
              </div>
            )}
          </div>

          <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
          
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 400 }}>
            <button type="button" onClick={handleCancel} style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#f1f5f9', color: '#475569', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
            <button 
              type="button" 
              onClick={capturePhoto} 
              disabled={!uiState.canCapture}
              style={{ 
                flex: 2, 
                padding: '14px', 
                borderRadius: 12, 
                background: uiState.canCapture ? '#0b1f3a' : '#94a3b8', 
                color: '#fff', 
                fontSize: 14, 
                fontWeight: 700, 
                border: 'none', 
                cursor: uiState.canCapture ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Capture
            </button>
          </div>
        </div>
      )}

      {mode === 'preview' && photo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          {photo.startsWith('data:application/pdf') ? (
            <div style={{ width: 72, height: 72, borderRadius: 8, background: '#34d399', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>PDF</div>
          ) : (
            <img src={photo} alt="Preview" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '2px solid #e2e8f0' }} />
          )}
          
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46', marginBottom: 4 }}>Ready to submit</div>
            <button type="button" onClick={() => { setPhoto(null); onPhotoSet(null); setMode('options'); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              Retake / Re-upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
