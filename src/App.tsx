import React, { useState } from 'react';
import { Screen } from './types';
import CameraScreen from './components/CameraScreen';
import TrainingScreen from './components/TrainingScreen';
import ModelManagerScreen from './components/ModelManagerScreen';
import TestLabScreen from './components/TestLabScreen';
import ReportsScreen from './components/ReportsScreen';
import SettingsScreen from './components/SettingsScreen';
import { Camera, Dumbbell, Box, FlaskConical, BarChart3, Settings, Bird, Download, Github, X } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('camera');
  const [showApkBanner, setShowApkBanner] = useState(true);

  const navItems: { id: Screen; label: string; icon: React.ReactNode }[] = [
    { id: 'camera', label: 'Camera', icon: <Camera size={20} /> },
    { id: 'training', label: 'Training', icon: <Dumbbell size={20} /> },
    { id: 'models', label: 'Models', icon: <Box size={20} /> },
    { id: 'testlab', label: 'Test Lab', icon: <FlaskConical size={20} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const renderScreen = () => {
    switch (currentScreen) {
      case 'camera': return <CameraScreen />;
      case 'training': return <TrainingScreen />;
      case 'models': return <ModelManagerScreen />;
      case 'testlab': return <TestLabScreen />;
      case 'reports': return <ReportsScreen />;
      case 'settings': return <SettingsScreen />;
      default: return <CameraScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* APK Download Banner */}
      {showApkBanner && (
        <div className="bg-gradient-to-r from-green-900/80 to-blue-900/80 border-b border-green-700/50 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="text-green-400" size={16} />
            <div>
              <span className="text-xs font-medium text-green-300">Android APK Available!</span>
              <span className="text-[10px] text-gray-400 ml-2">
                Download from GitHub Actions → Artifacts → app-debug-apk
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
            >
              <Github size={10} /> Get APK
            </a>
            <button onClick={() => setShowApkBanner(false)} className="text-gray-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bird className="text-green-400" size={28} />
          <h1 className="text-xl font-bold text-green-400">Live Count</h1>
          <span className="text-xs text-gray-400 ml-2">Broiler Chicken Detection</span>
          <span className="text-[9px] bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded ml-2">v1.0.0</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500">
            <span className="text-green-400">●</span> Android APK + Web Demo
          </span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-gray-400">Active</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-gray-800 border-t border-gray-700 flex justify-around py-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentScreen(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
              currentScreen === item.id
                ? 'text-green-400 bg-green-400/10'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
