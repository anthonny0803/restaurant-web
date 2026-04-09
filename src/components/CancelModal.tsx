import { useEffect } from "react";

interface CancelModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CancelModal({
  isOpen,
  isSubmitting,
  onConfirm,
  onClose,
}: CancelModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => { if (!isSubmitting) onClose(); }}
    >
      <div
        className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          Cancelar reservacion
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Esta accion no se puede deshacer. Dependiendo de la politica de
          cancelacion, podrias recibir un reembolso total o parcial.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Cancelando..." : "Cancelar reservacion"}
          </button>
        </div>
      </div>
    </div>
  );
}
