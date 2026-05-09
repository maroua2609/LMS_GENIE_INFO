# ============================================================
# LMS Génie Informatique — API Backend (Version Finale)
# ============================================================

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
from contextlib import contextmanager
from typing import List, Optional
import jwt
import bcrypt
import os
import shutil
import uuid

from database import get_connection
from models import (
    UserCreate, UserLogin, UserOut, ModuleOut, CoursCreate, CoursOut,
    RessourceCreate, RessourceOut, QuizOut, AnnonceCreate, AnnonceOut,
    SujetCreate, SujetOut, Token
)

# ============================================================
# CONFIGURATION
# ============================================================
app = FastAPI(title="LMS Génie Informatique", version="2.0")

# Dossier uploads
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sécurité
SECRET_KEY = os.getenv("SECRET_KEY", "ma_super_cle_secrete_2025")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24
security = HTTPBearer()

# ============================================================
# UTILITAIRES
# ============================================================

@contextmanager
def get_db():
    """Gestionnaire de connexion avec commit/rollback automatique"""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
def creer_notification(user_id: int, titre: str, message: str, type_notif: str = "systeme", lien: str = None):
    """Enregistre une notification pour un utilisateur"""
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO notifications (user_id, titre, message, type, lien) VALUES (%s, %s, %s, %s, %s)",
                (user_id, titre, message, type_notif, lien)
            )
    except Exception as e:
        print(f"Erreur création notification : {e}")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_token(user_id: int, role: str, expires_delta: timedelta = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + expires_delta,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


def require_role(*roles: str):
    """Décorateur pour vérifier les rôles"""
    def checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(status_code=403, detail=f"Rôle requis : {', '.join(roles)}")
        return current_user
    return checker

# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health_check():
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT 1")
        return {"status": "OK", "database": "connected", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        return {"status": "ERROR", "database": str(e)}

# ============================================================
# AUTHENTIFICATION
# ============================================================

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(user: UserCreate):
    with get_db() as conn:
        cur = conn.cursor()
        try:
            hashed = hash_password(user.mot_de_passe)
            cur.execute(
                """INSERT INTO users (nom, prenom, email, mot_de_passe, role, filiere, annee, numero_etudiant)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
                (user.nom, user.prenom, user.email, hashed, user.role,
                 user.filiere, user.annee, user.numero_etudiant)
            )
            return cur.fetchone()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/login")
def login(user: UserLogin):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s AND actif = TRUE", (user.email,))
        db_user = cur.fetchone()

    if not db_user or not verify_password(user.mot_de_passe, db_user["mot_de_passe"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    access_token = create_token(db_user["id"], db_user["role"])
    refresh_token = create_token(db_user["id"], db_user["role"], timedelta(days=30))

    # Stocker refresh token
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO refresh_tokens (user_id, token, expire_le) VALUES (%s, %s, %s)",
            (db_user["id"], refresh_token, datetime.utcnow() + timedelta(days=30))
        )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "nom": db_user["nom"],
            "prenom": db_user["prenom"],
            "email": db_user["email"],
            "role": db_user["role"]
        }
    }


@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, nom, prenom, email, role, filiere, annee, actif, avatar_url, numero_etudiant FROM users WHERE id = %s",
            (current_user["user_id"],)
        )
        user = cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

# ============================================================
# MODULES
# ============================================================

@app.get("/api/modules")
def get_modules(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        
        if current_user["role"] == "admin":
            cur.execute("SELECT * FROM modules WHERE actif = TRUE ORDER BY annee_niveau, semestre")
        elif current_user["role"] == "enseignant":
            cur.execute(
                """SELECT m.* FROM modules m
                JOIN enseignant_module em ON m.id = em.module_id
                WHERE em.enseignant_id = %s AND m.actif = TRUE
                ORDER BY m.annee_niveau, m.semestre""",
                (current_user["user_id"],)
            )
        else:
            cur.execute(
                """SELECT m.* FROM modules m
                JOIN inscriptions i ON m.id = i.module_id
                WHERE i.etudiant_id = %s AND m.actif = TRUE
                ORDER BY m.annee_niveau, m.semestre""",
                (current_user["user_id"],)
            )
        
        return cur.fetchall()


@app.get("/api/modules/{module_id}")
def get_module(module_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM modules WHERE id = %s", (module_id,))
        module = cur.fetchone()
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")
    return module

# ============================================================
# COURS
# ============================================================

@app.get("/api/modules/{module_id}/cours")
def get_cours(module_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM cours WHERE module_id = %s AND publie = TRUE ORDER BY ordre",
            (module_id,)
        )
        return cur.fetchall()



@app.get("/api/cours/{cours_id}")
def get_cours_detail(cours_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()

        # Récupération du cours avec jointures
        cur.execute(
            """SELECT c.*, 
               m.titre as module_titre, m.code as module_code, m.semestre as module_semestre,
               m.couleur as module_couleur,
               u.nom as enseignant_nom, u.prenom as enseignant_prenom
            FROM cours c
            JOIN modules m ON c.module_id = m.id
            LEFT JOIN enseignant_module em ON m.id = em.module_id
            LEFT JOIN users u ON em.enseignant_id = u.id
            WHERE c.id = %s""",
            (cours_id,)
        )
        cours = cur.fetchone()

        if not cours:
            raise HTTPException(status_code=404, detail="Cours non trouvé")

        # Récupération des ressources (dans la même connexion)
        cur.execute("SELECT * FROM ressources WHERE cours_id = %s ORDER BY ordre", (cours_id,))
        ressources = cur.fetchall()

    # Le dictionnaire de réponse est construit après le bloc with, c’est correct
    return {
        "cours": cours,
        "ressources": ressources,
        "module": {
            "id": cours["module_id"],
            "titre": cours["module_titre"],
            "code": cours["module_code"],
            "semestre": cours["module_semestre"],
            "couleur": cours["module_couleur"]
        },
        "enseignant": {
            "nom": cours["enseignant_nom"] or "Non assigné",
            "prenom": cours["enseignant_prenom"] or ""
        }
    }
@app.put("/api/ressources/{ressource_id}")
def update_ressource(
    ressource_id: int,
    titre: str = Form(...),
    description: str = Form(None),
    type: str = Form(...),
    url: str = Form(None),
    langage: str = Form(None),
    telechargeable: bool = Form(True),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    with get_db() as conn:
        cur = conn.cursor()
        # Vérifier que la ressource appartient bien à un cours créé par l'enseignant
        cur.execute(
            """SELECT r.id, c.created_by
               FROM ressources r
               JOIN cours c ON r.cours_id = c.id
               WHERE r.id = %s""",
            (ressource_id,)
        )
        res = cur.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="Ressource non trouvée")
        if current_user["role"] == "enseignant" and res["created_by"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas le créateur de cette ressource")

        # Mise à jour
        cur.execute(
            """UPDATE ressources
               SET titre = %s,
                   description = %s,
                   type = %s,
                   url = %s,
                   langage = %s,
                   telechargeable = %s
               WHERE id = %s
               RETURNING *""",
            (titre, description, type, url or "", langage, telechargeable, ressource_id)
        )
        updated = cur.fetchone()
    return updated
@app.get("/api/modules/{module_id}/enseignant")
def get_module_enseignant(module_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT u.nom, u.prenom
            FROM enseignant_module em
            JOIN users u ON em.enseignant_id = u.id
            WHERE em.module_id = %s
            LIMIT 1""",
            (module_id,)
        )
        enseignant = cur.fetchone()
    
    if not enseignant:
        return {"nom": "Non assigné", "prenom": ""}
    return {"nom": enseignant["nom"], "prenom": enseignant["prenom"]}
@app.post("/api/cours", status_code=status.HTTP_201_CREATED)
def create_cours(cours: CoursCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé aux enseignants")
    
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO cours (module_id, titre, description, ordre, publie, created_by) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
            (cours.module_id, cours.titre, cours.description, cours.ordre, cours.publie if hasattr(cours, 'publie') else True, current_user["user_id"])
        )
        new_cours = cur.fetchone()

        # Notifier les étudiants inscrits au module
        cur.execute("SELECT etudiant_id FROM inscriptions WHERE module_id = %s", (cours.module_id,))
        for etu in cur.fetchall():
            creer_notification(
                etu["etudiant_id"],
                "Nouveau cours disponible",
                f"Le cours '{cours.titre}' vient d'être ajouté.",
                "ressource",
                f"/etudiant/cours/{new_cours['id']}"
            )

        return new_cours


@app.put("/api/cours/{cours_id}/publier")
def toggle_publier_cours(cours_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE cours SET publie = NOT publie WHERE id = %s RETURNING *",
            (cours_id,)
        )
        cours = cur.fetchone()
    if not cours:
        raise HTTPException(status_code=404, detail="Cours non trouvé")
    return cours


@app.delete("/api/cours/{cours_id}")
def delete_cours(cours_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM cours WHERE id = %s", (cours_id,))
    return {"message": "Cours supprimé"}

# ============================================================
# RESSOURCES
# ============================================================
@app.get("/api/notifications")
def get_my_notifications(current_user: dict = Depends(get_current_user)):
    """Récupère les 30 dernières notifications de l'utilisateur"""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT id, titre, message, type, lien, lu, created_at
               FROM notifications
               WHERE user_id = %s
               ORDER BY created_at DESC LIMIT 30""",
            (current_user["user_id"],)
        )
        return cur.fetchall()


@app.put("/api/notifications/{notif_id}/lire")
def marquer_notification_lue(notif_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE notifications SET lu = TRUE WHERE id = %s AND user_id = %s",
            (notif_id, current_user["user_id"])
        )
    return {"message": "Notification marquée comme lue"}
@app.get("/api/cours/{cours_id}/ressources")
def get_ressources(cours_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM ressources WHERE cours_id = %s ORDER BY ordre", (cours_id,))
        return cur.fetchall()


@app.post("/api/ressources", status_code=status.HTTP_201_CREATED)
async def create_ressource(
    cours_id: int = Form(...),
    titre: str = Form(...),
    description: str = Form(None),
    type: str = Form(...),
    url: str = Form(None),
    langage: str = Form(None),
    telechargeable: bool = Form(True),
    fichier: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    
    final_url = url or ""
    
    if fichier and fichier.filename:
        ext = os.path.splitext(fichier.filename)[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(fichier.file, buffer)
        final_url = f"http://localhost:8000/uploads/{unique_name}"
    
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO ressources (cours_id, titre, description, type, url, langage, telechargeable, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (cours_id, titre, description, type, final_url, langage, telechargeable, current_user["user_id"])
        )
        return cur.fetchone()

# ============================================================
# QUIZ
# ============================================================

@app.get("/api/modules/{module_id}/quiz")
def get_quiz(module_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM quiz WHERE module_id = %s AND publie = TRUE", (module_id,))
        return cur.fetchall()

@app.post("/api/quiz", status_code=status.HTTP_201_CREATED)
def create_quiz_complet(data: dict, current_user: dict = Depends(get_current_user)):
    """Crée un quiz avec ses questions et choix.
    Format attendu :
    {
        "module_id": 1,
        "titre": "Quiz exemple",
        "description": "...",
        "type": "qcm",
        "note_max": 20,
        "duree_min": 30,
        "questions": [
            {
                "enonce": "Qu'est-ce qu'une variable ?",
                "type": "qcm",
                "points": 4,
                "choix": [
                    {"texte": "Un conteneur de données", "est_correct": true},
                    {"texte": "Un langage", "est_correct": false}
                ]
            }
        ]
    }
    """
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    with get_db() as conn:
        cur = conn.cursor()
        # Créer le quiz
        cur.execute(
            "INSERT INTO quiz (module_id, titre, description, type, note_max, duree_min, publie, created_by) "
            "VALUES (%s, %s, %s, %s, %s, %s, TRUE, %s) RETURNING id",
            (data["module_id"], data["titre"], data.get("description"),
             data.get("type", "qcm"), data.get("note_max", 20),
             data.get("duree_min"), current_user["user_id"])
        )
        quiz_id = cur.fetchone()["id"]

        # Ajouter les questions
        for q in data.get("questions", []):
            cur.execute(
                "INSERT INTO questions (quiz_id, enonce, type, points, ordre) "
                "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (quiz_id, q["enonce"], q.get("type", "qcm"), q.get("points", 1), q.get("ordre", 1))
            )
            question_id = cur.fetchone()["id"]
            for choix in q.get("choix", []):
                cur.execute(
                    "INSERT INTO choix_reponses (question_id, texte, est_correct, ordre) "
                    "VALUES (%s, %s, %s, %s)",
                    (question_id, choix["texte"], choix.get("est_correct", False), choix.get("ordre", 1))
                )
        # Envoyer une notification à chaque étudiant inscrit au module
    cur.execute(
    "SELECT etudiant_id FROM inscriptions WHERE module_id = %s",
    (data["module_id"],)
)
    for etu in cur.fetchall():
        creer_notification(
        etu["etudiant_id"],
        "Nouveau quiz disponible",
        f"Le quiz '{data['titre']}' est disponible dans votre module.",
        "quiz",
        f"/etudiant/quiz/{quiz_id}"
    )    
    return {"message": "Quiz créé avec succès", "quiz_id": quiz_id}
@app.get("/api/quiz/{quiz_id}/questions")
def get_quiz_questions(quiz_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM quiz WHERE id = %s", (quiz_id,))
        quiz = cur.fetchone()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz non trouvé")
        
        cur.execute("SELECT * FROM questions WHERE quiz_id = %s ORDER BY ordre", (quiz_id,))
        questions = cur.fetchall()
        
        for question in questions:
            cur.execute(
                "SELECT id, texte, ordre FROM choix_reponses WHERE question_id = %s ORDER BY ordre",
                (question["id"],)
            )
            question["choix"] = cur.fetchall()
    
    return {"quiz": quiz, "questions": questions}

@app.get("/api/enseignant/quiz")
def get_enseignant_quiz(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT q.id, q.titre, q.description, q.type, q.note_max, q.duree_min,
                      q.module_id, m.code AS module_code, m.titre AS module_titre,
                      q.publie, q.created_at
               FROM quiz q
               JOIN modules m ON q.module_id = m.id
               JOIN enseignant_module em ON m.id = em.module_id
               WHERE em.enseignant_id = %s AND q.created_by = %s
               ORDER BY q.created_at DESC""",
            (current_user["user_id"], current_user["user_id"])
        )
        quiz_list = cur.fetchall()
    return quiz_list

@app.get("/api/enseignant/etudiants/{etudiant_id}/detail")
def get_etudiant_detail(etudiant_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    enseignant_id = current_user["user_id"]

    with get_db() as conn:
        cur = conn.cursor()

        # Vérifier que l'étudiant est bien inscrit à au moins un module de l'enseignant
        cur.execute(
            """SELECT u.nom, u.prenom, u.email, u.numero_etudiant
            FROM users u
            JOIN inscriptions i ON u.id = i.etudiant_id
            JOIN enseignant_module em ON i.module_id = em.module_id
            WHERE em.enseignant_id = %s AND u.id = %s""",
            (enseignant_id, etudiant_id)
        )
        etudiant = cur.fetchone()
        if not etudiant:
            raise HTTPException(status_code=404, detail="Étudiant non trouvé ou non suivi")

        # Progression par module
        cur.execute(
            """SELECT m.code, m.titre, m.couleur,
                   COUNT(c.id) AS total_cours,
                   COUNT(pc.id) AS cours_consultees,
                   AVG(pc.progression) AS progression_moyenne
            FROM modules m
            JOIN inscriptions i ON m.id = i.module_id
            JOIN enseignant_module em ON m.id = em.module_id
            LEFT JOIN cours c ON m.id = c.module_id AND c.publie = TRUE
            LEFT JOIN progression_cours pc ON c.id = pc.cours_id AND pc.etudiant_id = i.etudiant_id
            WHERE em.enseignant_id = %s AND i.etudiant_id = %s
            GROUP BY m.id, m.code, m.titre, m.couleur
            ORDER BY m.annee_niveau, m.semestre""",
            (enseignant_id, etudiant_id)
        )
        modules_progression = cur.fetchall()

        # Quiz tentés avec notes
        cur.execute(
            """SELECT q.titre, tq.note_obtenue, tq.fin_le, m.code
            FROM tentatives_quiz tq
            JOIN quiz q ON tq.quiz_id = q.id
            JOIN modules m ON q.module_id = m.id
            JOIN enseignant_module em ON q.module_id = em.module_id
            WHERE em.enseignant_id = %s AND tq.etudiant_id = %s AND tq.soumis = TRUE
            ORDER BY tq.fin_le DESC""",
            (enseignant_id, etudiant_id)
        )
        quiz_resultats = cur.fetchall()

    return {
        "etudiant": etudiant,
        "modules_progression": modules_progression,
        "quiz_resultats": quiz_resultats
    }

@app.get("/api/enseignant/stats/etudiants")
def get_enseignant_stats_etudiants(current_user: dict = Depends(get_current_user), module_id: int = None):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    enseignant_id = current_user["user_id"]

    with get_db() as conn:
        cur = conn.cursor()

        if module_id:
            cur.execute("SELECT 1 FROM enseignant_module WHERE enseignant_id = %s AND module_id = %s",
                        (enseignant_id, module_id))
            if not cur.fetchone():
                raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à ce module")

            cur.execute("SELECT COUNT(*) as total FROM inscriptions WHERE module_id = %s", (module_id,))
            total_etudiants = cur.fetchone()["total"]

            cur.execute(
                """SELECT AVG(pc.progression) as moy
                FROM progression_cours pc
                JOIN cours c ON pc.cours_id = c.id
                WHERE c.module_id = %s""",
                (module_id,)
            )
            progression_globale = cur.fetchone()["moy"]

            cur.execute(
                """SELECT COUNT(*) as total_quiz
                FROM tentatives_quiz tq
                JOIN quiz q ON tq.quiz_id = q.id
                WHERE q.module_id = %s AND tq.soumis = TRUE""",
                (module_id,)
            )
            total_quiz = cur.fetchone()["total_quiz"]

            cur.execute(
                """SELECT COUNT(DISTINCT pc.etudiant_id) as a_risque
                FROM progression_cours pc
                JOIN cours c ON pc.cours_id = c.id
                WHERE c.module_id = %s AND pc.progression < 30""",
                (module_id,)
            )
            a_risque = cur.fetchone()["a_risque"]
        else:
            cur.execute(
                """SELECT COUNT(DISTINCT i.etudiant_id) AS total
                FROM inscriptions i
                JOIN enseignant_module em ON i.module_id = em.module_id
                WHERE em.enseignant_id = %s""",
                (enseignant_id,)
            )
            total_etudiants = cur.fetchone()["total"]

            cur.execute(
                """SELECT AVG(pc.progression) AS progression_moyenne
                FROM progression_cours pc
                JOIN cours c ON pc.cours_id = c.id
                JOIN enseignant_module em ON c.module_id = em.module_id
                WHERE em.enseignant_id = %s""",
                (enseignant_id,)
            )
            progression_globale = cur.fetchone()["progression_moyenne"]

            cur.execute(
                """SELECT COUNT(*) AS total_quiz
                FROM tentatives_quiz tq
                JOIN quiz q ON tq.quiz_id = q.id
                JOIN enseignant_module em ON q.module_id = em.module_id
                WHERE em.enseignant_id = %s AND tq.soumis = TRUE""",
                (enseignant_id,)
            )
            total_quiz = cur.fetchone()["total_quiz"]

            cur.execute(
                """SELECT COUNT(DISTINCT pc.etudiant_id) AS a_risque
                FROM progression_cours pc
                JOIN cours c ON pc.cours_id = c.id
                JOIN enseignant_module em ON c.module_id = em.module_id
                WHERE em.enseignant_id = %s AND pc.progression < 30""",
                (enseignant_id,)
            )
            a_risque = cur.fetchone()["a_risque"]

    return {
        "total_etudiants": total_etudiants,
        "progression_globale": round(float(progression_globale), 1) if progression_globale else 0,
        "total_quiz": total_quiz,
        "a_risque": a_risque
    }
@app.put("/api/quiz/{quiz_id}")
def update_quiz(quiz_id: int, data: dict, current_user: dict = Depends(get_current_user)):
    """Met à jour un quiz, ses questions et ses choix"""
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    with get_db() as conn:
        cur = conn.cursor()
        # Vérifier les droits
        cur.execute("SELECT created_by, module_id FROM quiz WHERE id = %s", (quiz_id,))
        quiz = cur.fetchone()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz non trouvé")
        if current_user["role"] == "enseignant" and quiz["created_by"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Vous n'avez pas créé ce quiz")

        # Mettre à jour les infos du quiz
        cur.execute(
            "UPDATE quiz SET titre=%s, description=%s, type=%s, note_max=%s, duree_min=%s WHERE id=%s",
            (data.get("titre"), data.get("description"), data.get("type"), data.get("note_max"), data.get("duree_min"), quiz_id)
        )

        # Supprimer les anciennes questions et choix (on les recrée)
        cur.execute("DELETE FROM choix_reponses WHERE question_id IN (SELECT id FROM questions WHERE quiz_id=%s)", (quiz_id,))
        cur.execute("DELETE FROM questions WHERE quiz_id=%s", (quiz_id,))

        # Réinsérer les questions
        for q in data.get("questions", []):
            cur.execute(
                "INSERT INTO questions (quiz_id, enonce, type, points, ordre) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (quiz_id, q["enonce"], q["type"], q["points"], q.get("ordre", 1))
            )
            qid = cur.fetchone()["id"]
            for c in q.get("choix", []):
                cur.execute(
                    "INSERT INTO choix_reponses (question_id, texte, est_correct, ordre) VALUES (%s, %s, %s, %s)",
                    (qid, c["texte"], c.get("est_correct", False), c.get("ordre", 1))
                )

    return {"message": "Quiz mis à jour"}
@app.get("/api/enseignant/etudiants")
def get_enseignant_etudiants(current_user: dict = Depends(get_current_user), module_id: int = None):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    enseignant_id = current_user["user_id"]
    with get_db() as conn:
        cur = conn.cursor()
        # Requête de base selon module_id
        if module_id:
            # Vérifier que le module est bien assigné à l'enseignant
            cur.execute("SELECT 1 FROM enseignant_module WHERE enseignant_id = %s AND module_id = %s", (enseignant_id, module_id))
            if not cur.fetchone():
                raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à ce module")
            # Étudiants inscrits à ce module
            cur.execute(
                """SELECT DISTINCT u.id, u.nom, u.prenom, u.email, u.numero_etudiant
                FROM users u
                JOIN inscriptions i ON u.id = i.etudiant_id
                WHERE i.module_id = %s AND u.role = 'etudiant'
                ORDER BY u.nom, u.prenom""",
                (module_id,)
            )
        else:
            # Tous les modules de l'enseignant (actuel)
            cur.execute(
                """SELECT DISTINCT u.id, u.nom, u.prenom, u.email, u.numero_etudiant
                FROM users u
                JOIN inscriptions i ON u.id = i.etudiant_id
                JOIN enseignant_module em ON i.module_id = em.module_id
                WHERE em.enseignant_id = %s AND u.role = 'etudiant'
                ORDER BY u.nom, u.prenom""",
                (enseignant_id,)
            )
        etudiants = cur.fetchall()
        for etudiant in etudiants:
            etudiant_id = etudiant["id"]
            # Progression moyenne : module_id restreint ou tous les modules de l'enseignant
            if module_id:
                cur.execute(
                    """SELECT AVG(pc.progression) as moy
                    FROM progression_cours pc
                    JOIN cours c ON pc.cours_id = c.id
                    WHERE c.module_id = %s AND pc.etudiant_id = %s""",
                    (module_id, etudiant_id)
                )
            else:
                cur.execute(
                    """SELECT AVG(pc.progression) as moy
                    FROM progression_cours pc
                    JOIN cours c ON pc.cours_id = c.id
                    JOIN enseignant_module em ON c.module_id = em.module_id
                    WHERE em.enseignant_id = %s AND pc.etudiant_id = %s""",
                    (enseignant_id, etudiant_id)
                )
            progression_moyenne = cur.fetchone()["moy"]
            etudiant["progression_moyenne"] = round(float(progression_moyenne), 1) if progression_moyenne else 0.0

            # Meilleure note de quiz
            if module_id:
                cur.execute(
                    """SELECT MAX(tq.note_obtenue) as best
                    FROM tentatives_quiz tq
                    JOIN quiz q ON tq.quiz_id = q.id
                    WHERE q.module_id = %s AND tq.etudiant_id = %s AND tq.soumis = TRUE""",
                    (module_id, etudiant_id)
                )
            else:
                cur.execute(
                    """SELECT MAX(tq.note_obtenue) as best
                    FROM tentatives_quiz tq
                    JOIN quiz q ON tq.quiz_id = q.id
                    JOIN enseignant_module em ON q.module_id = em.module_id
                    WHERE em.enseignant_id = %s AND tq.etudiant_id = %s AND tq.soumis = TRUE""",
                    (enseignant_id, etudiant_id)
                )
            best_note = cur.fetchone()["best"]
            etudiant["meilleure_note"] = round(float(best_note), 1) if best_note else None

            # Nombre de quiz soumis
            if module_id:
                cur.execute(
                    """SELECT COUNT(*) as nb
                    FROM tentatives_quiz tq
                    JOIN quiz q ON tq.quiz_id = q.id
                    WHERE q.module_id = %s AND tq.etudiant_id = %s AND tq.soumis = TRUE""",
                    (module_id, etudiant_id)
                )
            else:
                cur.execute(
                    """SELECT COUNT(*) as nb
                    FROM tentatives_quiz tq
                    JOIN quiz q ON tq.quiz_id = q.id
                    JOIN enseignant_module em ON q.module_id = em.module_id
                    WHERE em.enseignant_id = %s AND tq.etudiant_id = %s AND tq.soumis = TRUE""",
                    (enseignant_id, etudiant_id)
                )
            etudiant["quiz_soumis"] = cur.fetchone()["nb"]
        return etudiants
@app.get("/api/quiz/{quiz_id}/detail")
def get_quiz_detail(quiz_id: int, current_user: dict = Depends(get_current_user)):
    """Récupère le quiz avec ses questions et choix (pour édition/consultation)"""
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM quiz WHERE id = %s", (quiz_id,))
        quiz = cur.fetchone()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz non trouvé")

        cur.execute("SELECT * FROM questions WHERE quiz_id = %s ORDER BY ordre", (quiz_id,))
        questions = cur.fetchall()

        for question in questions:
            cur.execute(
                "SELECT id, texte, est_correct, ordre FROM choix_reponses WHERE question_id = %s ORDER BY ordre",
                (question["id"],)
            )
            question["choix"] = cur.fetchall()

    return {
        "quiz": quiz,
        "questions": questions
    }
@app.delete("/api/quiz/{quiz_id}")
def delete_quiz(quiz_id: int, current_user: dict = Depends(get_current_user)):
    """Supprime un quiz et toutes ses données associées (questions, choix, tentatives)"""
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    with get_db() as conn:
        cur = conn.cursor()

        # Vérifier que l'enseignant est le créateur du quiz ou admin
        cur.execute("SELECT created_by, module_id FROM quiz WHERE id = %s", (quiz_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Quiz non trouvé")
        if current_user["role"] == "enseignant" and row["created_by"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Vous n'avez pas créé ce quiz")

        # Supprimer les tentatives et réponses liées
        cur.execute("DELETE FROM reponses_etudiant WHERE tentative_id IN (SELECT id FROM tentatives_quiz WHERE quiz_id = %s)", (quiz_id,))
        cur.execute("DELETE FROM tentatives_quiz WHERE quiz_id = %s", (quiz_id,))

        # Supprimer les choix de toutes les questions de ce quiz
        cur.execute("DELETE FROM choix_reponses WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = %s)", (quiz_id,))

        # Supprimer les questions
        cur.execute("DELETE FROM questions WHERE quiz_id = %s", (quiz_id,))

        # Enfin, supprimer le quiz lui-même
        cur.execute("DELETE FROM quiz WHERE id = %s", (quiz_id,))

    return {"message": "Quiz supprimé avec succès"}
@app.post("/api/quiz/{quiz_id}/soumettre")
def soumettre_quiz(quiz_id: int, reponses: List[dict], current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM quiz WHERE id = %s", (quiz_id,))
        quiz = cur.fetchone()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz non trouvé")
        
        cur.execute(
            "INSERT INTO tentatives_quiz (quiz_id, etudiant_id, debut_le, fin_le) VALUES (%s, %s, NOW(), NOW()) RETURNING id",
            (quiz_id, current_user["user_id"])
        )
        tentative_id = cur.fetchone()["id"]
        
        total_points = 0
        points_obtenus = 0
        
        for reponse in reponses:
            question_id = reponse.get("question_id")
            choix_id = reponse.get("choix_id")
            
            cur.execute("SELECT points FROM questions WHERE id = %s", (question_id,))
            question = cur.fetchone()
            if not question:
                continue
            
            points_question = float(question["points"])
            total_points += points_question
            est_correct = False
            
            if choix_id:
                cur.execute(
                    "SELECT est_correct FROM choix_reponses WHERE id = %s AND question_id = %s",
                    (choix_id, question_id)
                )
                choix = cur.fetchone()
                if choix and choix["est_correct"]:
                    est_correct = True
                    points_obtenus += points_question
            
            cur.execute(
                """INSERT INTO reponses_etudiant 
                (tentative_id, question_id, choix_id, est_correct, points_obtenus)
                VALUES (%s, %s, %s, %s, %s)""",
                (tentative_id, question_id, choix_id, est_correct, points_question if est_correct else 0)
            )
        
        note_max = float(quiz["note_max"])
        note_finale = round((points_obtenus / total_points) * note_max, 2) if total_points > 0 else 0
        
        cur.execute(
            "UPDATE tentatives_quiz SET note_obtenue = %s, soumis = TRUE WHERE id = %s",
            (note_finale, tentative_id)
        )
    
    return {
        "message": "Quiz soumis avec succès",
        "tentative_id": tentative_id,
        "note_obtenue": note_finale,
        "note_max": note_max
    }
@app.put("/api/cours/{cours_id}")
def update_cours(
    cours_id: int,
    cours: CoursCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    with get_db() as conn:
        cur = conn.cursor()

        # Récupérer le cours et son module
        cur.execute(
            "SELECT created_by, module_id FROM cours WHERE id = %s",
            (cours_id,)
        )
        existing = cur.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Cours non trouvé")

        # Vérifier les droits
        user_id = current_user["user_id"]
        if current_user["role"] == "admin":
            pass  # admin a tous les droits
        elif existing["created_by"] == user_id:
            pass  # créateur du cours
        else:
            # Vérifier si l'enseignant est assigné au module
            cur.execute(
                "SELECT 1 FROM enseignant_module WHERE enseignant_id = %s AND module_id = %s",
                (user_id, existing["module_id"])
            )
            if not cur.fetchone():
                raise HTTPException(
                    status_code=403,
                    detail="Vous n'êtes pas autorisé à modifier ce cours"
                )

        # Mise à jour
        cur.execute(
            """UPDATE cours
               SET module_id = %s,
                   titre = %s,
                   description = %s,
                   ordre = %s,
                   publie = %s
               WHERE id = %s
               RETURNING *""",
            (
                cours.module_id,
                cours.titre,
                cours.description,
                cours.ordre,
                cours.publie if hasattr(cours, 'publie') else True,
                cours_id
            )
        )
        updated = cur.fetchone()

    return updated
# ============================================================
# PROGRESSION
# ============================================================

@app.get("/api/etudiant/progression")
def get_progression(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute(
            """SELECT m.*, 
               COALESCE(em.enseignant_nom, 'Non assigné') as enseignant_nom
            FROM modules m
            JOIN inscriptions i ON m.id = i.module_id
            LEFT JOIN (
                SELECT em.module_id, u.nom || ' ' || u.prenom as enseignant_nom
                FROM enseignant_module em
                JOIN users u ON em.enseignant_id = u.id
            ) em ON m.id = em.module_id
            WHERE i.etudiant_id = %s AND m.actif = TRUE
            ORDER BY m.annee_niveau, m.semestre""",
            (current_user["user_id"],)
        )
        modules = cur.fetchall()
        
        result = []
        total_progression = 0
        
        for module in modules:
            module_id = module["id"]
            
            cur.execute("SELECT COUNT(*) as nb FROM cours WHERE module_id = %s AND publie = TRUE", (module_id,))
            total_lecons = cur.fetchone()["nb"]
            
            cur.execute(
                """SELECT COUNT(*) as nb FROM progression_cours pc
                JOIN cours c ON pc.cours_id = c.id
                WHERE pc.etudiant_id = %s AND c.module_id = %s AND pc.progression > 0""",
                (current_user["user_id"], module_id)
            )
            lecons_consultees = cur.fetchone()["nb"]
            
            ratio_lecons = (lecons_consultees / total_lecons * 100) if total_lecons > 0 else 0
            
            cur.execute("SELECT id FROM quiz WHERE module_id = %s AND publie = TRUE", (module_id,))
            quiz_list = cur.fetchall()
            total_quiz = len(quiz_list)
            
            couverture_quiz = 0
            somme_scores = 0
            for quiz in quiz_list:
                cur.execute(
                    """SELECT note_obtenue FROM tentatives_quiz
                    WHERE quiz_id = %s AND etudiant_id = %s AND soumis = TRUE
                    ORDER BY note_obtenue DESC LIMIT 1""",
                    (quiz["id"], current_user["user_id"])
                )
                best = cur.fetchone()
                if best:
                    couverture_quiz += 1
                    somme_scores += min(float(best["note_obtenue"]) / 20 * 100, 100)
            
            ratio_quiz_couverture = (couverture_quiz / total_quiz * 100) if total_quiz > 0 else 0
            ratio_quiz_moyenne = (somme_scores / couverture_quiz) if couverture_quiz > 0 else 0
            ratio_quiz = (ratio_quiz_couverture * 0.5 + ratio_quiz_moyenne * 0.5)
            
            progression_module = round(ratio_lecons * 0.6 + ratio_quiz * 0.4, 1)
            total_progression += progression_module
            
            result.append({
                "module_id": module_id,
                "code": module["code"],
                "titre": module["titre"],
                "couleur": module["couleur"],
                "enseignant_nom": module["enseignant_nom"],
                "total_lecons": total_lecons,
                "lecons_consultees": lecons_consultees,
                "ratio_lecons": round(ratio_lecons, 1),
                "total_quiz": total_quiz,
                "quiz_completes": couverture_quiz,
                "ratio_quiz": round(ratio_quiz, 1),
                "progression": progression_module
            })
        
        progression_globale = round(total_progression / len(modules), 1) if modules else 0
    
    return {
        "modules": result,
        "progression_globale": progression_globale,
        "nb_modules": len(modules)
    }


@app.post("/api/cours/{cours_id}/valider-hybride")
async def valider_cours_hybride(
    cours_id: int,
    temps_passe: int = Form(0),
    ressources_ouvertes: str = Form(""),
    quiz_id: int = Form(0),
    current_user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        cur = conn.cursor()
        
        # Score temps (30%) - Max 10 minutes
        TEMPS_MAX = 600
        score_temps = min(temps_passe / TEMPS_MAX, 1.0) * 30
        
        # Score ressources (30%)
        cur.execute("SELECT COUNT(*) as nb FROM ressources WHERE cours_id = %s", (cours_id,))
        total_ressources = cur.fetchone()["nb"]
        ressources_ids = [int(x) for x in ressources_ouvertes.split(",") if x.strip()]
        ressources_consultees = len(set(ressources_ids))
        score_ressources = (ressources_consultees / total_ressources * 30) if total_ressources > 0 else 0
        
        # Score quiz (40%)
        score_quiz = 0
        if quiz_id > 0:
            cur.execute(
                """SELECT note_obtenue FROM tentatives_quiz 
                WHERE quiz_id = %s AND etudiant_id = %s AND soumis = TRUE 
                ORDER BY note_obtenue DESC LIMIT 1""",
                (quiz_id, current_user["user_id"])
            )
            tentative = cur.fetchone()
            if tentative:
                score_quiz = min((float(tentative["note_obtenue"]) / 20) * 40, 40)
        
        progression = min(round(score_temps + score_ressources + score_quiz), 100)
        
        cur.execute(
            "SELECT * FROM progression_cours WHERE etudiant_id = %s AND cours_id = %s",
            (current_user["user_id"], cours_id)
        )
        existing = cur.fetchone()
        
        if existing:
            cur.execute(
                "UPDATE progression_cours SET progression = %s, complete = %s, derniere_activite = NOW() WHERE id = %s",
                (progression, progression >= 100, existing["id"])
            )
        else:
            cur.execute(
                "INSERT INTO progression_cours (etudiant_id, cours_id, progression, complete, derniere_activite) VALUES (%s, %s, %s, %s, NOW())",
                (current_user["user_id"], cours_id, progression, progression >= 100)
            )
    
    return {
        "message": "Progression calculée",
        "progression": progression,
        "details": {
            "score_temps": round(score_temps, 1),
            "score_ressources": round(score_ressources, 1),
            "score_quiz": round(score_quiz, 1)
        }
    }

# ============================================================
# ANNONCES
# ============================================================

@app.get("/api/annonces")
def get_annonces(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()

        # Si l'utilisateur est admin, il voit toutes les annonces
        if current_user["role"] == "admin":
            cur.execute(
                """SELECT a.*, u.nom as auteur_nom, u.prenom as auteur_prenom, m.titre as module_titre
                FROM annonces a
                JOIN users u ON a.auteur_id = u.id
                LEFT JOIN modules m ON a.module_id = m.id
                WHERE a.publie = TRUE
                ORDER BY a.epingle DESC, a.created_at DESC"""
            )
        # Si l'utilisateur est enseignant, il voit ses propres annonces + celles de ses modules
        elif current_user["role"] == "enseignant":
            cur.execute(
                """SELECT a.*, u.nom as auteur_nom, u.prenom as auteur_prenom, m.titre as module_titre
                FROM annonces a
                JOIN users u ON a.auteur_id = u.id
                LEFT JOIN modules m ON a.module_id = m.id
                WHERE a.publie = TRUE
                  AND (
                       a.auteur_id = %s
                       OR a.module_id IN (
                           SELECT module_id
                           FROM enseignant_module
                           WHERE enseignant_id = %s
                       )
                  )
                ORDER BY a.epingle DESC, a.created_at DESC""",
                (current_user["user_id"], current_user["user_id"])
            )
        # Pour les autres rôles (étudiant), on garde tout (ou on peut filtrer aussi)
        else:
            cur.execute(
                """SELECT a.*, u.nom as auteur_nom, u.prenom as auteur_prenom, m.titre as module_titre
                FROM annonces a
                JOIN users u ON a.auteur_id = u.id
                LEFT JOIN modules m ON a.module_id = m.id
                WHERE a.publie = TRUE
                ORDER BY a.epingle DESC, a.created_at DESC"""
            )

        annonces = cur.fetchall()
    return annonces


# Dans main.py, modifiez create_annonce :
@app.post("/api/annonces", status_code=status.HTTP_201_CREATED)
def create_annonce(annonce: AnnonceCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO annonces (titre, contenu, type, auteur_id, module_id) VALUES (%s, %s, %s, %s, %s) RETURNING *",
            (annonce.titre, annonce.contenu, annonce.type, current_user["user_id"], annonce.module_id)
        )
        return cur.fetchone()

# ============================================================
# FORUM
# ============================================================

@app.get("/api/forum/module/{module_id}")
def get_sujets(module_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT s.*, u.nom as auteur_nom, u.prenom as auteur_prenom,
               (SELECT COUNT(*) FROM forum_reponses WHERE sujet_id = s.id) as reponses_count
            FROM forum_sujets s
            JOIN users u ON s.auteur_id = u.id
            WHERE s.module_id = %s
            ORDER BY s.epingle DESC, s.created_at DESC""",
            (module_id,)
        )
        return cur.fetchall()


@app.post("/api/forum/sujets", status_code=status.HTTP_201_CREATED)
def create_sujet(sujet: SujetCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO forum_sujets (module_id, auteur_id, titre, contenu) VALUES (%s, %s, %s, %s) RETURNING *",
            (sujet.module_id, current_user["user_id"], sujet.titre, sujet.contenu)
        )
        return cur.fetchone()
@app.delete("/api/forum/reponses/{reponse_id}")
def delete_forum_reponse(reponse_id: int, current_user: dict = Depends(get_current_user)):
    """Supprime une réponse. L'enseignant peut supprimer les réponses dans ses modules."""
    with get_db() as conn:
        cur = conn.cursor()

        if current_user["role"] not in ["enseignant", "admin"]:
            # Si étudiant, vérifier qu'il est l'auteur de la réponse
            cur.execute("SELECT auteur_id FROM forum_reponses WHERE id = %s", (reponse_id,))
            rep = cur.fetchone()
            if not rep or rep["auteur_id"] != current_user["user_id"]:
                raise HTTPException(status_code=403, detail="Vous ne pouvez pas supprimer cette réponse")
        else:
            # Enseignant / Admin : vérifier que la réponse appartient à un sujet d'un de ses modules
            cur.execute(
                """SELECT r.auteur_id, s.module_id
                   FROM forum_reponses r
                   JOIN forum_sujets s ON r.sujet_id = s.id
                   WHERE r.id = %s""",
                (reponse_id,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Réponse non trouvée")
            # Vérifier que l'enseignant est assigné au module du sujet
            cur.execute(
                "SELECT 1 FROM enseignant_module WHERE enseignant_id = %s AND module_id = %s",
                (current_user["user_id"], row["module_id"])
            )
            if not cur.fetchone() and current_user["role"] != "admin":
                raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à ce module")

        cur.execute("DELETE FROM forum_reponses WHERE id = %s", (reponse_id,))
    return {"message": "Réponse supprimée avec succès"}

@app.delete("/api/forum/sujets/{sujet_id}")
def delete_forum_sujet(sujet_id: int, current_user: dict = Depends(get_current_user)):
    """Supprime un sujet (et toutes ses réponses). Enseignant/admin pour ses modules, ou auteur."""
    with get_db() as conn:
        cur = conn.cursor()

        if current_user["role"] not in ["enseignant", "admin"]:
            cur.execute("SELECT auteur_id FROM forum_sujets WHERE id = %s", (sujet_id,))
            sujet = cur.fetchone()
            if not sujet or sujet["auteur_id"] != current_user["user_id"]:
                raise HTTPException(status_code=403, detail="Vous ne pouvez pas supprimer ce sujet")
        else:
            cur.execute(
                "SELECT module_id FROM forum_sujets WHERE id = %s", (sujet_id,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Sujet non trouvé")
            cur.execute(
                "SELECT 1 FROM enseignant_module WHERE enseignant_id = %s AND module_id = %s",
                (current_user["user_id"], row["module_id"])
            )
            if not cur.fetchone() and current_user["role"] != "admin":
                raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à ce module")

        # Supprimer d'abord les réponses
        cur.execute("DELETE FROM forum_reponses WHERE sujet_id = %s", (sujet_id,))
        cur.execute("DELETE FROM forum_votes WHERE reponse_id IN (SELECT id FROM forum_reponses WHERE sujet_id = %s)", (sujet_id,))
        cur.execute("DELETE FROM forum_sujets WHERE id = %s", (sujet_id,))
    return {"message": "Sujet et réponses supprimés avec succès"}
# ============================================================
# ENSEIGNANT
# ============================================================

@app.get("/api/enseignant/cours")
def get_enseignant_cours(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT c.*, m.titre as module_titre, m.code as module_code, m.couleur
            FROM cours c
            JOIN modules m ON c.module_id = m.id
            WHERE c.created_by = %s
            ORDER BY c.created_at DESC""",
            (current_user["user_id"],)
        )
        return cur.fetchall()


@app.get("/api/enseignant/stats")
def get_enseignant_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as nb FROM cours WHERE created_by = %s", (current_user["user_id"],))
        nb_cours = cur.fetchone()["nb"]
        cur.execute("SELECT COUNT(*) as nb FROM quiz WHERE created_by = %s", (current_user["user_id"],))
        nb_quiz = cur.fetchone()["nb"]
    return {"nb_cours": nb_cours, "nb_quiz": nb_quiz}

# ============================================================
# DASHBOARD ÉTUDIANT
# ============================================================

@app.get("/api/etudiant/dashboard")
def get_etudiant_dashboard(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) as nb FROM inscriptions WHERE etudiant_id = %s", (current_user["user_id"],))
        nb_modules = cur.fetchone()["nb"]
        
        cur.execute("SELECT COUNT(*) as nb FROM progression_cours WHERE etudiant_id = %s AND progression > 0", (current_user["user_id"],))
        lecons_consultees = cur.fetchone()["nb"]
        
        cur.execute(
            """SELECT COUNT(*) as nb FROM cours c
            JOIN inscriptions i ON c.module_id = i.module_id
            WHERE i.etudiant_id = %s""",
            (current_user["user_id"],)
        )
        total_lecons = cur.fetchone()["nb"]
        
        cur.execute("SELECT COALESCE(AVG(progression), 0) as moy FROM progression_cours WHERE etudiant_id = %s", (current_user["user_id"],))
        progression_moyenne = round(cur.fetchone()["moy"], 1)
        
        cur.execute(
            """SELECT q.*, m.titre as module_titre, m.code as module_code
            FROM quiz q JOIN modules m ON q.module_id = m.id
            JOIN inscriptions i ON q.module_id = i.module_id
            WHERE i.etudiant_id = %s AND q.publie = TRUE AND q.date_ouverture >= NOW()
            ORDER BY q.date_ouverture LIMIT 3""",
            (current_user["user_id"],)
        )
        quiz_a_venir = cur.fetchall()
        
        cur.execute(
            """SELECT a.*, u.nom as auteur_nom, u.prenom as auteur_prenom
            FROM annonces a JOIN users u ON a.auteur_id = u.id
            WHERE a.publie = TRUE ORDER BY a.created_at DESC LIMIT 5"""
        )
        annonces = cur.fetchall()
    
    return {
        "nb_modules": nb_modules,
        "lecons_consultees": lecons_consultees,
        "total_lecons": total_lecons,
        "progression_moyenne": progression_moyenne,
        "quiz_a_venir": quiz_a_venir,
        "annonces": annonces
    }
# ============================================================
# PROGRESSION AVANCÉE (Graphiques, Badges, Export)
# ============================================================

@app.get("/api/etudiant/progression/graphique")
def get_progression_graphique(current_user: dict = Depends(get_current_user)):
    """Données pour le graphique de progression"""
    with get_db() as conn:
        cur = conn.cursor()
        
        # Progression par semaine (30 derniers jours)
        cur.execute(
            """SELECT DATE(derniere_activite) as jour, 
               COUNT(*) as cours_actifs,
               AVG(progression) as progression_moyenne
            FROM progression_cours 
            WHERE etudiant_id = %s 
            AND derniere_activite >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(derniere_activite)
            ORDER BY jour""",
            (current_user["user_id"],)
        )
        data_jours = cur.fetchall()
        
        # Modules complétés
        cur.execute(
            """SELECT m.code, m.titre, m.couleur, pc.progression
            FROM progression_cours pc
            JOIN cours c ON pc.cours_id = c.id
            JOIN modules m ON c.module_id = m.id
            WHERE pc.etudiant_id = %s AND pc.complete = TRUE""",
            (current_user["user_id"],)
        )
        modules_completes = cur.fetchall()
        
        # Stats globales
        cur.execute(
            """SELECT 
                COUNT(DISTINCT c.module_id) as modules_actifs,
                COUNT(pc.id) as cours_travailles,
                COALESCE(AVG(pc.progression), 0) as moyenne,
                COUNT(CASE WHEN pc.complete = TRUE THEN 1 END) as cours_completes,
                (SELECT COUNT(*) FROM tentatives_quiz WHERE etudiant_id = %s AND soumis = TRUE) as quiz_soumis,
                (SELECT COALESCE(AVG(note_obtenue), 0) FROM tentatives_quiz WHERE etudiant_id = %s AND soumis = TRUE) as moyenne_quiz
            FROM progression_cours pc
            JOIN cours c ON pc.cours_id = c.id
            WHERE pc.etudiant_id = %s""",
            (current_user["user_id"], current_user["user_id"], current_user["user_id"])
        )
        stats = cur.fetchone()
    
    return {
        "data_jours": data_jours,
        "modules_completes": modules_completes,
        "stats": stats
    }


@app.get("/api/etudiant/badges")
def get_badges(current_user: dict = Depends(get_current_user)):
    """Récupère les badges de l'étudiant"""
    with get_db() as conn:
        cur = conn.cursor()
        
        badges = []
        
        # Badge : Premier module complété
        cur.execute(
            """SELECT COUNT(*) as nb FROM progression_cours pc
            JOIN cours c ON pc.cours_id = c.id
            WHERE pc.etudiant_id = %s AND pc.complete = TRUE""",
            (current_user["user_id"],)
        )
        if cur.fetchone()["nb"] >= 1:
            badges.append({"id": "premier_cours", "nom": "Premier pas", "description": "Premier cours complété", "icone": "🌟", "date": datetime.utcnow().isoformat()})
        
        # Badge : 5 cours complétés
        cur.execute(
            """SELECT COUNT(DISTINCT c.module_id) as nb FROM progression_cours pc
            JOIN cours c ON pc.cours_id = c.id
            WHERE pc.etudiant_id = %s AND pc.complete = TRUE""",
            (current_user["user_id"],)
        )
        if cur.fetchone()["nb"] >= 3:
            badges.append({"id": "3_modules", "nom": "Explorateur", "description": "3 modules complétés", "icone": "🏆", "date": datetime.utcnow().isoformat()})
        
        # Badge : Premier quiz réussi
        cur.execute(
            """SELECT COUNT(*) as nb FROM tentatives_quiz 
            WHERE etudiant_id = %s AND soumis = TRUE AND note_obtenue >= 10""",
            (current_user["user_id"],)
        )
        if cur.fetchone()["nb"] >= 1:
            badges.append({"id": "premier_quiz", "nom": "Quiz Master", "description": "Premier quiz réussi (≥10/20)", "icone": "🎯", "date": datetime.utcnow().isoformat()})
        
        # Badge : 100% progression globale
        cur.execute(
            "SELECT COALESCE(AVG(progression), 0) as moy FROM progression_cours WHERE etudiant_id = %s",
            (current_user["user_id"],)
        )
        if cur.fetchone()["moy"] >= 100:
            badges.append({"id": "100_pourcent", "nom": "Expert", "description": "Progression globale à 100%", "icone": "👑", "date": datetime.utcnow().isoformat()})
        
        # Badge : 10 quiz réussis
        cur.execute(
            """SELECT COUNT(*) as nb FROM tentatives_quiz 
            WHERE etudiant_id = %s AND soumis = TRUE AND note_obtenue >= 10""",
            (current_user["user_id"],)
        )
        if cur.fetchone()["nb"] >= 5:
            badges.append({"id": "5_quiz", "nom": "Ace", "description": "5 quiz réussis", "icone": "⭐", "date": datetime.utcnow().isoformat()})
    
    return badges


@app.get("/api/etudiant/progression/export")
def export_progression(current_user: dict = Depends(get_current_user)):
    """Export PDF des données de progression"""
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute(
            """SELECT m.code, m.titre, 
               COUNT(c.id) as total_lecons,
               COUNT(CASE WHEN pc.progression > 0 THEN 1 END) as lecons_consultees,
               ROUND(AVG(pc.progression), 1) as progression_moyenne,
               BOOL_OR(pc.complete) as module_complete
            FROM modules m
            JOIN inscriptions i ON m.id = i.module_id
            LEFT JOIN cours c ON m.id = c.module_id
            LEFT JOIN progression_cours pc ON c.id = pc.cours_id AND pc.etudiant_id = %s
            WHERE i.etudiant_id = %s
            GROUP BY m.id, m.code, m.titre
            ORDER BY m.annee_niveau, m.semestre""",
            (current_user["user_id"], current_user["user_id"])
        )
        modules_prog = cur.fetchall()
        
        cur.execute(
            "SELECT nom, prenom, email, filiere, annee FROM users WHERE id = %s",
            (current_user["user_id"],)
        )
        etudiant = cur.fetchone()
        
        cur.execute(
            """SELECT q.titre, tq.note_obtenue, tq.fin_le, m.code
            FROM tentatives_quiz tq
            JOIN quiz q ON tq.quiz_id = q.id
            JOIN modules m ON q.module_id = m.id
            WHERE tq.etudiant_id = %s AND tq.soumis = TRUE
            ORDER BY tq.fin_le DESC""",
            (current_user["user_id"],)
        )
        quiz_resultats = cur.fetchall()
    
    return {
        "etudiant": etudiant,
        "modules": modules_prog,
        "quiz_resultats": quiz_resultats,
        "date_export": datetime.utcnow().isoformat()
    }


@app.get("/api/etudiant/notifications")
def get_notifications(current_user: dict = Depends(get_current_user)):
    """Récupère les notifications de progression"""
    with get_db() as conn:
        cur = conn.cursor()
        
        notifications = []
        
        # Vérifier les modules complétés
        cur.execute(
            """SELECT m.code, m.titre, m.id
            FROM progression_cours pc
            JOIN cours c ON pc.cours_id = c.id
            JOIN modules m ON c.module_id = m.id
            WHERE pc.etudiant_id = %s AND pc.complete = TRUE
            GROUP BY m.id, m.code, m.titre""",
            (current_user["user_id"],)
        )
        for module in cur.fetchall():
            notifications.append({
                "type": "success",
                "titre": "Module complété ! 🎉",
                "message": f"Vous avez terminé le module {module['code']} - {module['titre']}",
                "date": datetime.utcnow().isoformat()
            })
        
        # Vérifier les quiz réussis
        cur.execute(
            """SELECT q.titre, tq.note_obtenue, m.code
            FROM tentatives_quiz tq
            JOIN quiz q ON tq.quiz_id = q.id
            JOIN modules m ON q.module_id = m.id
            WHERE tq.etudiant_id = %s AND tq.soumis = TRUE AND tq.note_obtenue >= 10
            ORDER BY tq.fin_le DESC LIMIT 3""",
            (current_user["user_id"],)
        )
        for quiz in cur.fetchall():
            notifications.append({
                "type": "info",
                "titre": "Quiz réussi ! 🎯",
                "message": f"Vous avez obtenu {quiz['note_obtenue']}/20 au quiz {quiz['titre']} ({quiz['code']})",
                "date": datetime.utcnow().isoformat()
            })
    
    return notifications
# ─── PROGRESSION V2 : Sessions + Events ─────────

@app.post("/api/progression/start")
def start_session(cours_id: int = Form(...), current_user: dict = Depends(get_current_user)):
    """Démarre une session de lecture"""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO sessions_lecture (etudiant_id, cours_id) VALUES (%s, %s) RETURNING id",
            (current_user["user_id"], cours_id)
        )
        session_id = cur.fetchone()["id"]
    return {"session_id": session_id, "message": "Session démarrée"}


@app.post("/api/progression/heartbeat")
def heartbeat(session_id: int = Form(...), current_user: dict = Depends(get_current_user)):
    """Confirme que l'étudiant est toujours actif"""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE sessions_lecture SET derniere_activite = NOW() WHERE id = %s AND etudiant_id = %s",
            (session_id, current_user["user_id"])
        )
    return {"message": "Heartbeat reçu"}


@app.post("/api/progression/event")
def log_event(
    session_id: int = Form(...),
    cours_id: int = Form(...),
    type: str = Form(...),
    valeur: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Enregistre un événement pédagogique"""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO events_pedagogiques (session_id, etudiant_id, cours_id, type, valeur) VALUES (%s, %s, %s, %s, %s)",
            (session_id, current_user["user_id"], cours_id, type, valeur)
        )
    return {"message": f"Événement {type} enregistré"}

@app.get("/api/cours/{cours_id}/progression")
def get_cours_progression(cours_id: int, current_user: dict = Depends(get_current_user)):
    """Récupère la progression enregistrée pour un cours donné"""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT progression FROM progression_cours WHERE etudiant_id = %s AND cours_id = %s",
            (current_user["user_id"], cours_id)
        )
        row = cur.fetchone()
    return {"progression": row["progression"] if row else None}
@app.post("/api/progression/end")
def end_session(session_id: int = Form(...), current_user: dict = Depends(get_current_user)):
    """Termine une session et calcule la progression"""
    with get_db() as conn:
        cur = conn.cursor()
        
        # Fermer la session
        cur.execute(
            "UPDATE sessions_lecture SET fin = NOW(), duree_totale_secondes = EXTRACT(EPOCH FROM (NOW() - debut)) WHERE id = %s",
            (session_id,)
        )
        
        # Récupérer les stats de la session
        cur.execute("SELECT * FROM sessions_lecture WHERE id = %s", (session_id,))
        session = cur.fetchone()
        
        # Compter les événements
        cur.execute("SELECT COUNT(*) as nb FROM events_pedagogiques WHERE session_id = %s", (session_id,))
        nb_events = cur.fetchone()["nb"]
        
        # Récupérer la durée estimée du cours
        cur.execute("SELECT duree_estimee_min FROM cours WHERE id = %s", (session["cours_id"],))
        cours = cur.fetchone()
        duree_estimee = cours["duree_estimee_min"] * 60 if cours else 1800
        
        # Calculer la progression
        progression = recalculer_progression(
            session["duree_totale_secondes"] or 0,
            duree_estimee,
            nb_events
        )
        
        # Mettre à jour progression_cours
        cur.execute(
            "SELECT * FROM progression_cours WHERE etudiant_id = %s AND cours_id = %s",
            (current_user["user_id"], session["cours_id"])
        )
        existing = cur.fetchone()
        
        if existing:
            cur.execute(
                "UPDATE progression_cours SET progression = %s, complete = %s WHERE id = %s",
                (progression, progression >= 100, existing["id"])
            )
        else:
            cur.execute(
                "INSERT INTO progression_cours (etudiant_id, cours_id, progression, complete) VALUES (%s, %s, %s, %s)",
                (current_user["user_id"], session["cours_id"], progression, progression >= 100)
            )
    
    return {
        "message": "Session terminée",
        "progression": progression,
        "duree_secondes": session["duree_totale_secondes"],
        "nb_events": nb_events
    }



def recalculer_progression(duree_reelle: int, duree_estimee: int, nb_events: int) -> int:
    score_temps = min((duree_reelle / duree_estimee) * 40, 40) if duree_estimee > 0 else 0
    score_activite = min((nb_events / 5) * 40, 40)
    score_completude = 20 if duree_reelle >= duree_estimee * 0.8 else 0
    progression = min(round(score_temps + score_activite + score_completude), 100)
    if progression == 0 and (duree_reelle > 0 or nb_events > 0):
        progression = 1
    return progression

@app.get("/api/enseignant/dashboard")
def get_enseignant_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé aux enseignants")

    enseignant_id = current_user["user_id"]

    with get_db() as conn:
        cur = conn.cursor()

        # Récupérer les modules de l'enseignant
        cur.execute(
            """SELECT m.id, m.code, m.titre, m.couleur, m.semestre
            FROM modules m
            JOIN enseignant_module em ON m.id = em.module_id
            WHERE em.enseignant_id = %s AND m.actif = TRUE
            ORDER BY m.annee_niveau, m.semestre""",
            (enseignant_id,)
        )
        modules_enseignant = cur.fetchall()

        # Initialiser les totaux
        total_progression = 0
        total_lecons_consultees = 0
        total_etudiants_set = set()
        nb_etudiants_risque = 0
        tous_etudiants_progression = []  # pour le classement

        modules_stats = []

        for module in modules_enseignant:
            module_id = module["id"]

            # Étudiants inscrits à ce module
            cur.execute(
                "SELECT etudiant_id FROM inscriptions WHERE module_id = %s AND annee_acad = '2024-2025'",
                (module_id,)
            )
            etudiants_ids = [row["etudiant_id"] for row in cur.fetchall()]
            nb_etudiants = len(etudiants_ids)
            for eid in etudiants_ids:
                total_etudiants_set.add(eid)

            # Progression moyenne des étudiants dans ce module
            cur.execute(
                """SELECT AVG(pc.progression) as moy
                FROM progression_cours pc
                JOIN cours c ON pc.cours_id = c.id
                WHERE c.module_id = %s AND pc.etudiant_id IN %s""",
                (module_id, tuple(etudiants_ids)) if etudiants_ids else (module_id, tuple([-1]))
            )
            moyenne_progression = cur.fetchone()["moy"] or 0

            # Couverture leçons : pourcentage de cours avec progression > 0
            cur.execute("SELECT COUNT(*) as total FROM cours WHERE module_id = %s AND publie = TRUE", (module_id,))
            total_lecons = cur.fetchone()["total"]
            cur.execute(
                """SELECT COUNT(DISTINCT pc.cours_id)
                FROM progression_cours pc
                JOIN cours c ON pc.cours_id = c.id
                WHERE c.module_id = %s AND pc.etudiant_id IN %s AND pc.progression > 0""",
                (module_id, tuple(etudiants_ids)) if etudiants_ids else (module_id, tuple([-1]))
            )
            lecons_consultees = cur.fetchone()["count"]
            couverture = (lecons_consultees / total_lecons * 100) if total_lecons > 0 else 0

            # Moyenne quiz
            cur.execute(
                """SELECT AVG(tq.note_obtenue) as moy_quiz
                FROM tentatives_quiz tq
                JOIN quiz q ON tq.quiz_id = q.id
                WHERE q.module_id = %s AND tq.etudiant_id IN %s AND tq.soumis = TRUE""",
                (module_id, tuple(etudiants_ids)) if etudiants_ids else (module_id, tuple([-1]))
            )
            moyenne_quiz = cur.fetchone()["moy_quiz"] or 0

            # Étudiants à risque (<30% progression)
            cur.execute(
                """SELECT COUNT(DISTINCT pc.etudiant_id)
                FROM progression_cours pc
                JOIN cours c ON pc.cours_id = c.id
                WHERE c.module_id = %s AND pc.etudiant_id IN %s AND pc.progression < 30""",
                (module_id, tuple(etudiants_ids)) if etudiants_ids else (module_id, tuple([-1]))
            )
            nb_risque = cur.fetchone()["count"]

            modules_stats.append({
                "module_id": module_id,
                "code": module["code"],
                "titre": module["titre"],
                "couleur": module["couleur"],
                "semestre": module["semestre"],
                "progression_moyenne": round(moyenne_progression, 1),
                "couverture_lecons": round(couverture, 1),
                "moyenne_quiz": round(moyenne_quiz, 1),
                "nb_etudiants": nb_etudiants,
                "nb_a_risque": nb_risque
            })

            total_progression += moyenne_progression * nb_etudiants if nb_etudiants > 0 else 0
            total_lecons_consultees += lecons_consultees

        # Progression globale moyenne pondérée
        progression_globale = round(total_progression / len(total_etudiants_set), 1) if total_etudiants_set else 0
        nb_etudiants_suivis = len(total_etudiants_set)

        # Leçons totales consultées
        lecons_consultees_total = total_lecons_consultees

        # Étudiants à risque global (progression < 30% dans au moins un module)
        cur.execute(
            """SELECT COUNT(DISTINCT pc.etudiant_id)
            FROM progression_cours pc
            JOIN cours c ON pc.cours_id = c.id
            JOIN enseignant_module em ON c.module_id = em.module_id
            WHERE em.enseignant_id = %s AND pc.progression < 30""",
            (enseignant_id,)
        )
        nb_etudiants_risque_global = cur.fetchone()["count"]

        # Total tentatives de quiz
        cur.execute(
            """SELECT COUNT(*) as total_tentatives
            FROM tentatives_quiz tq
            JOIN quiz q ON tq.quiz_id = q.id
            JOIN enseignant_module em ON q.module_id = em.module_id
            WHERE em.enseignant_id = %s AND tq.soumis = TRUE""",
            (enseignant_id,)
        )
        total_tentatives = cur.fetchone()["total_tentatives"]

        # Classement des étudiants (top 10)
        cur.execute(
            """SELECT u.nom, u.prenom, AVG(pc.progression) as moy
            FROM progression_cours pc
            JOIN cours c ON pc.cours_id = c.id
            JOIN enseignant_module em ON c.module_id = em.module_id
            JOIN users u ON pc.etudiant_id = u.id
            WHERE em.enseignant_id = %s
            GROUP BY u.id, u.nom, u.prenom
            ORDER BY moy DESC
            LIMIT 10""",
            (enseignant_id,)
        )
        classement = [{"nom": e["nom"], "prenom": e["prenom"], "progression": round(e["moy"], 1)} for e in cur.fetchall()]

    return {
        "progression_globale": progression_globale,
        "nb_etudiants_suivis": nb_etudiants_suivis,
        "lecons_consultees": lecons_consultees_total,
        "nb_etudiants_risque": nb_etudiants_risque_global,
        "total_tentatives": total_tentatives,
        "modules": modules_stats,
        "classement": classement
    }
@app.get("/api/enseignant/modules/stats")
def get_enseignant_modules_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    enseignant_id = current_user["user_id"]

    with get_db() as conn:
        cur = conn.cursor()

        cur.execute(
            """SELECT m.id, m.code, m.titre, m.couleur, m.semestre, m.credits
            FROM modules m
            JOIN enseignant_module em ON m.id = em.module_id
            WHERE em.enseignant_id = %s AND m.actif = TRUE
            ORDER BY m.annee_niveau, m.semestre""",
            (enseignant_id,)
        )
        modules = cur.fetchall()

        result = []
        for module in modules:
            module_id = module["id"]

            # Nombre de cours publiés
            cur.execute("SELECT COUNT(*) as nb FROM cours WHERE module_id = %s AND publie = TRUE", (module_id,))
            nb_cours = cur.fetchone()["nb"]

            # Nombre total de ressources pour ces cours
            cur.execute(
                "SELECT COUNT(*) as nb FROM ressources r JOIN cours c ON r.cours_id = c.id WHERE c.module_id = %s",
                (module_id,)
            )
            nb_ressources = cur.fetchone()["nb"]

            # Nombre d'étudiants inscrits à ce module
            cur.execute(
                "SELECT COUNT(*) as nb FROM inscriptions WHERE module_id = %s AND annee_acad = '2024-2025'",
                (module_id,)
            )
            nb_etudiants = cur.fetchone()["nb"]

            # Progression moyenne des étudiants dans ce module
            cur.execute(
                """SELECT AVG(pc.progression) as moy
                FROM progression_cours pc
                JOIN cours c ON pc.cours_id = c.id
                WHERE c.module_id = %s""",
                (module_id,)
            )
            progression_moyenne = cur.fetchone()["moy"] or 0

            result.append({
                "id": module["id"],
                "code": module["code"],
                "titre": module["titre"],
                "couleur": module["couleur"],
                "semestre": module["semestre"],
                "credits": module["credits"],
                "nbCours": nb_cours,
                "nbRessources": nb_ressources,
                "nbEtudiants": nb_etudiants,
                "progressionMoyenne": round(float(progression_moyenne), 1)
            })

    return result
# ─── RESSOURCES ENSEIGNANT ──────────────────────
@app.get("/api/enseignant/ressources")
def get_enseignant_ressources(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT r.id, r.titre, r.type, r.url, r.taille_mo, r.duree_min,
                      r.cours_id, m.code AS module_code, m.titre AS module_titre,
                      r.created_at
               FROM ressources r
               JOIN cours c ON r.cours_id = c.id
               JOIN modules m ON c.module_id = m.id
               JOIN enseignant_module em ON m.id = em.module_id
               WHERE em.enseignant_id = %s
               ORDER BY r.created_at DESC""",
            (current_user["user_id"],)
        )
        ressources = cur.fetchall()
    return ressources


@app.post("/api/enseignant/ressources")
async def ajouter_ressource_enseignant(
    module_id: int = Form(...),
    titre: str = Form(...),
    type: str = Form(...),
    fichier: UploadFile = File(None),
    url: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    
    with get_db() as conn:
        cur = conn.cursor()
        
        # Vérifier que l'enseignant est bien assigné à ce module
        cur.execute(
            "SELECT 1 FROM enseignant_module WHERE enseignant_id = %s AND module_id = %s",
            (current_user["user_id"], module_id)
        )
        if not cur.fetchone():
            raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à ce module")
        
        # Chercher ou créer un cours "Ressources" pour ce module
        cur.execute(
            "SELECT id FROM cours WHERE module_id = %s AND titre = 'Ressources pédagogiques' LIMIT 1",
            (module_id,)
        )
        cours = cur.fetchone()
        if not cours:
            cur.execute(
                "INSERT INTO cours (module_id, titre, ordre, publie, created_by) VALUES (%s, 'Ressources pédagogiques', 0, TRUE, %s) RETURNING id",
                (module_id, current_user["user_id"])
            )
            cours = cur.fetchone()
        cours_id = cours["id"]
        
        # Gérer l'upload
        final_url = url or ""
        if fichier and fichier.filename:
            ext = os.path.splitext(fichier.filename)[1]
            unique_name = f"{uuid.uuid4()}{ext}"
            file_path = os.path.join(UPLOAD_DIR, unique_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(fichier.file, buffer)
            final_url = f"http://localhost:8000/uploads/{unique_name}"
        
        cur.execute(
            """INSERT INTO ressources (cours_id, titre, type, url, telechargeable, created_by)
               VALUES (%s, %s, %s, %s, TRUE, %s) RETURNING *""",
            (cours_id, titre, type, final_url, current_user["user_id"])
        )
        ressource = cur.fetchone()
        
        # Ajouter des infos module pour la réponse
        cur.execute("SELECT code, titre FROM modules WHERE id = %s", (module_id,))
        module = cur.fetchone()
        ressource["module_code"] = module["code"]
        ressource["module_titre"] = module["titre"]
        
    return ressource
@app.delete("/api/ressources/{ressource_id}")
def delete_ressource(ressource_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    with get_db() as conn:
        cur = conn.cursor()
        # Vérifier que l'enseignant est bien assigné au module de cette ressource
        cur.execute(
            """SELECT r.id
               FROM ressources r
               JOIN cours c ON r.cours_id = c.id
               JOIN enseignant_module em ON c.module_id = em.module_id
               WHERE r.id = %s AND em.enseignant_id = %s""",
            (ressource_id, current_user["user_id"])
        )
        if not cur.fetchone() and current_user["role"] != "admin":
            raise HTTPException(status_code=404, detail="Ressource non trouvée ou non autorisée")

        cur.execute("DELETE FROM ressources WHERE id = %s", (ressource_id,))
    return {"message": "Ressource supprimée avec succès"}


import csv
import io
from fastapi.responses import StreamingResponse

@app.get("/api/enseignant/export/notes")
def export_notes_csv(current_user: dict = Depends(get_current_user), module_id: int = None):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    enseignant_id = current_user["user_id"]

    with get_db() as conn:
        cur = conn.cursor()

        # Récupérer les étudiants et leurs notes
        if module_id:
            cur.execute("SELECT 1 FROM enseignant_module WHERE enseignant_id = %s AND module_id = %s",
                        (enseignant_id, module_id))
            if not cur.fetchone():
                raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à ce module")

            cur.execute(
                """SELECT u.nom, u.prenom, u.email, u.numero_etudiant,
                   COALESCE(AVG(pc.progression), 0) AS progression_moyenne,
                   MAX(tq.note_obtenue) AS meilleure_note,
                   COUNT(tq.id) AS quiz_soumis
                FROM users u
                JOIN inscriptions i ON u.id = i.etudiant_id
                LEFT JOIN progression_cours pc ON u.id = pc.etudiant_id
                LEFT JOIN cours c ON pc.cours_id = c.id AND c.module_id = i.module_id
                LEFT JOIN tentatives_quiz tq ON u.id = tq.etudiant_id
                LEFT JOIN quiz q ON tq.quiz_id = q.id AND q.module_id = i.module_id
                WHERE i.module_id = %s AND u.role = 'etudiant'
                GROUP BY u.id, u.nom, u.prenom, u.email, u.numero_etudiant
                ORDER BY u.nom, u.prenom""",
                (module_id,)
            )
        else:
            cur.execute(
                """SELECT u.nom, u.prenom, u.email, u.numero_etudiant,
                   COALESCE(AVG(pc.progression), 0) AS progression_moyenne,
                   MAX(tq.note_obtenue) AS meilleure_note,
                   COUNT(tq.id) AS quiz_soumis
                FROM users u
                JOIN inscriptions i ON u.id = i.etudiant_id
                JOIN enseignant_module em ON i.module_id = em.module_id
                LEFT JOIN progression_cours pc ON u.id = pc.etudiant_id
                LEFT JOIN cours c ON pc.cours_id = c.id AND c.module_id = i.module_id
                LEFT JOIN tentatives_quiz tq ON u.id = tq.etudiant_id
                LEFT JOIN quiz q ON tq.quiz_id = q.id AND q.module_id = i.module_id
                WHERE em.enseignant_id = %s AND u.role = 'etudiant'
                GROUP BY u.id, u.nom, u.prenom, u.email, u.numero_etudiant
                ORDER BY u.nom, u.prenom""",
                (enseignant_id,)
            )

        rows = cur.fetchall()

    # Créer en mémoire un CSV
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    # En-tête
    writer.writerow(["Nom", "Prénom", "Email", "Numéro étudiant", "Progression moyenne (%)", "Meilleure note", "Quiz soumis"])
    for r in rows:
        writer.writerow([
            r["nom"], r["prenom"], r["email"], r["numero_etudiant"] or "",
            round(float(r["progression_moyenne"]), 1),
            round(float(r["meilleure_note"]), 1) if r["meilleure_note"] else "",
            r["quiz_soumis"]
        ])

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=notes_etudiants.csv"}
    )
    return response

@app.get("/api/enseignant/export/notes-complet")
def export_notes_complet(current_user: dict = Depends(get_current_user), module_id: int = None):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")

    enseignant_id = current_user["user_id"]

    with get_db() as conn:
        cur = conn.cursor()

        # Vérifier l'accès au module si filtré
        if module_id:
            cur.execute("SELECT 1 FROM enseignant_module WHERE enseignant_id = %s AND module_id = %s",
                        (enseignant_id, module_id))
            if not cur.fetchone():
                raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à ce module")

        # 1. Récupérer les étudiants concernés
        if module_id:
            cur.execute(
                """SELECT u.id, u.nom, u.prenom, u.email, u.numero_etudiant
                FROM users u
                JOIN inscriptions i ON u.id = i.etudiant_id
                WHERE i.module_id = %s AND u.role = 'etudiant'
                ORDER BY u.nom, u.prenom""",
                (module_id,)
            )
        else:
            cur.execute(
                """SELECT DISTINCT u.id, u.nom, u.prenom, u.email, u.numero_etudiant
                FROM users u
                JOIN inscriptions i ON u.id = i.etudiant_id
                JOIN enseignant_module em ON i.module_id = em.module_id
                WHERE em.enseignant_id = %s AND u.role = 'etudiant'
                ORDER BY u.nom, u.prenom""",
                (enseignant_id,)
            )
        etudiants = cur.fetchall()

        # 2. Récupérer les modules de l'enseignant (pour les colonnes de progression)
        if module_id:
            cur.execute(
                "SELECT id, code, titre FROM modules WHERE id = %s",
                (module_id,)
            )
        else:
            cur.execute(
                """SELECT m.id, m.code, m.titre
                FROM modules m
                JOIN enseignant_module em ON m.id = em.module_id
                WHERE em.enseignant_id = %s
                ORDER BY m.annee_niveau, m.semestre""",
                (enseignant_id,)
            )
        modules = cur.fetchall()

        # 3. Récupérer les quiz de l'enseignant (pour les colonnes de notes)
        if module_id:
            cur.execute(
                "SELECT id, titre, module_id FROM quiz WHERE module_id = %s ORDER BY id",
                (module_id,)
            )
        else:
            cur.execute(
                """SELECT q.id, q.titre, q.module_id
                FROM quiz q
                JOIN enseignant_module em ON q.module_id = em.module_id
                WHERE em.enseignant_id = %s
                ORDER BY q.module_id, q.id""",
                (enseignant_id,)
            )
        quiz_list = cur.fetchall()

        # 4. Pour chaque étudiant, récupérer la progression par module et les notes par quiz
        resultats = []
        for etu in etudiants:
            ligne = {
                "nom": etu["nom"],
                "prenom": etu["prenom"],
                "email": etu["email"],
                "numero": etu["numero_etudiant"] or "-",
            }

            # Progression par module
            for mod in modules:
                cur.execute(
                    """SELECT COALESCE(AVG(pc.progression), 0) AS moyenne
                    FROM progression_cours pc
                    JOIN cours c ON pc.cours_id = c.id
                    WHERE c.module_id = %s AND pc.etudiant_id = %s""",
                    (mod["id"], etu["id"])
                )
                progression = cur.fetchone()["moyenne"]
                ligne[f"prog_{mod['code']}"] = round(float(progression), 1)

            # Notes par quiz (meilleure tentative)
            for quiz in quiz_list:
                cur.execute(
                    """SELECT MAX(note_obtenue) AS meilleure
                    FROM tentatives_quiz
                    WHERE quiz_id = %s AND etudiant_id = %s AND soumis = TRUE""",
                    (quiz["id"], etu["id"])
                )
                note = cur.fetchone()["meilleure"]
                ligne[f"quiz_{quiz['id']}"] = note if note is not None else "N/A"

            # Progression globale
            cur.execute(
                """SELECT AVG(pc.progression) AS globale
                FROM progression_cours pc
                JOIN cours c ON pc.cours_id = c.id
                JOIN enseignant_module em ON c.module_id = em.module_id
                WHERE em.enseignant_id = %s AND pc.etudiant_id = %s""",
                (enseignant_id, etu["id"])
            )
            globale = cur.fetchone()["globale"]
            ligne["progression_globale"] = round(float(globale), 1) if globale else 0

            # Nombre total de quiz soumis
            cur.execute(
                """SELECT COUNT(*) AS nb
                FROM tentatives_quiz tq
                JOIN quiz q ON tq.quiz_id = q.id
                JOIN enseignant_module em ON q.module_id = em.module_id
                WHERE em.enseignant_id = %s AND tq.etudiant_id = %s AND tq.soumis = TRUE""",
                (enseignant_id, etu["id"])
            )
            ligne["quiz_total"] = cur.fetchone()["nb"]

            resultats.append(ligne)

    # 5. Construire le CSV
    import csv, io
    from fastapi.responses import StreamingResponse

    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')

    # En-tête
    entete = ["Nom", "Prénom", "Email", "Numéro étudiant"]
    for mod in modules:
        entete.append(f"Progression {mod['code']}")
    for quiz in quiz_list:
        entete.append(f"Quiz {quiz['titre'][:30]} (ID {quiz['id']})")
    entete.extend(["Progression globale", "Total quiz soumis"])
    writer.writerow(entete)

    # Données
    for r in resultats:
        row = [r["nom"], r["prenom"], r["email"], r["numero"]]
        for mod in modules:
            row.append(r[f"prog_{mod['code']}"])
        for quiz in quiz_list:
            row.append(r[f"quiz_{quiz['id']}"])
        row.extend([r["progression_globale"], r["quiz_total"]])
        writer.writerow(row)

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=notes_detaillees.csv"}
    )
    return response

@app.get("/api/admin/dashboard")
def get_admin_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")

    with get_db() as conn:
        cur = conn.cursor()

        # Totaux par rôle
        cur.execute("SELECT role, COUNT(*) as nb FROM users GROUP BY role")
        roles = {r["role"]: r["nb"] for r in cur.fetchall()}
        total_etudiants = roles.get("etudiant", 0)
        total_enseignants = roles.get("enseignant", 0)
        total_admins = roles.get("admin", 0)
        total_users = sum(roles.values())

        # Comptes suspendus (actif = FALSE)
        cur.execute("SELECT COUNT(*) as nb FROM users WHERE actif = FALSE")
        comptes_suspendus = cur.fetchone()["nb"]

        # Total modules actifs
        cur.execute("SELECT COUNT(*) as nb FROM modules WHERE actif = TRUE")
        total_modules = cur.fetchone()["nb"]

        # Total ressources
        cur.execute("SELECT COUNT(*) as nb FROM ressources")
        total_ressources = cur.fetchone()["nb"]

        # Total annonces publiées
        cur.execute("SELECT COUNT(*) as nb FROM annonces WHERE publie = TRUE")
        total_annonces = cur.fetchone()["nb"]

        # Quiz et tentatives
        cur.execute("SELECT COUNT(*) as nb FROM quiz")
        total_quiz = cur.fetchone()["nb"]

        cur.execute("SELECT COUNT(*) as nb FROM tentatives_quiz WHERE soumis = TRUE")
        total_tentatives = cur.fetchone()["nb"]

        # Derniers utilisateurs (10)
        cur.execute(
            """SELECT u.id, u.nom, u.prenom, u.email, u.role, u.avatar_url, u.created_at
               FROM users u ORDER BY u.created_at DESC LIMIT 10"""
        )
        derniers_utilisateurs = cur.fetchall()

        # Dernières annonces (5)
        cur.execute(
            """SELECT a.titre, a.type, a.created_at, u.nom as auteur_nom, u.prenom as auteur_prenom
               FROM annonces a
               JOIN users u ON a.auteur_id = u.id
               WHERE a.publie = TRUE
               ORDER BY a.created_at DESC LIMIT 5"""
        )
        dernieres_annonces = cur.fetchall()

    return {
        "total_etudiants": total_etudiants,
        "total_enseignants": total_enseignants,
        "total_admins": total_admins,
        "total_users": total_users,
        "comptes_suspendus": comptes_suspendus,      # <-- AJOUTÉ
        "total_modules": total_modules,
        "total_ressources": total_ressources,
        "total_annonces": total_annonces,
        "total_quiz": total_quiz,
        "total_tentatives": total_tentatives,
        "derniers_utilisateurs": derniers_utilisateurs,
        "dernieres_annonces": dernieres_annonces,
    }

# ============================================================
# ADMIN - GESTION DES UTILISATEURS
# ============================================================

@app.get("/api/admin/users")
def get_admin_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT id, nom, prenom, email, role, actif, avatar_url,
                      numero_etudiant, filiere, annee, created_at
               FROM users
               ORDER BY created_at DESC"""
        )
        users = cur.fetchall()
    return users


@app.put("/api/admin/users/{user_id}/toggle-actif")
def toggle_user_actif(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")

    with get_db() as conn:
        cur = conn.cursor()
        # Ne pas permettre de suspendre le compte admin en cours si c'est le seul ?
        cur.execute("SELECT actif FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        new_status = not user["actif"]
        cur.execute("UPDATE users SET actif = %s WHERE id = %s", (new_status, user_id))
    return {"message": "Statut mis à jour", "actif": new_status}


@app.delete("/api/admin/users/{user_id}")
def delete_admin_user(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")

    # On ne peut pas supprimer son propre compte
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")

    with get_db() as conn:
        cur = conn.cursor()
        # Vérifier que l'utilisateur existe
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        # Supprimer les inscriptions, progressions, tentatives, etc. (pour éviter les violations de FK)
        cur.execute("DELETE FROM inscriptions WHERE etudiant_id = %s", (user_id,))
        cur.execute("DELETE FROM enseignant_module WHERE enseignant_id = %s", (user_id,))
        cur.execute("DELETE FROM progression_cours WHERE etudiant_id = %s", (user_id,))
        cur.execute("DELETE FROM tentatives_quiz WHERE etudiant_id = %s", (user_id,))
        cur.execute("DELETE FROM reponses_etudiant WHERE tentative_id IN (SELECT id FROM tentatives_quiz WHERE etudiant_id = %s)", (user_id,))
        cur.execute("DELETE FROM notifications WHERE user_id = %s", (user_id,))
        cur.execute("DELETE FROM refresh_tokens WHERE user_id = %s", (user_id,))

        # Supprimer l'utilisateur
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))

    return {"message": "Utilisateur supprimé avec succès"}


@app.put("/api/admin/users/{user_id}")
def update_admin_user(user_id: int, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        cur.execute(
            """UPDATE users SET
                nom = %s,
                prenom = %s,
                email = %s,
                role = %s,
                filiere = %s,
                annee = %s,
                numero_etudiant = %s
             WHERE id = %s RETURNING *""",
            (
                data.get("nom"),
                data.get("prenom"),
                data.get("email"),
                data.get("role"),
                data.get("filiere"),
                data.get("annee"),
                data.get("numero_etudiant"),
                user_id
            )
        )
        updated = cur.fetchone()
    return updated
@app.get("/api/admin/users/{user_id}")
def get_admin_user(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@app.post("/api/admin/users", status_code=status.HTTP_201_CREATED)
def admin_create_user(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")

    with get_db() as conn:
        cur = conn.cursor()
        hashed = hash_password(data["mot_de_passe"])
        cur.execute(
            """INSERT INTO users (nom, prenom, email, mot_de_passe, role, filiere, annee, numero_etudiant)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (data["nom"], data["prenom"], data["email"], hashed,
             data.get("role", "etudiant"), data.get("filiere"), data.get("annee"), data.get("numero_etudiant"))
        )
        new_user = cur.fetchone()
    return new_user

@app.get("/api/admin/modules")
def get_admin_modules(current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT m.id, m.code, m.titre, m.description, m.couleur, m.semestre,
                      m.credits, m.actif, m.annee_niveau, m.icone, m.created_at,
                      COALESCE(u.nom || ' ' || u.prenom, 'Non assigné') AS enseignant,
                      COUNT(DISTINCT c.id) AS nb_cours,
                      COUNT(DISTINCT r.id) AS nb_ressources,
                      COUNT(DISTINCT a.id) AS nb_annonces
               FROM modules m
               LEFT JOIN enseignant_module em ON m.id = em.module_id
               LEFT JOIN users u ON em.enseignant_id = u.id
               LEFT JOIN cours c ON m.id = c.module_id AND c.publie = TRUE
               LEFT JOIN ressources r ON c.id = r.cours_id
               LEFT JOIN annonces a ON (a.module_id = m.id AND a.publie = TRUE)
               GROUP BY m.id, m.code, m.titre, m.description, m.couleur, m.semestre,
                        m.credits, m.actif, m.annee_niveau, m.icone, m.created_at,
                        u.nom, u.prenom
               ORDER BY m.annee_niveau, m.semestre, m.code"""
        )
        modules = cur.fetchall()
    return modules

@app.get("/api/admin/enseignants")
def get_admin_enseignants(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, nom, prenom, email FROM users WHERE role = 'enseignant' ORDER BY nom")
        enseignants = cur.fetchall()
    return enseignants

@app.post("/api/admin/modules", status_code=status.HTTP_201_CREATED)
def admin_create_module(data: dict, current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO modules (code, titre, description, annee_niveau, semestre, credits, couleur, actif, icone)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (data["code"], data["titre"], data.get("description", ""),
             data.get("annee_niveau", "1"), data.get("semestre", 1),
             data.get("credits", 6), data.get("couleur", "#8b5cf6"),
             data.get("actif", True), data.get("icone", ""))
        )
        module = cur.fetchone()

        enseignant_id = data.get("enseignant_id")
        if enseignant_id:
            # Vérifier que l'enseignant existe
            cur.execute("SELECT id FROM users WHERE id = %s AND role = 'enseignant'", (enseignant_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=400, detail="Enseignant non valide")
            # Ajouter l'année académique par défaut
            annee_acad = data.get("annee_acad", "2024-2025")
            cur.execute(
                "INSERT INTO enseignant_module (enseignant_id, module_id, annee_acad) VALUES (%s, %s, %s)",
                (enseignant_id, module["id"], annee_acad)
            )
        return module
@app.delete("/api/admin/modules/{module_id}")
def delete_admin_module(module_id: int, current_user: dict = Depends(require_role("admin"))):
    """Supprime un module et toutes ses dépendances"""
    with get_db() as conn:
        cur = conn.cursor()
        
        # Vérifier l'existence du module
        cur.execute("SELECT id FROM modules WHERE id = %s", (module_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Module non trouvé")
        
        # Supprimer les réponses aux tentatives de quiz
        cur.execute("""
            DELETE FROM reponses_etudiant 
            WHERE tentative_id IN (
                SELECT id FROM tentatives_quiz 
                WHERE quiz_id IN (SELECT id FROM quiz WHERE module_id = %s)
            )
        """, (module_id,))
        
        # Supprimer les tentatives de quiz
        cur.execute("DELETE FROM tentatives_quiz WHERE quiz_id IN (SELECT id FROM quiz WHERE module_id = %s)", (module_id,))
        
        # Supprimer les choix de réponses
        cur.execute("""
            DELETE FROM choix_reponses 
            WHERE question_id IN (
                SELECT id FROM questions 
                WHERE quiz_id IN (SELECT id FROM quiz WHERE module_id = %s)
            )
        """, (module_id,))
        
        # Supprimer les questions
        cur.execute("DELETE FROM questions WHERE quiz_id IN (SELECT id FROM quiz WHERE module_id = %s)", (module_id,))
        
        # Supprimer les quiz
        cur.execute("DELETE FROM quiz WHERE module_id = %s", (module_id,))
        
        # Supprimer les ressources des cours
        cur.execute("DELETE FROM ressources WHERE cours_id IN (SELECT id FROM cours WHERE module_id = %s)", (module_id,))
        
        # Supprimer les progressions des cours
        cur.execute("DELETE FROM progression_cours WHERE cours_id IN (SELECT id FROM cours WHERE module_id = %s)", (module_id,))
        
        # Supprimer les cours
        cur.execute("DELETE FROM cours WHERE module_id = %s", (module_id,))
        
        # Supprimer les annonces
        cur.execute("DELETE FROM annonces WHERE module_id = %s", (module_id,))
        
        # Supprimer les réponses du forum
        cur.execute("DELETE FROM forum_reponses WHERE sujet_id IN (SELECT id FROM forum_sujets WHERE module_id = %s)", (module_id,))
        
        # Supprimer les sujets du forum
        cur.execute("DELETE FROM forum_sujets WHERE module_id = %s", (module_id,))
        
        # Supprimer les inscriptions
        cur.execute("DELETE FROM inscriptions WHERE module_id = %s", (module_id,))
        
        # Supprimer la liaison enseignant_module
        cur.execute("DELETE FROM enseignant_module WHERE module_id = %s", (module_id,))
        
        # Enfin, supprimer le module
        cur.execute("DELETE FROM modules WHERE id = %s", (module_id,))
        
    return {"message": "Module supprimé avec succès"}   
@app.get("/api/admin/modules/{module_id}")
def get_admin_module(module_id: int, current_user: dict = Depends(require_role("admin"))):
    """Récupère un module spécifique avec son enseignant assigné"""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM modules WHERE id = %s", (module_id,))
        module = cur.fetchone()
        if not module:
            raise HTTPException(status_code=404, detail="Module non trouvé")
        
        # Récupérer l'enseignant assigné
        cur.execute(
            "SELECT enseignant_id FROM enseignant_module WHERE module_id = %s",
            (module_id,)
        )
        row = cur.fetchone()
        enseignant_id = row["enseignant_id"] if row else None
        
        module["enseignant_id"] = enseignant_id
        return module


@app.put("/api/admin/modules/{module_id}")
def update_admin_module(
    module_id: int,
    data: dict,
    current_user: dict = Depends(require_role("admin"))
):
    """Met à jour un module et son enseignant assigné"""
    with get_db() as conn:
        cur = conn.cursor()
        
        # Vérifier que le module existe
        cur.execute("SELECT id FROM modules WHERE id = %s", (module_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Module non trouvé")
        
        # Mise à jour des champs de la table modules
        allowed_fields = ["code", "titre", "description", "annee_niveau", "semestre", "credits", "couleur", "actif", "icone"]
        updates = []
        values = []
        for field in allowed_fields:
            if field in data:
                updates.append(f"{field} = %s")
                values.append(data[field])
        if updates:
            query = f"UPDATE modules SET {', '.join(updates)} WHERE id = %s RETURNING *"
            values.append(module_id)
            cur.execute(query, values)
            module = cur.fetchone()
        else:
            cur.execute("SELECT * FROM modules WHERE id = %s", (module_id,))
            module = cur.fetchone()
        
        # Gestion de l'enseignant assigné
        enseignant_id = data.get("enseignant_id")
        # Supprimer l'ancienne liaison
        cur.execute("DELETE FROM enseignant_module WHERE module_id = %s", (module_id,))
        if enseignant_id:
            # Vérifier que l'enseignant existe
            cur.execute("SELECT id FROM users WHERE id = %s AND role = 'enseignant'", (enseignant_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=400, detail="Enseignant non valide")
            # Définir l'année académique (par défaut l'année en cours, ex: '2024-2025')
            annee_acad = data.get("annee_acad", "2024-2025")
            cur.execute(
                "INSERT INTO enseignant_module (enseignant_id, module_id, annee_acad) VALUES (%s, %s, %s)",
                (enseignant_id, module_id, annee_acad)
            )
        
        conn.commit()
        
        # Retourner le module mis à jour avec l'enseignant
        module["enseignant_id"] = enseignant_id
        return module
    
@app.get("/api/forum/sujets")
def get_all_sujets(current_user: dict = Depends(get_current_user)):
    """Récupère tous les sujets du forum (pour admin/modération)"""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT s.*, u.nom as auteur_nom, u.prenom as auteur_prenom,
                      m.titre as module_titre, m.code as module_code,
                      (SELECT COUNT(*) FROM forum_reponses WHERE sujet_id = s.id) as reponses_count
               FROM forum_sujets s
               JOIN users u ON s.auteur_id = u.id
               LEFT JOIN modules m ON s.module_id = m.id
               ORDER BY s.created_at DESC"""
        )
        return cur.fetchall()
    
@app.put("/api/annonces/{annonce_id}/toggle")
def toggle_annonce(annonce_id: int, current_user: dict = Depends(require_role("admin"))):
    """Masquer / Publier une annonce (toggle publie) – réservé aux administrateurs"""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT publie FROM annonces WHERE id = %s", (annonce_id,))
        annonce = cur.fetchone()
        if not annonce:
            raise HTTPException(status_code=404, detail="Annonce non trouvée")
        new_status = not annonce["publie"]
        cur.execute("UPDATE annonces SET publie = %s WHERE id = %s", (new_status, annonce_id))
        conn.commit()
    return {"message": "Statut mis à jour", "publie": new_status}

@app.delete("/api/annonces/{annonce_id}")
def delete_annonce(annonce_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["enseignant", "admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé")
    with get_db() as conn:
        cur = conn.cursor()
        if current_user["role"] == "admin":
            cur.execute("DELETE FROM annonces WHERE id = %s", (annonce_id,))
        else:
            cur.execute("DELETE FROM annonces WHERE id = %s AND auteur_id = %s", (annonce_id, current_user["user_id"]))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Annonce non trouvée ou non autorisée")
    return {"message": "Annonce supprimée"}
# DÉMARRAGE
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Bienvenue sur l'API LMS Génie Informatique",
        "version": "2.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)