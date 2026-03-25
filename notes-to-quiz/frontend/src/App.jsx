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

  // ================= IMAGE COMPRESSION =================
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/jpeg", 0.7);
      };

      reader.readAsDataURL(file);
    });
  };

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
        setPreviewText("");
        setError("");
      }
    } catch {
      setError("❌ Backend not reachable");
      setQuiz(null);
    }

    setLoading(false);
  };

  // ================= IMAGE (FIXED + FAST) =================
  const handleGenerateFromImage = async () => {
    if (!selectedImage) {
      setError("⚠️ Select image first");
      return;
    }

    if (selectedImage.size > 2 * 1024 * 1024) {
      setError("❌ Image too large (max 2MB)");
      return;
    }

    setLoading(true);
    setError("⏳ Processing image...");

    try {
      const compressed = await compressImage(selectedImage);

      const formData = new FormData();
      formData.append("image", compressed); // ✅ FIXED

      const res = await fetch(`${API_BASE_URL}/ocr-quiz`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.quiz || data.quiz.length === 0) {
        setError(data.error || "⚠️ No text found in image");
        setQuiz(null);
        setPreviewText("");
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

  // ================= PDF =================
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
                {loading ? "Processing..." : "Generate from Text"}
              </button>

              <input
                type="file"
                onChange={(e) => setSelectedImage(e.target.files[0])}
              />
              <button onClick={handleGenerateFromImage} style={btnStyle}>
                {loading ? "Processing..." : "Generate from Image"}
              </button>

              <input
                type="file"
                onChange={(e) => setSelectedPDF(e.target.files[0])}
              />
              <button onClick={handleGenerateFromPDF} style={btnStyle}>
                {loading ? "Processing..." : "Generate from PDF"}
              </button>

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