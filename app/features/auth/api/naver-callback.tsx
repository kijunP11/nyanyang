import type { Route } from "./+types/naver-callback";

import { data, redirect } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return data({ error: "Authorization code not found" }, { status: 400 });
  }

  // 네이버에서 액세스 토큰 받기
  const tokenResponse = await fetch("https://nid.naver.com/oauth2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.NAVER_CLIENT_ID!,
      client_secret: process.env.NAVER_CLIENT_SECRET!,
      code: code,
      state: state || "",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    return data({ error: "Failed to get access token" }, { status: 400 });
  }

  // 네이버 사용자 정보 가져오기
  const userResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const userData = await userResponse.json();

  if (!userData.response) {
    return data({ error: "Failed to get user info" }, { status: 400 });
  }

  const naverUser = userData.response as {
    id: string;
    name?: string;
    profile_image?: string;
  };

  // Supabase에 사용자 생성/로그인
  const [client, headers] = makeServerClient(request);

  // 먼저 로그인 시도
  const { error } = await client.auth.signInWithPassword({
    email: `${naverUser.id}@naver.oauth`,
    password: naverUser.id,
  });

  if (error) {
    // 사용자가 없으면 생성
    const { error: signUpError } = await client.auth.signUp({
      email: `${naverUser.id}@naver.oauth`,
      password: naverUser.id,
      options: {
        data: {
          full_name: naverUser.name,
          avatar_url: naverUser.profile_image,
          provider: "naver",
        },
      },
    });

    if (signUpError) {
      return data({ error: signUpError.message }, { status: 400 });
    }
  }

  return redirect("/", { headers });
}
