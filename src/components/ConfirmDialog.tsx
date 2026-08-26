import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, CheckCircle, Info, X } from 'lucide-react';

export type DialogVariant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  hideCancel?: boolean;
}

const variantConfig: Record<DialogVariant, {
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  btnClass: string;
  ringColor: string;
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-900/30 border-red-800/40',
    iconColor: 'text-red-400',
    btnClass: 'bg-red-600 hover:bg-red-500 focus:ring-red-500/40',
    ringColor: 'ring-red-900/50',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-900/30 border-amber-800/40',
    iconColor: 'text-amber-400',
    btnClass: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500/40',
    ringColor: 'ring-amber-900/50',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-green-900/30 border-green-800/40',
    iconColor: 'text-green-400',
    btnClass: 'bg-green-600 hover:bg-green-500 focus:ring-green-500/40',
    ringColor: 'ring-green-900/50',
  },
  info: {
    icon: Info,
    iconBg: 'bg-purple-900/30 border-purple-800/40',
    iconColor: 'text-purple-400',
    btnClass: 'bg-purple-600 hover:bg-purple-500 focus:ring-purple-500/40',
    ringColor: 'ring-purple-900/50',
  },
};

export function ConfirmDialog({
  open,
  title,
  message,
  variant = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  hideCancel = false,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      confirmBtnRef.current?.focus();
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => { 
      document.body.style.overflow = ''; 
      document.body.style.paddingRight = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-gray-900 border border-purple-900/40 rounded-2xl shadow-2xl shadow-purple-900/30 animate-scale-in overflow-hidden">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-gray-600 hover:text-gray-400 transition-colors rounded-lg hover:bg-gray-800/50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={`h-14 w-14 rounded-2xl border ${config.iconBg} flex items-center justify-center mx-auto mb-5`}>
            <Icon className={`h-7 w-7 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-400 text-center leading-relaxed mb-8">
            {message}
          </p>

          {/* Buttons */}
          <div className={`flex gap-3 ${hideCancel ? 'justify-center' : ''}`}>
            {!hideCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-all text-sm border border-gray-700/50 hover:border-gray-600/50"
              >
                {cancelText}
              </button>
            )}
            <button
              ref={confirmBtnRef}
              onClick={onConfirm}
              className={`flex-1 px-5 py-3 text-white font-medium rounded-xl transition-all text-sm focus:outline-none focus:ring-2 ${config.btnClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easy usage
import { useState, useCallback } from 'react';

interface DialogState {
  open: boolean;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmText: string;
  cancelText: string;
  hideCancel: boolean;
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [state, setState] = useState<DialogState>({
    open: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    hideCancel: false,
    onConfirm: () => {},
  });

  const confirm = useCallback((options: {
    title: string;
    message: string;
    variant?: DialogVariant;
    confirmText?: string;
    cancelText?: string;
    hideCancel?: boolean;
    onConfirm: () => void;
  }) => {
    setState({
      open: true,
      title: options.title,
      message: options.message,
      variant: options.variant || 'danger',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      hideCancel: options.hideCancel || false,
      onConfirm: options.onConfirm,
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  const dialogProps = {
    open: state.open,
    title: state.title,
    message: state.message,
    variant: state.variant,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    hideCancel: state.hideCancel,
    onConfirm: () => { state.onConfirm(); close(); },
    onCancel: close,
  };

  return { confirm, dialogProps, ConfirmDialog };
}
