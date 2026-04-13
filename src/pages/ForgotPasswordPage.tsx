import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import AuthFormWrapper from "../components/AuthFormWrapper";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { handleApiError } from "../lib/form-errors";
import * as authService from "../services/auth.service";

interface ForgotPasswordForm {
  email: string;
}

const FIELDS: (keyof ForgotPasswordForm)[] = ["email"];

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      const response = await authService.forgotPassword(data.email);
      setSuccessMessage(response.message);
    } catch (error) {
      handleApiError<ForgotPasswordForm>(error, setError, FIELDS);
    }
  };

  return (
    <AuthFormWrapper title="Recuperar contrasena" error={errors.root?.message}>
      {successMessage ? (
        <div className="rounded-sm bg-emerald-900/30 p-4 text-sm text-emerald-400">
          <p>{successMessage}</p>
          <Link
            to="/login"
            className="mt-3 inline-block font-medium text-amber-500 transition-colors duration-200 hover:text-amber-400"
          >
            Volver a iniciar sesion
          </Link>
        </div>
      ) : (
        <>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField<ForgotPasswordForm>
              label="Correo electronico"
              name="email"
              type="email"
              placeholder="tu@email.com"
              register={register}
              errors={errors}
            />

            <SubmitButton
              label="Enviar enlace de recuperacion"
              loadingLabel="Enviando..."
              isSubmitting={isSubmitting}
            />
          </form>

          <p className="mt-4 text-center text-sm text-zinc-500">
            <Link
              to="/login"
              className="font-medium text-amber-500 transition-colors duration-200 hover:text-amber-400"
            >
              Volver a iniciar sesion
            </Link>
          </p>
        </>
      )}
    </AuthFormWrapper>
  );
}
