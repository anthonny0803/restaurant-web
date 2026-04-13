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
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-sm border border-zinc-700 bg-zinc-800 p-10 shadow-lg animate-fade-in-up">
        <h1 className="mb-8 text-center font-serif text-2xl font-medium text-white">
          {title}
        </h1>

        {error && (
          <p className="mb-6 rounded-sm bg-red-900/30 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}
