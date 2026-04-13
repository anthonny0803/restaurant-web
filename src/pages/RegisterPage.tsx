import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import AuthFormWrapper from "../components/AuthFormWrapper";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../lib/form-errors";

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

const FIELDS: (keyof RegisterForm)[] = [
  "name",
  "email",
  "phone",
  "password",
  "password_confirmation",
];

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data);
      navigate("/");
    } catch (error) {
      handleApiError<RegisterForm>(error, setError, FIELDS);
    }
  };

  return (
    <AuthFormWrapper title="Crear cuenta" error={errors.root?.message}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField<RegisterForm>
          label="Nombre"
          name="name"
          register={register}
          errors={errors}
        />

        <FormField<RegisterForm>
          label="Correo electronico"
          name="email"
          type="email"
          register={register}
          errors={errors}
        />

        <FormField<RegisterForm>
          label="Telefono"
          name="phone"
          type="tel"
          register={register}
          errors={errors}
        />

        <FormField<RegisterForm>
          label="Contrasena"
          name="password"
          type="password"
          register={register}
          errors={errors}
        />

        <FormField<RegisterForm>
          label="Confirmar contrasena"
          name="password_confirmation"
          type="password"
          register={register}
          errors={errors}
        />

        <SubmitButton
          label="Registrarse"
          loadingLabel="Creando cuenta..."
          isSubmitting={isSubmitting}
        />
      </form>

      <p className="mt-4 text-center text-sm text-zinc-500">
        Ya tienes cuenta?{" "}
        <Link
          to="/login"
          className="font-medium text-amber-500 transition-colors duration-200 hover:text-amber-400"
        >
          Inicia sesion
        </Link>
      </p>
    </AuthFormWrapper>
  );
}
