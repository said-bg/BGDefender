import { useModalStore, type ModalType } from '@/store/modalStore';

type ConfirmWithModalOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  type?: ModalType;
  confirmVariant?: 'primary' | 'danger';
};

export function confirmWithModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  type = 'confirm',
  confirmVariant = 'primary',
}: ConfirmWithModalOptions): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (process.env.NODE_ENV === 'test' && typeof window.confirm === 'function') {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise((resolve) => {
    let settled = false;

    const settle = (result: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(result);
    };

    useModalStore.getState().showModal({
      type,
      title,
      message,
      confirmLabel,
      cancelLabel,
      confirmVariant,
      onConfirm: () => settle(true),
      onCancel: () => settle(false),
    });
  });
}
