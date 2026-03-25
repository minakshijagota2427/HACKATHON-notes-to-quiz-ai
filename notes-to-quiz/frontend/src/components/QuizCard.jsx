import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import jsPDF from "jspdf";
import "./quiz.css";

export default function QuizCard({ quiz = [], onReset }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const COLORS = ["#10b981", "#ef4444"];

  const speak = (text) => {
    const msg = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(msg);
  };

  // PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(18);
    doc.text("Quiz Paper", 80, 10);

    doc.setFontSize(11);

    quiz.forEach((q, i) => {
      if (y > 270) {
        doc.addPage();
        y = 15;
      }

      const qLines = doc.splitTextToSize(
        `Q${i + 1}: ${q.question}`,
        180
      );
      doc.text(qLines, 10, y);
      y += qLines.length * 6;

      if (q.options) {
        q.options.forEach((opt, idx) => {
          const label = String.fromCharCode(65 + idx);
          doc.text(`${label}. ${opt}`, 15, y);
          y += 6;
        });
      }

      y += 5;
    });

    doc.addPage();
    doc.text("Answer Key", 80, 10);

    let ay = 20;

    quiz.forEach((q, i) => {
      doc.text(`Q${i + 1}: ${q.answer}`, 10, ay);
      ay += 6;
    });

    doc.save("Quiz_Paper.pdf");
  };

  // SCORE (improved for text)
  const calculateScore = () => {
    let score = 0;

    quiz.forEach((q, i) => {
      const userAns = answers[i];

      if (!userAns) return;

      if (q.type === "short_answer") {
        if (
          userAns.toLowerCase().includes(q.answer.toLowerCase())
        ) {
          score++;
        }
      } else {
        if (userAns === q.answer) score++;
      }
    });

    return score;
  };

  const score = calculateScore();
  const wrong = quiz.length - score;

  const chartData = [
    { name: "Correct", value: score },
    { name: "Wrong", value: wrong },
  ];

  const saveScore = () => {
    const scores = JSON.parse(localStorage.getItem("scores")) || [];
    scores.push(score);
    localStorage.setItem("scores", JSON.stringify(scores));
  };

  const scores = JSON.parse(localStorage.getItem("scores")) || [];

  // TIMER FIX
  useEffect(() => {
    if (submitted) return;

    if (timeLeft <= 0) {
      setSubmitted(true);
      saveScore();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, submitted]);

  const handleSelect = (option) => {
    setAnswers({ ...answers, [currentQ]: option });
  };

  const handleText = (e) => {
    setAnswers({ ...answers, [currentQ]: e.target.value });
  };

  const nextQuestion = () => {
    if (currentQ < quiz.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const submitQuiz = () => {
    setSubmitted(true);
    saveScore();
  };

  if (!quiz.length) return <p>No quiz</p>;

  const q = quiz[currentQ];

  return (
    <div className="quiz-wrapper">

      {!submitted && (
        <h3 style={{ color: timeLeft < 10 ? "red" : "white" }}>
          ⏳ {timeLeft}s
        </h3>
      )}

      {!submitted ? (
        <div className="quiz-card">

          <div className="quiz-icon">❓</div>

          <p className="quiz-question">{q.question}</p>

          <button className="voice-btn" onClick={() => speak(q.question)}>
            🔊 Listen
          </button>

          {/* ✅ MCQ / TRUE FALSE */}
          {q.options && (
            <div className="options">
              {q.options.map((opt, i) => (
                <div
                  key={i}
                  className={`option ${
                    answers[currentQ] === opt ? "selected" : ""
                  }`}
                  onClick={() => handleSelect(opt)}
                >
                  <span className="label">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </div>
              ))}
            </div>
          )}

          {/* ✅ SHORT ANSWER INPUT */}
          {!q.options && (
            <input
              type="text"
              placeholder="Type your answer..."
              value={answers[currentQ] || ""}
              onChange={handleText}
              style={{
                marginTop: "20px",
                padding: "12px",
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #ccc",
              }}
            />
          )}

          <button
            className="next-btn"
            onClick={
              currentQ === quiz.length - 1
                ? submitQuiz
                : nextQuestion
            }
          >
            {currentQ === quiz.length - 1 ? "Submit" : "Next"}
          </button>

        </div>
      ) : (
        <div className="result-card">

          <h2>🎯 Score: {score} / {quiz.length}</h2>
          <h3>
            Accuracy: {((score / quiz.length) * 100).toFixed(1)}%
          </h3>

          <PieChart width={300} height={300}>
            <Pie data={chartData} dataKey="value" outerRadius={100}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>

          <h4>🏆 History: {scores.join(", ")}</h4>

          <button className="pdf-btn" onClick={downloadPDF}>
            📄 Download Full Paper
          </button>

          <button className="next-btn" onClick={onReset}>
            Try Again
          </button>

        </div>
      )}
    </div>
  );
}