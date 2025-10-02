import type { Route } from "./+types/logout";

import { redirect } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

export async function loader({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await client.auth.signOut();
  return redirect("/", { headers });
}
