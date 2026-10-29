import { SideArt } from '../../components/afisha/SideArt';
import { Link, useLocation } from 'react-router-dom';
import { ResendConfirmation } from '../../components/ResendConfirmation';

/** Маршрут #/resend-confirmation. Email может прийти из формы входа через router state (не из URL). */
export function ResendConfirmationPage() {
  const state = useLocation().state as { email?: unknown } | null;
  const initialEmail = typeof state?.email === 'string' ? state.email : '';

  return (
    <div className="vol-page relative overflow-x-clip min-h-dvh flex items-center justify-center p-4">
      <SideArt />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="fas fa-envelope text-3xl text-primary" /></div>
        <h1 className="vol-compact mb-2">Письмо подтверждения</h1>
        <p className="text-gray-600 mb-6">Укажите адрес, и мы отправим ссылку для подтверждения email ещё раз.</p>
        <ResendConfirmation initialEmail={initialEmail} />
        <Link to="/login" className="block mt-6 text-sm text-gray-500 hover:text-primary no-underline"><i className="fas fa-arrow-left mr-1" />К входу</Link>
      </div>
    </div>
  );
}
