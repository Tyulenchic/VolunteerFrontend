import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useApiError } from '../../hooks/useApiError';
import { Spinner } from '../../components/Spinner';

export function LoginPage() {
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { error, capture } = useApiError();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      notify('Добро пожаловать! 🎉');
      navigate('/profile');
    } catch (err) { capture(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <i className="fas fa-hand-holding-heart text-3xl text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Вход в систему</h1>
          <p className="text-gray-600 mt-1">Добро пожаловать обратно!</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="your@email.com" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Пароль</label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Забыли пароль?</Link>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Spinner /> Вход...</> : 'Войти'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Нет аккаунта? <Link to="/register" className="text-primary font-semibold hover:underline">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
