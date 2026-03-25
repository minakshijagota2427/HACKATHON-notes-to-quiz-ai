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

  // 🔥 NEW (extracted text preview)
  const [previewText, setPreviewText] = useState("");

  // ================= TEXT =================
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          difficulty,
        }),
      });

      const data = await res.json();

      if (!data.quiz || data.quiz.length === 0) {
        setError("⚠️ No quiz generated");
        setQuiz(null);
      } else {
        setQuiz(data.quiz);
        setPreviewText(""); // clear preview
        setError("");
      }
    } catch {
      setError("❌ Backend not reachable");
      setQuiz(null);
    }

    setLoading(false);
  };

  // ================= IMAGE FIXED =================
  const handleGenerateFromImage = async () => {
    if (!selectedImage) {
      setError("⚠️ Select image first");
      return;
    }

    if (!selectedImage.type.startsWith("image/")) {
      setError("❌ Please upload valid image");
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

      console.log("🔥 OCR TEXT:", data.extracted_text); // ✅ DEBUG

      if (!data.quiz || data.quiz.length === 0) {
        setError(data.error || "⚠️ No text found in image");
        setQuiz(null);
        setPreviewText("");
      } else {
        setQuiz(data.quiz);
        setPreviewText(data.extracted_text || ""); // ✅ SHOW TEXT
        setError("");
      }
    } catch {
      setError("❌ Image processing failed");
    }

    setLoading(false);
  };

  // ================= PDF FIXED =================
  const handleGenerateFromPDF = async () => {
    if (!selectedPDF) {
      setError("⚠️ Select PDF first");
      return;
    }

    if (selectedPDF.type !== "application/pdf") {
      setError("❌ Upload valid PDF");
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

      console.log("🔥 PDF TEXT:", data.extracted_text); // ✅ DEBUG

      if (!data.quiz || data.quiz.length === 0) {
        setError(data.error || "⚠️ No readable text in PDF");
        setQuiz(null);
        setPreviewText("");
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
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          background: "rgba(15,23,42,0.75)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "420px",
            padding: "30px",
            borderRadius: "20px",
            background: "rgba(30,41,59,0.7)",
          }}
        >
          <h1 style={{ color: "white" }}>
            📘 Notes → Quiz AI
          </h1>

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

              <button onClick={handleGenerateFromText} style={btnStyle}>
                Generate from Text
              </button>

              <input
                type="file"
                onChange={(e) => setSelectedImage(e.target.files[0])}
              />
              <button onClick={handleGenerateFromImage} style={btnStyle}>
                Generate from Image
              </button>

              <input
                type="file"
                onChange={(e) => setSelectedPDF(e.target.files[0])}
              />
              <button onClick={handleGenerateFromPDF} style={btnStyle}>
                Generate from PDF
              </button>

              {/* 🔥 SHOW EXTRACTED TEXT */}
              {previewText && (
                <div style={{ marginTop: "10px", color: "white", fontSize: "12px" }}>
                  <strong>Detected Text:</strong>
                  <p>{previewText}</p>
                </div>
              )}

              {error && <p style={{ color: "red" }}>{error}</p>}
            </>
          ) : (
            <QuizCard quiz={quiz} onReset={reset} />
          )}
        </div>
      </div>
    </div>
  );
}