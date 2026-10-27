import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State { error: Error | null; }

/**
 * Последний рубеж интерфейса: если при отрисовке страницы возникла необработанная ошибка, пользователь видит понятное
 * сообщение и кнопки «Обновить» / «На главную», а не белый экран. Причина пишется в консоль.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui] Необработанная ошибка отрисовки:', error, '\nКомпоненты:', info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl">!</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Что-то пошло не так</h1>
          <p className="text-gray-600 mb-6">Страница не смогла отобразиться. Попробуйте обновить её — если ошибка повторится, сообщите нам, что вы делали перед этим.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition">Обновить</button>
            <a href="/" className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition no-underline">На главную</a>
          </div>
        </div>
      </div>
    );
  }
}
