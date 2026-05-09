import api from '../api/config';
import { Module, Cours, Ressource } from '../types';

const moduleService = {
  async getModules(): Promise<Module[]> {
    const response = await api.get('/modules');
    return response.data;
  },

  async getModuleById(id: number): Promise<Module> {
    const response = await api.get(`/modules/${id}`);
    return response.data;
  },

  async getCoursByModule(moduleId: number): Promise<Cours[]> {
    const response = await api.get(`/modules/${moduleId}/cours`);
    return response.data;
  },

  async getCoursById(id: number): Promise<Cours> {
    const response = await api.get(`/cours/${id}`);
    return response.data;
  },

  async getCoursResources(coursId: number): Promise<Ressource[]> {
    const response = await api.get(`/cours/${coursId}/ressources`);
    return response.data;
  },

  async getMyModules(): Promise<Module[]> {
    const response = await api.get('/me/modules');
    return response.data;
  },

  async getProgressionCours(coursId: number) {
    const response = await api.get(`/me/progression/${coursId}`);
    return response.data;
  },

  async updateProgression(coursId: number, progression: number, complete: boolean) {
    const response = await api.put(`/me/progression/${coursId}`, { progression, complete });
    return response.data;
  },
};

export default moduleService;
