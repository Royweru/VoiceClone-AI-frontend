// Updated TrainModelTab.tsx with validation flow
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { voiceService } from '@/lib/voice';

import ProgressBar from './progressBar';
import SampleCard from './sampleCard';
import TrainingStatus from './trainingStatus';

interface VoiceSampleStats {
  total_samples: number;
  valid_samples: number;
  processing_samples: number;
  invalid_samples: number;
  uploaded_samples: number;
  can_train: boolean;
  total_duration: number;
  average_quality: number;
}

interface TrainModelTabProps {
  taskId: string | null;
  setTaskId: (taskId: string | null) => void;
}

const TrainModelTab: React.FC<TrainModelTabProps> = ({ taskId, setTaskId }) => {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [stats, setStats] = useState<VoiceSampleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [currentTask, setCurrentTask] = useState<TrainingTask | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.wav', '.mp3', '.m4a', '.ogg', '.flac']
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: acceptedFiles => {
      setSelectedFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  const loadSamples = async () => {
    try {
      setIsLoading(true);
      const [samplesData, statsData] = await Promise.all([
        voiceService.getVoiceSamples(),
        voiceService.getSampleStats()
      ]);
      setSamples(samplesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load samples:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSamples();
    if (taskId) {
       const interval = setInterval(async () => {
        try {
            const task = await voiceService.getTrainingStatus(taskId);
            setCurrentTask(task);
            
            if (task.status === 'completed' || task.status === 'failed') {
                clearInterval(interval);
                // Refresh after completion
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
    }
  }, [taskId]);

  // Auto-refresh samples to show validation progress
  useEffect(() => {
    if (stats && stats.processing_samples > 0) {
      const interval = setInterval(loadSamples, 3000);
      return () => clearInterval(interval);
    }
  }, [stats?.processing_samples]);

  const handleUpload = async () => {
    if (!selectedFiles.length) return;

    try {
      setUploadProgress(0);
      const response = await voiceService.uploadVoiceSamples(
        selectedFiles,
        ({ percentage }: { percentage: number }) => setUploadProgress(percentage)
      );
      
      setSelectedFiles([]);
      setUploadProgress(null);
      
      // Show success message
      if (response.errors && response.errors.length > 0) {
        alert(`Upload completed with some errors:\n${response.errors.join('\n')}`);
      } else {
        alert(`Successfully uploaded ${response.created_count} files. Validation in progress.`);
      }
      
      // Refresh samples and stats
      loadSamples();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
      setUploadProgress(null);
    }
  };

  const handleTrain = async () => {
    if (!stats?.can_train) {
      alert(`Please upload at least 5 valid voice samples before training. Current valid samples: ${stats?.valid_samples || 0}`);
      return;
    }

    try {
      setIsTraining(true);
      const task = await voiceService.startTraining();
      setTaskId(task.task_id);
      setCurrentTask(task);
    } catch (error: any) {
      console.error('Training failed:', error);
      
      // Show detailed error message
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        alert(`Training failed: ${error.response.data.error}\n\nDetails:\n` +
              `- Valid samples: ${details.valid_samples}/${details.required_samples}\n` +
              `- Total samples: ${details.total_samples}\n` +
              `- Processing samples: ${details.processing_samples}\n` +
              `- Invalid samples: ${details.invalid_samples}`);
      } else {
        alert('Failed to start training. Please try again.');
      }
    } finally {
      setIsTraining(false);
    }
  };

  const handleDeleteSample = async (sampleId: number) => {
    try {
      await voiceService.deleteVoiceSample(sampleId);
      setSamples(prev => prev.filter(s => s.id !== sampleId));
      // Refresh stats
      loadSamples();
    } catch (error) {
      console.error('Failed to delete sample:', error);
      alert('Failed to delete sample. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-50';
      case 'invalid': return 'text-red-600 bg-red-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'uploaded': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid': return 'Valid ✓';
      case 'invalid': return 'Invalid ✗';
      case 'processing': return 'Processing...';
      case 'uploaded': return 'Uploaded';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Upload Voice Samples</h2>
        
        <div 
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-3">
            <svg
              className="w-12 h-12 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop audio files, or click to select'}
            </p>
            <p className="text-sm text-gray-500">Supports WAV, MP3, M4A, OGG, FLAC (max 50MB each)</p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">Selected Files ({selectedFiles.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="truncate">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button
                onClick={handleUpload}
                disabled={uploadProgress !== null}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {uploadProgress !== null ? `Uploading... ${uploadProgress}%` : 'Upload Files'}
              </button>
              {uploadProgress !== null && (
                <ProgressBar value={uploadProgress} className="mt-2" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Training Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Train Your Model</h2>
          {stats && (
            <div className="text-sm text-gray-500">
              {stats.valid_samples}/{stats.total_samples} valid samples • {voiceService.formatDuration(stats.total_duration)}
            </div>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 font-bold text-xl">{stats.total_samples}</div>
              <div className="text-gray-600">Total Samples</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 font-bold text-xl">{stats.valid_samples}</div>
              <div className="text-gray-600">Valid Samples</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-yellow-600 font-bold text-xl">{stats.processing_samples}</div>
              <div className="text-gray-600">Processing</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-red-600 font-bold text-xl">{stats.invalid_samples}</div>
              <div className="text-gray-600">Invalid</div>
            </div>
          </div>
        )}

        <button
          onClick={handleTrain}
          disabled={!stats?.can_train || isTraining || !!taskId}
          className={`w-full py-3 px-4 rounded-lg font-medium ${
            stats?.can_train && !isTraining && !taskId
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          } transition-opacity`}
        >
          {isTraining ? 'Starting Training...' : 
           taskId ? 'Training in Progress...' :
           !stats?.can_train ? `Need ${5 - (stats?.valid_samples || 0)} more valid samples` :
           'Start Training'}
        </button>

        {currentTask && (
          <div className="mt-6">
            <TrainingStatus task={currentTask} />
          </div>
        )}
      </div>

      {/* Samples List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Your Voice Samples</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : samples.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {samples.map(sample => (
              <div key={sample.id} className="relative">
                <SampleCard
                  sample={sample}
                  onDelete={handleDeleteSample}
                />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sample.status||'')}`}>
                  {getStatusText(sample?.status||'unknown')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <p>No voice samples uploaded yet</p>
            <p className="text-sm">Upload at least 5 samples to start training</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainModelTab;