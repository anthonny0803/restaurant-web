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
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={`rounded-md border px-3 py-2 text-sm outline-none transition-colors
          focus:ring-2 focus:ring-indigo-500
          ${error ? "border-red-500" : "border-gray-300"}`}
      />
      {error?.message && (
        <p className="text-sm text-red-600">{String(error.message)}</p>
      )}
    </div>
  );
}
