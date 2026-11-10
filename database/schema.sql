-- QuizHub MySQL Schema
-- Character set: utf8mb4, Collation: utf8mb4_unicode_ci

CREATE DATABASE IF NOT EXISTS `quizhub` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `quizhub`;

-- 1. users
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(120) NOT NULL,
    `role` ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    `avatar_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. student_profiles
CREATE TABLE IF NOT EXISTS `student_profiles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `xp` INT NOT NULL DEFAULT 0,
    `level` INT NOT NULL DEFAULT 1,
    `streak` INT NOT NULL DEFAULT 0,
    `total_quizzes_played` INT NOT NULL DEFAULT 0,
    `total_wins` INT NOT NULL DEFAULT 0,
    `accuracy_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. teacher_profiles
CREATE TABLE IF NOT EXISTS `teacher_profiles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `school_or_organization` VARCHAR(255) NULL,
    `subject_specialization` VARCHAR(150) NULL,
    `bio` TEXT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. quizzes
CREATE TABLE IF NOT EXISTS `quizzes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `creator_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'General Knowledge',
    `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    `cover_image` VARCHAR(500) NULL,
    `time_limit_per_question` INT NOT NULL DEFAULT 30,
    `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_public` BOOLEAN NOT NULL DEFAULT TRUE,
    `randomize_questions` BOOLEAN NOT NULL DEFAULT FALSE,
    `randomize_options` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_quizzes_category` (`category`),
    INDEX `idx_quizzes_published` (`is_published`, `is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. questions
CREATE TABLE IF NOT EXISTS `questions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quiz_id` INT NOT NULL,
    `question_text` TEXT NOT NULL,
    `question_type` ENUM('multiple_choice', 'true_false', 'multi_select') NOT NULL DEFAULT 'multiple_choice',
    `time_limit` INT NOT NULL DEFAULT 30,
    `points` INT NOT NULL DEFAULT 1000,
    `image_url` VARCHAR(500) NULL,
    `order_num` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE,
    INDEX `idx_questions_quiz` (`quiz_id`, `order_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. answer_options
CREATE TABLE IF NOT EXISTS `answer_options` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `question_id` INT NOT NULL,
    `option_text` TEXT NOT NULL,
    `is_correct` BOOLEAN NOT NULL DEFAULT FALSE,
    `order_num` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
    INDEX `idx_options_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. quiz_sessions
CREATE TABLE IF NOT EXISTS `quiz_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pin` VARCHAR(10) NOT NULL UNIQUE,
    `quiz_id` INT NOT NULL,
    `host_id` INT NOT NULL,
    `status` ENUM('lobby', 'active', 'question_active', 'showing_result', 'completed', 'cancelled') NOT NULL DEFAULT 'lobby',
    `current_question_index` INT NOT NULL DEFAULT 0,
    `current_question_start_time` TIMESTAMP NULL,
    `session_type` ENUM('live_multiplayer', 'duel_1v1', 'tournament') NOT NULL DEFAULT 'live_multiplayer',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `ended_at` TIMESTAMP NULL,
    FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_sessions_pin` (`pin`),
    INDEX `idx_sessions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. session_participants
CREATE TABLE IF NOT EXISTS `session_participants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` INT NOT NULL,
    `user_id` INT NULL,
    `nickname` VARCHAR(80) NOT NULL,
    `score` INT NOT NULL DEFAULT 0,
    `streak` INT NOT NULL DEFAULT 0,
    `rank` INT NOT NULL DEFAULT 0,
    `is_connected` BOOLEAN NOT NULL DEFAULT TRUE,
    `socket_id` VARCHAR(100) NULL,
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_participants_session` (`session_id`, `score` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. submitted_answers
CREATE TABLE IF NOT EXISTS `submitted_answers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` INT NOT NULL,
    `participant_id` INT NOT NULL,
    `question_id` INT NOT NULL,
    `selected_option_ids` JSON NOT NULL,
    `is_correct` BOOLEAN NOT NULL DEFAULT FALSE,
    `points_awarded` INT NOT NULL DEFAULT 0,
    `response_time_seconds` DECIMAL(6,3) NOT NULL DEFAULT 0.000,
    `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`participant_id`) REFERENCES `session_participants`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_part_question` (`session_id`, `participant_id`, `question_id`),
    INDEX `idx_answers_session` (`session_id`, `question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. game_results
CREATE TABLE IF NOT EXISTS `game_results` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` INT NOT NULL,
    `user_id` INT NULL,
    `nickname` VARCHAR(80) NOT NULL,
    `final_score` INT NOT NULL DEFAULT 0,
    `final_rank` INT NOT NULL DEFAULT 1,
    `correct_count` INT NOT NULL DEFAULT 0,
    `incorrect_count` INT NOT NULL DEFAULT 0,
    `average_speed` DECIMAL(6,3) NOT NULL DEFAULT 0.000,
    `xp_earned` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_game_results_user` (`user_id`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. tournaments
CREATE TABLE IF NOT EXISTS `tournaments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'General',
    `status` ENUM('upcoming', 'registration_open', 'live', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming',
    `max_participants` INT NOT NULL DEFAULT 100,
    `creator_id` INT NOT NULL,
    `quiz_id` INT NULL,
    `start_date` TIMESTAMP NOT NULL,
    `end_date` TIMESTAMP NOT NULL,
    `registration_deadline` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. tournament_participants
CREATE TABLE IF NOT EXISTS `tournament_participants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tournament_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `score` INT NOT NULL DEFAULT 0,
    `final_rank` INT NULL,
    `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_tourney_user` (`tournament_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. teams
CREATE TABLE IF NOT EXISTS `teams` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `captain_id` INT NOT NULL,
    `avatar_url` VARCHAR(500) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`captain_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. team_members
CREATE TABLE IF NOT EXISTS `team_members` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `team_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `role` ENUM('captain', 'member') NOT NULL DEFAULT 'member',
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_team_user` (`team_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. friendships
CREATE TABLE IF NOT EXISTS `friendships` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `requester_id` INT NOT NULL,
    `addressee_id` INT NOT NULL,
    `status` ENUM('pending', 'accepted', 'blocked') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`addressee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_friendship` (`requester_id`, `addressee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. challenges (1v1 Duels)
CREATE TABLE IF NOT EXISTS `challenges` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `challenger_id` INT NOT NULL,
    `challenged_id` INT NOT NULL,
    `quiz_id` INT NOT NULL,
    `session_id` INT NULL,
    `status` ENUM('pending', 'accepted', 'declined', 'completed') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`challenger_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`challenged_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. achievements
CREATE TABLE IF NOT EXISTS `achievements` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `badge_icon` VARCHAR(100) NOT NULL,
    `xp_reward` INT NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. user_achievements
CREATE TABLE IF NOT EXISTS `user_achievements` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `achievement_id` INT NOT NULL,
    `unlocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_user_achievement` (`user_id`, `achievement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. notifications
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(500) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_notifs_user` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. reports
CREATE TABLE IF NOT EXISTS `reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reporter_id` INT NOT NULL,
    `target_type` ENUM('quiz', 'question', 'user') NOT NULL,
    `target_id` INT NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `status` ENUM('pending', 'reviewed', 'dismissed', 'actioned') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `action` VARCHAR(150) NOT NULL,
    `ip_address` VARCHAR(50) NULL,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_logs_action` (`action`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

