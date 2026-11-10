def calculate_question_score(
    max_points: int,
    time_limit: int,
    response_time: float,
    is_correct: bool,
    current_streak: int = 0
) -> dict:
    """
    Server-authoritative scoring formula:
    - If wrong: 0 points, streak resets.
    - If correct:
        * Base Points: 50% of max_points.
        * Speed Bonus: Up to 50% of max_points based on remaining fraction of time.
        * Streak Bonus: 5% extra per streak level (max 25%).
    """
    if not is_correct:
        return {
            "points": 0,
            "base_points": 0,
            "speed_bonus": 0,
            "streak_bonus": 0,
            "new_streak": 0,
            "is_correct": False,
        }

    # Ensure response time doesn't exceed time limit
    effective_time = max(0.0, min(float(response_time), float(time_limit)))
    
    # 50% is guaranteed base points for correct answer
    base_points = int(max_points * 0.5)
    
    # Speed factor: 1.0 for instantaneous answer, scales down to 0 at time limit
    time_remaining_ratio = max(0.0, (time_limit - effective_time) / float(time_limit)) if time_limit > 0 else 0.0
    speed_bonus = int(max_points * 0.5 * time_remaining_ratio)

    # Streak bonus: 50 bonus points per consecutive streak up to 5 streaks (250 pts cap)
    new_streak = current_streak + 1
    streak_multiplier = min(new_streak, 5)
    streak_bonus = (streak_multiplier - 1) * 50 if streak_multiplier > 1 else 0

    total_points = base_points + speed_bonus + streak_bonus

    return {
        "points": total_points,
        "base_points": base_points,
        "speed_bonus": speed_bonus,
        "streak_bonus": streak_bonus,
        "new_streak": new_streak,
        "is_correct": True,
    }

def rank_participants(participants_list):
    """
    Sort participants: Primary = score DESC, Secondary = average response time ASC.
    """
    return sorted(
        participants_list,
        key=lambda p: (-p.get("score", 0), p.get("total_response_time", 999999.0))
    )

