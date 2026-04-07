import type { ReactNode } from "react";

interface AuthFormWrapperProps {
  title: string;
  error?: string;
  children: ReactNode;
}

export default function AuthFormWrapper({
  title,
  error,
  children,
}: AuthFormWrapperProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          {title}
        </h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}
