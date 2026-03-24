import { useRef } from 'react'

export default function InputSection({
  inputText,
  setInputText,
  selectedImage,
  setSelectedImage,
  onGenerateText,
  onGenerateImage,
  loading,
  error,
}) {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setSelectedImage(null)
        alert('Please select a valid image file (PNG or JPG)')
        return
      }
      setSelectedImage(file)
    }
  }

  const handleClearImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="notes">📝 Enter Your Notes</label>
        <textarea
          id="notes"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your study notes, textbook content, or any text here..."
          disabled={loading}
        />
      </div>
      <select onChange={(e) => setDifficulty(e.target.value)}>
  <option value="easy">Easy</option>
  <option value="medium">Medium</option>
  <option value="hard">Hard</option>
</select>

      <div className="button-group">
        <button
          className="btn btn-text"
          onClick={onGenerateText}
          disabled={loading || !inputText.trim()}
        >
          {loading ? (
            <span className="loading">
              <span className="spinner"></span>
              Generating...
            </span>
          ) : (
            '✨ Generate Quiz from Text'
          )}
        </button>
      </div>

      <div style={{ margin: '30px 0', textAlign: 'center', color: '#999' }}>
        <p style={{ fontSize: '0.9em' }}>OR</p>
      </div>

      <div className="form-group">
        <label htmlFor="image">📸 Upload an Image</label>
        <input
          ref={fileInputRef}
          id="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
        />
        <label htmlFor="image" className="file-input-label">
          {selectedImage ? '✓ Image Selected' : '📁 Click to choose an image'}
        </label>
        {selectedImage && (
          <div className="file-name">
            <strong>{selectedImage.name}</strong> ({(selectedImage.size / 1024).toFixed(1)} KB)
            <button
              style={{
                marginLeft: '10px',
                background: 'none',
                border: 'none',
                color: '#f5576c',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
              onClick={handleClearImage}
              disabled={loading}
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      <div className="button-group">
        <button
          className="btn btn-image"
          onClick={onGenerateImage}
          disabled={loading || !selectedImage}
        >
          {loading ? (
            <span className="loading">
              <span className="spinner"></span>
              Processing...
            </span>
          ) : (
            '🚀 Upload Image & Generate Quiz'
          )}
        </button>
      </div>
    </>
  )
}
