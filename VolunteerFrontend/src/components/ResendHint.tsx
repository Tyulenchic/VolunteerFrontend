import { Link } from 'react-router-dom';

/**
 * Нейтральная подсказка под ошибкой входа. Backend намеренно не различает «неверный пароль», «email не
 * подтверждён» и «аккаунта нет», поэтому подсказка показывается при ЛЮБОЙ ошибке входа и ничего не утверждает.
 * Email передаётся через router state (не в URL), запрос не выполняется автоматически.
 */
export function ResendHint({ email, onNavigate, dark = false }: { email: string; onNavigate?: () => void; dark?: boolean }) {
  return (
    <p className={`text-sm mb-4 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
      Не пришло письмо подтверждения?{' '}
      <Link to="/resend-confirmation" state={{ email: email.trim() }} onClick={onNavigate}
        className={`${dark ? 'text-blue-400' : 'text-primary'} font-semibold hover:underline`}>Отправить ещё раз</Link>
    </p>
  );
}
