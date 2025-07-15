// components/voice/TrainingStatus.tsx
import React from 'react'

import ProgressBar from './progressBar'

interface TrainingStatusProps {
  task: TrainingTask
}

const TrainingStatus: React.FC<TrainingStatusProps> = ({ task }) => {
  const statusColors = {
    pending: 'bg-blue-100 text-blue-800',
    training: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Training Status</h3>
        <span className={`px-2 py-1 rounded text-xs ${statusColors[task.status]}`}>
          {task.status.toUpperCase()}
        </span>
      </div>
      
      {task.progress !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <ProgressBar value={task.progress} />
        </div>
      )}
      
      {task.error_message && (
        <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">
          Error: {task.error_message}
        </div>
      )}
      
      <div className="mt-3 text-sm text-gray-500">
        Started: {new Date(task.created_at).toLocaleString()}
      </div>
    </div>
  )
}

export default TrainingStatus