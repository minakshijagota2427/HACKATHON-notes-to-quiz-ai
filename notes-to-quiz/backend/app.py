from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import pytesseract
from PIL import Image
import io
import os
from PyPDF2 import PdfReader
import re
import cv2
import numpy as np

pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"
print("PATH:", pytesseract.pytesseract.tesseract_cmd)
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
    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 15]

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

        question = {
            "type": "mcq",
            "question": "What is correct statement?",
            "options": options,
            "answer": correct_answer
        }

        questions.append(question)

    return questions


# ================= OCR IMPROVED =================
def extract_text_from_image(image):
    try:
        img = np.array(image)

        # convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # blur for noise removal
        gray = cv2.GaussianBlur(gray, (5, 5), 0)

        # threshold for clarity
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

        custom_config = r'--oem 3 --psm 6'

        text = pytesseract.image_to_string(thresh, config=custom_config)

        return clean_text(text)

    except Exception as e:
        print("OCR ERROR:", e)
        return ""


# ================= HOME =================
@app.route('/')
def home():
    return jsonify({"message": "Backend running 🚀"})


# ================= TEXT =================
@app.route('/generate-quiz', methods=['POST'])
def quiz():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Text required"}), 400

    quiz = generate_quiz(data["text"], data.get("difficulty", "easy"))

    if not quiz:
        return jsonify({"error": "No quiz generated"}), 400

    return jsonify({"quiz": quiz})


# ================= OCR =================
@app.route('/ocr-quiz', methods=['POST'])
def ocr_quiz():
    if 'image' not in request.files:
        return jsonify({"error": "No image"}), 400

    file = request.files['image']

    try:
        image = Image.open(io.BytesIO(file.read())).convert("RGB")

        text = extract_text_from_image(image)

        print("OCR TEXT:", text)

        if not text or len(text) < 10:
            return jsonify({"error": "No readable text found in image"}), 400

        quiz = generate_quiz(text)

        return jsonify({"quiz": quiz})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================= PDF =================
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
            return jsonify({"error": "No readable text found in PDF"}), 400

        quiz = generate_quiz(text)

        return jsonify({"quiz": quiz})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================= RUN =================
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002, debug=True)