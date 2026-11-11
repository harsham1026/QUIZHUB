import json
import os
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.middleware.auth import role_required

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


@ai_bp.route("/status", methods=["GET"])
@jwt_required()
@role_required("teacher", "admin")
def ai_status():
    gemini_configured = bool(os.getenv("GEMINI_API_KEY", "").strip())
    openai_configured = bool(os.getenv("OPENAI_API_KEY", "").strip())
    return jsonify({
        "configured": gemini_configured or openai_configured,
        "provider": "gemini" if gemini_configured else ("openai" if openai_configured else None),
    }), 200


def _extract_json_array(raw_text: str):
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\[[\s\S]*\]", cleaned)
        if match:
            return json.loads(match.group(0))
        raise


@ai_bp.route("/generate", methods=["POST"])
@jwt_required()
@role_required("teacher", "admin")
def generate_quiz_questions():
    data = request.get_json() or {}
    topic = data.get("topic", "").strip()
    category = data.get("category", "General Knowledge").strip()
    difficulty = data.get("difficulty", "medium").strip()
    try:
        num_questions = min(max(int(data.get("num_questions", 5)), 1), 20)
    except (TypeError, ValueError):
        num_questions = 5

    if not topic:
        return jsonify({"error": "Validation Error", "message": "Please specify a quiz topic"}), 400

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    if not gemini_key and not openai_key:
        return jsonify({
            "error": "Configuration Missing",
            "message": "GEMINI_API_KEY is not configured. Add GEMINI_API_KEY in Vercel Project Settings -> Environment Variables and redeploy.",
            "configured": False,
        }), 503

    prompt = f"""
    You are an expert educational game designer creating competitive quiz questions.
    Generate exactly {num_questions} high-quality {difficulty}-level quiz questions on the topic: '{topic}' (Category: {category}).

    Return ONLY a valid JSON array of objects with this exact structure:
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
    Rules:
    - Allowed question_type values: "multiple_choice", "true_false", "multi_select".
    - Every question must have at least one option with "is_correct": true.
    - Use 4 options for multiple_choice/multi_select and 2 options (True/False) for true_false.
    - Return pure JSON only with no markdown or extra commentary.
    """

    try:
        raw_text = ""
        if gemini_key:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_key)
            last_err = None
            for model_name in ("gemini-2.5-flash", "gemini-2.0-flash"):
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.7,
                        ),
                    )
                    if response and response.text:
                        raw_text = response.text.strip()
                        break
                except Exception as model_err:
                    last_err = model_err
                    continue

            if not raw_text:
                raise RuntimeError(str(last_err) if last_err else "Empty response from Gemini")
        else:
            import requests
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            }
            res = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=30)
            res.raise_for_status()
            raw_text = res.json()["choices"][0]["message"]["content"].strip()

        questions_data = _extract_json_array(raw_text)
        if not isinstance(questions_data, list):
            raise ValueError("AI output was not a JSON array")

        validated_questions = []
        allowed_types = {"multiple_choice", "true_false", "multi_select"}
        for q in questions_data:
            if not isinstance(q, dict):
                continue
            q_text = str(q.get("question_text", "")).strip()
            opts = q.get("options", [])
            if not q_text or not isinstance(opts, list) or len(opts) < 2:
                continue

            q_type = q.get("question_type", "multiple_choice")
            if q_type not in allowed_types:
                q_type = "multiple_choice"

            clean_opts = [
                {
                    "option_text": str(opt.get("option_text", "")).strip() or f"Option {idx + 1}",
                    "is_correct": bool(opt.get("is_correct", False)),
                    "order_num": idx,
                }
                for idx, opt in enumerate(opts)
                if isinstance(opt, dict)
            ]
            if len(clean_opts) < 2:
                continue
            if not any(o["is_correct"] for o in clean_opts):
                clean_opts[0]["is_correct"] = True

            validated_questions.append({
                "question_text": q_text,
                "question_type": q_type,
                "time_limit": min(max(int(q.get("time_limit", 30)), 10), 120),
                "points": min(max(int(q.get("points", 1000)), 100), 2000),
                "options": clean_opts,
            })

        if not validated_questions:
            return jsonify({
                "error": "AI Generation Failed",
                "message": "AI returned no valid questions. Please refine your topic and retry.",
            }), 502

        return jsonify({
            "message": f"Successfully generated {len(validated_questions)} questions",
            "questions": validated_questions,
        }), 200

    except Exception as e:
        return jsonify({
            "error": "AI Generation Failed",
            "message": f"Could not generate questions: {str(e)}",
        }), 500
