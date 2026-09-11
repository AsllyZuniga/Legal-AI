import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('Acceso denegado a Google Drive');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('Codigo de autorizacion no recibido');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    api.post('/integrations/google/callback', { code })
      .then(() => {
        setStatus('success');
        setMessage('Google Drive conectado exitosamente');
        setTimeout(() => navigate('/'), 2000);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Error al conectar con Google Drive');
        setTimeout(() => navigate('/'), 3000);
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg">Conectando con Google Drive...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <p className="text-lg text-green-600">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-red-500" />
            <p className="text-lg text-red-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
