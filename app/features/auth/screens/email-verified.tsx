import type { Route } from "./+types/email-verified";

import { useSearchParams } from "react-router";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Email Verification | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

export default function ChangeEmail() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get("message");
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">Confirmation Complete</h1>
      <p className="text-muted-foreground">
        {decodeURIComponent(message ?? "")}.
      </p>
    </div>
  );
}
