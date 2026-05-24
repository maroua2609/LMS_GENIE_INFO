import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EtudiantDashboard from './pages/etudiant/Dashboard';
import EtudiantModules from './pages/etudiant/Modules';
import EtudiantModuleDetail from './pages/etudiant/ModuleDetail';
import EtudiantCoursDetail from './pages/etudiant/CoursDetail';
import EtudiantQuiz from './pages/etudiant/Quiz';
import EtudiantProgression from './pages/etudiant/Progression';
import EnseignantDashboard from './pages/enseignant/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import AdminUsers from './pages/admin/Users';
import AdminModules from './pages/admin/Modules';   // correct

import EnseignantMesCours from './pages/enseignant/MesCours';
import EnseignantCreateCours from './pages/enseignant/CreateCours';
import EnseignantCreateQuiz from './pages/enseignant/CreateQuiz';
import EnseignantNotes from './pages/enseignant/Notes';
import EnseignantModuleDetail from './pages/enseignant/ModuleDetail';
import Annonces from './pages/Annonces';
import Forum from './pages/Forum';
import EnseignantModules from './pages/enseignant/EnseignantModules';
import EnseignantRessources from './pages/enseignant/Ressources';
import EnseignantAnnonces from './pages/enseignant/Annonces';
import EnseignantForum from './pages/enseignant/Forum';
import EnseignantQuizDetail from './pages/enseignant/QuizDetail';
import EnseignantQuizEdit from './pages/enseignant/QuizEdit';
import EnseignantEditCours from './pages/enseignant/EditCours';
import AdminUserEdit from './pages/admin/UserEdit';
import AdminUserCreate from './pages/admin/UserCreate';
// Dans la section enseignant protégée :
import ModuleCreate from './pages/admin/ModuleCreate';
import ModuleEdit from './pages/admin/ModuleEdit';
import AdminModeration from './pages/admin/Moderation';
import AdminAnnonceCreate from './pages/admin/AnnonceCreate';
import EtudiantForum from './pages/etudiant/EtudiantForum';
import ResetPassword from './pages/auth/ResetPassword';
// ...
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Étudiant */}
        <Route element={<ProtectedRoute />}>
          <Route path="/etudiant/dashboard" element={<EtudiantDashboard />} />
          <Route path="/etudiant/modules" element={<EtudiantModules />} />
          <Route path="/etudiant/modules/:id" element={<EtudiantModuleDetail />} />
          <Route path="/etudiant/cours/:id" element={<EtudiantCoursDetail />} />
          <Route path="/etudiant/quiz/:id" element={<EtudiantQuiz />} />
          <Route path="/etudiant/progression" element={<EtudiantProgression />} />
          <Route path="/etudiant/forum" element={<EtudiantForum />} />
          <Route path="/forum/:moduleId?" element={<EtudiantForum />} />
        </Route>

        {/* Enseignant */}
        <Route element={<ProtectedRoute requiredRole="enseignant" />}>
  <Route path="/enseignant/dashboard" element={<EnseignantDashboard />} />
  <Route path="/enseignant/modules" element={<EnseignantModules />} />           {/* liste des modules */}
  <Route path="/enseignant/modules/:id" element={<EnseignantModuleDetail />} />   {/* détail d’un module */}
  <Route path="/enseignant/cours" element={<EnseignantMesCours />} />
  <Route path="/enseignant/cours/create" element={<EnseignantCreateCours />} />
  <Route path="/enseignant/quiz/create" element={<EnseignantCreateQuiz />} />
  <Route path="/enseignant/notes" element={<EnseignantNotes />} />
  <Route path="/enseignant/ressources" element={<EnseignantRessources />} />
  <Route path="/enseignant/annonces" element={<EnseignantAnnonces />} />
  <Route path="/enseignant/forum" element={<EnseignantForum />} />
  <Route path="/enseignant/quiz/:id" element={<EnseignantQuizDetail />} />
  <Route path="/enseignant/quiz/:id/edit" element={<EnseignantQuizEdit />} />
  <Route path="/enseignant/cours/:id/edit" element={<EnseignantEditCours />} />
</Route>

        {/* Admin */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/modules" element={<AdminModules />} />
          
          <Route path="/admin/users/:id/edit" element={<AdminUserEdit />} />
          <Route path="/admin/users/create" element={<AdminUserCreate />} />
        </Route>

        {/* Communauté (accessible à tous les rôles avec ProtectedRoute) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/annonces" element={<Annonces />} />
          <Route path="/forum/:moduleId" element={<Forum />} />
        </Route>

        {/* Redirections */}
        <Route path="/dashboard" element={<Navigate to="/etudiant/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/admin/modules/create" element={<ModuleCreate />} />
        <Route path="/admin/modules/edit/:id" element={<ModuleEdit />} />
        <Route path="/admin/moderation" element={<AdminModeration />} />
        <Route path="/admin/annonces/create" element={<AdminAnnonceCreate />} />
      </Routes>
    </Router>
  );
};

export default App;