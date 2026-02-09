/**
 * Verification Screen Component (Step 2 of Registration)
 *
 * This component handles:
 * - Phone number verification (mock)
 * - Terms of service agreement
 * - Final account creation with Supabase
 */
import type { Route } from "./+types/verify";

import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Form, Link, data, redirect, useFetcher } from "react-router";

import FormButton from "~/core/components/form-button";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  getJoinSession,
  clearJoinSession,
  type JoinSessionData,
} from "../lib/join-session.server";

/**
 * Meta function for the verification page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `회원 인증 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Loader function to check for join session data
 * Redirects to /join if no session data exists
 */
export async function loader({ request }: Route.LoaderArgs) {
  const joinData = await getJoinSession(request);

  if (!joinData) {
    return redirect("/join");
  }

  return { email: joinData.email };
}

/**
 * Action handler for verification and account creation
 */
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle phone verification request (mock)
  if (intent === "request-code") {
    const phone = formData.get("phone") as string;
    const countryCode = formData.get("countryCode") as string;

    // Validate phone number (digits only, 10-11 characters)
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return data({ error: "잘못된 전화번호 형식입니다.", field: "phone" }, { status: 400 });
    }

    // Mock: Always succeed, log verification code
    console.log(`[MOCK] Verification code for ${countryCode}${phoneDigits}: 000000`);

    return data({ success: true, codeSent: true });
  }

  // Handle verification code check (mock)
  if (intent === "verify-code") {
    const code = formData.get("code") as string;

    // Mock: Accept "000000" as valid code
    if (code !== "000000") {
      return data({ error: "인증번호가 일치하지 않습니다.", field: "code" }, { status: 400 });
    }

    return data({ success: true, verified: true });
  }

  // Handle final signup
  if (intent === "signup") {
    const joinData = await getJoinSession(request);

    if (!joinData) {
      return redirect("/join");
    }

    const agreeAge = formData.get("agreeAge") === "on";
    const agreeTerms = formData.get("agreeTerms") === "on";
    const agreePrivacy = formData.get("agreePrivacy") === "on";
    const agreeMarketing = formData.get("agreeMarketing") === "on";
    const phone = formData.get("phone") as string;
    const countryCode = formData.get("countryCode") as string;

    // Validate required agreements
    if (!agreeAge || !agreeTerms || !agreePrivacy) {
      return data({ error: "필수 약관에 동의해주세요." }, { status: 400 });
    }

    // Create Supabase client and sign up
    const [client, headers] = makeServerClient(request);
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email: joinData.email,
      password: joinData.password,
      options: {
        data: {
          name: joinData.name,
          display_name: joinData.name,
          phone: `${countryCode}${phone.replace(/\D/g, "")}`,
          marketing_consent: agreeMarketing,
          referral_code: joinData.referralCode,
        },
        emailRedirectTo: `${import.meta.env.VITE_SITE_URL}/auth/confirm?type=email&next=/`,
      },
    });

    if (signUpError) {
      return data({ error: signUpError.message }, { status: 400 });
    }

    // Clear join session cookie
    const clearCookieHeader = await clearJoinSession();

    // Combine headers
    const responseHeaders = new Headers(headers);
    responseHeaders.append("Set-Cookie", clearCookieHeader);

    // Check if we have a session (email confirmation disabled in dev)
    if (signUpData?.session) {
      return redirect("/", { headers: responseHeaders });
    }

    // Check if email confirmation is required
    if (signUpData?.user && signUpData.user.email_confirmed_at) {
      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email: joinData.email,
        password: joinData.password,
      });

      if (!signInError && signInData?.session) {
        return redirect("/", { headers: responseHeaders });
      }
    }

    // Redirect to login with success message
    return redirect("/login?registered=true", { headers: responseHeaders });
  }

  return data({ error: "잘못된 요청입니다." }, { status: 400 });
}

/**
 * Verification Component
 */
export default function Verify({ loaderData, actionData }: Route.ComponentProps) {
  const { email } = loaderData;

  // Phone verification state
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+82");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);

  // Agreement state
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const fetcher = useFetcher();

  // Check if can submit
  const canSubmit = isPhoneVerified && agreeAge && agreeTerms && agreePrivacy;

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
      setIsCodeSent(false);
      setCodeExpired(true);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.codeSent) {
        setIsCodeSent(true);
        setTimer(300);
        setTimerActive(true);
        setCodeExpired(false);
      }
      if (fetcher.data.verified) {
        setIsPhoneVerified(true);
        setTimerActive(false);
      }
    }
  }, [fetcher.data]);

  // Handle "agree all" checkbox
  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeAge(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  // Update "agree all" when individual checkboxes change
  useEffect(() => {
    if (agreeAge && agreeTerms && agreePrivacy && agreeMarketing) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [agreeAge, agreeTerms, agreePrivacy, agreeMarketing]);

  // Format timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Check for errors
  const fetcherError = fetcher.data && "error" in fetcher.data ? fetcher.data : null;
  const phoneError = fetcherError && "field" in fetcherError && fetcherError.field === "phone" ? fetcherError.error : null;
  const codeError = fetcherError && "field" in fetcherError && fetcherError.field === "code" ? fetcherError.error : null;
  const generalError = fetcherError && !("field" in fetcherError) ? fetcherError.error : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] px-4 py-8">
      <div className="w-full max-w-[350px]">
        {/* 타이틀 */}
        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          회원 인증
        </h1>

        <Form method="post" className="flex flex-col gap-6">
          {/* 전화번호 섹션 */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-[#9ca3af]">전화번호</Label>
            <div className="flex gap-2">
              <select
                name="countryCode"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="h-12 w-20 rounded-md border border-[#3f3f46] bg-[#232323] px-2 text-white focus:border-[#14b8a6] focus:outline-none"
                disabled={isPhoneVerified}
              >
                <option value="+82">+82</option>
                <option value="+1">+1</option>
                <option value="+81">+81</option>
                <option value="+86">+86</option>
              </select>
              <Input
                name="phone"
                type="tel"
                placeholder="전화번호를 입력해주세요..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isPhoneVerified}
                className={`h-12 flex-1 border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6] ${
                  phoneError ? "border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  fetcher.submit(
                    { intent: "request-code", phone, countryCode },
                    { method: "post" }
                  );
                }}
                disabled={!phone.trim() || isPhoneVerified || fetcher.state === "submitting"}
                className={`h-12 rounded-md px-4 text-sm font-medium transition-colors ${
                  phone.trim() && !isPhoneVerified
                    ? "bg-[#14b8a6] text-white hover:bg-[#0d9488]"
                    : "cursor-not-allowed bg-[#3f3f46] text-[#9ca3af]"
                }`}
              >
                인증요청
              </button>
            </div>
            <p className="text-xs text-[#6b7280]">* - 는 제외하고 입력해주세요.</p>
            {phoneError && (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {phoneError}
              </div>
            )}
          </div>

          {/* 인증번호 섹션 */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-[#9ca3af]">인증번호</Label>
            <div className="flex gap-2">
              <Input
                name="code"
                type="text"
                placeholder="인증번호 6자리 입력해주세요"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={!isCodeSent || isPhoneVerified}
                maxLength={6}
                className={`h-12 flex-1 border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6] ${
                  codeError ? "border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  fetcher.submit(
                    { intent: "verify-code", code: verificationCode },
                    { method: "post" }
                  );
                }}
                disabled={!isCodeSent || isPhoneVerified || verificationCode.length !== 6 || fetcher.state === "submitting"}
                className={`h-12 rounded-md px-4 text-sm font-medium transition-colors ${
                  isCodeSent && !isPhoneVerified && verificationCode.length === 6
                    ? "bg-[#14b8a6] text-white hover:bg-[#0d9488]"
                    : "cursor-not-allowed bg-[#3f3f46] text-[#6b7280]"
                }`}
              >
                인증
              </button>
            </div>
            {timerActive && !isPhoneVerified && (
              <p className="text-sm text-[#14b8a6]">남은시간 : {formatTimer(timer)}</p>
            )}
            {isPhoneVerified && (
              <p className="text-sm text-[#14b8a6]">✓ 인증이 완료되었습니다.</p>
            )}
            {codeExpired && !isPhoneVerified && (
              <p className="text-sm text-red-500">인증번호가 만료되었습니다. 다시 요청해주세요.</p>
            )}
            {codeError && (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {codeError}
              </div>
            )}
          </div>

          {/* 약관 동의 섹션 */}
          <div className="mt-2 space-y-3">
            {/* 전체 동의 */}
            <div className="flex items-center gap-2 border-b border-[#3f3f46] pb-3">
              <Checkbox
                id="agreeAll"
                checked={agreeAll}
                onCheckedChange={(checked) => handleAgreeAll(checked as boolean)}
                className="border-[#3f3f46] data-[state=checked]:border-[#14b8a6] data-[state=checked]:bg-[#14b8a6]"
              />
              <Label htmlFor="agreeAll" className="text-sm font-medium text-white">
                아래 약관에 모두 동의합니다.
              </Label>
            </div>

            {/* 만 14세 이상 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeAge"
                name="agreeAge"
                checked={agreeAge}
                onCheckedChange={(checked) => setAgreeAge(checked as boolean)}
                className="border-[#3f3f46] data-[state=checked]:border-[#14b8a6] data-[state=checked]:bg-[#14b8a6]"
              />
              <Label htmlFor="agreeAge" className="text-sm text-[#9ca3af]">
                만 14세 이상입니다. <span className="text-[#14b8a6]">(필수)</span>
              </Label>
            </div>

            {/* 이용약관 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeTerms"
                name="agreeTerms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                className="border-[#3f3f46] data-[state=checked]:border-[#14b8a6] data-[state=checked]:bg-[#14b8a6]"
              />
              <Label htmlFor="agreeTerms" className="text-sm text-[#9ca3af]">
                <Link to="/legal/terms-of-service" className="text-[#14b8a6] hover:underline">
                  나냥 서비스 이용약관
                </Link>
                에 동의합니다. <span className="text-[#14b8a6]">(필수)</span>
              </Label>
            </div>

            {/* 개인정보처리방침 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreePrivacy"
                name="agreePrivacy"
                checked={agreePrivacy}
                onCheckedChange={(checked) => setAgreePrivacy(checked as boolean)}
                className="border-[#3f3f46] data-[state=checked]:border-[#14b8a6] data-[state=checked]:bg-[#14b8a6]"
              />
              <Label htmlFor="agreePrivacy" className="text-sm text-[#9ca3af]">
                <Link to="/legal/privacy-policy" className="text-[#14b8a6] hover:underline">
                  개인정보 수집 및 이용
                </Link>
                에 동의합니다. <span className="text-[#14b8a6]">(필수)</span>
              </Label>
            </div>

            {/* 마케팅 동의 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeMarketing"
                name="agreeMarketing"
                checked={agreeMarketing}
                onCheckedChange={(checked) => setAgreeMarketing(checked as boolean)}
                className="border-[#3f3f46] data-[state=checked]:border-[#14b8a6] data-[state=checked]:bg-[#14b8a6]"
              />
              <Label htmlFor="agreeMarketing" className="text-sm text-[#9ca3af]">
                마케팅 활용 및 광고성 정보 수신에 동의합니다. <span className="text-[#6b7280]">(선택)</span>
              </Label>
            </div>
          </div>

          {/* 에러 메시지 */}
          {generalError && (
            <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              {generalError}
            </div>
          )}

          {/* 가입 완료 버튼 */}
          <button
            type="submit"
            name="intent"
            value="signup"
            disabled={!canSubmit}
            className={`mt-4 h-11 w-full rounded-md text-sm font-medium transition-colors ${
              canSubmit
                ? "bg-[#14b8a6] text-white hover:bg-[#0d9488]"
                : "cursor-not-allowed bg-[#3f3f46] text-[#6b7280]"
            }`}
          >
            가입 완료
          </button>
        </Form>

        {/* 로그인 링크 */}
        <p className="mt-6 text-center text-sm text-[#9ca3af]">
          이미 계정이 있으신가요?{" "}
          <Link
            to="/login"
            viewTransition
            className="font-medium text-[#14b8a6] hover:underline"
          >
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
}
