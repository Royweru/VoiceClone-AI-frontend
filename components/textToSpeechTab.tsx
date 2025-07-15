import React, { useRef, useState } from "react"
import axios from "axios"

export default function TextToSpeechTab({ audioUrl, setAudioUrl }: {
    audioUrl: string,
    setAudioUrl: (audioUrl: string) => void
}) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const maxChars = 5000
  const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
  const estimatedDuration = Math.ceil(words / 3) // ~3 words per second

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    if (newText.length <= maxChars) {
      setText(newText)
      setCharCount(newText.length)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    
    setLoading(true)
    setProgress(0)
    
    // Simulate progress (since we don't have real progress from API)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)
    
    try {
      const response = await axios.post('/api/text-to-speech', { text })
      setAudioUrl(response.data.audio_url)
      setProgress(100)
      
      if (audioRef.current) {
        audioRef.current.load()
      }
    } catch (error) {
      console.error(error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          alert('Text too long. Please shorten your message.')
        } else if (error.code === 'ECONNABORTED') {
          alert('Request timed out. Please try again.')
        } else {
          alert(`Conversion failed: ${error.response?.data?.error || error.message}`)
        }
      } else {
        alert('Conversion failed. Please try again.')
      }
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const clearText = () => {
    setText('')
    setCharCount(0)
  }

  const sampleTexts = [
    "Hello! Welcome to our AI-powered text-to-speech service. We hope you enjoy the natural-sounding voice synthesis.",
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet.",
    "Technology is advancing rapidly, and artificial intelligence is transforming how we communicate and interact with digital systems."
  ]

  const insertSampleText = (sample: string) => {
    if (sample.length <= maxChars) {
      setText(sample)
      setCharCount(sample.length)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Text-to-Speech AI
          </h1>
          <p className="text-gray-600 text-lg">Transform your written words into natural-sounding speech</p>
        </div>

        {/* Main Input Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Text Input Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Enter Your Text
                </label>
                
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${charCount > maxChars * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
                    {charCount}/{maxChars}
                  </span>
                  {text && (
                    <button
                      type="button"
                      onClick={clearText}
                      className="text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Type or paste your text here... Start with something like 'Hello, this is a test of the text-to-speech system.'"
                  className="w-full p-6 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 resize-none text-gray-700 placeholder-gray-400 leading-relaxed"
                  rows={8}
                  style={{ minHeight: '200px' }}
                />
                
                {/* Character count progress bar */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        charCount > maxChars * 0.9 ? 'bg-red-500' : 
                        charCount > maxChars * 0.7 ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(charCount / maxChars) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-emerald-600 font-bold text-lg">{words}</div>
                <div className="text-gray-600 text-sm">Words</div>
              </div>
              <div className="bg-teal-50 rounded-xl p-3 text-center">
                <div className="text-teal-600 font-bold text-lg">{charCount}</div>
                <div className="text-gray-600 text-sm">Characters</div>
              </div>
              <div className="bg-cyan-50 rounded-xl p-3 text-center">
                <div className="text-cyan-600 font-bold text-lg">~{estimatedDuration}s</div>
                <div className="text-gray-600 text-sm">Duration</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-blue-600 font-bold text-lg">{Math.ceil(charCount / 100)}</div>
                <div className="text-gray-600 text-sm">Sentences</div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="text-center">
              <button 
                type="submit" 
                disabled={loading || !text.trim()}
                className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 ${
                  loading || !text.trim()
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Converting... {progress}%
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                    </svg>
                    Convert to Speech
                  </div>
                )}
              </button>
              
              {loading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Sample Texts */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Try These Sample Texts
          </h3>
          <div className="grid gap-3">
            {sampleTexts.map((sample, index) => (
              <button
                key={index}
                onClick={() => insertSampleText(sample)}
                className="text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all duration-200 group"
              >
                <p className="text-gray-700 group-hover:text-gray-900 transition-colors">
                  "{sample}"
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{sample.length} characters</span>
                  <span className="text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to use →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Audio Result */}
        {audioUrl && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.415A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.414 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Your Generated Speech</h3>
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Ready to play
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <audio 
                controls 
                ref={audioRef} 
                key={audioUrl}
                className="w-full h-12 rounded-lg"
              >
                <source src={audioUrl} type="audio/wav" />
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>🎵 High-quality AI voice synthesis</span>
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0
                      audioRef.current.play()
                    }
                  }}
                  className="text-purple-600 hover:text-purple-800 transition-colors"
                >
                  Replay ↻
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Info */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Features</h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-medium text-gray-800">Natural Voice</h4>
              <p className="text-sm text-gray-600">Human-like speech synthesis with natural intonation</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-medium text-gray-800">Fast Processing</h4>
              <p className="text-sm text-gray-600">Quick conversion with real-time progress tracking</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl">📝</span>
              </div>
              <h4 className="font-medium text-gray-800">Long Text Support</h4>
              <p className="text-sm text-gray-600">Convert up to 5,000 characters in one go</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}