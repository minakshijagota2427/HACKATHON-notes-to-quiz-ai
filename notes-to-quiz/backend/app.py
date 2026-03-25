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

# ✅ AUTO DETECT TESSERACT
tesseract_path = shutil.which("tesseract")
pytesseract.pytesseract.tesseract_cmd = tesseract_path

print("Tesseract Path:", tesseract_path)

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
    try:
        img = np.array(image.convert("L"))

        # resize (speed + clarity)
        h, w = img.shape
        if w > 800:
            img = cv2.resize(img, (800, int(h * 800 / w)))

        text = pytesseract.image_to_string(
            img,
            config='--oem 3 --psm 6'
        )

        return clean_text(text)

    except Exception as e:
        print("OCR ERROR:", e)
        return ""

# ================= ROUTES =================
@app.route('/')
def home():
    return jsonify({"message": "Backend running 🚀"})

@app.route('/generate-quiz', methods=['POST'])
def quiz():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Text required"}), 400

    quiz = generate_quiz(data["text"], data.get("difficulty", "easy"))

    if not quiz:
        return jsonify({"error": "No quiz generated"}), 400

    return jsonify({"quiz": quiz})

@app.route('/ocr-quiz', methods=['POST'])
def ocr_quiz():
    if 'image' not in request.files:
        return jsonify({"error": "No image"}), 400

    file = request.files['image']

    try:
        image = Image.open(io.BytesIO(file.read())).convert("RGB")

        text = extract_text_from_image(image)

        if not text or len(text) < 10:
            return jsonify({"error": "No readable text found"}), 400

        quiz = generate_quiz(text)

        return jsonify({
            "quiz": quiz,
            "extracted_text": text
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/pdf-quiz', methods=['POST'])
def pdf_quiz():
    if 'pdf' not in request.files:
        return jsonify({"error": "No PDF uploaded"}), 400

    file = request.files['pdf']

    try:
        reader = PdfReader(file)
        text = ""

        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + " "

        text = clean_text(text)

        if not text or len(text) < 20:
            return jsonify({"error": "No readable text found"}), 400

        quiz = generate_quiz(text)

        return jsonify({
            "quiz": quiz,
            "extracted_text": text
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================= RUN =================
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002)