import { useState, useRef } from 'react'
import { detect } from './detect'

const TABS = [
  { key: 'text', label: 'Text', icon: '📝' },
  { key: 'image', label: 'Image', icon: '🖼️' },
  { key: 'video', label: 'Video', icon: '🎬' },
  { key: 'audio', label: 'Audio', icon: '🎵' },
  { key: 'web', label: 'Web', icon: '🌐' },
]

const FILE_ACCEPT = {
  image: '.jpg,.jpeg,.png,.webp,.gif,.bmp',
  video: '.mp4,.webm,.mov,.avi,.mkv',
  audio: '.mp3,.wav,.ogg,.flac,.m4a,.aac',
}

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export default function App() {
  const [tab, setTab] = useState('text')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragover, setDragover] = useState(false)
  const fileRef = useRef()

  const resetInput = () => {
    setText('')
    setUrl('')
    setFile(null)
    setResult(null)
    setError(null)
  }

  const handleTabChange = (key) => {
    setTab(key)
    resetInput()
  }

  const handleFile = (f) => {
    if (f) {
      setFile(f)
      setResult(null)
      setError(null)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragover(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const canAnalyze = () => {
    if (loading) return false
    if (tab === 'text') return text.trim().length > 20
    if (tab === 'web') return url.trim().length > 5
    return !!file
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await detect({ contentType: tab, text, file, url })
      setResult(res)
    } catch (err) {
      setError(err.message || 'Detection failed')
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="app">
      <header>
        {DEMO && <span className="demo-badge">Demo Mode</span>}
        <h1>AI Content Detector</h1>
        <p>Detect which AI model generated your content</p>
      </header>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => handleTabChange(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="input-area">
        {tab === 'text' && (
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setResult(null); setError(null) }}
            placeholder="Paste text here to analyze (minimum 20 characters)..."
          />
        )}

        {tab === 'web' && (
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); setResult(null); setError(null) }}
            placeholder="Enter a URL (article, blog, webpage)..."
          />
        )}

        {(tab === 'image' || tab === 'video' || tab === 'audio') && (
          <>
            <div
              className={`file-drop ${dragover ? 'dragover' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragover(true) }}
              onDragLeave={() => setDragover(false)}
              onDrop={onDrop}
            >
              <div className="icon">
                {tab === 'image' ? '🖼️' : tab === 'video' ? '🎬' : '🎵'}
              </div>
              <p>
                Drop a {tab} file here or <strong>click to browse</strong>
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={FILE_ACCEPT[tab]}
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files?.[0])}
            />
            {file && (
              <div className="file-info">
                <span className="name">{file.name}</span>
                <span className="size">{formatSize(file.size)}</span>
                <button className="remove" onClick={() => { setFile(null); setResult(null) }}>✕</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Analyze Button */}
      <button
        className={`analyze-btn ${loading ? 'loading' : ''}`}
        disabled={!canAnalyze()}
        onClick={handleAnalyze}
      >
        {loading ? 'Analyzing...' : 'Analyze Content'}
      </button>

      {/* Error */}
      {error && <div className="error-msg">⚠️ {error}</div>}

      {/* Results */}
      {result && (
        <div className="results">
          <div className="result-card">
            {/* Header */}
            <div className="result-header">
              <h2 style={{ fontSize: '1rem' }}>Detection Result</h2>
              <span className={`verdict ${result.verdict}`}>
                {result.verdict === 'ai' ? '🤖 AI Generated' :
                  result.verdict === 'mixed' ? '🔀 Mixed' : '✅ Human'}
              </span>
            </div>

            {/* Confidence bar */}
            <div className="confidence-row">
              <div className="confidence-label">
                <span>AI Confidence</span>
                <span>{result.confidence}%</span>
              </div>
              <div className="confidence-bar">
                <div
                  className={`confidence-fill ${result.confidence >= 60 ? 'high' : result.confidence >= 30 ? 'medium' : 'low'
                    }`}
                  style={{ width: `${result.confidence}%` }}
                />
              </div>
            </div>

            {/* Detected Model - THE KEY SECTION */}
            {result.detectedModel && (
              <div className="model-section">
                <h3>Detected AI Model</h3>
                <div className="model-card">
                  <div className="model-name">{result.detectedModel.name}</div>
                  <div className="model-desc">{result.detectedModel.description}</div>
                  <div className="model-confidence">
                    Model match confidence: <strong>{result.detectedModel.confidence}%</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Details */}
            {result.details && (
              <div className="details-section">
                <h3>Analysis Details</h3>
                <div className="detail-row">
                  <span className="label">Content Type</span>
                  <span className="value" style={{ textTransform: 'capitalize' }}>{result.contentType}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Method</span>
                  <span className="value">{result.details.analysisMethod}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Processing Time</span>
                  <span className="value">{result.details.processingTime}</span>
                </div>
                {result.details.patterns && result.details.patterns.length > 0 && (
                  <div className="artifacts-section">
                    <span className="label artifacts-title">Detection Evidence</span>
                    <ul className="artifacts-list">
                      {result.details.patterns.map((p, i) => (
                        <li key={i} className={`artifact-item ${result.verdict === 'human' ? 'artifact-human' : 'artifact-ai'}`}>
                          <span className="artifact-icon">{result.verdict === 'human' ? '✅' : '🚩'}</span>
                          <span className="artifact-text">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
