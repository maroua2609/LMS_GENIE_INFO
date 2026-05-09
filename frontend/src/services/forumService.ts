import api from '../api/config';
import { ForumSujet } from '../types';

const forumService = {
  async getSujetsByModule(moduleId: number): Promise<ForumSujet[]> {
    const response = await api.get(`/modules/${moduleId}/forum`);
    return response.data;
  },

  async getSujetById(id: number) {
    const response = await api.get(`/forum/${id}`);
    return response.data;
  },

  async createSujet(moduleId: number, titre: string, contenu: string) {
    const response = await api.post(`/modules/${moduleId}/forum`, {
      titre,
      contenu,
    });
    return response.data;
  },

  async createReponse(sujetId: number, contenu: string) {
    const response = await api.post(`/forum/${sujetId}/reponses`, {
      contenu,
    });
    return response.data;
  },

  async getReponses(sujetId: number) {
    const response = await api.get(`/forum/${sujetId}/reponses`);
    return response.data;
  },

  async voteReponse(reponseId: number, valeur: number) {
    const response = await api.post(`/forum/reponses/${reponseId}/vote`, {
      valeur,
    });
    return response.data;
  },
};

export default forumService;
