import api from '../api/config';
import { Annonce } from '../types';

const annonceService = {
  async getAnnonces(moduleId?: number): Promise<Annonce[]> {
    const params = moduleId ? { module_id: moduleId } : {};
    const response = await api.get('/annonces', { params });
    return response.data;
  },

  async getAnnonceById(id: number): Promise<Annonce> {
    const response = await api.get(`/annonces/${id}`);
    return response.data;
  },

  async markAsRead(annonceId: number): Promise<void> {
    await api.post(`/annonces/${annonceId}/read`);
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/annonces/unread/count');
    return response.data.count;
  },
};

export default annonceService;
