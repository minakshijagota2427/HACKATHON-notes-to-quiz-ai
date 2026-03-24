from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import pytesseract
from PIL import Image
import io
import os
from PyPDF2 import PdfReader


pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# QUIZ GENERATOR
def generate_quiz(text):
    questions = []

    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 10]

    if not sentences:
        return questions

    question_types = ['mcq', 'true_false', 'short_answer']

    for sentence in sentences[:5]:
        q_type = random.choice(question_types)

        if q_type == 'mcq':
            correct_answer = sentence.strip()

            distractors = [
                "This is a distractor option",
                "None of the above",
                "Unable to determine",
            ]

            options = [correct_answer] + distractors
            random.shuffle(options)

            question = {
                "type": "mcq",
                "question": f"What is the meaning of: '{correct_answer}'?",
                "options": options,
                "answer": correct_answer
            }

        elif q_type == 'true_false':
            question = {
                "type": "true_false",
                "question": f"True or False: {sentence}",
                "options": ["True", "False"],
                "answer": "True"
            }

        else:
            question = {
                "type": "short_answer",
                "question": f"Explain in brief: {sentence}",
                "answer": sentence
            }

        questions.append(question)

    return questions


@app.route('/')
def home():
    return jsonify({"message": "Backend running on port 5002"})


@app.route('/generate-quiz', methods=['POST'])
def quiz():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Text required"}), 400

    quiz = generate_quiz(data["text"])
    return jsonify({"quiz": quiz})


@app.route('/ocr-quiz', methods=['POST'])
def ocr_quiz():
    if 'image' not in request.files:
        return jsonify({"error": "No image"}), 400

    file = request.files['image']

    try:
        image = Image.open(io.BytesIO(file.read()))
        text = pytesseract.image_to_string(image)

        quiz = generate_quiz(text)
        return jsonify({"quiz": quiz})

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
            text += page.extract_text() or ""

        if not text.strip():
            return jsonify({"error": "No text found in PDF"}), 400

        quiz = generate_quiz(text)
        return jsonify({"quiz": quiz})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)