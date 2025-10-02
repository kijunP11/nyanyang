import type { Route } from "./+types/public.layout";

import { Outlet, redirect } from "react-router";

import makeServerClient from "../lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (user) {
    throw redirect("/dashboard");
  }

  // Return an empty object to avoid the "Cannot read properties of undefined" error
  return {};
}

export default function PublicLayout() {
  return <Outlet />;
}
