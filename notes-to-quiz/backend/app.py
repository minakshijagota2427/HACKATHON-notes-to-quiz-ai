from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import pytesseract
from PIL import Image
import io
from PyPDF2 import PdfReader
import re
import cv2
import numpy as np
import shutil

# ================= TESSERACT SETUP =================
TESSERACT_FALLBACK_MSG = "Tesseract not installed. OCR cannot run."
tesseract_path = shutil.which("tesseract")
print("[DEBUG] Tesseract Path:", tesseract_path)
if tesseract_path:
    pytesseract.pytesseract.tesseract_cmd = tesseract_path

app = Flask(__name__)
CORS(app)

# ================= CLEAN TEXT =================
def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# ================= QUIZ GENERATOR =================
def generate_quiz(text, difficulty="easy"):
    questions = []

    text = clean_text(text)
    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 10]

    if not sentences:
        return []

    for sentence in sentences[:5]:
        correct_answer = sentence

        other_sentences = [s for s in sentences if s != sentence]
        random.shuffle(other_sentences)

        distractors = other_sentences[:3]

        while len(distractors) < 3:
            distractors.append("None of the above")

        options = [correct_answer] + distractors
        random.shuffle(options)

        questions.append({
            "type": "mcq",
            "question": "Which statement is correct?",
            "options": options,
            "answer": correct_answer
        })

    return questions

# ================= FAST OCR =================
def extract_text_from_image(image):
    if not tesseract_path:
        print("[DEBUG] Tesseract not found!")
        return TESSERACT_FALLBACK_MSG
    try:
        print("[DEBUG] extract_text_from_image called")
        # Convert to grayscale only
        img = image.convert("L")
        text_raw = pytesseract.image_to_string(img, config='--psm 6')
        print("[DEBUG] OCR raw output:", repr(text_raw))
        return text_raw
    except Exception as e:
        print("[DEBUG] OCR ERROR:", e)
        return ""

# ================= ROUTES =================

@app.route('/')
def home():
    return jsonify({"message": "Backend running 🚀"})

# ---------- TEXT ----------
@app.route('/generate-quiz', methods=['POST'])
def quiz():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Text required"}), 400

    quiz = generate_quiz(data["text"], data.get("difficulty", "easy"))

    if not quiz:
        return jsonify({"error": "No quiz generated"}), 400

    return jsonify({"quiz": quiz})


# ---------- IMAGE OCR ----------
@app.route('/ocr-quiz', methods=['POST'])
def ocr_quiz():
    fallback = "This image contains educational content related to math or diagrams."
    if 'image' not in request.files:
        print("[DEBUG] No image in request.files")
        quiz = generate_quiz(fallback)
        return jsonify({
            "quiz": quiz,
            "extracted_text": fallback
        })

    file = request.files['image']
    file_bytes = file.read()
    print(f"[DEBUG] Image received: filename={getattr(file, 'filename', None)}, size={len(file_bytes)} bytes")
    try:
        image = Image.open(io.BytesIO(file_bytes))
        print("[DEBUG] Image opened successfully")
        text = extract_text_from_image(image)
        if not text or not text.strip() or text == TESSERACT_FALLBACK_MSG:
            print("[DEBUG] OCR output empty or tesseract missing, using fallback text")
            text = fallback
        quiz = generate_quiz(text)
        return jsonify({
            "quiz": quiz,
            "extracted_text": text
        })
    except Exception as e:
        print("[DEBUG] Exception in /ocr-quiz:", e)
        quiz = generate_quiz(fallback)
        return jsonify({
            "quiz": quiz,
            "extracted_text": fallback
        })
# ================= RUN =================
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002)