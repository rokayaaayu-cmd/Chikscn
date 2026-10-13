import React, { useState, useRef } from 'react';
import { TrainingData } from '../types';
import { Upload, Image, Tag, Play, CheckCircle, AlertCircle, FolderOpen, Plus, Trash2 } from 'lucide-react';

export default function TrainingScreen() {
  const [datasets, setDatasets] = useState<TrainingData[]>([
    { id: '1', name: 'Broiler Dataset v1', images: 2500, annotations: 8420, classes: ['chicken', 'feeder', 'waterer'], createdAt: Date.now() - 86400000 * 7, size: '1.2 GB', status: 'ready' },
    { id: '2', name: 'Overlap Cases', images: 800, annotations: 1200, classes: ['chicken-overlapping', 'chicken-group'], createdAt: Date.now() - 86400000 * 3, size: '450 MB', status: 'ready' },
    { id: '3', name: 'Occlusion Scenarios', images: 500, annotations: 680, classes: ['chicken-partial', 'chicken-hidden'], createdAt: Date.now() - 86400000, size: '280 MB', status: 'processing' },
  ]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<{ id: string; image: string; bbox: number[]; class: string; verified: boolean }[]>([
    { id: 'a1', image: 'frame_001.jpg', bbox: [120, 80, 60, 45], class: 'chicken', verified: true },
    { id: 'a2', image: 'frame_001.jpg', bbox: [200, 100, 55, 40], class: 'chicken', verified: true },
    { id: 'a3', image: 'frame_002.jpg', bbox: [150, 90, 65, 50], class: 'chicken-overlapping', verified: false },
    { id: 'a4', image: 'frame_003.jpg', bbox: [80, 120, 50, 38], class: 'chicken', verified: true },
    { id: 'a5', image: 'frame_003.jpg', bbox: [300, 80, 45, 35], class: 'chicken-partial', verified: false },
  ]);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedClass, setSelectedClass] = useState('chicken');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newDataset: TrainingData = {
        id: Date.now().toString(),
        name: `Imported ${new Date().toLocaleDateString()}`,
        images: files.length,
        annotations: 0,
        classes: ['chicken'],
        createdAt: Date.now(),
        size: `${(Array.from(files).reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(1)} MB`,
        status: 'processing',
      };
      setDatasets(prev => [...prev, newDataset]);
      // Simulate processing
      setTimeout(() => {
        setDatasets(prev => prev.map(d => d.id === newDataset.id ? { ...d, status: 'ready' as const } : d));
      }, 3000);
    }
  };

  const handleTrain = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + 2;
      });
    }, 200);
  };

  const handleDeleteDataset = (id: string) => {
    setDatasets(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderOpen className="text-blue-400" size={20} />
            Training Data & Annotation
          </h2>
          <button onClick={handleImport} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs flex items-center gap-1">
            <Upload size={14} /> Import Dataset
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Datasets */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Datasets</h3>
          <div className="grid grid-cols-1 gap-2">
            {datasets.map(ds => (
              <div
                key={ds.id}
                onClick={() => setSelectedDataset(ds.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedDataset === ds.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{ds.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {ds.images} images • {ds.annotations} annotations • {ds.size}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      ds.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                      ds.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {ds.status}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDataset(ds.id); }} className="text-gray-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  {ds.classes.map(cls => (
                    <span key={cls} className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px] text-gray-300">{cls}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Annotation Viewer */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-1">
              <Tag size={14} /> Annotations
            </h3>
            <div className="flex items-center gap-2">
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="bg-gray-700 text-xs rounded px-2 py-1 text-white">
                <option value="chicken">chicken</option>
                <option value="chicken-overlapping">chicken-overlapping</option>
                <option value="chicken-partial">chicken-partial</option>
                <option value="chicken-group">chicken-group</option>
              </select>
              <button className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-[10px] flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-gray-700">
              {annotations.map(ann => (
                <div key={ann.id} className="p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image size={14} className="text-gray-500" />
                    <span className="text-xs text-white">{ann.image}</span>
                    <span className="text-[10px] text-gray-500">[{ann.bbox.join(', ')}]</span>
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">{ann.class}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {ann.verified ? (
                      <CheckCircle size={14} className="text-green-400" />
                    ) : (
                      <AlertCircle size={14} className="text-yellow-400" />
                    )}
                    <span className="text-[10px] text-gray-500">{ann.verified ? 'Verified' : 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Training Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Play size={14} className="text-green-400" />
            Sandbox Training
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-700/50 rounded p-2">
              <div className="text-[10px] text-gray-400">Base Model</div>
              <div className="text-xs text-white">MobileNet v2 + SSD</div>
            </div>
            <div className="bg-gray-700/50 rounded p-2">
              <div className="text-[10px] text-gray-400">Epochs</div>
              <div className="text-xs text-white">50</div>
            </div>
            <div className="bg-gray-700/50 rounded p-2">
              <div className="text-[10px] text-gray-400">Learning Rate</div>
              <div className="text-xs text-white">0.001</div>
            </div>
            <div className="bg-gray-700/50 rounded p-2">
              <div className="text-[10px] text-gray-400">Batch Size</div>
              <div className="text-xs text-white">16</div>
            </div>
          </div>

          {isTraining && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Training Progress</span>
                <span className="text-green-400">{trainingProgress}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${trainingProgress}%` }}></div>
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                Epoch {Math.floor(trainingProgress / 2)}/50 • Loss: {(2.5 - trainingProgress * 0.02).toFixed(3)} • mAP: {(trainingProgress * 0.008).toFixed(3)}
              </div>
            </div>
          )}

          <button
            onClick={handleTrain}
            disabled={isTraining || !selectedDataset}
            className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
              isTraining || !selectedDataset ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isTraining ? 'Training...' : 'Start Training'}
          </button>
          {!selectedDataset && <p className="text-[10px] text-yellow-400 mt-1">Select a dataset to train</p>}
        </div>
      </div>
    </div>
  );
}
