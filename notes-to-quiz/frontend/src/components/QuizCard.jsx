import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import jsPDF from "jspdf";

export default function QuizCard({ quiz }) {
  const [selected, setSelected] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const COLORS = ["#22c55e", "#ef4444"];

  // 🔊 SPEAK
  const speak = (text) => {
    const msg = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(msg);
  };

  // 📄 PDF DOWNLOAD
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    quiz.forEach((q, i) => {
      doc.text(`${i + 1}. ${q.question}`, 10, y);
      y += 7;

      if (q.options) {
        q.options.forEach((opt) => {
          doc.text(`- ${opt}`, 15, y);
          y += 5;
        });
      }

      doc.text(`Answer: ${q.answer}`, 10, y);
      y += 10;

      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save("quiz.pdf");
  };

  // 🏆 SAVE SCORE
  const saveScore = (score) => {
    const scores = JSON.parse(localStorage.getItem("scores")) || [];
    scores.push(score);
    localStorage.setItem("scores", JSON.stringify(scores));
  };

  // 🎯 CALCULATE SCORE (FIXED)
  const calculateScore = () => {
    let score = 0;

    quiz.forEach((q, i) => {
      if (q.type !== "short_answer") {
        if (selected[i] === q.answer) score++;
      } else {
        if (
          selected[i] &&
          selected[i].toLowerCase().includes(q.answer.toLowerCase())
        ) {
          score++;
        }
      }
    });

    return score;
  };

  const score = calculateScore();
  const wrong = quiz.length - score;

  const chartData = [
    { name: "Correct", value: score },
    { name: "Wrong", value: wrong }
  ];

  const scores = JSON.parse(localStorage.getItem("scores")) || [];

  // ⏳ TIMER
  useEffect(() => {
    if (timeLeft <= 0 || showAnswers) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showAnswers]);

  // SELECT OPTION
  const handleSelect = (qIndex, option) => {
    setSelected({ ...selected, [qIndex]: option });
  };

  return (
    <div>

      {/* TIMER */}
      <h3 style={{ textAlign: "center" }}>
        ⏳ Time Left: {timeLeft}s
      </h3>

      {/* PROGRESS BAR */}
      <div style={{
        height: "10px",
        background: "#334155",
        borderRadius: "5px",
        marginBottom: "10px"
      }}>
        <div style={{
          width: `${(Object.keys(selected).length / quiz.length) * 100}%`,
          height: "100%",
          background: "#22c55e",
          borderRadius: "5px"
        }} />
      </div>

      {/* QUESTIONS */}
      {quiz.map((q, index) => (
        <div key={index} style={cardStyle}>

          <h3>Q{index + 1}: {q.question}</h3>

          {/* 🔊 SPEAK */}
          <button onClick={() => speak(q.question)} style={btnSmall}>
            🔊 Listen
          </button>

          {/* OPTIONS */}
          {q.options && q.options.map((opt, i) => {
            const isSelected = selected[index] === opt;
            const isCorrect = showAnswers && opt === q.answer;
            const isWrong = showAnswers && isSelected && opt !== q.answer;

            return (
              <div
                key={i}
                onClick={() => handleSelect(index, opt)}
                style={{
                  ...optionStyle,
                  background: isCorrect
                    ? "#22c55e"
                    : isWrong
                    ? "#ef4444"
                    : isSelected
                    ? "#64748b"
                    : "#1e293b"
                }}
              >
                {opt}
              </div>
            );
          })}

          {/* SHORT ANSWER INPUT */}
          {q.type === "short_answer" && (
            <input
              type="text"
              placeholder="Type your answer..."
              value={selected[index] || ""}
              onChange={(e) => handleSelect(index, e.target.value)}
              style={inputStyle}
            />
          )}

          {/* SHOW CORRECT */}
          {q.type === "short_answer" && showAnswers && (
            <p><b>Correct Answer:</b> {q.answer}</p>
          )}

        </div>
      ))}

      {/* PDF */}
      <button onClick={downloadPDF} style={btnStyle}>
        📄 Download PDF
      </button>

      {/* SUBMIT */}
      {!showAnswers && (
        <button
          onClick={() => {
            setShowAnswers(true);
            const score = calculateScore();
            saveScore(score);
          }}
          style={btnStyle}
        >
          Submit Quiz
        </button>
      )}

      {/* RESULT */}
      {showAnswers && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>

          <h2>🎯 Score: {score} / {quiz.length}</h2>

          <h3>📊 Accuracy: {((score / quiz.length) * 100).toFixed(1)}%</h3>

          <PieChart width={300} height={300}>
            <Pie data={chartData} dataKey="value" outerRadius={100} label>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>

          <h3>🏆 Previous Scores: {scores.join(", ")}</h3>

        </div>
      )}

    </div>
  );
}

// STYLES
const cardStyle = {
  background: "#1e293b",
  padding: "20px",
  margin: "15px 0",
  borderRadius: "10px",
  color: "white"
};

const optionStyle = {
  padding: "10px",
  margin: "5px 0",
  borderRadius: "6px",
  cursor: "pointer"
};

const btnStyle = {
  padding: "10px 15px",
  background: "#22c55e",
  border: "none",
  borderRadius: "8px",
  color: "white",
  display: "block",
  margin: "20px auto"
};

const btnSmall = {
  padding: "6px 10px",
  marginBottom: "10px",
  background: "#22c55e",
  border: "none",
  borderRadius: "6px",
  color: "white",
  cursor: "pointer"
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "6px",
  border: "none"
};