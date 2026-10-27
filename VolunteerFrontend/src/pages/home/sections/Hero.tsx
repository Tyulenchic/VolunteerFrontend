import { VolButton } from '../../../components/afisha/VolButton';
import heroImage from '../../../assets/home/hero.webp';

interface Props {
  isAuthenticated: boolean;
  onRegister: () => void;
}

export function Hero({ isAuthenticated, onRegister }: Props) {
  return (
    <section className="relative">
      <div className="relative z-10 mx-auto grid max-w-[76rem] items-center px-4 sm:px-6 lg:grid-cols-[.92fr_1.4fr] lg:gap-6 lg:pb-24 lg:pt-12">
        <div className="relative z-10 order-2 min-w-0 max-lg:-mt-9 max-lg:mb-14 max-lg:text-center lg:order-1">
          <h1
            className="font-display text-[clamp(1.55rem,6.7vw,2.6rem)] font-extrabold leading-[1.1] tracking-tight text-vol-head sm:text-[clamp(2rem,5.6vw,3rem)] sm:leading-[1.08] lg:text-[clamp(2.2rem,3.4vw,3.2rem)]"
            style={{ textWrap: 'balance' }}
          >
            Присоединяйся к добрым делам <span className="text-vol-accent">в Приднестровье</span>
          </h1>
          <p className="mt-4 max-w-[30rem] text-[13.5px] leading-relaxed text-vol-muted max-lg:mx-auto sm:mt-5 sm:text-[14.5px] lg:mt-6 lg:max-w-[26rem]">
            Находите мероприятия, становитесь волонтёром, помогайте и меняйте мир вокруг себя к лучшему вместе с нами.
          </p>
          <div className="mt-6 grid grid-cols-[1.5fr_1fr] gap-2.5 sm:mt-8 sm:flex sm:justify-center sm:gap-3 lg:mt-9 lg:justify-start">
            <VolButton kind="primary" icon="arrow" to="/events" className="min-w-0 max-sm:px-3">
              <span className="sm:hidden">К мероприятиям</span><span className="max-sm:hidden">Перейти к мероприятиям</span>
            </VolButton>
            {isAuthenticated ? (
              <VolButton kind="outline" to="/profile" className="min-w-0 max-sm:px-3">
                <span className="sm:hidden">Кабинет</span><span className="max-sm:hidden">Личный кабинет</span>
              </VolButton>
            ) : (
              <VolButton kind="outline" onClick={onRegister} aria-haspopup="dialog" className="min-w-0 max-sm:px-3">
                <span className="sm:hidden">Вступить</span><span className="max-sm:hidden">Стать волонтёром</span>
              </VolButton>
            )}
          </div>
        </div>

        <div className="relative order-1 mx-auto w-full max-w-[34rem] max-sm:-mx-4 max-sm:w-[calc(100%+2rem)] max-sm:max-w-none sm:max-w-[42rem] lg:order-2 lg:mx-0 lg:max-w-none lg:justify-self-end lg:-mr-6 xl:-mr-10 xl:w-[calc(100%+2.5rem)]">
          <div className="relative">
            <span className="vol-dots absolute -left-4 bottom-[6%] hidden h-24 w-20 opacity-60 sm:block" aria-hidden="true" />
            <img src={heroImage} alt="Волонтёры сажают дерево" className="block w-full select-none" draggable={false} />
          </div>
        </div>
      </div>
    </section>
  );
}
