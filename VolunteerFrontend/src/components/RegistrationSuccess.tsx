import { ResendConfirmation } from './ResendConfirmation';

/**
 * Состояние после регистрации (POST /api/auth/register → 202, токенов нет): «Проверьте почту».
 * Общий для страницы регистрации и модального окна на главной. Текст нейтральный: backend отвечает одинаково
 * для нового и уже существующего адреса.
 */
export function RegistrationSuccess({ email, dark = false }: { email: string; dark?: boolean }) {
  const title = dark ? 'text-white' : 'text-gray-900';
  const text = dark ? 'text-gray-300' : 'text-gray-600';
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="fas fa-envelope text-3xl text-green-600" /></div>
      <h2 className={`text-2xl font-bold ${title} mb-2`}>Проверьте почту</h2>
      <p className={`${text} mb-2`}>Если адрес указан верно, на него отправлено письмо с подтверждением.</p>
      <p className={`${text} mb-6`}>Войти можно после подтверждения email.</p>
      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'} mb-3`}>Письмо не пришло? Проверьте «Спам» или отправьте его ещё раз.</p>
      <ResendConfirmation initialEmail={email} dark={dark} />
    </div>
  );
}
