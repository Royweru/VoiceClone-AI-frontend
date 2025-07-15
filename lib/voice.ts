// services/voiceService.ts
import api from "./api"


class VoiceService {
  // Upload voice samples with progress tracking
  async uploadVoiceSamples(
    files: File[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    const formData = new FormData()
    files.forEach(file => formData.append('audio', file))

    try {
      const response = await api.post<UploadResponse>('/api/upload-sample/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            })
          }
        }
      })
      return response.data
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  }

  // Get all voice samples for current user
  async getVoiceSamples(): Promise<VoiceSample[]> {
    try {
      const response = await api.get('/api/upload-sample/list/')
      return response.data
    } catch (error) {
      console.error('Failed to fetch samples:', error)
      throw error
    }
  }

  // Delete a voice sample
  async deleteVoiceSample(sampleId: number): Promise<void> {
    try {
      await api.delete(`/api/upload-sample/${sampleId}/`)
    } catch (error) {
      console.error('Failed to delete sample:', error)
      throw error
    }
  }

   // Get sample statistics
  async getSampleStats(): Promise<VoiceSampleStats> {
    try {
      const response = await api.get('/api/samples/stats/')
      return response.data
    } catch (error) {
      console.error('Failed to fetch sample stats:', error)
      throw error
    }
  }


  // Start model training
  async startTraining(): Promise<TrainingTask> {
    try {
      const response = await api.post('/api/train-model/')
          if (response.status !== 202) {
            throw new Error(`Unexpected status: ${response.status}`);
        }
        return {
            task_id: response.data.task_id,
            status: 'pending',
            created_at: new Date().toISOString()
        };
    } catch (error) {
      console.error('Training failed:', error)
      throw error
    }
  }

  // Get training status
  async getTrainingStatus(taskId: string): Promise<TrainingTask> {
    try {
      const response = await api.get(`/api/train-model/${taskId}/`)
      return response.data
    } catch (error) {
      console.error('Failed to get status:', error)
      throw error
    }
  }

  // Text to speech conversion
  async textToSpeech(text: string): Promise<{ audio_url: string }> {
    try {
      const response = await api.post('/api/text-to-speech/', { text })
      return response.data
    } catch (error) {
      console.error('TTS failed:', error)
      throw error
    }
  }

  // Utility functions
  formatDuration(seconds?: number): string {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 Bytes'
    const units = ['Bytes', 'KB', 'MB', 'GB']
    let unitIndex = 0
    while (bytes >= 1024 && unitIndex < units.length - 1) {
      bytes /= 1024
      unitIndex++
    }
    return `${bytes.toFixed(1)} ${units[unitIndex]}`
  }

  // Estimate training time based on sample count
  estimateTrainingTime(sampleCount: number): string {
    if (sampleCount < 5) return 'Not enough samples'
    if (sampleCount < 10) return '15-30 minutes'
    if (sampleCount < 20) return '30-60 minutes'
    if (sampleCount < 50) return '1-2 hours'
    return '2-4 hours'
  }

  // Get training guidelines
  getTrainingGuidelines(): string[] {
    return [
      'Upload at least 5-10 high-quality voice samples',
      'Each sample should be 5-30 seconds long',
      'Speak clearly and at a natural pace',
      'Use different sentences and emotions',
      'Record in a quiet environment',
      'Avoid background noise and echo'
    ]
  }
}

export const voiceService = new VoiceService()