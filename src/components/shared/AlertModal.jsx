import { useEffect } from 'react';

const typeStyles = {
  success: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    title: 'Success',
  },
  error: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    button: 'bg-red-600 hover:bg-red-700',
    title: 'Something went wrong',
  },
  info: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
    title: 'Notice',
  },
};

const AlertIcon = ({ type }) => {
  if (type === 'success') {
    return (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }

  if (type === 'error') {
    return (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    );
  }

  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
};

const AlertModal = ({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  onConfirm,
  onClose,
}) => {
  const style = typeStyles[type] || typeStyles.info;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
      return;
    }
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[10050] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-6"
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className={`w-18 h-18 rounded-full flex items-center justify-center mx-auto ${style.iconBg} ${style.iconColor}`}>
          <AlertIcon type={type} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900 text-center">{title || style.title}</h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed text-center">{message}</p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleConfirm}
            className={`min-w-[108px] px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer ${style.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
