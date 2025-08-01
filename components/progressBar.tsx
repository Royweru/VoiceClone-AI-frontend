// components/ui/ProgressBar.tsx
import React from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max = 100,
  className = '' 
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  )
}

export default ProgressBar