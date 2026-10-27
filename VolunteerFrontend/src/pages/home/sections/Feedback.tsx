import { useFeedback } from '../../../context/FeedbackContext';
import { VolButton } from '../../../components/afisha/VolButton';
import { VolIcon } from '../../../components/afisha/VolIcon';

/** Feedback band. The form itself is the shared FeedbackModal (sends to /api/feedback). */
export function Feedback() {
  const { openFeedback } = useFeedback();
  return (
    <section className="relative z-10 mx-auto max-w-[76rem] px-4 pb-32 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-8 rounded-2xl border border-vol-line bg-vol-surface p-8 text-center shadow-[0_12px_32px_rgba(15,27,51,.06)] sm:p-12 md:flex-row md:text-left">
        <div className="flex min-w-0 flex-col items-center gap-5 md:flex-row md:items-start">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-vol-accent-soft text-vol-accent"><VolIcon n="mail" size={22} /></span>
          <div className="min-w-0">
            <h2 className="vol-h2">Обратная связь</h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-vol-muted">Есть вопросы или предложения? Мы всегда рады ответить.</p>
          </div>
        </div>
        <VolButton kind="primary" iconLeft="send" onClick={openFeedback} aria-haspopup="dialog" className="max-sm:w-full">Написать нам</VolButton>
      </div>
    </section>
  );
}
