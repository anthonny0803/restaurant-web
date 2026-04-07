import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiValidationError } from "./api";

export function handleApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Path<T>[],
): void {
  if (!(error instanceof ApiValidationError)) {
    const message =
      error instanceof Error ? error.message : "Ocurrio un error inesperado";
    setError("root" as Path<T>, { type: "server", message });
    return;
  }

  const unmappedMessages: string[] = [];

  for (const [field, messages] of Object.entries(error.errors)) {
    if (fields.includes(field as Path<T>)) {
      setError(field as Path<T>, { type: "server", message: messages[0] });
    } else {
      unmappedMessages.push(messages[0]);
    }
  }

  if (unmappedMessages.length > 0) {
    setError("root" as Path<T>, {
      type: "server",
      message: unmappedMessages.join(". "),
    });
  }
}
