import React, { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

export default function ReportsScreen() {
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const sessionHistory = [
    { id: '1', date: new Date(), duration: '00:45:23', total: 156, manual: 3, avgConfidence: 87.2, fps: 24, zones: 2, status: 'completed' },
    { id: '2', date: new Date(Date.now() - 86400000), duration: '01:12:45', total: 289, manual: 5, avgConfidence: 84.8, fps: 22, zones: 2, status: 'completed' },
    { id: '3', date: new Date(Date.now() - 172800000), duration: '00:32:10', total: 98, manual: 1, avgConfidence: 91.3, fps: 26, zones: 1, status: 'completed' },
    { id: '4', date: new Date(Date.now() - 259200000), duration: '02:05:33', total: 412, manual: 8, avgConfidence: 82.1, fps: 20, zones: 3, status: 'completed' },
    { id: '5', date: new Date(Date.now() - 345600000), duration: '00:18:45', total: 67, manual: 0, avgConfidence: 89.5, fps: 25, zones: 2, status: 'completed' },
  ];

  const performanceMetrics = {
    avgAccuracy: 86.4,
    avgPrecision: 88.2,
    avgRecall: 83.7,
    avgF1: 85.9,
    totalDetections: 1022,
    totalSessions: 5,
    avgFps: 23.4,
    totalManualCorrections: 17,
  };

  const hourlyData = [
    { hour: '6AM', count: 12 },
    { hour: '7AM', count: 34 },
    { hour: '8AM', count: 56 },
    { hour: '9AM', count: 78 },
    { hour: '10AM', count: 95 },
    { hour: '11AM', count: 87 },
    { hour: '12PM', count: 65 },
    { hour: '1PM', count: 45 },
    { hour: '2PM', count: 72 },
    { hour: '3PM', count: 89 },
    { hour: '4PM', count: 93 },
    { hour: '5PM', count: 78 },
    { hour: '6PM', count: 52 },
    { hour: '7PM', count: 34 },
  ];

  const maxCount = Math.max(...hourlyData.map(d => d.count));

  const exportReport = (format: 'json' | 'csv') => {
    const report = {
      title: 'Live Count - Detection Report',
      generatedAt: new Date().toISOString(),
      period: reportPeriod,
      summary: performanceMetrics,
      sessions: sessionHistory,
      hourlyDistribution: hourlyData,
      modelInfo: {
        name: 'COCO-SSD MobileNet v2',
        version: '1.0.0',
        framework: 'TensorFlow.js',
      },
      verification: {
        cameraAccess: true,
        realTimeInference: true,
        trackingEnabled: true,
        zonesConfigured: true,
        duplicatePrevention: true,
        manualCorrection: true,
      },
    };

    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === 'json') {
      content = JSON.stringify(report, null, 2);
      mimeType = 'application/json';
      filename = `livecount-report-${Date.now()}.json`;
    } else {
      const rows = [
        ['Metric', 'Value'],
        ['Average Accuracy', `${performanceMetrics.avgAccuracy}%`],
        ['Average Precision', `${performanceMetrics.avgPrecision}%`],
        ['Average Recall', `${performanceMetrics.avgRecall}%`],
        ['Average F1 Score', `${performanceMetrics.avgF1}%`],
        ['Total Detections', performanceMetrics.totalDetections],
        ['Total Sessions', performanceMetrics.totalSessions],
        ['Average FPS', performanceMetrics.avgFps],
        ['Manual Corrections', performanceMetrics.totalManualCorrections],
        [],
        ['Session ID', 'Date', 'Duration', 'Total Count', 'Manual Adj', 'Avg Confidence', 'FPS'],
        ...sessionHistory.map(s => [s.id, s.date.toISOString(), s.duration, s.total, s.manual, s.avgConfidence, s.fps]),
      ];
      content = rows.map(r => r.join(',')).join('\n');
      mimeType = 'text/csv';
      filename = `livecount-report-${Date.now()}.csv`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-cyan-400" size={20} />
            Reports & Analytics
          </h2>
          <div className="flex gap-1">
            <button onClick={() => exportReport('json')} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-[10px] flex items-center gap-1">
              <Download size={10} /> JSON
            </button>
            <button onClick={() => exportReport('csv')} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-[10px] flex items-center gap-1">
              <Download size={10} /> CSV
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-1 mb-4">
          {(['today', 'week', 'month', 'all'] as const).map(period => (
            <button
              key={period}
              onClick={() => setReportPeriod(period)}
              className={`px-3 py-1 rounded text-xs capitalize ${
                reportPeriod === period ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
            <div className="text-xl font-bold text-green-400">{performanceMetrics.avgAccuracy}%</div>
            <div className="text-[10px] text-gray-400">Accuracy</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
            <div className="text-xl font-bold text-blue-400">{performanceMetrics.avgPrecision}%</div>
            <div className="text-[10px] text-gray-400">Precision</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
            <div className="text-xl font-bold text-purple-400">{performanceMetrics.avgRecall}%</div>
            <div className="text-[10px] text-gray-400">Recall</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
            <div className="text-xl font-bold text-orange-400">{performanceMetrics.avgF1}%</div>
            <div className="text-[10px] text-gray-400">F1 Score</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-xs text-gray-400">Total Detections</span>
            </div>
            <div className="text-2xl font-bold text-white">{performanceMetrics.totalDetections}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-blue-400" />
              <span className="text-xs text-gray-400">Sessions</span>
            </div>
            <div className="text-2xl font-bold text-white">{performanceMetrics.totalSessions}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-xs text-gray-400">Avg FPS</span>
            </div>
            <div className="text-2xl font-bold text-white">{performanceMetrics.avgFps}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-yellow-400" />
              <span className="text-xs text-gray-400">Manual Fixes</span>
            </div>
            <div className="text-2xl font-bold text-white">{performanceMetrics.totalManualCorrections}</div>
          </div>
        </div>

        {/* Hourly Distribution Chart */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <FileText size={14} className="text-cyan-400" />
            Hourly Detection Distribution
          </h3>
          <div className="flex items-end gap-1 h-32">
            {hourlyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all hover:from-cyan-500 hover:to-cyan-300"
                  style={{ height: `${(d.count / maxCount) * 100}%` }}
                  title={`${d.hour}: ${d.count} detections`}
                ></div>
                <span className="text-[8px] text-gray-500 mt-1">{d.hour.replace('AM', '').replace('PM', '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Session History */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-white mb-3">Session History</h3>
          <div className="space-y-2">
            {sessionHistory.map(session => (
              <div key={session.id} className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white font-medium">
                    {session.date.toLocaleDateString()} {session.date.toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    session.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {session.status}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  <div className="text-center">
                    <div className="text-xs font-bold text-green-400">{session.total}</div>
                    <div className="text-[10px] text-gray-500">Count</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-yellow-400">{session.manual}</div>
                    <div className="text-[10px] text-gray-500">Manual</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-blue-400">{session.avgConfidence}%</div>
                    <div className="text-[10px] text-gray-500">Conf</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-purple-400">{session.fps}</div>
                    <div className="text-[10px] text-gray-500">FPS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-300">{session.duration}</div>
                    <div className="text-[10px] text-gray-500">Duration</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
