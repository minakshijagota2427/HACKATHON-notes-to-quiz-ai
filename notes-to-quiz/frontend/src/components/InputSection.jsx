import { useRef, useState } from 'react'

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

  // ✅ FIX: difficulty state add kiya
  const [difficulty, setDifficulty] = useState("easy")

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

  // ✅ NEW: Direct API call (text)
  const handleGenerateText = async () => {
    try {
      const res = await fetch("https://notes-to-quiz-ai.onrender.com/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: inputText,
          difficulty: difficulty
        })
      })

      const data = await res.json()
      onGenerateText(data.quiz)
    } catch (err) {
      console.error(err)
      alert("Error generating quiz")
    }
  }

  // ✅ NEW: Image API call
  const handleGenerateImage = async () => {
    try {
      const formData = new FormData()
      formData.append("image", selectedImage)

      const res = await fetch("https://notes-to-quiz-ai.onrender.com/ocr-quiz", {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      onGenerateImage(data.quiz)
    } catch (err) {
      console.error(err)
      alert("Error processing image")
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
          placeholder="Paste your study notes..."
          disabled={loading}
        />
      </div>

      {/* ✅ Difficulty Selector */}
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <div className="button-group">
        <button
          className="btn btn-text"
          onClick={handleGenerateText}
          disabled={loading || !inputText.trim()}
        >
          {loading ? "Generating..." : "✨ Generate Quiz from Text"}
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
            <strong>{selectedImage.name}</strong>
            <button onClick={handleClearImage}>✕</button>
          </div>
        )}
      </div>

      <div className="button-group">
        <button
          className="btn btn-image"
          onClick={handleGenerateImage}
          disabled={loading || !selectedImage}
        >
          🚀 Generate from Image
        </button>
      </div>
    </>
  )
}