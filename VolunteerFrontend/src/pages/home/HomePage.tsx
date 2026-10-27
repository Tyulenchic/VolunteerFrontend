import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { LoginModal, RegisterModal } from './AuthModals';
import { Hero } from './sections/Hero';
import { News } from './sections/News';
import { Gallery } from './sections/Gallery';
import { Steps } from './sections/Steps';
import { Features } from './sections/Features';
import { Community } from './sections/Community';
import { Feedback } from './sections/Feedback';

type ModalT = 'login' | 'register' | null;

/** Home page. The shell (header, footer, tab bar, backdrop) is AfishaLayout; sections are in ./sections. */
export function HomePage() {
  const { user } = useAuth();
  const [modal, setModal] = useState<ModalT>(null);
  const close = () => setModal(null);
  const register = () => setModal('register');
  const isAuthenticated = !!user;

  return (
    <>
      <Hero isAuthenticated={isAuthenticated} onRegister={register} />
      <News />
      <Gallery />
      <Steps isAuthenticated={isAuthenticated} onRegister={register} />
      <Features />
      <Community isAuthenticated={isAuthenticated} onRegister={register} />
      <Feedback />

      <Modal isOpen={modal === 'login'} onClose={close} title="Вход в систему">
        <LoginModal onClose={close} onSwitch={register} />
      </Modal>
      <Modal isOpen={modal === 'register'} onClose={close} title="Регистрация волонтёра">
        <RegisterModal onClose={close} onSwitch={() => setModal('login')} />
      </Modal>
    </>
  );
}
