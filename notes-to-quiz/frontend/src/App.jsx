import { useState } from "react";
import QuizCard from "./components/QuizCard";

const API_BASE_URL = "https://notes-to-quiz-ai.onrender.com";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [previewText, setPreviewText] = useState("");

  // ================= TEXT =================
  const handleGenerateFromText = async () => {
    if (!inputText.trim()) {
      setError("⚠️ Enter some text first");
      return;
    }

    setLoadingText(true);
    setLoadingImage(false);
    setLoadingPDF(false);
    setError("⏳ Generating quiz...");

    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_BASE_URL}/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText, difficulty }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!data.quiz) {
        setError("No quiz generated");
      } else {
        setQuiz(data.quiz);
        setError("");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("⏱️ Server took too long. Try again.");
      } else {
        setError("❌ Backend error");
      }
    } finally {
      setLoadingText(false);
    }
  };

  // ================= IMAGE =================
  const handleGenerateFromImage = async () => {
    if (!selectedImage) {
      setError("⚠️ Select image first");
      return;
    }

    setLoadingImage(true);
    setLoadingText(false);
    setLoadingPDF(false);
    setError("⏳ Processing image...");

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_BASE_URL}/ocr-quiz`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await res.json();

      if (!data.quiz) {
        setError("⚠️ No readable text found");
      } else {
        setQuiz(data.quiz);
        setPreviewText(data.extracted_text || "");
        setError("");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("⏱️ OCR is slow. Try again.");
      } else {
        setError("❌ Image processing failed");
      }
    } finally {
      setLoadingImage(false);
    }
  };

  // ================= PDF =================
  const handleGenerateFromPDF = async () => {
    if (!selectedPDF) {
      setError("⚠️ Select PDF first");
      return;
    }

    setLoadingPDF(true);
    setLoadingText(false);
    setLoadingImage(false);
    setError("⏳ Reading PDF...");

    const formData = new FormData();
    formData.append("pdf", selectedPDF);

    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_BASE_URL}/pdf-quiz`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await res.json();

      if (!data.quiz) {
        setError("⚠️ No readable text in PDF");
      } else {
        setQuiz(data.quiz);
        setPreviewText(data.extracted_text || "");
        setError("");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("⏱️ PDF processing slow. Try again.");
      } else {
        setError("❌ PDF processing failed");
      }
    } finally {
      setLoadingPDF(false);
    }
  };

  const reset = () => {
    setQuiz(null);
    setInputText("");
    setSelectedImage(null);
    setSelectedPDF(null);
    setError("");
    setPreviewText("");
  };

  const btnStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#6366f1",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "12px",
  };

  return (
    <div className="app-container">
      <div className="main-card">

        <h1 className="title">📘 Notes → Quiz AI</h1>

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
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>

            <button className="btn" onClick={handleGenerateFromText}>
              Generate from Text
            </button>

            <input
              className="file-input"
              type="file"
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />
            <button className="btn" onClick={handleGenerateFromImage}>
              Generate from Image
            </button>

            <input
              className="file-input"
              type="file"
              onChange={(e) => setSelectedPDF(e.target.files[0])}
            />
            <button className="btn" onClick={handleGenerateFromPDF}>
              Generate from PDF
            </button>
            {error && <p className="error">{error}</p>}
          </>
        ) : (
          <QuizCard quiz={quiz} onReset={reset} />
        )}

      </div>
    </div>
  );
}