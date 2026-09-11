import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Scale, Loader2 } from 'lucide-react';

const LaurelBranch = ({ position }: { position: 'top-right' | 'bottom-left' }) => (
  <svg
    className={`absolute w-24 h-24 pointer-events-none ${
      position === 'top-right'
        ? 'top-6 right-6 rotate-90'
        : 'bottom-6 left-6 -rotate-90 scale-x-[-1]'
    }`}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 10 70 Q 25 40 40 20 Q 50 8 60 2" stroke="hsl(85 20% 45% / 0.45)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    <path d="M 20 55 Q 13 50 16 43 Q 21 48 20 55 Z" fill="hsl(85 20% 45% / 0.25)" />
    <path d="M 28 42 Q 21 37 24 30 Q 29 35 28 42 Z" fill="hsl(85 20% 45% / 0.25)" />
    <path d="M 36 30 Q 29 25 32 18 Q 37 23 36 30 Z" fill="hsl(85 20% 45% / 0.25)" />
    <path d="M 44 20 Q 37 15 40 8 Q 45 13 44 20 Z" fill="hsl(85 20% 45% / 0.25)" />
    <path d="M 22 52 Q 29 47 26 40 Q 21 45 22 52 Z" fill="hsl(85 20% 45% / 0.25)" />
    <path d="M 30 40 Q 37 35 34 28 Q 29 33 30 40 Z" fill="hsl(85 20% 45% / 0.25)" />
    <path d="M 38 28 Q 45 23 42 16 Q 37 21 38 28 Z" fill="hsl(85 20% 45% / 0.25)" />
    <path d="M 48 16 Q 55 11 52 4 Q 47 9 48 16 Z" fill="hsl(85 20% 45% / 0.25)" />
  </svg>
);

export default function LoginPage() {
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(documentNumber, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream relative overflow-hidden p-4">
      <LaurelBranch position="top-right" />
      <LaurelBranch position="bottom-left" />

      <div className="w-full max-w-[380px] bg-white rounded-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-10 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full border border-gold flex items-center justify-center mb-4">
            <Scale className="w-6 h-6 text-navy" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-[28px] font-medium text-navy tracking-wide">Legal AI</h1>
          <p className="text-[11px] tracking-[0.2em] uppercase text-gray-400 mt-1.5 font-light">
            Asistente jurídico inteligente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Número de cédula</label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-cream/60 border border-gold/30 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors"
              placeholder="1000000001"
              required
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-cream/60 border border-gold/30 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-navy text-gold rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Iniciar sesión
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-cream-dark" />
          <span className="text-[11px] text-gray-400 font-light">o</span>
          <div className="flex-1 h-px bg-cream-dark" />
        </div>

        <p className="text-center text-[13px] text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-navy font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
