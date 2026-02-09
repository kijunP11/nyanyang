import type { Route } from "./+types/account";

import { Suspense } from "react";
import { Await, Link, useSearchParams } from "react-router";
import { ArrowLeft, CheckCircle } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { Switch } from "~/core/components/ui/switch";
import makeServerClient from "~/core/lib/supa-client.server";

import EditProfileForm from "../components/forms/edit-profile-form";
import ChangeEmailForm from "../components/forms/change-email-form";
import ChangePasswordForm from "../components/forms/change-password-form";
import DeleteAccountForm from "../components/forms/delete-account-form";
import { getUserProfile } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `마이페이지 설정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const profile = getUserProfile(client, { userId: user!.id });
  return { user, profile };
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { user, profile } = loaderData;
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const hasEmailIdentity = user?.identities?.some(
    (identity) => identity.provider === "email"
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">마이페이지</h1>
        <Button
          variant="ghost"
          asChild
          className="text-[#9ca3af] hover:text-white"
        >
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Link>
        </Button>
      </div>

      {/* 탭 */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="bg-[#232323] border border-[#3f3f46] mb-6">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white"
          >
            프로필 수정
          </TabsTrigger>
          <TabsTrigger
            value="safety"
            className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white"
          >
            세이프티 설정
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white"
          >
            계정 설정
          </TabsTrigger>
        </TabsList>

        {/* 프로필 탭 */}
        <TabsContent value="profile">
          <Suspense
            fallback={
              <div className="bg-[#232323] animate-pulse h-60 w-full rounded-xl border border-[#3f3f46]" />
            }
          >
            <Await resolve={profile}>
              {(profileData) => {
                if (!profileData) return null;
                return (
                  <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
                    <EditProfileForm
                      name={profileData.name}
                      marketingConsent={profileData.marketing_consent}
                      avatarUrl={profileData.avatar_url}
                    />
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </TabsContent>

        {/* 세이프티 탭 */}
        <TabsContent value="safety">
          <div className="space-y-6">
            {/* 본인인증 */}
            <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                본인인증
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">본인 인증</p>
                  <p className="text-sm text-[#9ca3af]">
                    실명 확인 및 본인 인증
                  </p>
                </div>
                {user?.user_metadata?.verified_at ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">인증완료</span>
                  </div>
                ) : (
                  <Button className="bg-[#14b8a6] hover:bg-[#0d9488]">
                    인증하기
                  </Button>
                )}
              </div>
            </div>

            {/* 성인인증 */}
            <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                성인인증
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">성인 인증</p>
                  <p className="text-sm text-[#9ca3af]">만 19세 이상 확인</p>
                </div>
                <Button
                  variant="outline"
                  className="border-[#3f3f46] text-[#9ca3af]"
                >
                  인증하기
                </Button>
              </div>
            </div>

            {/* 세이프티 토글 */}
            <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                세이프티
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">세이프티 모드</p>
                  <p className="text-sm text-[#9ca3af]">
                    성인 콘텐츠 표시 여부를 설정합니다
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 계정 설정 탭 */}
        <TabsContent value="account">
          <div className="space-y-6">
            <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
              <ChangeEmailForm email={user?.email ?? ""} />
            </div>
            <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
              <ChangePasswordForm hasPassword={hasEmailIdentity ?? false} />
            </div>
            <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
              <DeleteAccountForm />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
