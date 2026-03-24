import { useState } from "react";
import QuizCard from "./components/QuizCard";
import { motion } from "framer-motion";

const API_BASE_URL = "https://notes-to-quiz-ai.onrender.com";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState("easy");

  // 🔹 TEXT QUIZ
  const handleGenerateFromText = async () => {
    if (!inputText.trim()) {
      setError("Enter some text first");
      return;
    }

    setLoading(true);
    setError("");

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

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setQuiz(data.quiz);
    } catch (err) {
      setError("Backend not responding or CORS issue");
      setQuiz(null);
    }

    setLoading(false);
  };

  // 🔹 IMAGE QUIZ
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

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setQuiz(data.quiz);
    } catch {
      setError("Image API failed");
    }

    setLoading(false);
  };

  // 🔹 PDF QUIZ
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

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

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

  const btnStyle = {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "none",
    background: "#6366f1",
    color: "white",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "10px",
    transition: "all 0.2s ease",
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
    {/* DARK OVERLAY */}
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "rgba(15, 23, 42, 0.75)", // dark blue overlay
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* MAIN CARD */}
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
        {/* TITLE */}
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "600",
            color: "#f1f5f9",
            marginBottom: "20px",
            letterSpacing: "0.5px",
          }}
        >
          📘 Notes → Quiz AI
        </h1>

        {/* TEXTAREA */}
        <textarea
          placeholder="Paste your notes here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{
            width: "100%",
            height: "110px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "12px",
            background: "rgba(15, 23, 42, 0.6)",
            color: "#e2e8f0",
            outline: "none",
            resize: "none",
            marginBottom: "15px",
          }}
        />

        {/* DROPDOWN */}
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "8px",
            background: "#0f172a",
            color: "white",
            border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: "15px",
          }}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {/* BUTTON STYLE */}
        {/*
          reuse same style for all buttons
        */}
        {(() => {
          const btn = {
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: "#6366f1",
            color: "white",
            fontWeight: "500",
            cursor: "pointer",
            marginBottom: "10px",
            transition: "0.2s",
          };

          return (
            <>
              {/* TEXT BUTTON */}
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
                Generate from Text
              </button>

              {/* IMAGE */}
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

              {/* PDF */}
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
            </>
          );
        })()}

        {/* ERROR */}
        {error && (
          <p style={{ color: "#f87171", marginTop: "10px" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  </div>
);