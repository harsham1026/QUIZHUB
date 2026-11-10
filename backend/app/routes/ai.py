import json
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.middleware.auth import role_required

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")

@ai_bp.route("/generate", methods=["POST"])
@jwt_required()
@role_required("teacher", "admin")
def generate_quiz_questions():
    data = request.get_json() or {}
    topic = data.get("topic", "").strip()
    category = data.get("category", "General Knowledge").strip()
    difficulty = data.get("difficulty", "medium").strip()
    num_questions = min(max(int(data.get("num_questions", 5)), 1), 20)

    if not topic:
        return jsonify({"error": "Validation Error", "message": "Please specify a quiz topic"}), 400

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    if not gemini_key and not openai_key:
        return jsonify({
            "error": "Configuration Missing",
            "message": "AI Generation requires an API Key. Please set GEMINI_API_KEY in your backend .env file.",
            "configured": False
        }), 503

    prompt = f"""
    You are an expert educational game designer creating competitive quiz questions.
    Generate exactly {num_questions} high quality {difficulty}-level quiz questions on the topic: '{topic}' (Category: {category}).
    
    Return ONLY a valid JSON array of objects with the following exact structure:
    [
      {{
        "question_text": "Clear and engaging question",
        "question_type": "multiple_choice",
        "time_limit": 30,
        "points": 1000,
        "options": [
          {{ "option_text": "Choice A", "is_correct": false }},
          {{ "option_text": "Choice B", "is_correct": true }},
          {{ "option_text": "Choice C", "is_correct": false }},
          {{ "option_text": "Choice D", "is_correct": false }}
        ]
      }}
    ]
    Ensure each question has at least one correct option, exactly 4 choices for multiple_choice (or 2 for true_false), and no Markdown formatting outside the JSON.
    """

    try:
        if gemini_key:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            raw_text = response.text.strip()
        else:
            import requests
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7
            }
            res = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=30)
            res.raise_for_status()
            raw_text = res.json()["choices"][0]["message"]["content"].strip()

        # Clean markdown code blocks if present
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        questions_data = json.loads(raw_text)

        # Validate schema
        validated_questions = []
        for q in questions_data:
            if "question_text" in q and "options" in q and len(q["options"]) >= 2:
                # Ensure at least one correct option
                has_correct = any(opt.get("is_correct") for opt in q["options"])
                if not has_correct:
                    q["options"][0]["is_correct"] = True
                validated_questions.append({
                    "question_text": q["question_text"],
                    "question_type": q.get("question_type", "multiple_choice"),
                    "time_limit": int(q.get("time_limit", 30)),
                    "points": int(q.get("points", 1000)),
                    "options": [
                        {
                            "option_text": opt.get("option_text", ""),
                            "is_correct": bool(opt.get("is_correct", False)),
                            "order_num": idx
                        }
                        for idx, opt in enumerate(q["options"])
                    ]
                })

        return jsonify({
            "message": f"Successfully generated {len(validated_questions)} questions",
            "questions": validated_questions
        }), 200

    except Exception as e:
        return jsonify({
            "error": "AI Generation Failed",
            "message": f"Could not generate questions: {str(e)}"
        }), 500

