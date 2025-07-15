// components/voice/SampleCard.tsx
import React from 'react'

import { voiceService } from '@/lib/voice'
interface SampleCardProps {
  sample: VoiceSample
  onDelete?: (id: number) => void
}

const SampleCard: React.FC<SampleCardProps> = ({ sample, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium">Sample #{sample.id}</h3>
        {onDelete && (
          <button 
            onClick={() => onDelete(sample.id)}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        )}
      </div>
      
      <div className="flex items-center space-x-3 mb-3">
        <audio controls className="flex-1 max-w-full">
          <source src={sample.audio_file} type="audio/wav" />
        </audio>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>
          <span className="font-medium">Duration:</span> {voiceService.formatDuration(sample.duration)}
        </div>
        <div>
          <span className="font-medium">Size:</span> {voiceService.formatFileSize(sample.file_size)}
        </div>
        <div>
          <span className="font-medium">Status:</span> {sample.status || 'unknown'}
        </div>
        <div>
          <span className="font-medium">Uploaded:</span> {new Date(sample.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

export default SampleCard