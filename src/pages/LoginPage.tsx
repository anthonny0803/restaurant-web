import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import AuthFormWrapper from "../components/AuthFormWrapper";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../lib/form-errors";

interface LoginForm {
  email: string;
  password: string;
}

const FIELDS: (keyof LoginForm)[] = ["email", "password"];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (error) {
      handleApiError<LoginForm>(error, setError, FIELDS);
    }
  };

  return (
    <AuthFormWrapper title="Iniciar sesion" error={errors.root?.message}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField<LoginForm>
          label="Correo electronico"
          name="email"
          type="email"
          placeholder="tu@email.com"
          register={register}
          errors={errors}
        />

        <FormField<LoginForm>
          label="Contrasena"
          name="password"
          type="password"
          placeholder="********"
          register={register}
          errors={errors}
        />

        <SubmitButton
          label="Ingresar"
          loadingLabel="Ingresando..."
          isSubmitting={isSubmitting}
        />
      </form>

      <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-600">
        <Link to="/forgot-password" className="hover:text-indigo-600">
          Olvidaste tu contrasena?
        </Link>
        <p>
          No tienes cuenta?{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Registrate
          </Link>
        </p>
      </div>
    </AuthFormWrapper>
  );
}
