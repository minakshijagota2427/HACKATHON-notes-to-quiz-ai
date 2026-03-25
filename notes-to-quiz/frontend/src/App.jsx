import { useState } from "react";
import QuizCard from "./components/QuizCard";

const API_BASE_URL = "https://notes-to-quiz-ai.onrender.com";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [quiz, setQuiz] = useState(null);

  // 🔥 separate loading states
  const [loadingText, setLoadingText] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);

  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [previewText, setPreviewText] = useState("");

  // TEXT
  const handleGenerateFromText = async () => {
    if (!inputText.trim()) {
      setError("⚠️ Enter some text first");
      return;
    }

    setLoadingText(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText, difficulty }),
      });

      const data = await res.json();

      if (!data.quiz) {
        setError("⚠️ No quiz generated");
      } else {
        setQuiz(data.quiz);
      }
    } catch {
      setError("❌ Backend error");
    }

    setLoadingText(false);
  };

  // IMAGE
  const handleGenerateFromImage = async () => {
    if (!selectedImage) {
      setError("⚠️ Select image first");
      return;
    }

    setLoadingImage(true);
    setError("");

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const res = await fetch(`${API_BASE_URL}/ocr-quiz`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.quiz) {
        setError("⚠️ No text found");
      } else {
        setQuiz(data.quiz);
        setPreviewText(data.extracted_text || "");
      }
    } catch {
      setError("❌ Image failed");
    }

    setLoadingImage(false);
  };

  // PDF
  const handleGenerateFromPDF = async () => {
    if (!selectedPDF) {
      setError("⚠️ Select PDF first");
      return;
    }

    setLoadingPDF(true);
    setError("");

    const formData = new FormData();
    formData.append("pdf", selectedPDF);

    try {
      const res = await fetch(`${API_BASE_URL}/pdf-quiz`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.quiz) {
        setError("⚠️ No text found");
      } else {
        setQuiz(data.quiz);
        setPreviewText(data.extracted_text || "");
      }
    } catch {
      setError("❌ PDF failed");
    }

    setLoadingPDF(false);
  };

  const reset = () => {
    setQuiz(null);
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
              {loadingText ? "Processing..." : "Generate from Text"}
            </button>

            {/* IMAGE */}
            <label className="upload-btn">
              📸 Upload Image
              <input
                type="file"
                hidden
                onChange={(e) => setSelectedImage(e.target.files[0])}
              />
            </label>

            <button onClick={handleGenerateFromImage}>
              {loadingImage ? "Processing..." : "Generate from Image"}
            </button>

            {/* PDF */}
            <label className="upload-btn">
              📄 Upload PDF
              <input
                type="file"
                hidden
                onChange={(e) => setSelectedPDF(e.target.files[0])}
              />
            </label>

            <button onClick={handleGenerateFromPDF}>
              {loadingPDF ? "Processing..." : "Generate from PDF"}
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