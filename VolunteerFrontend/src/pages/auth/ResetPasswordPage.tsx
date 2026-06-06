import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useApiError } from '../../hooks/useApiError';
import { useNotification } from '../../context/NotificationContext';
import { Spinner } from '../../components/Spinner';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { error, capture } = useApiError();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [validErr, setValidErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setValidErr('Минимум 8 символов'); return; }
    if (password !== confirm) { setValidErr('Пароли не совпадают'); return; }
    setValidErr(''); setLoading(true);
    try {
      const token = params.get('token') ?? '';
      await authApi.resetPassword({ token, newPassword: password });
      notify('Пароль изменён! Войдите в систему.'); navigate('/login');
    } catch (err) { capture(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="fas fa-key text-3xl text-primary" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Новый пароль</h1>
        </div>
        {(error || validErr) && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{error || validErr}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Минимум 8 символов" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Повторите пароль</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="••••••••" /></div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Spinner /> Сохранение...</> : 'Установить пароль'}
          </button>
        </form>
        <Link to="/login" className="block text-center mt-4 text-sm text-gray-500 hover:text-primary no-underline"><i className="fas fa-arrow-left mr-1" />Назад к входу</Link>
      </div>
    </div>
  );
}
