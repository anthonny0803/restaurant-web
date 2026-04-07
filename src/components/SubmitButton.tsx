interface SubmitButtonProps {
  label: string;
  loadingLabel: string;
  isSubmitting: boolean;
}

export default function SubmitButton({
  label,
  loadingLabel,
  isSubmitting,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="rounded-md bg-indigo-600 py-2 text-sm font-medium text-white
        transition-colors hover:bg-indigo-700
        disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSubmitting ? loadingLabel : label}
    </button>
  );
}
