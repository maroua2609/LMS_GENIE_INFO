import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../services/quizService';
import { Navbar } from '../components/common/Navbar';
import { Loading, EmptyState } from '../components/common';
import { Quiz, Question, ChoixReponse } from '../types';
import { ArrowLeft, Play, CheckCircle, XCircle } from 'lucide-react';

const QuizNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [quizData, questionsData] = await Promise.all([
        quizService.getQuizById(parseInt(id)),
        quizService.getQuizQuestions(parseInt(id)),
      ]);
      setQuiz(quizData);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!quiz) return;
    try {
      await quizService.startQuizAttempt(quiz.id);
      setQuizStarted(true);
    } catch (error) {
      console.error('Erreur au démarrage du quiz:', error);
    }
  };

  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-12">
          <Loading text="Chargement du quiz..." />
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <EmptyState title="Quiz non trouvé" description="Le quiz demandé n'existe pas." />
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition"
          >
            <ArrowLeft size={20} />
            <span>Retour</span>
          </button>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.titre}</h1>
            {quiz.description && (
              <p className="text-gray-600 mb-6">{quiz.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <p className="text-sm text-gray-600">Nombre de questions</p>
                <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Note maximale</p>
                <p className="text-2xl font-bold text-gray-900">{quiz.note_max}</p>
              </div>
              {quiz.duree_min && (
                <div>
                  <p className="text-sm text-gray-600">Durée</p>
                  <p className="text-2xl font-bold text-gray-900">{quiz.duree_min} min</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Tentatives</p>
                <p className="text-2xl font-bold text-gray-900">{quiz.tentatives_max}</p>
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Play size={20} />
              Commencer le quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz complété!</h2>
            <p className="text-gray-600 mb-8">Merci d'avoir complété le quiz.</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Retourner au cours
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = answers[question.id] !== undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-gray-900">
              Question {currentQuestion + 1}/{questions.length}
            </h2>
            <p className="text-gray-600">
              {Object.keys(answers).length}/{questions.length} répondues
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">{question.enonce}</h3>

          {question.type === 'qcm' || question.type === 'vrai_faux' ? (
            <div className="space-y-3">
              {/* Fetch choices from API would be needed here */}
              <p className="text-gray-600 text-sm">Les options de réponse seront affichées ici</p>
            </div>
          ) : (
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="Écrivez votre réponse..."
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Soumettre
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizNew;
