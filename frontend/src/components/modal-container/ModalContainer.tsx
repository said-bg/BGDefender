'use client';

import Image from 'next/image';
import { useModalStore } from '@/store/modalStore';
import styles from './ModalContainer.module.css';

const MODAL_BADGES: Record<string, string> = {
  error: 'Attention',
  success: 'Success',
  warning: 'Warning',
  confirm: 'Confirm',
};

export function ModalContainer() {
  const { modals, closeModal } = useModalStore();

  return (
    <>
      {modals.map((modal) => (
        <div key={modal.id} className={styles.backdrop}>
          <div className={`${styles.modal} ${styles[`modal-${modal.type}`]}`}>
            <div className={styles.header}>
              <div className={styles.identity}>
                {modal.branded ? (
                  <div className={styles.logoWrap}>
                    <Image
                      alt="BG Defender"
                      className={styles.logo}
                      height={44}
                      src="/assets/images/bgdefender.jpeg"
                      width={44}
                    />
                  </div>
                ) : null}
                <div className={styles.headingBlock}>
                  {modal.branded ? (
                    <span className={styles.badge}>
                      {MODAL_BADGES[modal.type] ?? MODAL_BADGES.confirm}
                    </span>
                  ) : null}
                  <h2 className={styles.title}>{modal.title}</h2>
                </div>
              </div>
              <button
                aria-label="Close dialog"
                className={styles.closeBtn}
                onClick={() => {
                  modal.onCancel?.();
                  closeModal(modal.id);
                }}
                type="button"
              >
                ×
              </button>
            </div>

            <div className={styles.content}>
              <p>{modal.message}</p>
            </div>

            {modal.confirmLabel && (
              <div className={styles.footer}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => {
                    modal.onCancel?.();
                    closeModal(modal.id);
                  }}
                  type="button"
                >
                  {modal.cancelLabel || 'Cancel'}
                </button>
                <button
                  className={
                    modal.confirmVariant === 'danger'
                      ? styles.buttonDanger
                      : styles.buttonPrimary
                  }
                  onClick={async () => {
                    if (modal.onConfirm) {
                      await modal.onConfirm();
                    }
                    closeModal(modal.id);
                  }}
                  type="button"
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
