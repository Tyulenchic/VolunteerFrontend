import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useApiError } from '../../hooks/useApiError';
import { useNotification } from '../../context/NotificationContext';
import { Spinner } from '../../components/Spinner';
import { classifyApiError } from '../../utils/apiError';
import { validateNewPassword } from '../../utils/password';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { error, capture } = useApiError();
  const [tokenRejected, setTokenRejected] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [validErr, setValidErr] = useState('');
  const token = params.get('token')?.trim() ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const weak = validateNewPassword(password);
    if (weak) { setValidErr(weak); return; }
    if (password !== confirm) { setValidErr('Пароли не совпадают'); return; }
    setValidErr(''); setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      // authApi.resetPassword уже очистил локальную сессию (сервер отозвал refresh-токены).
      // replace: использованный токен не остаётся в истории браузера.
      notify('Пароль изменён! Войдите в систему.'); navigate('/login', { replace: true });
    } catch (err) { capture(err); setTokenRejected(classifyApiError(err) === 'invalid'); }
    finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="fas fa-link-slash text-3xl text-red-600" /></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ссылка недействительна</h1>
          <p className="text-gray-600 mb-6">В ссылке нет токена сброса пароля. Откройте ссылку из письма целиком или запросите новую.</p>
          <Link to="/forgot-password" className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition no-underline">Запросить новую ссылку</Link>
          <Link to="/login" className="block mt-4 text-sm text-gray-500 hover:text-primary no-underline"><i className="fas fa-arrow-left mr-1" />Назад к входу</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="fas fa-key text-3xl text-primary" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Новый пароль</h1>
        </div>
        {(error || validErr) && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
          {error || validErr}
          {tokenRejected && !validErr && <> <Link to="/forgot-password" className="font-semibold underline">Запросить новую ссылку</Link></>}
        </div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Минимум 8 символов" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Повторите пароль</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password"
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
