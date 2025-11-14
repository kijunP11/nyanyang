import type { Route } from "./+types/naver";

import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const state = crypto.randomUUID();
  const naverClientId = process.env.NAVER_CLIENT_ID;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: naverClientId!,
    redirect_uri: `${process.env.SITE_URL}/auth/naver/callback`,
    state: state,
  });

  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?${params}`;

  return redirect(naverAuthUrl);
}
