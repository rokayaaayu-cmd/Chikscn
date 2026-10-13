import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Detection, TrackedObject, CountingZone, SessionData } from '../types';
import { Play, Pause, RotateCcw, Plus, Minus, Target, AlertCircle } from 'lucide-react';

export default function CameraScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animFrameRef = useRef<number>(0);
  const trackIdCounter = useRef(0);
  
  const [isRunning, setIsRunning] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [trackedObjects, setTrackedObjects] = useState<Map<number, TrackedObject>>(new Map());
  const [totalCount, setTotalCount] = useState(0);
  const [manualCorrection, setManualCorrection] = useState(0);
  const [fps, setFps] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [zones, setZones] = useState<CountingZone[]>([
    { id: 'zone1', name: 'Zone A', x: 50, y: 200, width: 200, height: 150, count: 0, color: '#22c55e', active: true },
    { id: 'zone2', name: 'Zone B', x: 300, y: 200, width: 200, height: 150, count: 0, color: '#eab308', active: true },
  ]);
  const [showZones, setShowZones] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showIds, setShowIds] = useState(true);
  const [confidence, setConfidence] = useState(0.5);
  const [detectionClass, setDetectionClass] = useState('bird');
  const [sessionActive, setSessionActive] = useState(false);

  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);

  // Load TensorFlow.js model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setModelLoading(true);
        await tf.ready();
        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        modelRef.current = model;
        setModelLoaded(true);
        setModelLoading(false);
      } catch (err) {
        console.error('Failed to load model:', err);
        setCameraError('Failed to load detection model. Check internet connection.');
        setModelLoading(false);
      }
    };
    loadModel();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(`Camera access denied: ${err.message}. Please allow camera permissions.`);
    }
  }, []);

  // Calculate IoU
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

  // Detection loop
  const detect = useCallback(async () => {
    if (!videoRef.current || !modelRef.current || !canvasRef.current || !isRunning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    try {
      const predictions = await modelRef.current.detect(video);
      const now = performance.now();

      // Filter predictions by class and confidence
      const filtered = predictions.filter(p => 
        p.class.toLowerCase() === detectionClass && p.score >= confidence
      );

      // Update tracked objects
      const currentTracks = new Map(trackedObjects);
      const matchedTrackIds = new Set<number>();

      filtered.forEach(pred => {
        const bbox = pred.bbox as [number, number, number, number];
        const centerX = bbox[0] + bbox[2] / 2;
        const centerY = bbox[1] + bbox[3] / 2;
        
        let bestMatch: number | null = null;
        let bestIoU = 0.3; // IoU threshold for matching

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

          // Check zone counting
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
          // New track
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

      // Mark old tracks as lost
      currentTracks.forEach((track, id) => {
        if (!matchedTrackIds.has(id) && now - track.lastSeen > 2000) {
          track.lastDetection.status = 'lost';
        } else if (!matchedTrackIds.has(id)) {
          track.lastDetection.status = 'occluded';
        }
      });

      // Remove very old tracks
      currentTracks.forEach((track, id) => {
        if (now - track.lastSeen > 5000) {
          currentTracks.delete(id);
        }
      });

      setTrackedObjects(new Map(currentTracks));

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw zones
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

      // Draw detections
      if (showBoxes) {
        currentTracks.forEach(track => {
          const det = track.lastDetection;
          const [x, y, w, h] = det.bbox;
          
          let color = '#22c55e'; // green - active
          if (det.status === 'occluded') color = '#eab308'; // yellow
          if (det.status === 'lost') color = '#ef4444'; // red
          if (track.counted) color = '#3b82f6'; // blue - counted

          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          // Label background
          const label = showIds ? `#${track.trackId} ${det.class} ${(det.score * 100).toFixed(0)}%` : `${det.class} ${(det.score * 100).toFixed(0)}%`;
          ctx.fillStyle = color;
          ctx.fillRect(x, y - 18, ctx.measureText(label).width + 8, 18);
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

      // FPS calculation
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
  }, [isRunning, trackedObjects, zones, showZones, showBoxes, showIds, confidence, detectionClass]);

  // Start/stop detection
  useEffect(() => {
    if (isRunning && modelLoaded) {
      animFrameRef.current = requestAnimationFrame(detect);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, modelLoaded, detect]);

  // Session timer
  useEffect(() => {
    let interval: number;
    if (sessionActive && isRunning) {
      interval = window.setInterval(() => setSessionTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, isRunning]);

  const handleStart = async () => {
    if (!modelLoaded) return;
    await startCamera();
    setIsRunning(true);
    setSessionActive(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
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
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
            <div className="text-center p-6">
              <AlertCircle className="mx-auto text-red-400 mb-3" size={48} />
              <p className="text-red-400 text-sm mb-4">{cameraError}</p>
              <button onClick={startCamera} className="px-4 py-2 bg-green-600 rounded-lg text-sm">
                Retry Camera
              </button>
            </div>
          </div>
        )}
        
        {modelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-green-400 text-sm">Loading TensorFlow.js Model...</p>
              <p className="text-gray-500 text-xs mt-1">Downloading COCO-SSD MobileNet v2</p>
            </div>
          </div>
        )}

        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
        
        {!isRunning && !cameraError && modelLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <button onClick={handleStart} className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl text-lg font-bold flex items-center gap-2 transition-all">
              <Play size={24} /> Start Detection
            </button>
          </div>
        )}
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
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setManualCorrection(prev => prev - 1)} className="w-7 h-7 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600">
              <Minus size={14} />
            </button>
            <span className="text-xs text-gray-300">Manual: {manualCorrection}</span>
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
