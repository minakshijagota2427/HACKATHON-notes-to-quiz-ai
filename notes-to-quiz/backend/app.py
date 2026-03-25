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
import pytesseract

pytesseract.pytesseract.tesseract_cmd = shutil.which("tesseract")
print("Tesseract Path:", pytesseract.pytesseract.tesseract_cmd)

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

        question = {
            "type": "mcq",
            "question": "Which statement is correct?",
            "options": options,
            "answer": correct_answer
        }

        questions.append(question)

    return questions

# ================= SMART OCR FUNCTION =================
def extract_text_from_image(image):
    try:
        # Convert to grayscale
        img = np.array(image.convert("L"))

        # Resize (balanced for speed + clarity)
        h, w = img.shape
        if w < 1000:
            img = cv2.resize(img, (1000, int(h * 1000 / w)))

        # Improve contrast
        img = cv2.equalizeHist(img)

        # Adaptive threshold
        thresh = cv2.adaptiveThreshold(
            img, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )

        # OCR
        text = pytesseract.image_to_string(
            thresh,
            config='--oem 3 --psm 6'
        )

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
    print("Image received:", file.filename)

    try:
        image = Image.open(io.BytesIO(file.read())).convert("RGB")

        text = extract_text_from_image(image)

        print("OCR TEXT:", text[:200])

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