/**
 * Login Screen — A-1 소셜 로그인
 * 이메일/비밀번호 폼은 /login/email 로 분리됨.
 */
import type { Route } from "./+types/login";

import { Link } from "react-router";

import { SignInButtons } from "../components/auth-login-buttons";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `로그인 또는 회원가입 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-[350px]">
        <h1 className="mb-8 text-center text-2xl font-bold text-[#181D27]">
          로그인 또는 회원가입
        </h1>

        <SignInButtons />

        <div className="mt-6 text-center">
          <Link
            to="/login/email"
            className="text-sm text-[#717680] underline"
            viewTransition
          >
            이메일 로그인
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-[#535862]">
          소셜 계정이 없으신가요?{" "}
          <Link
            to="/join"
            viewTransition
            className="font-semibold text-[#28A393] underline"
          >
            이메일로 회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
