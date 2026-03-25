import { useState } from "react";
import QuizCard from "./components/QuizCard";

const API_BASE_URL = "https://notes-to-quiz-ai.onrender.com";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [previewText, setPreviewText] = useState("");

  // TEXT
  const handleGenerateFromText = async () => {
    if (!inputText.trim()) {
      setError("⚠️ Enter some text first");
      return;
    }

    setLoading(true);
    setError("⏳ Generating quiz...");

    try {
      const res = await fetch(`${API_BASE_URL}/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, difficulty }),
      });

      const data = await res.json();

      if (!data.quiz || data.quiz.length === 0) {
        setError("⚠️ No quiz generated");
        setQuiz(null);
      } else {
        setQuiz(data.quiz);
        setPreviewText("");
        setError("");
      }
    } catch {
      setError("❌ Backend not reachable");
    }

    setLoading(false);
  };

  // IMAGE
  const handleGenerateFromImage = async () => {
    if (!selectedImage) {
      setError("⚠️ Select image first");
      return;
    }

    setLoading(true);
    setError("⏳ Processing image...");

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const res = await fetch(`${API_BASE_URL}/ocr-quiz`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.quiz || data.quiz.length === 0) {
        setError("⚠️ No text found in image");
      } else {
        setQuiz(data.quiz);
        setPreviewText(data.extracted_text || "");
        setError("");
      }
    } catch {
      setError("❌ Image processing failed");
    }

    setLoading(false);
  };

  // PDF
  const handleGenerateFromPDF = async () => {
    if (!selectedPDF) {
      setError("⚠️ Select PDF first");
      return;
    }

    setLoading(true);
    setError("⏳ Reading PDF...");

    const formData = new FormData();
    formData.append("pdf", selectedPDF);

    try {
      const res = await fetch(`${API_BASE_URL}/pdf-quiz`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.quiz || data.quiz.length === 0) {
        setError("⚠️ No readable text in PDF");
      } else {
        setQuiz(data.quiz);
        setPreviewText(data.extracted_text || "");
        setError("");
      }
    } catch {
      setError("❌ PDF processing failed");
    }

    setLoading(false);
  };

  const reset = () => {
    setQuiz(null);
    setInputText("");
    setSelectedImage(null);
    setSelectedPDF(null);
    setError("");
    setPreviewText("");
  };

  return (
    <div className="container">
      <div className="input-card">

        <h1 className="header">📘 Notes → Quiz AI</h1>

        {!quiz ? (
          <>
            <textarea
              placeholder="Paste your notes..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>easy</option>
              <option>medium</option>
              <option>hard</option>
            </select>

            <button onClick={handleGenerateFromText}>
              {loading ? "Processing..." : "Generate from Text"}
            </button>

            {/* IMAGE UPLOAD */}
            <label className="upload-btn">
              📸 Upload Image
              <input
                type="file"
                hidden
                onChange={(e) => setSelectedImage(e.target.files[0])}
              />
            </label>

            <button onClick={handleGenerateFromImage}>
              {loading ? "Processing..." : "Generate from Image"}
            </button>

            {/* PDF UPLOAD */}
            <label className="upload-btn">
              📄 Upload PDF
              <input
                type="file"
                hidden
                onChange={(e) => setSelectedPDF(e.target.files[0])}
              />
            </label>

            <button onClick={handleGenerateFromPDF}>
              {loading ? "Processing..." : "Generate from PDF"}
            </button>

            {previewText && (
              <div className="preview">
                <strong>Detected Text:</strong>
                <p>{previewText}</p>
              </div>
            )}

            {error && <p className="error">{error}</p>}
          </>
        ) : (
          <QuizCard quiz={quiz} onReset={reset} />
        )}
      </div>
    </div>
  );
}