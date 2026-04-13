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
      className="rounded-sm bg-amber-500 py-2.5 text-sm font-medium tracking-wide text-zinc-900
        transition-colors duration-200 hover:bg-amber-600
        disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSubmitting ? loadingLabel : label}
    </button>
  );
}
