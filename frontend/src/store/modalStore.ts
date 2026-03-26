import { create } from 'zustand';

export type ModalType = 'error' | 'success' | 'warning' | 'confirm';

export interface Modal {
  id: string;
  type: ModalType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ModalStore {
  modals: Modal[];
  showModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAll: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  modals: [],
  
  showModal: (modal: Omit<Modal, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newModal: Modal = {
      ...modal,
      id,
    };
    set((state) => ({
      modals: [...state.modals, newModal],
    }));
    return id;
  },

  closeModal: (id: string) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    }));
  },

  closeAll: () => {
    set({ modals: [] });
  },
}));
