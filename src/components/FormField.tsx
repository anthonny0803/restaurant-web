import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

interface FormFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  type?: string;
  placeholder?: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}

export default function FormField<T extends FieldValues>({
  label,
  name,
  type = "text",
  placeholder,
  register,
  errors,
}: FormFieldProps<T>) {
  const error = errors[name];

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-zinc-400">
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={`rounded-sm border bg-zinc-700 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors duration-200
          focus:ring-1 focus:ring-amber-500
          ${error ? "border-red-500" : "border-zinc-600"}`}
      />
      {error?.message && (
        <p className="text-sm text-red-400">{String(error.message)}</p>
      )}
    </div>
  );
}
