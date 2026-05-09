import api from '../api/config';
import { Quiz, Question, ChoixReponse } from '../types';

const quizService = {
  async getQuizByModule(moduleId: number): Promise<Quiz[]> {
    const response = await api.get(`/modules/${moduleId}/quiz`);
    return response.data;
  },

  async getQuizById(id: number): Promise<Quiz> {
    const response = await api.get(`/quiz/${id}`);
    return response.data;
  },

  async getQuizQuestions(quizId: number): Promise<Question[]> {
    const response = await api.get(`/quiz/${quizId}/questions`);
    return response.data;
  },

  async getQuestion(questionId: number): Promise<Question & { choix_reponses: ChoixReponse[] }> {
    const response = await api.get(`/questions/${questionId}`);
    return response.data;
  },

  async startQuizAttempt(quizId: number) {
    const response = await api.post(`/quiz/${quizId}/start`);
    return response.data;
  },

  async submitAnswer(attemptId: number, questionId: number, reponse: any) {
    const response = await api.post(`/tentatives/${attemptId}/reponses`, {
      question_id: questionId,
      ...reponse,
    });
    return response.data;
  },

  async submitQuizAttempt(attemptId: number) {
    const response = await api.post(`/tentatives/${attemptId}/submit`);
    return response.data;
  },

  async getAttempts(quizId: number) {
    const response = await api.get(`/quiz/${quizId}/attempts`);
    return response.data;
  },
};

export default quizService;
