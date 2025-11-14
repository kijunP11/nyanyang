/**
 * Complete Profile Screen Component
 *
 * This component handles profile completion after social login.
 * Users who sign up via social authentication need to complete
 * their profile with nickname, referral code (optional), and
 * terms agreement before they can use the service.
 */
import type { Route } from "./+types/complete-profile";

import { CheckCircle2Icon } from "lucide-react";
import React, { useRef, useState } from "react";
import { Form, data, redirect } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Meta function for the complete profile page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `프로필 완성 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Validation schema for profile completion form
 */
const completeProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, { message: "닉네임은 최소 2자 이상이어야 합니다." })
    .max(20, { message: "닉네임은 최대 20자까지 가능합니다." })
    .regex(/^[가-힣a-zA-Z0-9]+$/, {
      message: "닉네임은 한글, 영문, 숫자만 사용 가능합니다.",
    }),
  referralCode: z.string().optional(),
  age14: z.coerce.boolean().refine((val) => val === true, {
    message: "만 14세 이상 동의는 필수입니다.",
  }),
  terms: z.coerce.boolean().refine((val) => val === true, {
    message: "서비스 이용약관 동의는 필수입니다.",
  }),
  privacy: z.coerce.boolean().refine((val) => val === true, {
    message: "개인정보 수집 및 이용 동의는 필수입니다.",
  }),
  marketing: z.coerce.boolean().default(false),
});

/**
 * Loader function - ensures user is authenticated
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  return {};
}

/**
 * Action handler for profile completion form submission
 */
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const {
    data: validData,
    success,
    error,
  } = completeProfileSchema.safeParse(Object.fromEntries(formData));

  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }

  const [client, headers] = makeServerClient(request);

  // Get current user
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  // Update user metadata with profile information
  const { error: updateError } = await client.auth.updateUser({
    data: {
      nickname: validData.nickname,
      referral_code: validData.referralCode || null,
      marketing_consent: validData.marketing,
      profile_completed: true,
    },
  });

  if (updateError) {
    return data({ error: updateError.message }, { status: 400 });
  }

  // Redirect to home page
  return redirect("/", { headers });
}

/**
 * Complete Profile Component
 */
export default function CompleteProfile({ actionData }: Route.ComponentProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [allTermsChecked, setAllTermsChecked] = useState(false);

  const handleAllTermsChange = (checked: boolean | string) => {
    const isChecked = checked === true || checked === "checked";
    setAllTermsChecked(isChecked);
    if (formRef.current) {
      const age14Checkbox =
        formRef.current.querySelector<HTMLInputElement>("#age14");
      const termsCheckbox =
        formRef.current.querySelector<HTMLInputElement>("#terms");
      const privacyCheckbox =
        formRef.current.querySelector<HTMLInputElement>("#privacy");
      const marketingCheckbox =
        formRef.current.querySelector<HTMLInputElement>("#marketing");

      if (age14Checkbox) age14Checkbox.checked = isChecked;
      if (termsCheckbox) termsCheckbox.checked = isChecked;
      if (privacyCheckbox) privacyCheckbox.checked = isChecked;
      if (marketingCheckbox) marketingCheckbox.checked = isChecked;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            프로필을 완성해 주세요
          </CardTitle>
          <CardDescription className="text-center text-base">
            <div>소셜 계정으로 연결됐어요.</div>
            <div>아래 정보만 확인하면 가입이 완료됩니다.</div>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form
            className="flex w-full flex-col gap-5"
            method="post"
            ref={formRef}
          >
            {/* 닉네임 입력 */}
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="nickname"
                className="flex flex-col items-start gap-1"
              >
                닉네임
              </Label>
              <Input
                id="nickname"
                name="nickname"
                required
                type="text"
                placeholder="닉네임을 입력하세요"
              />
              <small className="text-muted-foreground text-xs">
                닉네임은 2-20자의 한글/영문/숫자만 가능합니다.
              </small>
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.nickname ? (
                <FormErrors errors={actionData.fieldErrors.nickname} />
              ) : null}
            </div>

            {/* 추천인 코드 입력 */}
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="referralCode"
                className="flex flex-col items-start gap-1"
              >
                추천인 코드
              </Label>
              <Input
                id="referralCode"
                name="referralCode"
                type="text"
                placeholder="추천인 코드를 입력하세요 (선택)"
              />
            </div>

            {/* 전체 약관 동의 */}
            <div className="flex items-center gap-2 border-b pb-2">
              <Checkbox
                id="allTerms"
                checked={allTermsChecked}
                onCheckedChange={handleAllTermsChange}
              />
              <Label
                htmlFor="allTerms"
                className="text-muted-foreground cursor-pointer font-medium"
              >
                아래 약관에 모두 동의합니다.
              </Label>
            </div>

            {/* 개별 약관 체크박스들 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="age14" name="age14" required />
                <Label
                  htmlFor="age14"
                  className="text-muted-foreground text-sm"
                >
                  만 14세 이상입니다.(필수)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="terms" name="terms" required />
                <Label
                  htmlFor="terms"
                  className="text-muted-foreground text-sm"
                >
                  나냥 서비스 이용약관에 동의합니다. (필수)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="privacy" name="privacy" required />
                <Label
                  htmlFor="privacy"
                  className="text-muted-foreground text-sm"
                >
                  개인정보 수집 및 이용에 동의합니다. (필수)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="marketing" name="marketing" />
                <Label
                  htmlFor="marketing"
                  className="text-muted-foreground text-sm"
                >
                  마케팅 활용 및 광고성 정보 수신에 동의합니다. (선택)
                </Label>
              </div>
            </div>

            {/* 약관 에러 표시 */}
            {actionData &&
            "fieldErrors" in actionData &&
            (actionData.fieldErrors?.age14 ||
              actionData.fieldErrors?.terms ||
              actionData.fieldErrors?.privacy) ? (
              <FormErrors
                errors={
                  [
                    actionData.fieldErrors?.age14?.[0],
                    actionData.fieldErrors?.terms?.[0],
                    actionData.fieldErrors?.privacy?.[0],
                  ].filter(Boolean) as string[]
                }
              />
            ) : null}

            {/* 일반 에러 표시 */}
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors errors={[actionData.error]} />
            ) : null}

            {/* 성공 메시지 */}
            {actionData && "success" in actionData && actionData.success ? (
              <Alert className="bg-green-600/20 text-green-700 dark:bg-green-950/20 dark:text-green-600">
                <CheckCircle2Icon className="size-4" />
                <AlertTitle>가입 완료!</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-600">
                  프로필이 완성되었습니다.
                </AlertDescription>
              </Alert>
            ) : null}

            <FormButton
              label="가입 완료"
              className="w-full bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
            />
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
