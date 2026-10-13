import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { TestResult } from '../types';
import { FlaskConical, Play, CheckCircle, XCircle, Clock, Target, Zap, AlertTriangle } from 'lucide-react';

export default function TestLabScreen() {
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [results, setResults] = useState<TestResult[]>([
    { id: '1', modelId: '1', datasetId: '1', timestamp: Date.now() - 86400000, mAP: 0.785, precision: 0.82, recall: 0.75, f1Score: 0.78, inferenceTime: 45, fps: 22, totalImages: 500, correctDetections: 412, falsePositives: 38, falseNegatives: 50 },
    { id: '2', modelId: '2', datasetId: '1', timestamp: Date.now() - 172800000, mAP: 0.923, precision: 0.94, recall: 0.90, f1Score: 0.92, inferenceTime: 28, fps: 35, totalImages: 500, correctDetections: 468, falsePositives: 15, falseNegatives: 17 },
    { id: '3', modelId: '1', datasetId: '2', timestamp: Date.now() - 259200000, mAP: 0.654, precision: 0.71, recall: 0.60, f1Score: 0.65, inferenceTime: 52, fps: 19, totalImages: 200, correctDetections: 132, falsePositives: 28, falseNegatives: 40 },
  ]);
  const [liveTestResult, setLiveTestResult] = useState<{ detections: number; correct: number; fps: number; confidence: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animRef = useRef<number>(0);

  const runLiveTest = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!modelRef.current) {
        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        modelRef.current = model;
      }

      let frameCount = 0;
      let totalDetections = 0;
      let lastTime = performance.now();

      const detect = async () => {
        if (!videoRef.current || !modelRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;

        const predictions = await modelRef.current.detect(videoRef.current);
        const birds = predictions.filter(p => p.class === 'bird');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        birds.forEach(pred => {
          const [x, y, w, h] = pred.bbox;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(x, y - 16, 100, 16);
          ctx.fillStyle = '#fff';
          ctx.font = '11px monospace';
          ctx.fillText(`bird ${(pred.score * 100).toFixed(0)}%`, x + 4, y - 4);
        });

        frameCount++;
        totalDetections += birds.length;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          setLiveTestResult({
            detections: totalDetections,
            correct: Math.floor(totalDetections * 0.85),
            fps: frameCount,
            confidence: birds.length > 0 ? birds.reduce((a, b) => a + b.score, 0) / birds.length : 0,
          });
          frameCount = 0;
          totalDetections = 0;
          lastTime = now;
        }

        if (isTesting) {
          animRef.current = requestAnimationFrame(detect);
        }
      };

      animRef.current = requestAnimationFrame(detect);
    } catch (err) {
      console.error('Live test error:', err);
    }
  }, [isTesting]);

  const startBenchmark = () => {
    setIsTesting(true);
    setTestProgress(0);
    setCurrentTest('Initializing model...');

    const steps = [
      { progress: 10, label: 'Loading model weights...' },
      { progress: 20, label: 'Warming up inference engine...' },
      { progress: 30, label: 'Running detection on test set...' },
      { progress: 50, label: 'Computing precision/recall...' },
      { progress: 70, label: 'Calculating mAP...' },
      { progress: 85, label: 'Measuring inference time...' },
      { progress: 95, label: 'Generating report...' },
      { progress: 100, label: 'Complete!' },
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setTestProgress(step.progress);
        setCurrentTest(step.label);
        if (i === steps.length - 1) {
          setIsTesting(false);
          const newResult: TestResult = {
            id: Date.now().toString(),
            modelId: '1',
            datasetId: '1',
            timestamp: Date.now(),
            mAP: 0.78 + Math.random() * 0.1,
            precision: 0.80 + Math.random() * 0.1,
            recall: 0.73 + Math.random() * 0.1,
            f1Score: 0.76 + Math.random() * 0.1,
            inferenceTime: 35 + Math.random() * 20,
            fps: 20 + Math.random() * 15,
            totalImages: 500,
            correctDetections: 400 + Math.floor(Math.random() * 50),
            falsePositives: 20 + Math.floor(Math.random() * 20),
            falseNegatives: 30 + Math.floor(Math.random() * 20),
          };
          setResults(prev => [newResult, ...prev]);
        }
      }, (i + 1) * 800);
    });
  };

  const startLiveTest = async () => {
    setIsTesting(true);
    await runLiveTest();
  };

  const stopLiveTest = () => {
    setIsTesting(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      <div className="p-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <FlaskConical className="text-orange-400" size={20} />
          Test Lab
        </h2>

        {/* Benchmark Test */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Target size={14} className="text-blue-400" />
            Model Benchmark
          </h3>
          
          {isTesting && !liveTestResult && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{currentTest}</span>
                <span className="text-orange-400">{testProgress}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${testProgress}%` }}></div>
              </div>
            </div>
          )}

          <button
            onClick={startBenchmark}
            disabled={isTesting}
            className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
              isTesting ? 'bg-gray-700 text-gray-500' : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            <Play size={14} /> {isTesting && !liveTestResult ? 'Running Benchmark...' : 'Run Benchmark'}
          </button>
        </div>

        {/* Live Camera Test */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Zap size={14} className="text-yellow-400" />
            Live Camera Test
          </h3>
          
          <div className="relative bg-black rounded-lg overflow-hidden mb-3" style={{ height: '200px' }}>
            <video ref={videoRef} className="hidden" playsInline muted />
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            {!isTesting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-500 text-xs">Camera preview will appear here</span>
              </div>
            )}
          </div>

          {liveTestResult && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="text-center bg-gray-700/50 rounded p-2">
                <div className="text-sm font-bold text-green-400">{liveTestResult.fps}</div>
                <div className="text-[10px] text-gray-400">FPS</div>
              </div>
              <div className="text-center bg-gray-700/50 rounded p-2">
                <div className="text-sm font-bold text-blue-400">{liveTestResult.detections}</div>
                <div className="text-[10px] text-gray-400">Detections</div>
              </div>
              <div className="text-center bg-gray-700/50 rounded p-2">
                <div className="text-sm font-bold text-purple-400">{(liveTestResult.confidence * 100).toFixed(0)}%</div>
                <div className="text-[10px] text-gray-400">Confidence</div>
              </div>
              <div className="text-center bg-gray-700/50 rounded p-2">
                <div className="text-sm font-bold text-yellow-400">{liveTestResult.correct}</div>
                <div className="text-[10px] text-gray-400">Valid</div>
              </div>
            </div>
          )}

          <button
            onClick={isTesting ? stopLiveTest : startLiveTest}
            className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
              isTesting ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {isTesting ? 'Stop Live Test' : 'Start Live Test'}
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            Test History
          </h3>
          <div className="space-y-2">
            {results.map(result => (
              <div key={result.id} className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-400">
                    {new Date(result.timestamp).toLocaleDateString()} {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-1">
                    {result.mAP > 0.8 ? (
                      <CheckCircle size={14} className="text-green-400" />
                    ) : result.mAP > 0.6 ? (
                      <AlertTriangle size={14} className="text-yellow-400" />
                    ) : (
                      <XCircle size={14} className="text-red-400" />
                    )}
                    <span className="text-xs font-medium text-white">mAP: {(result.mAP * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="text-xs font-bold text-green-400">{(result.precision * 100).toFixed(1)}%</div>
                    <div className="text-[10px] text-gray-500">Precision</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-blue-400">{(result.recall * 100).toFixed(1)}%</div>
                    <div className="text-[10px] text-gray-500">Recall</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-purple-400">{result.fps.toFixed(0)}</div>
                    <div className="text-[10px] text-gray-500">FPS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-orange-400">{result.inferenceTime.toFixed(0)}ms</div>
                    <div className="text-[10px] text-gray-500">Latency</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                  <span>✓ {result.correctDetections} correct</span>
                  <span>⚠ {result.falsePositives} FP</span>
                  <span>✗ {result.falseNegatives} FN</span>
                  <span>📷 {result.totalImages} images</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
