import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [participantId, setParticipantId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameStatus, setGameStatus] = useState('idle'); // idle, lobby, question_active, showing_result, completed
  const [participants, setParticipants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionResult, setQuestionResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [finalPodium, setFinalPodium] = useState([]);
  const [answersCount, setAnswersCount] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const lastQuestionIdRef = useRef(null);
  const advancingRef = useRef(false);

  const applyServerState = useCallback((state) => {
    if (!state) return;

    setParticipants(state.participants || []);
    setAnswersCount(state.answers_count || 0);
    setLeaderboard(state.leaderboard || []);

    const incomingQ = state.current_question || null;
    if (incomingQ && incomingQ.id !== lastQuestionIdRef.current) {
      lastQuestionIdRef.current = incomingQ.id;
      setSelectedOptionIds(state.selected_option_ids || []);
      setHasAnswered(Boolean(state.has_answered));
      setQuestionResult(null);
    } else if (state.has_answered) {
      setHasAnswered(true);
      if (state.selected_option_ids?.length) {
        setSelectedOptionIds(state.selected_option_ids);
      }
    }

    setCurrentQuestion(incomingQ);
    setQuestionResult(state.question_result || null);

    if (state.status === 'completed') {
      setFinalPodium(state.final_podium || []);
      if (state.full_standings?.length) {
        setLeaderboard(state.full_standings);
      }
    }

    setGameStatus(state.status || 'lobby');
    setErrorMessage('');
  }, []);

  // Poll live game state every 1s while a session is active
  useEffect(() => {
    if (!pin || gameStatus === 'idle' || gameStatus === 'completed') {
      return;
    }

    let cancelled = false;
    const fetchState = async () => {
      try {
        const params = participantId ? { participant_id: participantId } : {};
        const res = await api.get(`/sessions/${pin}/state`, { params });
        if (!cancelled) {
          applyServerState(res.data);
        }
      } catch (err) {
        if (!cancelled && err.response?.status === 404) {
          setErrorMessage(err.response?.data?.message || 'Game session not found');
        }
      }
    };

    const interval = setInterval(fetchState, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pin, participantId, gameStatus, applyServerState]);

  const joinGame = async (gamePin, nickname) => {
    const cleanPin = gamePin.trim().toUpperCase();
    setErrorMessage('');
    try {
      const res = await api.post(`/sessions/${cleanPin}/join`, {
        nickname,
        user_id: user?.id || null,
      });
      setPin(cleanPin);
      setIsHost(false);
      setParticipantId(res.data.participant_id);
      lastQuestionIdRef.current = res.data.current_question?.id || null;
      applyServerState(res.data);
      return true;
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Invalid or expired Game PIN');
      setGameStatus('idle');
      return false;
    }
  };

  const initHost = async (gamePin) => {
    const cleanPin = gamePin.trim().toUpperCase();
    setPin(cleanPin);
    setIsHost(true);
    setParticipantId(null);
    setErrorMessage('');
    try {
      const res = await api.get(`/sessions/${cleanPin}/state`);
      lastQuestionIdRef.current = res.data.current_question?.id || null;
      applyServerState(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to load host game session');
      setGameStatus('lobby');
    }
  };

  const startGame = async () => {
    if (!isHost || !pin) return;
    try {
      const res = await api.post(`/sessions/${pin}/start`);
      applyServerState(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to start game');
    }
  };

  const submitAnswer = async (optionIds) => {
    if (hasAnswered || !currentQuestion || !participantId || !pin) return;
    setSelectedOptionIds(optionIds);
    setHasAnswered(true);
    try {
      const res = await api.post(`/sessions/${pin}/answer`, {
        participant_id: participantId,
        selected_option_ids: optionIds,
      });
      applyServerState(res.data);
    } catch (err) {
      if (err.response?.status !== 409) {
        setErrorMessage(err.response?.data?.message || 'Failed to submit answer');
      }
    }
  };

  const nextQuestion = async () => {
    if (!isHost || !pin || advancingRef.current) return;
    advancingRef.current = true;
    try {
      const res = await api.post(`/sessions/${pin}/next`);
      applyServerState(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to advance question');
    } finally {
      setTimeout(() => {
        advancingRef.current = false;
      }, 400);
    }
  };

  const endGame = async () => {
    if (!isHost || !pin) return;
    try {
      const res = await api.post(`/sessions/${pin}/end`);
      applyServerState(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to end game');
    }
  };

  const resetGame = () => {
    lastQuestionIdRef.current = null;
    advancingRef.current = false;
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
