import axios from 'axios'
import { useEffect, useState, useRef } from 'react'
import Recorder from 'recorder-js'

export default function SpeechToSpeechTab({
  audioUrl,
  setAudioUrl,
  convertedText,
  setConvertedText,
  recorderRef,
  isRecording,
  setIsRecording
}: {
  audioUrl: string,
  setAudioUrl: (audioUrl: string) => void,
  setConvertedText: (convertedText: string) => void,
  convertedText: string,
  recorderRef: any,
  isRecording: boolean,
  setIsRecording: (recording: boolean) => void,
}) {
  const [loading, setLoading] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const initRecorder = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        recorderRef.current = new Recorder(audioContextRef.current)
      } catch (error) {
        console.error('Failed to initialize recorder:', error)
      }
    }

    initRecorder()
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Setup audio level monitoring
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        source.connect(analyserRef.current)
        
        const monitorAudioLevel = () => {
          if (analyserRef.current && isRecording) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
            analyserRef.current.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length
            setAudioLevel(average / 255 * 100)
            animationRef.current = requestAnimationFrame(monitorAudioLevel)
          }
        }
        monitorAudioLevel()
      }
      
      await recorderRef.current.init(stream)
      recorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = async () => {
    try {
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      
      const { blob } = await recorderRef.current.stop()
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      setAudioLevel(0)
      await processRecording(blob)
    } catch (error) {
      console.error('Failed to stop recording:', error)
      alert('Failed to stop recording')
    }
  }

  const processRecording = async (blob: Blob) => {
    setLoading(true)
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')
    
    try {
      const response = await axios.post('/api/speech-to-speech', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      })
      
      setConvertedText(response.data.text)
      setAudioUrl(response.data.audio_url)
      
      if (audioRef.current) {
        audioRef.current.load()
      }
    } catch (error) {
      console.error('Conversion error:', error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          alert('Audio file too large. Please record a shorter message.')
        } else if (error.code === 'ECONNABORTED') {
          alert('Request timed out. Please try again.')
        } else {
          alert(`Conversion failed: ${error.response?.data?.error || error.message}`)
        }
      } else {
        alert('Conversion failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Speech-to-Speech AI
          </h1>
          <p className="text-gray-600 text-lg">Transform your voice with AI-powered speech conversion</p>
        </div>

        {/* Recording Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="text-center space-y-6">
            {/* Microphone Visualization */}
            <div className="relative">
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-lg hover:shadow-blue-500/30'
              }`}>
                <svg 
                  className={`w-12 h-12 text-white transition-transform duration-300 ${isRecording ? 'scale-110' : ''}`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Audio Level Rings */}
              {isRecording && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full border-2 border-red-400 animate-ping"
                      style={{
                        width: `${140 + i * 20}px`,
                        height: `${140 + i * 20}px`,
                        opacity: Math.max(0.1, audioLevel / 100 - i * 0.2),
                        animationDelay: `${i * 0.2}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="space-y-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 ${
                  isRecording 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : isRecording ? (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    Stop Recording
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    Start Recording
                  </div>
                )}
              </button>

              {/* Recording Stats */}
              {isRecording && (
                <div className="flex justify-center items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full text-red-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {formatTime(recordingTime)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Level:</span>
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-75"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Transcribed Text */}
          {convertedText && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Recognized Text</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-green-500">
                <p className="text-gray-700 leading-relaxed">{convertedText}</p>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.415A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.414 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">AI Generated Speech</h3>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                <audio 
                  controls 
                  ref={audioRef} 
                  key={audioUrl}
                  className="w-full h-12 rounded-lg"
                  style={{
                    filter: 'sepia(0) saturate(0) hue-rotate(200deg) brightness(1) contrast(1)'
                  }}
                >
                  <source src={audioUrl} type="audio/wav" />
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}
        </div>

        {/* Features Info */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">How it works</h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl">🎤</span>
              </div>
              <h4 className="font-medium text-gray-800">Record</h4>
              <p className="text-sm text-gray-600">Speak clearly into your microphone</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl">🧠</span>
              </div>
              <h4 className="font-medium text-gray-800">Process</h4>
              <p className="text-sm text-gray-600">AI analyzes and converts your speech</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl">🔊</span>
              </div>
              <h4 className="font-medium text-gray-800">Generate</h4>
              <p className="text-sm text-gray-600">Get your transformed audio output</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}