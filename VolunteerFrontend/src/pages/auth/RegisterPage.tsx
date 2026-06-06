import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useApiError } from '../../hooks/useApiError';
import { Spinner } from '../../components/Spinner';

export function RegisterPage() {
  const { register } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { error, capture } = useApiError();
  const [form, setForm] = useState({ email: '', password: '', confirm: '', firstName: '', lastName: '', consent: false });
  const [fieldErr, setFieldErr] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean) => setForm(p => ({...p, [k]: v}));

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.email) e.email = 'Обязательно';
    if (form.password.length < 8) e.password = 'Минимум 8 символов';
    if (form.password !== form.confirm) e.confirm = 'Пароли не совпадают';
    if (!form.consent) e.consent = 'Необходимо согласие';
    setFieldErr(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, firstName: form.firstName || undefined, lastName: form.lastName || undefined, consentGiven: form.consent });
      notify('Регистрация успешна! 🎉');
      navigate('/profile');
    } catch (err) { capture(err); }
    finally { setLoading(false); }
  };

  const inp = (err?: string) => `w-full px-4 py-2.5 border ${err ? 'border-red-400' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <i className="fas fa-user-plus text-3xl text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Регистрация волонтёра</h1>
          <p className="text-gray-600 mt-1">Присоединяйтесь к движению!</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Имя</label><input value={form.firstName} onChange={e => set('firstName', e.target.value)} className={inp()} placeholder="Иван" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label><input value={form.lastName} onChange={e => set('lastName', e.target.value)} className={inp()} placeholder="Иванов" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className={inp(fieldErr.email)} placeholder="your@email.com" />
            {fieldErr.email && <p className="text-red-500 text-xs mt-1">{fieldErr.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль * <span className="text-gray-400 font-normal">(мин. 8 символов)</span></label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required className={inp(fieldErr.password)} placeholder="••••••••" />
            {fieldErr.password && <p className="text-red-500 text-xs mt-1">{fieldErr.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Повтор пароля *</label>
            <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required className={inp(fieldErr.confirm)} placeholder="••••••••" />
            {fieldErr.confirm && <p className="text-red-500 text-xs mt-1">{fieldErr.confirm}</p>}
          </div>
          <div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form.consent} onChange={e => set('consent', e.target.checked)} className="w-4 h-4 mt-0.5 accent-primary" />
              <span className="text-sm text-gray-600">Согласен(а) с <span className="text-primary hover:underline cursor-pointer">политикой конфиденциальности</span></span>
            </label>
            {fieldErr.consent && <p className="text-red-500 text-xs mt-1">{fieldErr.consent}</p>}
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Spinner /> Регистрация...</> : 'Создать аккаунт'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Уже есть аккаунт? <Link to="/login" className="text-primary font-semibold hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  );
}
