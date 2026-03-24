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

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      setQuiz(data.quiz);

    } catch (err) {
      setError("Backend not responding or CORS issue");
      setQuiz(null);
    }

    setLoading(false);
  };

  // 🔹 IMAGE QUIZ
  const handleGenerateFromImage = async () => {
    if (!selectedImage) {
      setError("Select an image first");
      return;
    }

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

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      setQuiz(data.quiz);

    } catch (err) {
      setError("Image API failed");
      setQuiz(null);
    }

    setLoading(false);
  };

  // 🔹 PDF QUIZ
  const handleGenerateFromPDF = async () => {
    if (!selectedPDF) {
      setError("Select a PDF first");
      return;
    }

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

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      setQuiz(data.quiz);

    } catch (err) {
      setError("PDF API failed");
      setQuiz(null);
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
    padding: "10px 15px",
    marginTop: "10px",
    background: "#22c55e",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "white"
    }}>

      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
        📚 Notes → Quiz AI
      </h1>

      {!quiz ? (
        <div style={{
          background: "#1e293b",
          padding: "30px",
          borderRadius: "12px",
          width: "400px",
          textAlign: "center"
        }}>

          {/* TEXT */}
          <textarea
            placeholder="Paste your notes here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              width: "100%",
              height: "100px",
              marginBottom: "10px",
              borderRadius: "8px",
              padding: "10px"
            }}
          />

          {/* DIFFICULTY */}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <button onClick={handleGenerateFromText} style={btnStyle}>
            Generate from Text
          </button>

          <br /><br />

          {/* IMAGE */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedImage(e.target.files[0])}
          />
          <button onClick={handleGenerateFromImage} style={btnStyle}>
            Generate from Image
          </button>

          <br /><br />

          {/* PDF */}
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setSelectedPDF(e.target.files[0])}
          />
          <button onClick={handleGenerateFromPDF} style={btnStyle}>
            Generate from PDF
          </button>

          {loading && <p>⏳ Generating...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

        </div>
      ) : (
        <div style={{ width: "600px" }}>
          <button onClick={reset} style={btnStyle}>
            🔁 Generate Again
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <QuizCard quiz={quiz} />
          </motion.div>
        </div>
      )}
    </div>
  );
}