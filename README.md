# Live Count - Broiler Chicken Detection & Counting

## Overview

Live Count is a real-time object detection and counting application for broiler chickens. It uses **TensorFlow.js** with the **COCO-SSD MobileNet v2** model for genuine ML inference, running directly in the browser with real camera access.

## Architecture

This web application implements the same architecture as a native Android app would:

| Android Native | Web Implementation |
|---|---|
| CameraX | Browser MediaDevices API |
| TensorFlow Lite / ONNX | TensorFlow.js (COCO-SSD) |
| Jetpack Compose | React + Tailwind CSS |
| Kotlin Coroutines | JavaScript async/await |
| Android SDK | Web APIs (Canvas, WebRTC) |

## Features

### 🎥 Real Camera Detection
- **Live camera access** via `navigator.mediaDevices.getUserMedia()`
- **Real TensorFlow.js inference** - COCO-SSD MobileNet v2 model
- **Live bounding boxes** with tracking IDs
- **Confidence scores** displayed per detection
- **Green/Yellow/Red status indicators** (active/occluded/lost)
- **Demo mode** for environments without camera access

### 📊 Tracking & Counting
- **IoU-based object tracking** prevents duplicate counting
- **Unique Track IDs** assigned to each detected object
- **Counting zones** with configurable regions
- **Path visualization** showing movement trajectories
- **Manual correction** (+/-) for operator adjustments
- **Session counters** with real-time statistics

### 🧠 Model Management
- **Multiple model support** (TF.js, TFLite, ONNX formats)
- **Model comparison** table with accuracy/speed metrics
- **Active model selection** with one-click switching
- **Import/export** model files

### 📚 Training & Annotation
- **Dataset import** with image upload
- **Annotation viewer** with bounding box data
- **Class management** for different detection targets
- **Sandbox training** with progress visualization
- **Training metrics** (loss, mAP, epochs)

### 🧪 Test Lab
- **Benchmark testing** with comprehensive metrics
- **Live camera testing** with real-time FPS
- **Precision/Recall/F1/mAP** calculations
- **Test history** with detailed results

### 📈 Reports & Analytics
- **Session history** with full statistics
- **Performance metrics** (accuracy, precision, recall, F1)
- **Hourly distribution** charts
- **Export to JSON/CSV** for external analysis
- **Verification checklist** in exported reports

### ⚙️ Settings
- **Detection parameters** (confidence, IoU, track age)
- **Camera configuration** (facing, resolution)
- **Display options** (boxes, IDs, confidence, zones)
- **Counting zone** position adjustment

## Screens

1. **Camera** - Live detection with real-time inference
2. **Training** - Dataset management and model training
3. **Model Manager** - Model selection and comparison
4. **Test Lab** - Benchmark and live testing
5. **Reports** - Analytics and data export
6. **Settings** - Configuration and preferences

## Technical Details

### Real ML Inference
- **Model**: COCO-SSD (Single Shot Detector) with MobileNet v2 backbone
- **Framework**: TensorFlow.js v4.x
- **Backend**: WebGL (GPU-accelerated) with WASM fallback
- **Classes**: 80 COCO classes (detects 'bird' class for chickens)
- **Model Size**: ~4MB (quantized lite version)
- **Inference Time**: 25-50ms per frame on modern devices

### Tracking Algorithm
- **Method**: IoU (Intersection over Union) based matching
- **Track ID Assignment**: Sequential unique IDs
- **Max Track Age**: Configurable (default 5000ms)
- **Duplicate Prevention**: Zone-based counting with state tracking
- **Occlusion Handling**: Status indicators (active/occluded/lost)

### Camera Access
- Uses standard `getUserMedia()` API
- Prefers rear-facing camera (`facingMode: 'environment'`)
- Falls back to any available camera
- Handles permission denied, not found, and security errors
- Works in HTTPS and localhost contexts

## Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck
```

## Browser Requirements

- Chrome/Edge 90+ (recommended)
- Firefox 85+
- Safari 15+
- Camera permission required for live detection
- WebGL support required for GPU-accelerated inference

## Project Structure

```
├── src/
│   ├── App.tsx                    # Main app with navigation
│   ├── types.ts                   # TypeScript interfaces
│   ├── index.css                  # Global styles
│   ├── main.tsx                   # Entry point
│   └── components/
│       ├── CameraScreen.tsx       # Live detection & camera
│       ├── TrainingScreen.tsx     # Dataset & annotation
│       ├── ModelManagerScreen.tsx # Model management
│       ├── TestLabScreen.tsx      # Testing & benchmarks
│       ├── ReportsScreen.tsx      # Analytics & export
│       └── SettingsScreen.tsx     # Configuration
├── index.html                     # HTML entry
├── package.json                   # Dependencies
├── vite.config.js                 # Build config
├── tsconfig.json                  # TypeScript config
├── README.md                      # This file
├── VERIFICATION_CHECKLIST.md      # Verification checklist
└── .gitignore                     # Git ignore rules
```

## Verification

See [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) for the complete verification checklist covering:
- Camera access verification
- ML inference verification
- Tracking accuracy verification
- Counting accuracy verification
- Performance benchmarks
- Export verification

## License

MIT License - See LICENSE file for details.
