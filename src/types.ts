export interface Detection {
  id: string;
  trackId: number;
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  timestamp: number;
  status: 'active' | 'occluded' | 'lost';
  zoneId?: string;
  counted: boolean;
}

export interface TrackedObject {
  trackId: number;
  lastDetection: Detection;
  history: Detection[];
  firstSeen: number;
  lastSeen: number;
  counted: boolean;
  countZone?: string;
  path: { x: number; y: number; t: number }[];
}

export interface CountingZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  count: number;
  color: string;
  active: boolean;
}

export interface SessionData {
  id: string;
  startTime: number;
  endTime?: number;
  totalCount: number;
  manualCorrections: number;
  detections: number;
  avgConfidence: number;
  fps: number;
  zones: CountingZone[];
  status: 'active' | 'paused' | 'completed';
}

export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  type: 'tflite' | 'onnx' | 'tfjs';
  size: string;
  accuracy: number;
  inferenceTime: number;
  lastTrained?: number;
  status: 'ready' | 'training' | 'error';
}

export interface TrainingData {
  id: string;
  name: string;
  images: number;
  annotations: number;
  classes: string[];
  createdAt: number;
  size: string;
  status: 'ready' | 'processing' | 'error';
}

export interface TestResult {
  id: string;
  modelId: string;
  datasetId: string;
  timestamp: number;
  mAP: number;
  precision: number;
  recall: number;
  f1Score: number;
  inferenceTime: number;
  fps: number;
  totalImages: number;
  correctDetections: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface AppSettings {
  confidenceThreshold: number;
  iouThreshold: number;
  maxTrackAge: number;
  minDetectionArea: number;
  maxDetectionArea: number;
  countingLinePosition: number;
  enableTracking: boolean;
  enableZones: boolean;
  darkMode: boolean;
  showConfidence: boolean;
  showTrackIds: boolean;
  showBoundingBoxes: boolean;
  cameraFacing: 'front' | 'back';
  resolution: string;
  targetClass: string;
}

export type Screen = 'camera' | 'training' | 'models' | 'testlab' | 'reports' | 'settings';
