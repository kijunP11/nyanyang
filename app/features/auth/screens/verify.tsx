/**
 * Verification Screen (Step 2 of Registration)
 * 약관 동의만 진행. 전화인증 제거.
 */
import type { Route } from "./+types/verify";

import { useState, useEffect } from "react";
import { Form, Link, data, redirect } from "react-router";

import FormErrors from "~/core/components/form-error";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  getJoinSession,
  clearJoinSession,
} from "../lib/join-session.server";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `서비스 약관 동의 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const joinData = await getJoinSession(request);

  if (!joinData) {
    return redirect("/join");
  }

  return { email: joinData.email };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "signup") {
    const joinData = await getJoinSession(request);

    if (!joinData) {
      return redirect("/join");
    }

    const agreeAge = formData.get("agreeAge") === "on";
    const agreeTerms = formData.get("agreeTerms") === "on";
    const agreePrivacy = formData.get("agreePrivacy") === "on";
    const agreeMarketing = formData.get("agreeMarketing") === "on";

    if (!agreeAge || !agreeTerms || !agreePrivacy) {
      return data({ error: "필수 약관에 동의해주세요." }, { status: 400 });
    }

    const [client, headers] = makeServerClient(request);
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email: joinData.email,
      password: joinData.password,
      options: {
        data: {
          name: joinData.name,
          display_name: joinData.name,
          nickname: joinData.nickname ?? joinData.name,
          marketing_consent: agreeMarketing,
          referral_code: joinData.referralCode,
        },
        emailRedirectTo: `${import.meta.env.VITE_SITE_URL}/auth/confirm?type=email&next=/`,
      },
    });

    if (signUpError) {
      return data({ error: signUpError.message }, { status: 400 });
    }

    const clearCookieHeader = await clearJoinSession();
    const responseHeaders = new Headers(headers);
    responseHeaders.append("Set-Cookie", clearCookieHeader);

    if (signUpData?.session) {
      return redirect("/", { headers: responseHeaders });
    }

    if (signUpData?.user && signUpData.user.email_confirmed_at) {
      const { data: signInData, error: signInError } =
        await client.auth.signInWithPassword({
          email: joinData.email,
          password: joinData.password,
        });

      if (!signInError && signInData?.session) {
        return redirect("/", { headers: responseHeaders });
      }
    }

    return redirect("/login?registered=true", { headers: responseHeaders });
  }

  return data({ error: "잘못된 요청입니다." }, { status: 400 });
}

export default function Verify({ loaderData, actionData }: Route.ComponentProps) {
  const { email } = loaderData;

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const canSubmit = agreeAge && agreeTerms && agreePrivacy;

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeAge(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  useEffect(() => {
    if (agreeAge && agreeTerms && agreePrivacy && agreeMarketing) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [agreeAge, agreeTerms, agreePrivacy, agreeMarketing]);

  const generalError =
    actionData && "error" in actionData ? actionData.error : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-[360px]">
        <h1 className="mb-2 text-center text-2xl font-bold text-black">
          서비스 약관 동의
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          {email} 으로 가입을 진행합니다.
        </p>

        <Form method="post" className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
              <Checkbox
                id="agreeAll"
                checked={agreeAll}
                onCheckedChange={(checked) =>
                  handleAgreeAll(checked as boolean)
                }
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label
                htmlFor="agreeAll"
                className="text-sm font-medium text-black"
              >
                아래 약관에 모두 동의합니다.
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeAge"
                name="agreeAge"
                checked={agreeAge}
                onCheckedChange={(checked) => setAgreeAge(checked as boolean)}
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label htmlFor="agreeAge" className="text-sm text-gray-500">
                만 14세 이상입니다.{" "}
                <span className="text-[#41C7BD]">(필수)</span>
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeTerms"
                name="agreeTerms"
                checked={agreeTerms}
                onCheckedChange={(checked) =>
                  setAgreeTerms(checked as boolean)
                }
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label htmlFor="agreeTerms" className="text-sm text-gray-500">
                <Link
                  to="/legal/terms-of-service"
                  className="text-[#41C7BD] hover:underline"
                >
                  나냥 서비스 이용약관
                </Link>
                에 동의합니다.{" "}
                <span className="text-[#41C7BD]">(필수)</span>
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="agreePrivacy"
                name="agreePrivacy"
                checked={agreePrivacy}
                onCheckedChange={(checked) =>
                  setAgreePrivacy(checked as boolean)
                }
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label htmlFor="agreePrivacy" className="text-sm text-gray-500">
                <Link
                  to="/legal/privacy-policy"
                  className="text-[#41C7BD] hover:underline"
                >
                  개인정보 수집 및 이용
                </Link>
                에 동의합니다.{" "}
                <span className="text-[#41C7BD]">(필수)</span>
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeMarketing"
                name="agreeMarketing"
                checked={agreeMarketing}
                onCheckedChange={(checked) =>
                  setAgreeMarketing(checked as boolean)
                }
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label
                htmlFor="agreeMarketing"
                className="text-sm text-gray-500"
              >
                마케팅 활용 및 광고성 정보 수신에 동의합니다.{" "}
                <span className="text-gray-400">(선택)</span>
              </Label>
            </div>
          </div>

          {generalError && <FormErrors errors={[generalError]} />}

          <button
            type="submit"
            name="intent"
            value="signup"
            disabled={!canSubmit}
            className={`h-12 w-full rounded-md text-sm font-medium transition-colors ${
              canSubmit
                ? "bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            가입 완료
          </button>
        </Form>

        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link
            to="/login"
            viewTransition
            className="text-[#41C7BD] hover:underline"
          >
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
}
