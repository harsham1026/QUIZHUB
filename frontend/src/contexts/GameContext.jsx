import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [participantId, setParticipantId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameStatus, setGameStatus] = useState('idle'); // idle, lobby, active, question_active, showing_result, completed
  const [participants, setParticipants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionResult, setQuestionResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [finalPodium, setFinalPodium] = useState([]);
  const [answersCount, setAnswersCount] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const socket = socketService.getSocket();

  useEffect(() => {
    socket.on('player_joined', (data) => {
      // New player joined
    });

    socket.on('lobby_updated', (data) => {
      setParticipants(data.participants || []);
    });

    socket.on('join_success', (data) => {
      setParticipantId(data.participant_id);
      setGameStatus(data.status || 'lobby');
      setErrorMessage('');
    });

    socket.on('game_started', () => {
      setGameStatus('question_active');
    });

    socket.on('new_question', (data) => {
      setCurrentQuestion(data);
      setQuestionResult(null);
      setSelectedOptionIds([]);
      setHasAnswered(false);
      setGameStatus('question_active');
    });

    socket.on('answer_received', (data) => {
      setAnswersCount(data.answers_count || 0);
    });

    socket.on('question_ended', (data) => {
      setQuestionResult(data);
      setLeaderboard(data.leaderboard || []);
      setGameStatus('showing_result');
    });

    socket.on('game_finished', (data) => {
      setFinalPodium(data.podium || []);
      setLeaderboard(data.full_standings || []);
      setGameStatus('completed');
    });

    socket.on('error_message', (data) => {
      setErrorMessage(data.message || 'An error occurred');
    });

    return () => {
      socket.off('player_joined');
      socket.off('lobby_updated');
      socket.off('join_success');
      socket.off('game_started');
      socket.off('new_question');
      socket.off('answer_received');
      socket.off('question_ended');
      socket.off('game_finished');
      socket.off('error_message');
    };
  }, [socket]);

  const joinGame = (gamePin, nickname) => {
    setPin(gamePin);
    setIsHost(false);
    setGameStatus('lobby');
    socket.emit('join_game', {
      pin: gamePin,
      nickname,
      user_id: user?.id || null,
    });
  };

  const initHost = (gamePin) => {
    setPin(gamePin);
    setIsHost(true);
    setGameStatus('lobby');
    socket.emit('host_connect', {
      pin: gamePin,
      host_id: user?.id,
    });
  };

  const startGame = () => {
    if (isHost && pin) {
      socket.emit('start_game', { pin });
    }
  };

  const submitAnswer = (optionIds) => {
    if (hasAnswered || !currentQuestion) return;
    setSelectedOptionIds(optionIds);
    setHasAnswered(true);
    socket.emit('submit_answer', {
      pin,
      participant_id: participantId,
      selected_option_ids: optionIds,
    });
  };

  const nextQuestion = () => {
    if (isHost && pin) {
      socket.emit('next_question', { pin });
    }
  };

  const endGame = () => {
    if (isHost && pin) {
      socket.emit('end_game', { pin });
    }
  };

  const resetGame = () => {
    setPin('');
    setParticipantId(null);
    setIsHost(false);
    setGameStatus('idle');
    setParticipants([]);
    setCurrentQuestion(null);
    setQuestionResult(null);
    setLeaderboard([]);
    setFinalPodium([]);
    setAnswersCount(0);
    setSelectedOptionIds([]);
    setHasAnswered(false);
    setErrorMessage('');
  };

  return (
    <GameContext.Provider
      value={{
        pin,
        participantId,
        isHost,
        gameStatus,
        participants,
        currentQuestion,
        questionResult,
        leaderboard,
        finalPodium,
        answersCount,
        selectedOptionIds,
        hasAnswered,
        errorMessage,
        joinGame,
        initHost,
        startGame,
        submitAnswer,
        nextQuestion,
        endGame,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
export default GameContext;

