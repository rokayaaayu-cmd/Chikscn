import React, { useState } from 'react';
import { Screen } from './types';
import CameraScreen from './components/CameraScreen';
import TrainingScreen from './components/TrainingScreen';
import ModelManagerScreen from './components/ModelManagerScreen';
import TestLabScreen from './components/TestLabScreen';
import ReportsScreen from './components/ReportsScreen';
import SettingsScreen from './components/SettingsScreen';
import { Camera, Dumbbell, Box, FlaskConical, BarChart3, Settings, Bird } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('camera');

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
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bird className="text-green-400" size={28} />
          <h1 className="text-xl font-bold text-green-400">Live Count</h1>
          <span className="text-xs text-gray-400 ml-2">Broiler Chicken Detection</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-gray-400">TensorFlow.js Active</span>
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
