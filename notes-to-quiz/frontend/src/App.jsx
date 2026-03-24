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

  // ✅ FILE HANDLERS
  const handleImageUpload = (e) => {
    setSelectedImage(e.target.files[0]);
  };

  const handlePdfUpload = (e) => {
    setSelectedPDF(e.target.files[0]);
  };

  // ✅ TEXT QUIZ
  const handleGenerateFromText = async () => {
    if (!inputText.trim()) {
      setError("Enter some text first");
      return;
    }

    setLoading(true);
    setError("Server starting... please wait");

    try {
      const res = await fetch(`${API_BASE_URL}/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          difficulty: difficulty,
        }),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setQuiz(data.quiz);
    } catch (err) {
      setError("Backend not responding (Render sleep / CORS issue)");
      setQuiz(null);
    }

    setLoading(false);
  };

  // ✅ IMAGE QUIZ
  const handleGenerateFromImage = async () => {
    if (!selectedImage) return setError("Select an image first");

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const res = await fetch(`${API_BASE_URL}/ocr-quiz`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Image API error");

      const data = await res.json();
      setQuiz(data.quiz);
    } catch {
      setError("Image API failed");
    }

    setLoading(false);
  };

  // ✅ PDF QUIZ
  const handleGenerateFromPDF = async () => {
    if (!selectedPDF) return setError("Select a PDF first");

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("pdf", selectedPDF);

    try {
      const res = await fetch(`${API_BASE_URL}/pdf-quiz`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("PDF API error");

      const data = await res.json();
      setQuiz(data.quiz);
    } catch {
      setError("PDF API failed");
    }

    setLoading(false);
  };

  const reset = () => {
    setQuiz(null);
    setInputText("");
    setSelectedImage(null);
    setSelectedPDF(null);
    setError("");
  };

  const btn = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    background: "#f16382",
    color: "white",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "10px",
    transition: "0.2s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* OVERLAY */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* CARD */}
        <div
          style={{
            width: "420px",
            padding: "30px",
            borderRadius: "16px",
            background: "rgba(30, 41, 59, 0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            textAlign: "center",
          }}
        >
          <h1 style={{ color: "#f1f5f9", marginBottom: "20px" }}>
            📘 Notes → Quiz AI
          </h1>

          {!quiz ? (
            <>
              <textarea
                placeholder="Paste your notes..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  width: "100%",
                  height: "110px",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "15px",
                }}
              />

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <button
                onClick={handleGenerateFromText}
                style={btn}
                onMouseOver={(e) =>
                  (e.target.style.background = "#4f46e5")
                }
                onMouseOut={(e) =>
                  (e.target.style.background = "#6366f1")
                }
              >
                {loading ? "Loading..." : "Generate from Text"}
              </button>

              <input type="file" onChange={handleImageUpload} />

              <button
                onClick={handleGenerateFromImage}
                style={btn}
                onMouseOver={(e) =>
                  (e.target.style.background = "#4f46e5")
                }
                onMouseOut={(e) =>
                  (e.target.style.background = "#6366f1")
                }
              >
                Generate from Image
              </button>

              <input type="file" onChange={handlePdfUpload} />

              <button
                onClick={handleGenerateFromPDF}
                style={btn}
                onMouseOver={(e) =>
                  (e.target.style.background = "#4f46e5")
                }
                onMouseOut={(e) =>
                  (e.target.style.background = "#6366f1")
                }
              >
                Generate from PDF
              </button>

              {error && (
                <p style={{ color: "red", marginTop: "10px" }}>
                  {error}
                </p>
              )}
            </>
          ) : (
            <QuizCard quiz={quiz} onReset={reset} />
          )}
        </div>
      </div>
    </div>
  );
}