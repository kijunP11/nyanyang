/**
 * Social Authentication Complete Screen
 */
import type { Route } from "./+types/complete";

import { data, redirect } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

/** 페이지 메타 */
export const meta: Route.MetaFunction = () => [
  { title: `Confirm | ${import.meta.env.VITE_APP_NAME}` },
];

/** 성공 콜백 쿼리: code (+ 선택적으로 next/state) */
const successSchema = z.object({
  code: z.string(),
  next: z.string().optional(), // ✅ next 지원
  state: z.string().optional(), // ✅ 필요 시 state로 복구 경로 싣는 경우
});

/** 에러 콜백 쿼리: 카카오는 error_code가 없을 수 있음 → optional */
const errorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
  error_code: z.string().optional(), // ✅ optional 로 변경
});

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams);

  // 1) 성공 쿼리 파싱
  const ok = successSchema.safeParse(raw);

  // 2) 실패 쿼리 파싱
  const bad = errorSchema.safeParse(raw);

  // 3) 실패 케이스 먼저 처리(명시적 에러이면 바로 사용자에게 보여줌)
  if (!ok.success && bad.success) {
    const { error, error_description, error_code } = bad.data;
    const msg = [
      `OAuth error: ${error}`,
      error_code ? `(code: ${error_code})` : "",
      error_description ? `- ${error_description}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return data({ error: msg }, { status: 400 });
  }

  // 4) 성공/실패 모두 아닌 이상한 콜백
  if (!ok.success) {
    return data(
      { error: "Invalid OAuth callback (missing code)" },
      { status: 400 },
    );
  }

  // 5) code → 세션 교환
  const [client, headers] = makeServerClient(request);

  // ❗중요: Supabase v2는 객체 형태로 넘겨야 해요.
  //    기존 코드: exchangeCodeForSession(validData.code)  (X)
  //    수정 코드: exchangeCodeForSession({ code: validData.code })  (O)
  const { code, next } = ok.data;
  const { error: xErr } = await client.auth.exchangeCodeForSession({ code }); // ✅ 수정

  if (xErr) {
    return data(
      { error: `Session exchange failed: ${xErr.message}` },
      { status: 400, headers },
    );
  }

  // 6) 세션 생김 → 이동
  return redirect(next || "/", { headers }); // ✅ next 있으면 우선
}

/** 에러 시에만 렌더됨 */
export default function Confirm({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      <h1 className="text-2xl font-semibold">Login failed</h1>
      <p className="text-muted-foreground">
        {loaderData?.error ?? "Unknown error"}
      </p>
    </div>
  );
}
