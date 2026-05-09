from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ─── USER ────────────────────────────────────────
class UserCreate(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    mot_de_passe: str
    role: str = "etudiant"
    filiere: Optional[str] = None
    annee: Optional[int] = None
    numero_etudiant: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    mot_de_passe: str

class UserOut(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: str
    filiere: Optional[str]
    annee: Optional[int]
    actif: bool

# ─── MODULE ──────────────────────────────────────
class ModuleOut(BaseModel):
    id: int
    code: str
    titre: str
    description: Optional[str]
    credits: int
    annee_niveau: int
    semestre: int
    couleur: str
    icone: str
    actif: bool

# ─── COURS ───────────────────────────────────────
class CoursCreate(BaseModel):
    module_id: int
    titre: str
    description: Optional[str] = None
    ordre: int = 1

class CoursOut(BaseModel):
    id: int
    module_id: int
    titre: str
    description: Optional[str]
    ordre: int
    publie: bool

# ─── RESSOURCE ───────────────────────────────────
class RessourceCreate(BaseModel):
    cours_id: int
    titre: str
    description: Optional[str] = None
    type: str  # pdf, video, code, lien, autre
    url: str
    langage: Optional[str] = None
    telechargeable: bool = True

class RessourceOut(BaseModel):
    id: int
    cours_id: int
    titre: str
    type: str
    url: str

# ─── QUIZ ────────────────────────────────────────
class QuizOut(BaseModel):
    id: int
    module_id: int
    titre: str
    type: str
    note_max: float
    date_ouverture: Optional[datetime]
    date_cloture: Optional[datetime]

# ─── ANNONCE ─────────────────────────────────────
class AnnonceCreate(BaseModel):
    titre: str
    contenu: str
    type: str = "info"
    module_id: Optional[int] = None

class AnnonceOut(BaseModel):
    id: int
    titre: str
    contenu: str
    type: str
    module_id: Optional[int]
    created_at: datetime

# ─── FORUM ───────────────────────────────────────
class SujetCreate(BaseModel):
    module_id: int
    titre: str
    contenu: str

class SujetOut(BaseModel):
    id: int
    module_id: int
    auteur_id: int
    titre: str
    contenu: str
    created_at: datetime

# ─── TOKEN ───────────────────────────────────────
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ─── QUIZ ────────────────────────────────────────
class QuestionOut(BaseModel):
    id: int
    enonce: str
    type: str
    points: float
    ordre: int
    choix: List[dict] = []

class QuizQuestionsOut(BaseModel):
    quiz: dict
    questions: List[dict]

class ReponseSubmit(BaseModel):
    question_id: int
    choix_id: Optional[int] = None
    texte_reponse: Optional[str] = None

class QuizResultat(BaseModel):
    message: str
    note_obtenue: float
    note_max: float
    tentative_id: int

# ─── ENSEIGNANT ──────────────────────────────────
class CoursEnseignantOut(BaseModel):
    id: int
    module_id: int
    titre: str
    description: Optional[str]
    ordre: int
    publie: bool
    module_titre: str
    module_code: str
    couleur: str
    created_at: datetime

# ─── DASHBOARD ÉTUDIANT ─────────────────────────
class DashboardStats(BaseModel):
    nb_modules: int
    lecons_consultees: int
    total_lecons: int
    progression_moyenne: float
    quiz_a_venir: List[dict]
    annonces: List[dict]