"use client"

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AudioProgressIndicatorProps {
  year: number
  expectedCount: number
  actualCount: number
  onGenerateMissing?: () => void
}

export default function AudioProgressIndicator({
  year,
  expectedCount,
  actualCount,
  onGenerateMissing
}: AudioProgressIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const progress = (actualCount / expectedCount) * 100
  const missingCount = expectedCount - actualCount
  const isComplete = actualCount >= expectedCount

  const getStatusColor = () => {
    if (isComplete) return 'text-green-500'
    if (progress >= 75) return 'text-yellow-500'
    if (progress >= 50) return 'text-orange-500'
    return 'text-red-500'
  }

  const getStatusIcon = () => {
    if (isComplete) return <CheckCircle className="h-4 w-4" />
    if (progress >= 75) return <Clock className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-white">{year} Audio Files</span>
          <span className={`text-sm ${getStatusColor()}`}>
            {actualCount}/{expectedCount} ({Math.round(progress)}%)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isComplete && onGenerateMissing && (
            <Button
              size="sm"
              onClick={onGenerateMissing}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            >
              Generate Missing
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              isComplete 
                ? 'bg-green-500' 
                : progress >= 75 
                  ? 'bg-yellow-500' 
                  : progress >= 50 
                    ? 'bg-orange-500' 
                    : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Status:</span>
              <span className={`ml-2 ${getStatusColor()}`}>
                {isComplete ? 'Complete' : progress >= 75 ? 'Nearly Complete' : 'In Progress'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Missing:</span>
              <span className="ml-2 text-white">{missingCount} files</span>
            </div>
            <div>
              <span className="text-gray-400">Generated:</span>
              <span className="ml-2 text-white">{actualCount} files</span>
            </div>
            <div>
              <span className="text-gray-400">Expected:</span>
              <span className="ml-2 text-white">{expectedCount} files</span>
            </div>
          </div>
          
          {!isComplete && (
            <div className="mt-3 p-2 bg-gray-700 rounded text-xs text-gray-300">
              <p>Audio generation is in progress. Missing files will be generated automatically.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 