'use client';

import { useModalStore } from '@/store/modalStore';
import styles from './ModalContainer.module.css';

export function ModalContainer() {
  const { modals, closeModal } = useModalStore();

  return (
    <>
      {modals.map((modal) => (
        <div key={modal.id} className={styles.backdrop}>
          <div className={`${styles.modal} ${styles[`modal-${modal.type}`]}`}>
            {/* Header */}
            <div className={styles.header}>
              <h2 className={styles.title}>{modal.title}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  modal.onCancel?.();
                  closeModal(modal.id);
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              <p>{modal.message}</p>
            </div>

            {/* Footer - Only show if confirmLabel is provided */}
            {modal.confirmLabel && (
              <div className={styles.footer}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => {
                    modal.onCancel?.();
                    closeModal(modal.id);
                  }}
                >
                  {modal.cancelLabel || 'Cancel'}
                </button>
                <button
                  className={styles.buttonPrimary}
                  onClick={async () => {
                    if (modal.onConfirm) {
                      await modal.onConfirm();
                    }
                    closeModal(modal.id);
                }}
              >
                {modal.confirmLabel || 'Confirm'}
              </button>
            </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
