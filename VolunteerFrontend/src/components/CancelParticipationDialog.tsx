import { useEffect, useState } from 'react';
import { Modal } from './Modal';

interface Props {
  isOpen: boolean;
  eventTitle: string;
  /** Принятая заявка: в тексте предупреждаем, что место освободится. Для заявки на рассмотрении — «отзыв заявки». */
  approved: boolean;
  busy?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const MAX = 500;

/** Отказ от участия. Причина не обязательна: она «для хорошего тона» и видна организаторам и администраторам. */
export function CancelParticipationDialog({ isOpen, eventTitle, approved, busy = false, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (isOpen) setReason(''); }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={approved ? 'Отказаться от участия' : 'Отозвать заявку'}>
      <p className="mb-3 text-sm text-gray-700">
        {approved
          ? <>Вы собираетесь отказаться от участия в «<strong>{eventTitle}</strong>». Место освободится для других волонтёров.</>
          : <>Заявка на «<strong>{eventTitle}</strong>» будет отозвана.</>}
      </p>
      <label className="block text-sm font-medium text-gray-700">
        Причина <span className="font-normal text-gray-400">(необязательно)</span>
        <textarea value={reason} onChange={e => setReason(e.target.value.slice(0, MAX))} rows={3}
          placeholder="Например: изменились планы. Организатор увидит ваше сообщение."
          className="mt-1 w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      </label>
      <p className="mt-1 text-right text-xs text-gray-400">{reason.length}/{MAX}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">Не отказываться</button>
        <button type="button" onClick={() => onConfirm(reason.trim())} disabled={busy}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
          {busy ? 'Отправка…' : approved ? 'Отказаться' : 'Отозвать'}
        </button>
      </div>
    </Modal>
  );
}
