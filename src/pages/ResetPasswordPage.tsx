import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthFormWrapper from "../components/AuthFormWrapper";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { handleApiError } from "../lib/form-errors";
import * as authService from "../services/auth.service";

interface ResetPasswordForm {
  password: string;
  password_confirmation: string;
}

const FIELDS: (keyof ResetPasswordForm)[] = [
  "password",
  "password_confirmation",
];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  if (token && email) {
    window.history.replaceState({}, "", "/reset-password");
  }

  const hasMissingParams = !token && !email;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>();

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      await authService.resetPassword({
        token,
        email,
        ...data,
      });
      navigate("/login");
    } catch (error) {
      handleApiError<ResetPasswordForm>(error, setError, FIELDS);
    }
  };

  if (hasMissingParams) {
    return (
      <AuthFormWrapper title="Enlace invalido">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          <p>El enlace de recuperacion es invalido o ha expirado.</p>
          <Link
            to="/forgot-password"
            className="mt-3 inline-block font-medium text-indigo-600 hover:text-indigo-700"
          >
            Solicitar un nuevo enlace
          </Link>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper title="Nueva contrasena" error={errors.root?.message}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField<ResetPasswordForm>
          label="Nueva contrasena"
          name="password"
          type="password"
          register={register}
          errors={errors}
        />

        <FormField<ResetPasswordForm>
          label="Confirmar contrasena"
          name="password_confirmation"
          type="password"
          register={register}
          errors={errors}
        />

        <SubmitButton
          label="Restablecer contrasena"
          loadingLabel="Guardando..."
          isSubmitting={isSubmitting}
        />
      </form>
    </AuthFormWrapper>
  );
}
