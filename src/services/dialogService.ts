/**
 * Dialog Service for Global Centered Popups
 * Replaces native browser alert/confirm (which display domain headers like "hr-staff-pp1-pro-api.vercel.app says")
 * with custom, centered modal popups displaying "hr staff pp1 says".
 */

export interface DialogOptions {
  id?: string;
  type: 'confirm' | 'alert' | 'danger';
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

type DialogResolver = (value: boolean) => void;

interface ActiveDialog extends DialogOptions {
  resolve: DialogResolver;
}

type DialogListener = (dialog: ActiveDialog | null) => void;

class DialogService {
  private listener: DialogListener | null = null;
  private currentDialog: ActiveDialog | null = null;

  public subscribe(listener: DialogListener): () => void {
    this.listener = listener;
    // Notify current state if any
    if (this.currentDialog) {
      listener(this.currentDialog);
    }
    return () => {
      if (this.listener === listener) {
        this.listener = null;
      }
    };
  }

  public confirm(
    message: string,
    options?: Partial<Omit<DialogOptions, 'message' | 'type'>>
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const dialog: ActiveDialog = {
        type: options?.isDestructive ? 'danger' : 'confirm',
        title: options?.title || 'hr staff pp1 says',
        message,
        confirmText: options?.confirmText || (options?.isDestructive ? 'Hapus' : 'Ya, Lanjutkan'),
        cancelText: options?.cancelText || 'Batal',
        isDestructive: options?.isDestructive ?? false,
        resolve: (val: boolean) => {
          this.currentDialog = null;
          if (this.listener) this.listener(null);
          resolve(val);
        },
      };
      this.currentDialog = dialog;
      if (this.listener) {
        this.listener(dialog);
      }
    });
  }

  public alert(
    message: string,
    options?: { title?: string; buttonText?: string }
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const dialog: ActiveDialog = {
        type: 'alert',
        title: options?.title || 'hr staff pp1 says',
        message,
        confirmText: options?.buttonText || 'OK',
        resolve: () => {
          this.currentDialog = null;
          if (this.listener) this.listener(null);
          resolve();
        },
      };
      this.currentDialog = dialog;
      if (this.listener) {
        this.listener(dialog);
      }
    });
  }
}

export const dialogService = new DialogService();

// Convenient standalone helper functions
export const appConfirm = (
  message: string,
  options?: Partial<Omit<DialogOptions, 'message' | 'type'>>
) => dialogService.confirm(message, options);

export const appAlert = (
  message: string,
  options?: { title?: string; buttonText?: string }
) => dialogService.alert(message, options);

// Polyfill window.alert to automatically route to custom centered modal
if (typeof window !== 'undefined') {
  window.alert = (msg?: any) => {
    dialogService.alert(String(msg ?? ''));
  };
}

