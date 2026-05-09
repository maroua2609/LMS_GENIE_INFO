import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input, Button } from '../components/form';
import { Eye, EyeOff } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.email.includes('@')) newErrors.email = 'Email invalide';
    if (formData.mot_de_passe.length < 6)
      newErrors.mot_de_passe = 'Le mot de passe doit contenir au moins 6 caractères';
    if (formData.mot_de_passe !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register(
        formData.nom,
        formData.prenom,
        formData.email,
        formData.mot_de_passe
      );
      navigate('/dashboard');
    } catch (error: any) {
      if (error.response?.data?.detail) {
        setErrors({ submit: error.response.data.detail });
      } else {
        setErrors({ submit: "Erreur lors de l'inscription" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Inscription
        </h1>
        <p className="text-center text-gray-600 mb-8">
          LMS Génie Informatique
        </p>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Prénom"
            name="prenom"
            type="text"
            value={formData.prenom}
            onChange={handleChange}
            error={errors.prenom}
            placeholder="Votre prénom"
            required
          />

          <Input
            label="Nom"
            name="nom"
            type="text"
            value={formData.nom}
            onChange={handleChange}
            error={errors.nom}
            placeholder="Votre nom"
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="votre@email.com"
            required
          />

          {/* Mot de passe avec toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="mot_de_passe"
                value={formData.mot_de_passe}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.mot_de_passe
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.mot_de_passe && (
              <p className="text-red-600 text-sm mt-1">{errors.mot_de_passe}</p>
            )}
          </div>

          <Input
            label="Confirmer le mot de passe"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="••••••••"
            required
          />

          <Button type="submit" fullWidth size="lg" loading={isLoading}>
            S'inscrire
          </Button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          Vous avez déjà un compte ?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;