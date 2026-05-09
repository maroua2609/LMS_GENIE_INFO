// Types pour l'API LMS

export type UserRole = 'etudiant' | 'enseignant' | 'admin';
export type TypeRessource = 'pdf' | 'video' | 'code' | 'lien' | 'autre';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  numero_etudiant?: string;
  filiere?: string;
  annee?: number;
  actif: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Module {
  id: number;
  code: string;
  titre: string;
  description?: string;
  credits: number;
  annee_niveau: number;
  semestre: number;
  couleur: string;
  icone: string;
  actif: boolean;
}

export interface Cours {
  id: number;
  module_id: number;
  titre: string;
  description?: string;
  ordre: number;
  publie: boolean;
  created_by: number;
  created_at: string;
}

export interface Ressource {
  id: number;
  cours_id: number;
  titre: string;
  description?: string;
  type: TypeRessource;
  url?: string;
  langage?: string;
  telechargeable: boolean;
}

export interface Quiz {
  id: number;
  module_id: number;
  titre: string;
  description?: string;
  type: string;
  note_max: number;
  duree_min?: number;
  date_ouverture?: string;
  date_cloture?: string;
  publie: boolean;
}

export interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  type: 'info' | 'important' | 'urgent';
  auteur_prenom: string;
  auteur_nom: string;
  module_titre?: string;
  epingle: boolean;
  created_at: string;
}

export interface SujetForum {
  id: number;
  titre: string;
  contenu: string;
  auteur_prenom: string;
  auteur_nom: string;
  reponses_count: number;
  epingle: boolean;
  ferme: boolean;
  created_at: string;
}

export interface DashboardStats {
  nb_modules: number;
  lecons_consultees: number;
  total_lecons: number;
  progression_moyenne: number;
  quiz_a_venir: any[];
  annonces: Annonce[];
}

export interface ModuleProgression {
  module_id: number;
  code: string;
  titre: string;
  couleur: string;
  enseignant_nom: string;
  total_lecons: number;
  lecons_consultees: number;
  ratio_lecons: number;
  total_quiz: number;
  quiz_completes: number;
  ratio_quiz: number;
  progression: number;
}

export interface ProgressionData {
  modules: ModuleProgression[];
  progression_globale: number;
  nb_modules: number;
}