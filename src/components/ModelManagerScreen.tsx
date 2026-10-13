import React, { useState } from 'react';
import { ModelInfo } from '../types';
import { Box, Download, Upload, Trash2, CheckCircle, AlertCircle, Clock, Cpu, HardDrive, Zap } from 'lucide-react';

export default function ModelManagerScreen() {
  const [models, setModels] = useState<ModelInfo[]>([
    { id: '1', name: 'COCO-SSD MobileNet v2', version: '1.0.0', type: 'tfjs', size: '4.2 MB', accuracy: 78.5, inferenceTime: 45, status: 'ready' },
    { id: '2', name: 'Broiler Detector v2', version: '2.1.0', type: 'tflite', size: '12.8 MB', accuracy: 92.3, inferenceTime: 28, status: 'ready' },
    { id: '3', name: 'Chicken Counter ONNX', version: '1.3.0', type: 'onnx', size: '8.5 MB', accuracy: 89.7, inferenceTime: 35, status: 'ready' },
    { id: '4', name: 'Overlap Resolver', version: '0.9.0', type: 'tfjs', size: '6.1 MB', accuracy: 85.2, inferenceTime: 52, status: 'training' },
    { id: '5', name: 'Group Segmentation', version: '1.0.0-beta', type: 'onnx', size: '15.2 MB', accuracy: 0, inferenceTime: 0, status: 'error' },
  ]);
  const [selectedModel, setSelectedModel] = useState<string>('1');
  const [importingModel, setImportingModel] = useState(false);

  const handleImport = () => {
    setImportingModel(true);
    setTimeout(() => {
      const newModel: ModelInfo = {
        id: Date.now().toString(),
        name: 'Imported Model',
        version: '1.0.0',
        type: 'tfjs',
        size: '5.0 MB',
        accuracy: 80.0,
        inferenceTime: 40,
        status: 'ready',
      };
      setModels(prev => [...prev, newModel]);
      setImportingModel(false);
    }, 2000);
  };

  const handleDelete = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
  };

  const handleSetActive = (id: string) => {
    setSelectedModel(id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle size={14} className="text-green-400" />;
      case 'training': return <Clock size={14} className="text-yellow-400 animate-pulse" />;
      case 'error': return <AlertCircle size={14} className="text-red-400" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tfjs': return 'bg-blue-500/20 text-blue-400';
      case 'tflite': return 'bg-green-500/20 text-green-400';
      case 'onnx': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Box className="text-purple-400" size={20} />
            Model Manager
          </h2>
          <button onClick={handleImport} disabled={importingModel} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs flex items-center gap-1 disabled:opacity-50">
            <Upload size={14} /> {importingModel ? 'Importing...' : 'Import Model'}
          </button>
        </div>

        {/* Active Model Info */}
        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-700/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-green-400" />
            <span className="text-sm font-medium text-green-400">Active Model</span>
          </div>
          {(() => {
            const active = models.find(m => m.id === selectedModel);
            if (!active) return null;
            return (
              <div>
                <div className="text-white font-medium">{active.name}</div>
                <div className="text-xs text-gray-400 mt-1">v{active.version} • {active.type.toUpperCase()}</div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{active.accuracy}%</div>
                    <div className="text-[10px] text-gray-400">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{active.inferenceTime}ms</div>
                    <div className="text-[10px] text-gray-400">Inference</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">{active.size}</div>
                    <div className="text-[10px] text-gray-400">Size</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Model List */}
        <div className="space-y-2">
          {models.map(model => (
            <div
              key={model.id}
              className={`p-3 rounded-lg border transition-all ${
                selectedModel === model.id ? 'border-green-500 bg-green-500/5' : 'border-gray-700 bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{model.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeColor(model.type)}`}>
                      {model.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <HardDrive size={10} /> {model.size}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Cpu size={10} /> {model.inferenceTime}ms
                    </span>
                    <span className="text-xs text-gray-400">
                      v{model.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusIcon(model.status)}
                    <span className="text-[10px] text-gray-400 capitalize">{model.status}</span>
                    {model.accuracy > 0 && (
                      <div className="flex items-center gap-1 ml-2">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${model.accuracy}%` }}></div>
                        </div>
                        <span className="text-[10px] text-gray-400">{model.accuracy}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selectedModel !== model.id && model.status === 'ready' && (
                    <button onClick={() => handleSetActive(model.id)} className="p-1.5 bg-green-600/20 hover:bg-green-600/40 rounded text-green-400" title="Set Active">
                      <CheckCircle size={14} />
                    </button>
                  )}
                  <button className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 rounded text-blue-400" title="Download">
                    <Download size={14} />
                  </button>
                  <button onClick={() => handleDelete(model.id)} className="p-1.5 bg-red-600/20 hover:bg-red-600/40 rounded text-red-400" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Model Comparison */}
        <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-white mb-3">Model Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">Model</th>
                  <th className="text-center py-2">Accuracy</th>
                  <th className="text-center py-2">Speed</th>
                  <th className="text-center py-2">Size</th>
                </tr>
              </thead>
              <tbody>
                {models.filter(m => m.status === 'ready').map(model => (
                  <tr key={model.id} className="border-b border-gray-700/50">
                    <td className="py-2 text-white">{model.name}</td>
                    <td className="text-center text-green-400">{model.accuracy}%</td>
                    <td className="text-center text-blue-400">{model.inferenceTime}ms</td>
                    <td className="text-center text-purple-400">{model.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
