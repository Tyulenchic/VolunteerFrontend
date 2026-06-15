import { createContext, useContext, useState } from 'react';
import { useNotification } from './NotificationContext';

interface FeedbackContextValue {
    openFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue>({ openFeedback: () => {} });

export function useFeedback() {
    return useContext(FeedbackContext);
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const subjectLabel: Record<string, string> = {
            question: 'Вопрос',
            suggestion: 'Предложение',
            problem: 'Проблема',
            cooperation: 'Сотрудничество',
        };

        const fullMessage = form.subject
            ? `[${subjectLabel[form.subject] ?? form.subject}] ${form.message}`
            : form.message;

        try {
            const res = await fetch('https://volunteerapi-0x7y.onrender.com/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: form.name, email: form.email, message: fullMessage }),
            });

            if (res.status === 429) {
                notify('Слишком много запросов. Попробуйте позже.');
                return;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                notify(err?.detail ?? 'Ошибка при отправке. Попробуйте ещё раз.');
                return;
            }

            notify('Сообщение отправлено! 📬');
            onClose();
        } catch {
            notify('Нет соединения. Проверьте интернет и попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Написать нам</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times" />
                    </button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                            <input
                                required
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                placeholder="Ваше имя"
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                required
                                type="email"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Тема</label>
                        <select
                            value={form.subject}
                            onChange={e => set('subject', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm bg-white"
                        >
                            <option value="">Выберите тему...</option>
                            <option value="question">Вопрос</option>
                            <option value="suggestion">Предложение</option>
                            <option value="problem">Проблема</option>
                            <option value="cooperation">Сотрудничество</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Сообщение</label>
                        <textarea
                            required
                            rows={4}
                            value={form.message}
                            onChange={e => set('message', e.target.value)}
                            placeholder="Опишите ваш вопрос или предложение..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition text-sm"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition text-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            {loading ? <><i className="fas fa-spinner fa-spin" />Отправка...</> : <><i className="fas fa-paper-plane" />Отправить</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <FeedbackContext.Provider value={{ openFeedback: () => setOpen(true) }}>
            {children}
            {open && <FeedbackModal onClose={() => setOpen(false)} />}
        </FeedbackContext.Provider>
    );
}