import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import AuthFormWrapper from "../components/AuthFormWrapper";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../lib/form-errors";
import * as authService from "../services/auth.service";

interface CompleteAccountForm {
  password: string;
  password_confirmation: string;
}

const FIELDS: (keyof CompleteAccountForm)[] = [
  "password",
  "password_confirmation",
];

export default function CompleteAccountPage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CompleteAccountForm>();

  const onSubmit = async (data: CompleteAccountForm) => {
    try {
      const response = await authService.completeAccount(data);
      updateUser(response.data);
      navigate("/my-reservations");
    } catch (error) {
      handleApiError<CompleteAccountForm>(error, setError, FIELDS);
    }
  };

  return (
    <AuthFormWrapper title="Completar cuenta" error={errors.root?.message}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField<CompleteAccountForm>
          label="Contrasena"
          name="password"
          type="password"
          register={register}
          errors={errors}
        />

        <FormField<CompleteAccountForm>
          label="Confirmar contrasena"
          name="password_confirmation"
          type="password"
          register={register}
          errors={errors}
        />

        <SubmitButton
          label="Completar cuenta"
          loadingLabel="Guardando..."
          isSubmitting={isSubmitting}
        />
      </form>
    </AuthFormWrapper>
  );
}
