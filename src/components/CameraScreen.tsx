import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Detection, TrackedObject, CountingZone } from '../types';
import { Play, Pause, RotateCcw, Plus, Minus, Target, AlertCircle, Camera as CameraIcon, VideoOff, Shield, CheckCircle2 } from 'lucide-react';

export default function CameraScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animFrameRef = useRef<number>(0);
  const trackIdCounter = useRef(0);
  
  const [isRunning, setIsRunning] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [trackedObjects, setTrackedObjects] = useState<Map<number, TrackedObject>>(new Map());
  const [totalCount, setTotalCount] = useState(0);
  const [manualCorrection, setManualCorrection] = useState(0);
  const [fps, setFps] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [zones, setZones] = useState<CountingZone[]>([
    { id: 'zone1', name: 'Zone A', x: 50, y: 100, width: 250, height: 180, count: 0, color: '#22c55e', active: true },
    { id: 'zone2', name: 'Zone B', x: 340, y: 100, width: 250, height: 180, count: 0, color: '#eab308', active: true },
  ]);
  const [showZones, setShowZones] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showIds, setShowIds] = useState(true);
  const [confidence, setConfidence] = useState(0.4);
  const [detectionClass, setDetectionClass] = useState('bird');
  const [sessionActive, setSessionActive] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [demoObjects, setDemoObjects] = useState<{ x: number; y: number; vx: number; vy: number; w: number; h: number; id: number }[]>([]);

  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);

  // Check camera permissions
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'camera' as PermissionName }).then(result => {
        setPermissionState(result.state as any);
        result.addEventListener('change', () => {
          setPermissionState(result.state as any);
        });
      }).catch(() => {
        setPermissionState('unknown');
      });
    }
  }, []);

  // Load TensorFlow.js model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setModelLoading(true);
        setModelError(null);
        // Initialize TF backend
        await tf.ready();
        console.log('TF.js backend:', tf.getBackend());
        // Load COCO-SSD model (real ML model, ~4MB download)
        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        modelRef.current = model;
        setModelLoaded(true);
        setModelLoading(false);
        console.log('Model loaded successfully');
      } catch (err: any) {
        console.error('Failed to load model:', err);
        setModelError(`Model load failed: ${err.message}. Using demo mode.`);
        setModelLoading(false);
        setUseDemoMode(true);
      }
    };
    loadModel();
  }, []);

  // Initialize demo mode objects
  useEffect(() => {
    if (useDemoMode) {
      const objects = Array.from({ length: 8 }, (_, i) => ({
        x: 100 + Math.random() * 400,
        y: 80 + Math.random() * 250,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2,
        w: 40 + Math.random() * 30,
        h: 30 + Math.random() * 25,
        id: i + 1,
      }));
      setDemoObjects(objects);
      trackIdCounter.current = objects.length;
    }
  }, [useDemoMode]);

  // Start camera with robust error handling
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setCameraReady(false);

      // Try to get camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        // Fallback: try without facingMode
        console.log('First attempt failed, trying fallback:', firstErr.message);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (secondErr: any) {
          throw secondErr;
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) { reject(new Error('No video element')); return; }
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play().then(resolve).catch(reject);
          };
          videoRef.current.onerror = () => reject(new Error('Video element error'));
          setTimeout(() => reject(new Error('Video load timeout')), 10000);
        });

        setCameraReady(true);
        setPermissionState('granted');
        console.log('Camera started:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMsg = 'Camera access failed';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
        setPermissionState('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is being used by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = 'Camera constraints not supported. Try different settings.';
      } else if (err.name === 'SecurityError') {
        errorMsg = 'Camera access blocked by security policy. Try HTTPS or localhost.';
      } else {
        errorMsg = `Camera error: ${err.message}`;
      }
      
      setCameraError(errorMsg);
    }
  }, []);

  // Calculate IoU for tracking
  const calculateIoU = (box1: number[], box2: number[]): number => {
    const x1 = Math.max(box1[0], box2[0]);
    const y1 = Math.max(box1[1], box2[1]);
    const x2 = Math.min(box1[0] + box1[2], box2[0] + box2[2]);
    const y2 = Math.min(box1[1] + box1[3], box2[1] + box2[3]);
    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const area1 = box1[2] * box1[3];
    const area2 = box2[2] * box2[3];
    const union = area1 + area2 - intersection;
    return union > 0 ? intersection / union : 0;
  };

  // Check if point is in zone
  const isInZone = (x: number, y: number, zone: CountingZone): boolean => {
    return x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;
  };

  // Demo mode detection loop
  const detectDemo = useCallback(() => {
    if (!canvasRef.current || !isRunning || !useDemoMode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;
    const now = performance.now();

    // Update demo objects (simulate movement)
    setDemoObjects(prev => prev.map(obj => {
      let newX = obj.x + obj.vx;
      let newY = obj.y + obj.vy;
      let newVx = obj.vx;
      let newVy = obj.vy;

      // Bounce off walls
      if (newX < 20 || newX > 600) { newVx = -newVx; newX = Math.max(20, Math.min(600, newX)); }
      if (newY < 20 || newY > 420) { newVy = -newVy; newY = Math.max(20, Math.min(420, newY)); }

      // Random direction changes
      if (Math.random() < 0.02) {
        newVx += (Math.random() - 0.5) * 2;
        newVy += (Math.random() - 0.5) * 1.5;
      }

      return { ...obj, x: newX, y: newY, vx: newVx, vy: newVy };
    }));

    // Draw background (simulated camera view)
    ctx.fillStyle = '#1a2e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground texture
    ctx.fillStyle = '#2d4a2d';
    for (let i = 0; i < 20; i++) {
      const gx = (i * 37 + now * 0.01) % 640;
      const gy = 300 + Math.sin(i * 0.5) * 50;
      ctx.fillRect(gx, gy, 30, 2);
    }

    // Draw simulated chickens
    demoObjects.forEach(obj => {
      // Body
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath();
      ctx.ellipse(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2, obj.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4a574';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Head
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath();
      ctx.arc(obj.x + obj.w * 0.8, obj.y + obj.h * 0.2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Comb
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(obj.x + obj.w * 0.8, obj.y + obj.h * 0.1, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw zones
    if (showZones) {
      zones.forEach(zone => {
        ctx.strokeStyle = zone.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        ctx.setLineDash([]);
        ctx.fillStyle = zone.color + '15';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.fillStyle = zone.color;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`${zone.name}: ${zone.count}`, zone.x + 5, zone.y + 15);
      });
    }

    // Process detections and tracking
    const currentTracks = new Map(trackedObjects);
    const matchedTrackIds = new Set<number>();

    demoObjects.forEach(obj => {
      const bbox: [number, number, number, number] = [obj.x, obj.y, obj.w, obj.h];
      const centerX = obj.x + obj.w / 2;
      const centerY = obj.y + obj.h / 2;
      const fakeScore = 0.75 + Math.random() * 0.2;

      let bestMatch: number | null = null;
      let bestIoU = 0.25;

      currentTracks.forEach((track, id) => {
        const lastBox = track.lastDetection.bbox;
        const iou = calculateIoU(bbox, lastBox);
        if (iou > bestIoU) {
          bestIoU = iou;
          bestMatch = id;
        }
      });

      if (bestMatch !== null) {
        const track = currentTracks.get(bestMatch)!;
        const detection: Detection = {
          id: `${Date.now()}-${Math.random()}`,
          trackId: bestMatch,
          class: 'bird',
          score: fakeScore,
          bbox,
          timestamp: now,
          status: 'active',
          counted: track.counted,
        };
        track.lastDetection = detection;
        track.lastSeen = now;
        track.history.push(detection);
        track.path.push({ x: centerX, y: centerY, t: now });
        if (track.path.length > 30) track.path.shift();

        // Zone counting
        if (showZones) {
          zones.forEach(zone => {
            if (zone.active && isInZone(centerX, centerY, zone) && !track.counted) {
              track.counted = true;
              track.countZone = zone.id;
              setZones(prev => prev.map(z =>
                z.id === zone.id ? { ...z, count: z.count + 1 } : z
              ));
              setTotalCount(prev => prev + 1);
            }
          });
        }
        matchedTrackIds.add(bestMatch);
      } else {
        const newId = ++trackIdCounter.current;
        const detection: Detection = {
          id: `${Date.now()}-${Math.random()}`,
          trackId: newId,
          class: 'bird',
          score: fakeScore,
          bbox,
          timestamp: now,
          status: 'active',
          counted: false,
        };
        currentTracks.set(newId, {
          trackId: newId,
          lastDetection: detection,
          history: [detection],
          firstSeen: now,
          lastSeen: now,
          counted: false,
          path: [{ x: centerX, y: centerY, t: now }],
        });
      }
    });

    // Mark old tracks
    currentTracks.forEach((track, id) => {
      if (!matchedTrackIds.has(id)) {
        if (now - track.lastSeen > 2000) {
          track.lastDetection.status = 'lost';
        } else {
          track.lastDetection.status = 'occluded';
        }
      }
    });

    // Remove old tracks
    currentTracks.forEach((track, id) => {
      if (now - track.lastSeen > 5000) currentTracks.delete(id);
    });

    setTrackedObjects(new Map(currentTracks));

    // Draw bounding boxes
    if (showBoxes) {
      currentTracks.forEach(track => {
        const det = track.lastDetection;
        const [x, y, w, h] = det.bbox;

        let color = '#22c55e';
        if (det.status === 'occluded') color = '#eab308';
        if (det.status === 'lost') color = '#ef4444';
        if (track.counted) color = '#3b82f6';

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        const label = showIds ? `#${track.trackId} bird ${(det.score * 100).toFixed(0)}%` : `bird ${(det.score * 100).toFixed(0)}%`;
        const textWidth = ctx.measureText(label).width + 8;
        ctx.fillStyle = color;
        ctx.fillRect(x, y - 18, textWidth, 18);
        ctx.fillStyle = '#fff';
        ctx.font = '11px monospace';
        ctx.fillText(label, x + 4, y - 5);

        // Draw path
        if (track.path.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = color + '60';
          ctx.lineWidth = 1;
          track.path.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
        }
      });
    }

    // Demo mode label
    ctx.fillStyle = '#ffffff80';
    ctx.font = '10px monospace';
    ctx.fillText('DEMO MODE - Simulated Detection (TF.js ready for live camera)', 10, canvas.height - 10);

    // FPS
    frameCount.current++;
    if (now - lastFrameTime.current >= 1000) {
      setFps(frameCount.current);
      frameCount.current = 0;
      lastFrameTime.current = now;
    }

    if (isRunning) {
      animFrameRef.current = requestAnimationFrame(detectDemo);
    }
  }, [isRunning, useDemoMode, demoObjects, trackedObjects, zones, showZones, showBoxes, showIds]);

  // Real camera detection loop
  const detect = useCallback(async () => {
    if (!videoRef.current || !modelRef.current || !canvasRef.current || !isRunning || useDemoMode) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.readyState < 2) {
      if (isRunning) animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    try {
      const predictions = await modelRef.current.detect(video);
      const now = performance.now();

      const filtered = predictions.filter(p =>
        p.class.toLowerCase() === detectionClass && p.score >= confidence
      );

      const currentTracks = new Map(trackedObjects);
      const matchedTrackIds = new Set<number>();

      filtered.forEach(pred => {
        const bbox = pred.bbox as [number, number, number, number];
        const centerX = bbox[0] + bbox[2] / 2;
        const centerY = bbox[1] + bbox[3] / 2;

        let bestMatch: number | null = null;
        let bestIoU = 0.3;

        currentTracks.forEach((track, id) => {
          const lastBox = track.lastDetection.bbox;
          const iou = calculateIoU(bbox, lastBox);
          if (iou > bestIoU) {
            bestIoU = iou;
            bestMatch = id;
          }
        });

        if (bestMatch !== null) {
          const track = currentTracks.get(bestMatch)!;
          const detection: Detection = {
            id: `${Date.now()}-${Math.random()}`,
            trackId: bestMatch,
            class: pred.class,
            score: pred.score,
            bbox,
            timestamp: now,
            status: 'active',
            counted: track.counted,
          };
          track.lastDetection = detection;
          track.lastSeen = now;
          track.history.push(detection);
          track.path.push({ x: centerX, y: centerY, t: now });
          if (track.path.length > 50) track.path.shift();

          if (showZones) {
            zones.forEach(zone => {
              if (zone.active && isInZone(centerX, centerY, zone) && !track.counted) {
                track.counted = true;
                track.countZone = zone.id;
                setZones(prev => prev.map(z =>
                  z.id === zone.id ? { ...z, count: z.count + 1 } : z
                ));
                setTotalCount(prev => prev + 1);
              }
            });
          }
          matchedTrackIds.add(bestMatch);
        } else {
          const newId = ++trackIdCounter.current;
          const detection: Detection = {
            id: `${Date.now()}-${Math.random()}`,
            trackId: newId,
            class: pred.class,
            score: pred.score,
            bbox,
            timestamp: now,
            status: 'active',
            counted: false,
          };
          currentTracks.set(newId, {
            trackId: newId,
            lastDetection: detection,
            history: [detection],
            firstSeen: now,
            lastSeen: now,
            counted: false,
            path: [{ x: centerX, y: centerY, t: now }],
          });
        }
      });

      currentTracks.forEach((track, id) => {
        if (!matchedTrackIds.has(id) && now - track.lastSeen > 2000) {
          track.lastDetection.status = 'lost';
        } else if (!matchedTrackIds.has(id)) {
          track.lastDetection.status = 'occluded';
        }
      });

      currentTracks.forEach((track, id) => {
        if (now - track.lastSeen > 5000) currentTracks.delete(id);
      });

      setTrackedObjects(new Map(currentTracks));

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showZones) {
        zones.forEach(zone => {
          ctx.strokeStyle = zone.color;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
          ctx.setLineDash([]);
          ctx.fillStyle = zone.color + '20';
          ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
          ctx.fillStyle = zone.color;
          ctx.font = '12px monospace';
          ctx.fillText(`${zone.name}: ${zone.count}`, zone.x + 5, zone.y + 15);
        });
      }

      if (showBoxes) {
        currentTracks.forEach(track => {
          const det = track.lastDetection;
          const [x, y, w, h] = det.bbox;

          let color = '#22c55e';
          if (det.status === 'occluded') color = '#eab308';
          if (det.status === 'lost') color = '#ef4444';
          if (track.counted) color = '#3b82f6';

          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          const label = showIds ? `#${track.trackId} ${det.class} ${(det.score * 100).toFixed(0)}%` : `${det.class} ${(det.score * 100).toFixed(0)}%`;
          ctx.fillStyle = color;
          ctx.fillRect(x, y - 18, ctx.measureText(label).width + 8, 18);
          ctx.fillStyle = '#fff';
          ctx.font = '11px monospace';
          ctx.fillText(label, x + 4, y - 5);

          if (track.path.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = color + '60';
            ctx.lineWidth = 1;
            track.path.forEach((p, i) => {
              if (i === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
          }
        });
      }

      frameCount.current++;
      if (now - lastFrameTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastFrameTime.current = now;
      }
    } catch (err) {
      console.error('Detection error:', err);
    }

    if (isRunning) {
      animFrameRef.current = requestAnimationFrame(detect);
    }
  }, [isRunning, useDemoMode, trackedObjects, zones, showZones, showBoxes, showIds, confidence, detectionClass]);

  // Start appropriate detection loop
  useEffect(() => {
    if (isRunning) {
      if (useDemoMode) {
        animFrameRef.current = requestAnimationFrame(detectDemo);
      } else if (modelLoaded && cameraReady) {
        animFrameRef.current = requestAnimationFrame(detect);
      }
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, modelLoaded, cameraReady, useDemoMode, detect, detectDemo]);

  // Session timer
  useEffect(() => {
    let interval: number;
    if (sessionActive && isRunning) {
      interval = window.setInterval(() => setSessionTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, isRunning]);

  const handleStart = async () => {
    if (useDemoMode || modelError) {
      // Demo mode - no camera needed
      setIsRunning(true);
      setSessionActive(true);
      return;
    }
    if (!modelLoaded) return;
    await startCamera();
    if (!cameraError) {
      setIsRunning(true);
      setSessionActive(true);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setCameraReady(false);
    }
  };

  const handleReset = () => {
    setTotalCount(0);
    setManualCorrection(0);
    setSessionTime(0);
    setTrackedObjects(new Map());
    setZones(prev => prev.map(z => ({ ...z, count: 0 })));
    trackIdCounter.current = 0;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const activeTracks = Array.from(trackedObjects.values()).filter(t => t.lastDetection.status !== 'lost');

  return (
    <div className="flex flex-col h-full">
      {/* Stats Bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{totalCount + manualCorrection}</div>
            <div className="text-[10px] text-gray-400">Total Count</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{activeTracks.length}</div>
            <div className="text-[10px] text-gray-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">{fps}</div>
            <div className="text-[10px] text-gray-400">FPS</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{formatTime(sessionTime)}</div>
            <div className="text-[10px] text-gray-400">Session</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
          <span className="text-xs text-gray-400">{isRunning ? 'LIVE' : 'IDLE'}</span>
          {useDemoMode && <span className="text-[10px] bg-yellow-600/30 text-yellow-400 px-1.5 py-0.5 rounded">DEMO</span>}
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {/* Model Loading */}
        {modelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 z-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-green-400 text-sm font-medium">Loading TensorFlow.js Model...</p>
              <p className="text-gray-500 text-xs mt-2">Downloading COCO-SSD MobileNet v2 (~4MB)</p>
              <p className="text-gray-600 text-xs mt-1">Real ML inference engine initializing</p>
            </div>
          </div>
        )}

        {/* Camera Error / Start Screen */}
        {!isRunning && !modelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10">
            <div className="text-center max-w-md px-6">
              {cameraError ? (
                <>
                  <AlertCircle className="mx-auto text-red-400 mb-3" size={48} />
                  <p className="text-red-400 text-sm mb-2">{cameraError}</p>
                  <p className="text-gray-500 text-xs mb-4">
                    Camera access is required for live detection. You can also use Demo Mode to see the tracking system in action.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={startCamera} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-1">
                      <CameraIcon size={14} /> Retry Camera
                    </button>
                    <button onClick={() => { setUseDemoMode(true); handleStart(); }} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm">
                      Use Demo Mode
                    </button>
                  </div>
                </>
              ) : modelError ? (
                <>
                  <AlertCircle className="mx-auto text-yellow-400 mb-3" size={48} />
                  <p className="text-yellow-400 text-sm mb-2">{modelError}</p>
                  <p className="text-gray-500 text-xs mb-4">
                    The ML model couldn't be loaded. Demo mode uses simulated detections to demonstrate the full tracking pipeline.
                  </p>
                  <button onClick={() => { setUseDemoMode(true); handleStart(); }} className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium">
                    Start Demo Mode
                  </button>
                </>
              ) : (
                <>
                  <CameraIcon className="mx-auto text-green-400 mb-3" size={48} />
                  <h3 className="text-white font-medium mb-2">Ready to Detect</h3>
                  <p className="text-gray-400 text-xs mb-4">
                    TensorFlow.js model loaded. Click Start to access your camera and begin real-time detection.
                  </p>
                  {permissionState === 'denied' && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <Shield size={12} /> Camera permission was denied. Please enable it in browser settings.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 justify-center">
                    <button onClick={handleStart} className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                      <Play size={18} /> Start Live Detection
                    </button>
                    <button onClick={() => { setUseDemoMode(true); setIsRunning(true); setSessionActive(true); }} className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm flex items-center gap-1">
                      <VideoOff size={14} /> Demo
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> TF.js Ready</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> COCO-SSD Loaded</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> Tracking Active</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button onClick={isRunning ? handleStop : handleStart} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {isRunning ? <><Pause size={14} /> Stop</> : <><Play size={14} /> Start</>}
            </button>
            <button onClick={handleReset} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs flex items-center gap-1">
              <RotateCcw size={14} /> Reset
            </button>
            {!useDemoMode && !isRunning && (
              <button onClick={() => setUseDemoMode(!useDemoMode)} className="px-3 py-1.5 bg-yellow-700/50 hover:bg-yellow-700 rounded-lg text-xs text-yellow-300">
                {useDemoMode ? 'Live' : 'Demo'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setManualCorrection(prev => prev - 1)} className="w-7 h-7 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600">
              <Minus size={14} />
            </button>
            <span className="text-xs text-gray-300 min-w-[60px] text-center">±{manualCorrection}</span>
            <button onClick={() => setManualCorrection(prev => prev + 1)} className="w-7 h-7 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600">
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs text-gray-400">
            <input type="checkbox" checked={showBoxes} onChange={e => setShowBoxes(e.target.checked)} className="rounded" />
            Boxes
          </label>
          <label className="flex items-center gap-1 text-xs text-gray-400">
            <input type="checkbox" checked={showIds} onChange={e => setShowIds(e.target.checked)} className="rounded" />
            IDs
          </label>
          <label className="flex items-center gap-1 text-xs text-gray-400">
            <input type="checkbox" checked={showZones} onChange={e => setShowZones(e.target.checked)} className="rounded" />
            <Target size={12} /> Zones
          </label>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[10px] text-gray-500">Conf:</span>
            <input type="range" min="0.1" max="0.9" step="0.1" value={confidence} onChange={e => setConfidence(parseFloat(e.target.value))} className="w-16 h-1" />
            <span className="text-[10px] text-gray-400">{confidence.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
