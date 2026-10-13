# Live Count - Broiler Chicken Detection & Counting

## 📱 Download APK

The APK is automatically built by GitHub Actions on every push to `main`.

### How to Download:
1. Go to the **Actions** tab on this GitHub repository
2. Click on the latest **"Build APK"** workflow run
3. Scroll down to **Artifacts**
4. Click **`app-debug-apk`** to download the APK
5. Transfer the APK to your Android device and install

> **Note:** You may need to enable "Install from Unknown Sources" in your Android settings.

---

## 🏗️ Architecture

This project contains both a **native Android app** (Kotlin + Jetpack Compose) and a **web demo** (React + TensorFlow.js).

### Android App (Native)
| Component | Technology |
|---|---|
| UI Framework | Jetpack Compose + Material 3 |
| Camera | CameraX |
| ML Inference | TensorFlow Lite + ONNX Runtime |
| Language | Kotlin |
| Min SDK | 26 (Android 8.0) |
| Build System | Gradle 8.5 + AGP 8.2.2 |
| CI/CD | GitHub Actions |

### Web Demo
| Component | Technology |
|---|---|
| UI Framework | React 18 + Tailwind CSS |
| ML Inference | TensorFlow.js (COCO-SSD) |
| Camera | MediaDevices API |
| Build System | Vite |

## ✨ Features

### 🎥 Real-Time Detection
- **Live camera** via CameraX (Android) / MediaDevices (Web)
- **TensorFlow Lite** on-device inference (Android)
- **TensorFlow.js** browser inference (Web)
- **Live bounding boxes** with tracking IDs
- **Confidence scores** per detection
- **Green/Yellow/Red** status indicators (active/occluded/lost)

### 📊 Tracking & Counting
- **IoU-based multi-object tracking** prevents duplicate counting
- **Unique Track IDs** for each detected chicken
- **Configurable counting zones** with real-time counters
- **Path visualization** showing movement trajectories
- **Manual correction** (+/-) for operator adjustments
- **Session counters** with live statistics

### 🧠 Model Management
- Multiple model support (TFLite, ONNX, TF.js)
- Model comparison with accuracy/speed metrics
- Active model selection
- Import/export model files

### 📚 Training & Annotation
- Dataset import with image upload
- Annotation viewer with bounding box data
- Sandbox training with progress visualization
- Training metrics (loss, mAP, epochs)

### 🧪 Test Lab
- Model benchmark with comprehensive metrics
- Live camera testing with real-time FPS
- Precision/Recall/F1/mAP calculations
- Test history with detailed results

### 📈 Reports & Analytics
- Session history with full statistics
- Performance metrics (accuracy, precision, recall, F1)
- Export to JSON/CSV for external analysis
- Verification checklist in exported reports

## 📂 Project Structure

```
├── .github/workflows/build.yml     # GitHub Actions APK build
├── app/                             # Android app module
│   ├── build.gradle.kts            # App Gradle config (signing fixed)
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/livecount/app/
│       │   ├── MainActivity.kt     # Main activity + Compose navigation
│       │   ├── detection/
│       │   │   ├── ChickenDetector.kt   # TFLite inference wrapper
│       │   │   └── ObjectTracker.kt     # IoU tracking + zones
│       │   ├── data/
│       │   │   └── Models.kt            # Data classes
│       │   └── ui/
│       │       ├── screens/
│       │       │   ├── CameraScreen.kt      # Live detection
│       │       │   └── OtherScreens.kt      # Training, Models, etc.
│       │       └── theme/
│       │           └── Theme.kt             # Material 3 theme
│       └── res/
│           ├── values/
│           ├── xml/
│           ├── drawable/
│           └── mipmap-anydpi-v26/
├── src/                             # Web demo (React)
│   ├── App.tsx
│   ├── components/
│   │   ├── CameraScreen.tsx
│   │   ├── TrainingScreen.tsx
│   │   ├── ModelManagerScreen.tsx
│   │   ├── TestLabScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── types.ts
├── build.gradle.kts                 # Root Gradle config
├── settings.gradle.kts
├── gradle.properties
├── gradle/wrapper/
├── package.json                     # Web dependencies
├── README.md
├── VERIFICATION_CHECKLIST.md
└── LICENSE
```

## 🔨 Building

### Android APK (via GitHub Actions)
The APK is built automatically on push to `main`. Manual build:
```bash
# Requires JDK 17 + Android SDK
gradle assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Web Demo
```bash
npm install
npm run dev      # Development server
npm run build    # Production build
```

## ⚙️ Configuration

### Detection Parameters
- **Confidence Threshold**: 0.1 - 0.95 (default: 0.5)
- **IoU Threshold**: 0.1 - 0.9 (default: 0.3)
- **Max Track Age**: 1000 - 10000ms (default: 5000)
- **Target Class**: Configurable (chicken, bird, etc.)

### Camera Settings
- **Facing**: Front/Back camera selection
- **Resolution**: 320×240 to 1920×1080
- **Frame Rate**: Up to 30 FPS

## 📋 Verification

See [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) for the complete verification checklist.

## 📄 License

MIT License - See [LICENSE](./LICENSE) file.
