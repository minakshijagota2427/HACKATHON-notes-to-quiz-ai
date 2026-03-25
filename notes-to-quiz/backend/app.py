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
import img2pdf

# ================= TESSERACT SETUP =================
TESSERACT_FALLBACK_MSG = "Tesseract not installed. OCR cannot run."
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
        import cv2
        import numpy as np

        img = np.array(image)

        # BGR convert
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

        # Resize (IMPORTANT 🔥)
        img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

        # Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Sharpen
        kernel = np.array([[0, -1, 0],
                           [-1, 5,-1],
                           [0, -1, 0]])
        sharp = cv2.filter2D(gray, -1, kernel)

        # Threshold (KEY FIX 🔥)
        _, thresh = cv2.threshold(sharp, 150, 255, cv2.THRESH_BINARY)

        # OCR CONFIG (VERY IMPORTANT)
        custom_config = r'--oem 3 --psm 6'

        text = pytesseract.image_to_string(thresh, config=custom_config)

        print("OCR TEXT:", text[:200])

        return text.strip()

    except Exception as e:
        print("OCR ERROR:", e)
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
    if 'image' not in request.files:
        return jsonify({"error": "No image"}), 400

    file = request.files['image']

    try:
        image = Image.open(io.BytesIO(file.read())).convert("RGB")

        # 🔥 STEP 1: Convert image → PDF
        pdf_file = convert_image_to_pdf(image)

        if not pdf_file:
            return jsonify({"error": "Conversion failed"}), 500

        # 🔥 STEP 2: Read PDF
        reader = PdfReader(pdf_file)
        text = ""

        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + " "

        text = clean_text(text)

        # ⚠️ fallback if PDF text fail
        if not text or len(text) < 10:
            text = pytesseract.image_to_string(image)

       if not text:
    return jsonify({
        "error": "No readable text found",
        "raw_text": text
    }), 400

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