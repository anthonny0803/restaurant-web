import { useToast } from "../context/ToastContext";

const TYPE_STYLES = {
  success: "bg-emerald-900 text-emerald-50",
  error: "bg-red-900 text-red-50",
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-sm px-5 py-3 text-sm shadow-lg animate-slide-in-right ${TYPE_STYLES[toast.type]}`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="cursor-pointer opacity-60 transition-opacity duration-200 hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
