import React, { useState } from 'react';
import { Settings as SettingsIcon, Camera, Cpu, Target, Eye, Monitor, Save, RotateCcw, Info } from 'lucide-react';
import { AppSettings } from '../types';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    confidenceThreshold: 0.5,
    iouThreshold: 0.3,
    maxTrackAge: 5000,
    minDetectionArea: 500,
    maxDetectionArea: 50000,
    countingLinePosition: 50,
    enableTracking: true,
    enableZones: true,
    darkMode: true,
    showConfidence: true,
    showTrackIds: true,
    showBoundingBoxes: true,
    cameraFacing: 'back',
    resolution: '640x480',
    targetClass: 'bird',
  });
  const [saved, setSaved] = useState(false);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('livecount_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults: AppSettings = {
      confidenceThreshold: 0.5,
      iouThreshold: 0.3,
      maxTrackAge: 5000,
      minDetectionArea: 500,
      maxDetectionArea: 50000,
      countingLinePosition: 50,
      enableTracking: true,
      enableZones: true,
      darkMode: true,
      showConfidence: true,
      showTrackIds: true,
      showBoundingBoxes: true,
      cameraFacing: 'back',
      resolution: '640x480',
      targetClass: 'bird',
    };
    setSettings(defaults);
    setSaved(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <SettingsIcon className="text-gray-400" size={20} />
            Settings
          </h2>
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs flex items-center gap-1">
              <RotateCcw size={12} /> Reset
            </button>
            <button onClick={handleSave} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <Save size={12} /> {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* Detection Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Cpu size={14} className="text-blue-400" />
            Detection Parameters
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-400">Confidence Threshold</label>
                <span className="text-xs text-blue-400">{settings.confidenceThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.1" max="0.95" step="0.05"
                value={settings.confidenceThreshold}
                onChange={e => updateSetting('confidenceThreshold', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-400">IoU Threshold (Tracking)</label>
                <span className="text-xs text-blue-400">{settings.iouThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.1" max="0.9" step="0.05"
                value={settings.iouThreshold}
                onChange={e => updateSetting('iouThreshold', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-400">Max Track Age (ms)</label>
                <span className="text-xs text-blue-400">{settings.maxTrackAge}</span>
              </div>
              <input
                type="range" min="1000" max="10000" step="500"
                value={settings.maxTrackAge}
                onChange={e => updateSetting('maxTrackAge', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-400">Min Detection Area (px²)</label>
                <span className="text-xs text-blue-400">{settings.minDetectionArea}</span>
              </div>
              <input
                type="range" min="100" max="5000" step="100"
                value={settings.minDetectionArea}
                onChange={e => updateSetting('minDetectionArea', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Target Class</label>
              <select
                value={settings.targetClass}
                onChange={e => updateSetting('targetClass', e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-sm text-white"
              >
                <option value="bird">Bird (COCO-SSD)</option>
                <option value="chicken">Chicken (Custom)</option>
                <option value="person">Person</option>
              </select>
            </div>
          </div>
        </div>

        {/* Camera Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Camera size={14} className="text-green-400" />
            Camera Settings
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Camera Facing</label>
              <div className="flex gap-2">
                {(['back', 'front'] as const).map(facing => (
                  <button
                    key={facing}
                    onClick={() => updateSetting('cameraFacing', facing)}
                    className={`flex-1 py-2 rounded text-xs capitalize ${
                      settings.cameraFacing === facing ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {facing} Camera
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Resolution</label>
              <select
                value={settings.resolution}
                onChange={e => updateSetting('resolution', e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-sm text-white"
              >
                <option value="320x240">320×240 (Fast)</option>
                <option value="640x480">640×480 (Balanced)</option>
                <option value="1280x720">1280×720 (HD)</option>
                <option value="1920x1080">1920×1080 (Full HD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Eye size={14} className="text-purple-400" />
            Display Settings
          </h3>
          <div className="space-y-3">
            {[
              { key: 'showBoundingBoxes' as const, label: 'Show Bounding Boxes' },
              { key: 'showTrackIds' as const, label: 'Show Track IDs' },
              { key: 'showConfidence' as const, label: 'Show Confidence Scores' },
              { key: 'enableTracking' as const, label: 'Enable Object Tracking' },
              { key: 'enableZones' as const, label: 'Enable Counting Zones' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-gray-400">{label}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings[key] as boolean}
                    onChange={e => updateSetting(key, e.target.checked as any)}
                    className="sr-only"
                  />
                  <div className={`w-9 h-5 rounded-full transition-colors ${settings[key] ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings[key] ? 'translate-x-4' : ''}`}></div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Counting Zone Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Target size={14} className="text-yellow-400" />
            Counting Zone
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-400">Counting Line Position (%)</label>
                <span className="text-xs text-yellow-400">{settings.countingLinePosition}%</span>
              </div>
              <input
                type="range" min="10" max="90" step="5"
                value={settings.countingLinePosition}
                onChange={e => updateSetting('countingLinePosition', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Info size={14} className="text-gray-400" />
            About
          </h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>App Version</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Inference Engine</span>
              <span className="text-white">TensorFlow.js</span>
            </div>
            <div className="flex justify-between">
              <span>Model</span>
              <span className="text-white">COCO-SSD MobileNet v2</span>
            </div>
            <div className="flex justify-between">
              <span>Backend</span>
              <span className="text-white">WebGL / WASM</span>
            </div>
            <div className="flex justify-between">
              <span>Platform</span>
              <span className="text-white">Web (PWA-capable)</span>
            </div>
            <div className="mt-3 p-2 bg-gray-700/50 rounded text-[10px] text-gray-500">
              <p className="mb-1"><strong className="text-gray-300">Architecture Note:</strong> This web app uses TensorFlow.js for real-time object detection in the browser. For native Android deployment, the same architecture maps to:</p>
              <ul className="list-disc list-inside space-y-0.5 mt-1">
                <li>CameraX → Browser MediaDevices API</li>
                <li>TensorFlow Lite → TensorFlow.js</li>
                <li>Jetpack Compose → React + Tailwind</li>
                <li>Kotlin Coroutines → JavaScript async/await</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
