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
from pdf2image import convert_from_bytes

# ================= TESSERACT SETUP =================
tesseract_path = shutil.which("tesseract")
print("[DEBUG] Tesseract Path:", tesseract_path)

if tesseract_path:
    pytesseract.pytesseract.tesseract_cmd = tesseract_path
else:
    print("❌ Tesseract NOT FOUND")

app = Flask(__name__)
CORS(app)

# ================= CLEAN TEXT =================
def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_keywords(text):
    words = text.split()
    return [w for w in words if len(w) > 5]

# ================= QUIZ GENERATOR =================
def generate_quiz(text, difficulty="easy"):
    questions = []

    text = clean_text(text)
    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 20]

    if len(sentences) < 2:
        return []

    for sentence in sentences[:5]:

        words = sentence.split()
        if len(words) < 6:
            continue

        keywords = extract_keywords(sentence)
        if not keywords:
            continue

        keyword = random.choice(keywords)

        # options
        options = [keyword]
        distractors = []

        for s in sentences:
            for w in s.split():
                if w != keyword and len(w) > 4:
                    distractors.append(w)

        random.shuffle(distractors)

        for d in distractors:
            if len(options) >= 4:
                break
            if d not in options:
                options.append(d)

        random.shuffle(options)

        # question type
        q_type = random.choice(["fill", "direct"])

        if q_type == "fill":
            question_text = sentence.replace(keyword, "_____")
            question = f"Fill in the blank: {question_text}"
        else:
            question = f"What is '{keyword}' referring to in the sentence?"

        questions.append({
            "type": "mcq",
            "question": question,
            "options": options,
            "answer": keyword
        })

    return questions

# ================= IMAGE OCR =================
def extract_text_from_image(image):
    try:
        img = np.array(image)

        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

        text = pytesseract.image_to_string(thresh, config="--oem 3 --psm 6")

        print("OCR TEXT:", text[:200])
        return clean_text(text)

    except Exception as e:
        print("OCR ERROR:", e)
        return ""

# ================= PDF OCR =================
def extract_text_from_pdf(file):
    text = ""

    try:
        reader = PdfReader(file)
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + " "
    except:
        pass

    # fallback OCR
    if len(text.strip()) < 20:
        print("⚠️ Using OCR fallback for PDF")
        images = convert_from_bytes(file.read())

        for img in images:
            img = np.array(img.convert("L"))
            text += pytesseract.image_to_string(img)

    return clean_text(text)

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

    quiz = generate_quiz(data["text"])

    if not quiz:
        return jsonify({"error": "No quiz generated"}), 400

    return jsonify({"quiz": quiz})

# ---------- IMAGE ----------
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

# ---------- PDF ----------
@app.route('/pdf-quiz', methods=['POST'])
def pdf_quiz():
    if 'pdf' not in request.files:
        return jsonify({"error": "No PDF uploaded"}), 400

    file = request.files['pdf']

    try:
        text = extract_text_from_pdf(file)

        print("PDF TEXT:", text[:200])

        if not text or len(text) < 10:
            return jsonify({"error": "No readable text in PDF"}), 400

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