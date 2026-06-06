import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useApiError } from '../../hooks/useApiError';
import { Spinner } from '../../components/Spinner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { error, capture } = useApiError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await authApi.forgotPassword({ email }); setSent(true); }
    catch (err) { capture(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        {sent ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="fas fa-envelope text-3xl text-green-600" /></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Письмо отправлено!</h1>
            <p className="text-gray-600 mb-6">Мы отправили ссылку на восстановление пароля на <strong>{email}</strong>. Проверьте почту.</p>
            <Link to="/login" className="inline-flex items-center text-primary hover:underline font-medium no-underline"><i className="fas fa-arrow-left mr-2" />Вернуться к входу</Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="fas fa-lock text-3xl text-primary" /></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Забыли пароль?</h1>
            <p className="text-gray-600 mb-6">Введите email, и мы отправим ссылку для сброса пароля.</p>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="your@email.com" />
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Отправка...</> : 'Отправить ссылку'}
              </button>
            </form>
            <Link to="/login" className="block mt-4 text-sm text-gray-500 hover:text-primary no-underline"><i className="fas fa-arrow-left mr-1" />Назад к входу</Link>
          </>
        )}
      </div>
    </div>
  );
}
