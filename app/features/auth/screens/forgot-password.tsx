/**
 * 계정 찾기 — 이메일 찾기 / 비밀번호 찾기 (A-4)
 *
 * 탭 기반 UI로 전화번호 인증을 통해
 * 이메일을 찾거나 비밀번호를 재설정합니다.
 */
import type { Route } from "./+types/forgot-password";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `계정 찾기 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

type Tab = "email" | "password";

export default function AccountRecovery() {
  const [activeTab, setActiveTab] = useState<Tab>("email");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-4 py-8">
      <div className="flex w-full max-w-[360px] flex-col items-center gap-[40px]">
        {/* Tab bar */}
        <div className="flex w-full gap-[40px] text-center text-2xl font-bold">
          <button
            type="button"
            className={`flex-1 leading-[32px] ${activeTab === "email" ? "text-black" : "text-[#A4A7AE]"}`}
            onClick={() => setActiveTab("email")}
          >
            이메일 찾기
          </button>
          <button
            type="button"
            className={`flex-1 leading-[32px] ${activeTab === "password" ? "text-black" : "text-[#A4A7AE]"}`}
            onClick={() => setActiveTab("password")}
          >
            비밀번호 찾기
          </button>
        </div>

        {activeTab === "email" ? (
          <FindEmailTab onSwitchToPassword={() => setActiveTab("password")} />
        ) : (
          <FindPasswordTab />
        )}
      </div>
    </div>
  );
}

/* ─── 이메일 찾기 탭 ─── */

type FindEmailStep = "form" | "result";

function FindEmailTab({
  onSwitchToPassword,
}: {
  onSwitchToPassword: () => void;
}) {
  const [step, setStep] = useState<FindEmailStep>("form");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [foundEmail, setFoundEmail] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleRequestCode = () => {
    setPhoneError(null);
    // TODO: API call to send verification code via phone
    setIsCodeSent(true);
    setTimer(300); // 5분
  };

  const handleVerifyCode = () => {
    setCodeError(null);
    // TODO: API call to verify the code
    setIsCodeVerified(true);
  };

  const handleFindEmail = () => {
    // TODO: API call to find email by verified phone
    setFoundEmail("ye***@gmail.com");
    setStep("result");
  };

  if (step === "result") {
    return (
      <FindEmailResult
        email={foundEmail}
        onSwitchToPassword={onSwitchToPassword}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-[40px]">
      <div className="flex flex-col gap-[20px]">
        {/* 전화번호 필드 */}
        <div className="flex flex-col gap-[6px]">
          <Label className="text-sm font-medium text-[#414651]">
            전화번호
          </Label>
          <div className="flex gap-[8px]">
            <div className="relative w-[268px]">
              <Input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="전화번호 입력"
                aria-invalid={!!phoneError}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680]"
              />
              {phoneError && (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              )}
            </div>
            <button
              type="button"
              disabled={!phone || isCodeSent}
              onClick={handleRequestCode}
              className={`flex h-11 flex-1 items-center justify-center rounded-[8px] border text-sm font-semibold shadow-xs ${
                phone && !isCodeSent
                  ? "border-[#36C4B3] bg-[#36C4B3] text-white"
                  : "border-[#E9EAEB] bg-[#E9EAEB] text-[#A4A7AE]"
              }`}
            >
              인증요청
            </button>
          </div>
          {phoneError ? (
            <p className="text-sm text-[#F04438]">{phoneError}</p>
          ) : (
            <p className="text-sm text-[#535862]">
              ※ -는 제외하고 입력해주세요.
            </p>
          )}
        </div>

        {/* 인증번호 필드 */}
        <div className="flex flex-col gap-[6px]">
          <Label className="text-sm font-medium text-[#414651]">
            인증번호
          </Label>
          <div className="flex gap-[8px]">
            <div className="relative w-[268px]">
              <Input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="인증번호 6자리 입력해주세요"
                aria-invalid={!!codeError}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680]"
              />
              {codeError && (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              )}
            </div>
            <button
              type="button"
              disabled={!code || !isCodeSent}
              onClick={handleVerifyCode}
              className={`flex h-11 flex-1 items-center justify-center rounded-[8px] border text-sm font-semibold shadow-xs ${
                code && isCodeSent
                  ? "border-[#36C4B3] bg-[#36C4B3] text-white"
                  : "border-[#E9EAEB] bg-[#E9EAEB] text-[#A4A7AE]"
              }`}
            >
              인증
            </button>
          </div>
          {codeError ? (
            <p className="text-sm text-[#F04438]">{codeError}</p>
          ) : timer > 0 ? (
            <p className="text-sm text-[#F04438]">
              남은 시간 : {formatTimer(timer)}
            </p>
          ) : null}
        </div>
      </div>

      {/* 제출 버튼 */}
      <button
        type="button"
        disabled={!isCodeVerified}
        onClick={handleFindEmail}
        className={`flex h-[48px] w-full items-center justify-center rounded-[8px] border text-base font-semibold shadow-xs ${
          isCodeVerified
            ? "border-[#36C4B3] bg-[#36C4B3] text-white"
            : "border-[#E9EAEB] bg-[#E9EAEB] text-[#A4A7AE]"
        }`}
      >
        이메일 찾기
      </button>
    </div>
  );
}

/* ─── 이메일 찾기 결과 화면 ─── */

function FindEmailResult({
  email,
  onSwitchToPassword,
}: {
  email: string;
  onSwitchToPassword: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-[40px]">
      <div className="flex flex-col gap-[12px] text-center">
        <h2 className="text-2xl font-bold text-[#181D27]">
          본인 확인이 완료되었습니다.
        </h2>
        <p className="text-sm text-[#717680]">
          회원님의 이메일 주소는 다음과 같습니다.
        </p>
      </div>

      <div className="flex h-[80px] w-full items-center justify-center border border-[#E9EAEB] bg-white">
        <span className="text-sm font-semibold text-black">{email}</span>
      </div>

      <div className="flex w-full flex-col gap-[10px]">
        <Link
          to="/login"
          className="flex h-[48px] items-center justify-center rounded-[8px] bg-[#36C4B3] text-base font-semibold text-white shadow-xs"
        >
          로그인 하러 가기
        </Link>
        <button
          type="button"
          onClick={onSwitchToPassword}
          className="flex h-[48px] items-center justify-center rounded-[8px] border border-[#D5D7DA] bg-white text-base font-semibold text-[#414651] shadow-xs"
        >
          비밀번호 찾기
        </button>
      </div>
    </div>
  );
}

/* ─── 비밀번호 찾기 탭 ─── */

type FindPasswordStep = "form" | "reset" | "result";

function FindPasswordTab() {
  const [step, setStep] = useState<FindPasswordStep>("form");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleRequestCode = () => {
    setPhoneError(null);
    // TODO: API call to send verification code via phone
    setIsCodeSent(true);
    setTimer(300); // 5분
  };

  const handleVerifyCode = () => {
    setCodeError(null);
    // TODO: API call to verify the code
    setIsCodeVerified(true);
  };

  const handleFindPassword = () => {
    // TODO: API call to verify phone for password reset
    setStep("reset");
  };

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    if (pw.length > 20) return "비밀번호는 20자 이하로 입력해주세요.";
    if (/\s/.test(pw)) return "비밀번호에 공백은 사용할 수 없습니다.";
    return null;
  };

  const handleResetPassword = () => {
    setPasswordError(null);
    setConfirmError(null);

    const pwError = validatePassword(newPassword);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }

    if (confirmPassword !== newPassword) {
      setConfirmError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // TODO: API call to reset password
    setStep("result");
  };

  const isResetValid =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    !passwordError &&
    !confirmError;

  if (step === "result") {
    return <ResetPasswordResult />;
  }

  if (step === "reset") {
    return (
      <div className="flex w-full flex-col gap-[40px]">
        <div className="flex flex-col gap-[12px] text-center">
          <h2 className="text-2xl font-bold text-[#181D27]">
            본인 확인이 완료되었습니다.
          </h2>
          <p className="text-sm text-[#717680]">
            새 비밀번호를 입력해주세요.
          </p>
        </div>

        <div className="flex flex-col gap-[20px]">
          {/* 새 비밀번호 */}
          <div className="flex flex-col gap-[6px]">
            <Label className="text-sm font-medium text-[#414651]">
              새 비밀번호
            </Label>
            <div className="relative">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError(null);
                }}
                placeholder="새 비밀번호 입력"
                aria-invalid={!!passwordError}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680]"
              />
              {passwordError && (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              )}
            </div>
            {passwordError ? (
              <p className="text-sm text-[#F04438]">{passwordError}</p>
            ) : (
              <p className="text-sm text-[#535862]">
                최소 8자 이상, 숫자/문자 포함
              </p>
            )}
          </div>

          {/* 새 비밀번호 확인 */}
          <div className="flex flex-col gap-[6px]">
            <Label className="text-sm font-medium text-[#414651]">
              새 비밀번호 확인
            </Label>
            <div className="relative">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmError(null);
                }}
                placeholder="새 비밀번호 확인"
                aria-invalid={!!confirmError}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680]"
              />
              {confirmError && (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              )}
            </div>
            {confirmError && (
              <p className="text-sm text-[#F04438]">{confirmError}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={!isResetValid}
          onClick={handleResetPassword}
          className={`flex h-[48px] w-full items-center justify-center rounded-[8px] border text-base font-semibold shadow-xs ${
            isResetValid
              ? "border-[#36C4B3] bg-[#36C4B3] text-white"
              : "border-[#E9EAEB] bg-[#E9EAEB] text-[#A4A7AE]"
          }`}
        >
          비밀번호 재설정 완료
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-[40px]">
      <div className="flex flex-col gap-[20px]">
        {/* 전화번호 필드 */}
        <div className="flex flex-col gap-[6px]">
          <Label className="text-sm font-medium text-[#414651]">
            전화번호
          </Label>
          <div className="flex gap-[8px]">
            <div className="relative w-[268px]">
              <Input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="전화번호 입력"
                aria-invalid={!!phoneError}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680]"
              />
              {phoneError && (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              )}
            </div>
            <button
              type="button"
              disabled={!phone || isCodeSent}
              onClick={handleRequestCode}
              className={`flex h-11 flex-1 items-center justify-center rounded-[8px] border text-sm font-semibold shadow-xs ${
                phone && !isCodeSent
                  ? "border-[#36C4B3] bg-[#36C4B3] text-white"
                  : "border-[#E9EAEB] bg-[#E9EAEB] text-[#A4A7AE]"
              }`}
            >
              인증요청
            </button>
          </div>
          {phoneError ? (
            <p className="text-sm text-[#F04438]">{phoneError}</p>
          ) : (
            <p className="text-sm text-[#535862]">
              ※ -는 제외하고 입력해주세요.
            </p>
          )}
        </div>

        {/* 인증번호 필드 */}
        <div className="flex flex-col gap-[6px]">
          <Label className="text-sm font-medium text-[#414651]">
            인증번호
          </Label>
          <div className="flex gap-[8px]">
            <div className="relative w-[268px]">
              <Input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="인증번호 6자리 입력해주세요"
                aria-invalid={!!codeError}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680]"
              />
              {codeError && (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              )}
            </div>
            <button
              type="button"
              disabled={!code || !isCodeSent}
              onClick={handleVerifyCode}
              className={`flex h-11 flex-1 items-center justify-center rounded-[8px] border text-sm font-semibold shadow-xs ${
                code && isCodeSent
                  ? "border-[#36C4B3] bg-[#36C4B3] text-white"
                  : "border-[#E9EAEB] bg-[#E9EAEB] text-[#A4A7AE]"
              }`}
            >
              인증
            </button>
          </div>
          {codeError ? (
            <p className="text-sm text-[#F04438]">{codeError}</p>
          ) : timer > 0 ? (
            <p className="text-sm text-[#F04438]">
              남은 시간 : {formatTimer(timer)}
            </p>
          ) : null}
        </div>
      </div>

      {/* 제출 버튼 */}
      <button
        type="button"
        disabled={!isCodeVerified}
        onClick={handleFindPassword}
        className={`flex h-[48px] w-full items-center justify-center rounded-[8px] border text-base font-semibold shadow-xs ${
          isCodeVerified
            ? "border-[#36C4B3] bg-[#36C4B3] text-white"
            : "border-[#E9EAEB] bg-[#E9EAEB] text-[#A4A7AE]"
        }`}
      >
        비밀번호 찾기
      </button>
    </div>
  );
}

/* ─── 비밀번호 재설정 완료 화면 ─── */

function ResetPasswordResult() {
  return (
    <div className="flex w-full flex-col items-center gap-[40px]">
      <div className="flex flex-col gap-[12px] text-center">
        <h2 className="text-2xl font-bold text-[#181D27]">
          비밀번호 재설정 완료
        </h2>
        <p className="text-sm text-[#717680]">
          새 비밀번호로 로그인할 수 있습니다.
        </p>
      </div>

      <div className="flex w-full flex-col gap-[10px]">
        <Link
          to="/login"
          className="flex h-[48px] items-center justify-center rounded-[8px] bg-[#36C4B3] text-base font-semibold text-white shadow-xs"
        >
          로그인 하러 가기
        </Link>
        <Link
          to="/"
          className="flex h-[48px] items-center justify-center rounded-[8px] border border-[#D5D7DA] bg-white text-base font-semibold text-[#414651] shadow-xs"
        >
          메인화면으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
