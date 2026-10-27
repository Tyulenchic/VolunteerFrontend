import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useApiError } from '../../hooks/useApiError';
import { Spinner } from '../../components/Spinner';
import { RegistrationSuccess } from '../../components/RegistrationSuccess';
import { ResendHint } from '../../components/ResendHint';
import { validateNewPassword } from '../../utils/password';

// ─── Auth Modals ─────────────────────────────────────────────────────────────
export function LoginModal({ onClose, onSwitch }: { onClose: () => void; onSwitch: () => void }) {
    const { login } = useAuth(); const { notify } = useNotification(); const navigate = useNavigate();
    const { error, capture } = useApiError();
    const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [loading, setLoading] = useState(false);
    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try { await login({ email: email.trim(), password: pw }); notify('Добро пожаловать! 🎉'); onClose(); navigate('/profile'); }
        catch (err) { capture(err); } finally { setLoading(false); }
    };
    return (
        <form onSubmit={submit} className="space-y-4">
            {error && <div role="alert" className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">{error}</div>}
            {error && <ResendHint email={email} onNavigate={onClose} dark />}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="your@email.com" /></div>
            <div>
                <div className="flex justify-between mb-1"><label className="block text-sm font-medium text-gray-700">Пароль</label><Link to="/forgot-password" onClick={onClose} className="text-sm text-blue-600 hover:underline">Забыли пароль?</Link></div>
                <input type="password" value={pw} onChange={e => setPw(e.target.value)} required autoComplete="current-password" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Вход...</> : 'Войти'}
            </button>
            <p className="text-center text-sm text-gray-600">Нет аккаунта? <button type="button" onClick={onSwitch} className="text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0">Зарегистрироваться</button></p>
        </form>
    );
}

export function RegisterModal({ onClose, onSwitch }: { onClose: () => void; onSwitch: () => void }) {
    const { register } = useAuth();
    const { error, capture } = useApiError();
    const [form, setForm] = useState({ email: '', pw: '', confirm: '', first: '', last: '', consent: false });
    const [fe, setFe] = useState({} as Record<string, string>);
    const [loading, setLoading] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
    const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));
    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.email) e.email = 'Обязательно';
        const weak = validateNewPassword(form.pw);
        if (weak) e.pw = weak;
        if (form.pw !== form.confirm) e.confirm = 'Пароли не совпадают';
        if (!form.consent) e.consent = 'Необходимо согласие';
        setFe(e); return Object.keys(e).length === 0;
    };
    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!validate()) return; setLoading(true);
        try {
            await register({ email: form.email.trim(), password: form.pw, firstName: form.first || undefined, lastName: form.last || undefined, consentGiven: form.consent });
            // 202 Accepted: токенов нет — пользователь не авторизован. Показываем «Проверьте почту», без перехода в профиль.
            setRegisteredEmail(form.email.trim());
        }
        catch (err) { capture(err); } finally { setLoading(false); }
    };
    if (registeredEmail) return <RegistrationSuccess email={registeredEmail} dark />;
    const inp = (err?: string) => `w-full px-4 py-2.5 border ${err ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition`;
    return (
        <form onSubmit={submit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">{error}</div>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Имя</label><input value={form.first} onChange={e => set('first', e.target.value)} className={inp()} placeholder="Иван" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label><input value={form.last} onChange={e => set('last', e.target.value)} className={inp()} placeholder="Иванов" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className={inp(fe.email)} placeholder="your@email.com" />{fe.email && <p className="text-red-500 text-xs mt-1">{fe.email}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Пароль * <span className="text-gray-400 font-normal">(мин. 8)</span></label><input type="password" value={form.pw} onChange={e => set('pw', e.target.value)} required autoComplete="new-password" className={inp(fe.pw)} placeholder="••••••••" />{fe.pw && <p className="text-red-500 text-xs mt-1">{fe.pw}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Повтор пароля *</label><input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required autoComplete="new-password" className={inp(fe.confirm)} placeholder="••••••••" />{fe.confirm && <p className="text-red-500 text-xs mt-1">{fe.confirm}</p>}</div>
            <div>
                <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={form.consent} onChange={e => set('consent', e.target.checked)} className="w-4 h-4 mt-0.5 accent-blue-600" /><span className="text-sm text-gray-600">Согласен(а) с <Link to="/privacy" onClick={onClose} className="text-blue-600 hover:underline">политикой конфиденциальности</Link></span></label>
                {fe.consent && <p className="text-red-500 text-xs mt-1">{fe.consent}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Регистрация...</> : 'Создать аккаунт'}
            </button>
            <p className="text-center text-sm text-gray-600">Уже есть аккаунт? <button type="button" onClick={onSwitch} className="text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0">Войти</button></p>
        </form>
    );
}
