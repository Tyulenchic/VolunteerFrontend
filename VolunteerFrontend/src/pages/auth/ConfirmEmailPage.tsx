import { SideArt } from '../../components/afisha/SideArt';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { mapApiError, classifyApiError } from '../../utils/apiError';
import { Spinner } from '../../components/Spinner';
import { ResendConfirmation } from '../../components/ResendConfirmation';

/** Пауза перед повтором после 429. */
const RATE_LIMIT_COOLDOWN_SECONDS = 30;

// invalid — сервер отверг токен (400: недействителен / истёк / уже использован);
// temporary — токен НЕ признан недействительным: сеть, таймаут, 429, 5xx — можно повторить.
type Status = 'idle' | 'loading' | 'success' | 'invalid' | 'temporary';

/**
 * Маршрут HashRouter: #/confirm-email?token=...
 * Токен НЕ отправляется автоматически при открытии страницы: почтовые сканеры/предпросмотр ссылок могут
 * выполнять JS, и тогда одноразовый токен был бы израсходован до пользователя. POST — только по кнопке.
 * Токен живёт только в hash-URL и в этом компоненте; в storage не попадает и пользователю не показывается.
 */
export function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token')?.trim() ?? '';
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const confirm = async () => {
    if (status === 'loading' || cooldown > 0) return;
    setStatus('loading');
    try {
      await authApi.confirmEmail(token);
      setStatus('success');
      // Использованный токен убираем из адреса и истории: кнопка «Назад» не вернёт на #/confirm-email?token=…
      navigate('/confirm-email', { replace: true });
    } catch (err) {
      const kind = classifyApiError(err);
      setMessage(mapApiError(err));
      if (kind === 'rate_limited') setCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
      setStatus(kind === 'invalid' || kind === 'other' ? 'invalid' : 'temporary');
    }
  };

  const icon = (cls: string, bg: string) => (
    <div className={`w-16 h-16 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}><i className={`${cls} text-3xl`} /></div>
  );

  let body;
  if (status === 'success') {
    body = (
      <>
        {icon('fas fa-check text-green-600', 'bg-green-100')}
        <h1 className="vol-compact mb-2">Email подтверждён!</h1>
        <p className="text-gray-600 mb-6">Теперь вы можете войти в аккаунт.</p>
        <Link to="/login" className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition no-underline">Войти</Link>
      </>
    );
  } else if (!token) {
    body = (
      <>
        {icon('fas fa-link-slash text-red-600', 'bg-red-100')}
        <h1 className="vol-compact mb-2">Ссылка недействительна</h1>
        <p className="text-gray-600 mb-6">В ссылке нет токена подтверждения. Откройте ссылку из письма целиком или запросите новое письмо.</p>
        <ResendConfirmation />
      </>
    );
  } else if (status === 'invalid') {
    body = (
      <>
        {icon('fas fa-exclamation-triangle text-red-600', 'bg-red-100')}
        <h1 className="vol-compact mb-2">Ссылка недействительна или устарела</h1>
        <p className="text-gray-600 mb-6">{message} Запросите новое письмо.</p>
        <ResendConfirmation />
      </>
    );
  } else {
    const temporary = status === 'temporary';
    body = (
      <>
        {icon(temporary ? 'fas fa-wifi text-amber-600' : 'fas fa-envelope-circle-check text-primary', temporary ? 'bg-amber-100' : 'bg-primary/10')}
        <h1 className="vol-compact mb-2">Подтверждение email</h1>
        {temporary
          ? <p role="alert" className="mb-6 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm">{message} Ссылка не потеряна — её можно использовать повторно.</p>
          : <p className="text-gray-600 mb-6">Нажмите кнопку, чтобы подтвердить адрес электронной почты.</p>}
        <button onClick={confirm} disabled={status === 'loading' || cooldown > 0}
          className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2">
          {status === 'loading' ? <><Spinner /> Подтверждение...</>
            : cooldown > 0 ? `Повторить (через ${cooldown} с)`
            : temporary ? 'Повторить' : 'Подтвердить email'}
        </button>
      </>
    );
  }

  return (
    <div className="vol-page relative overflow-x-clip min-h-dvh flex items-center justify-center p-4">
      <SideArt />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        {body}
        <Link to="/login" className="block text-center mt-6 text-sm text-gray-500 hover:text-primary no-underline"><i className="fas fa-arrow-left mr-1" />К входу</Link>
      </div>
    </div>
  );
}
