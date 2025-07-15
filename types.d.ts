interface User{
    username:string,
    email:string
}

 interface VoiceSample {
  id: number
  audio_file: string
  duration?: number
  file_size?: number
  status?: 'uploaded' | 'processing' | 'valid' | 'invalid'
  created_at: string
}

 interface VoiceModel {
  id: number
  is_active: boolean
  status: 'pending' | 'training' | 'completed' | 'failed'
  progress: number
  created_at: string
}

 interface TrainingTask {
  task_id: string
  status: 'pending' | 'training' | 'completed' | 'failed'
  progress?: number
  error_message?: string
  created_at: string
}

 interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}
interface UploadResponse {
  samples: VoiceSample[];
  created_count: number;
  total_count: number;
  message: string;
  errors?: string[];
}

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
