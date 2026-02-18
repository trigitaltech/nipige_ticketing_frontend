import { useEffect } from 'react';
import deleteIcon from '../../assets/icons/delete.png';

const DeleteConfirmModal = ({
  isOpen,
  title = 'Delete Item',
  message,
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Delete',
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[380px] rounded-2xl border border-slate-200 bg-white shadow-2xl p-7 text-center"
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="w-18 h-18 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <img src={deleteIcon} alt="delete" className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            className="px-6 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="px-6 py-2 rounded-lg border-none bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors cursor-pointer"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
