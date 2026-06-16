import React from 'react';
import { X, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 ">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200/70 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 rounded-lg text-red-500">
              <Trash2 size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Record</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            {itemName && (
              <span className="font-semibold text-slate-900">"{itemName}"</span>
            )}?
          </p>
          <p className="text-xs text-slate-400 mt-1">This action cannot be undone.</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition shadow-md shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;