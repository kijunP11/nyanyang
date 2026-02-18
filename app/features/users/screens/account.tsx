import type { Route } from "./+types/account";

import { Suspense } from "react";
import { Await, Link, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { data } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { Switch } from "~/core/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/core/components/ui/alert-dialog";
import makeServerClient from "~/core/lib/supa-client.server";

import KeywordBookTab from "~/features/keywords/components/keyword-book-tab";

import EditProfileForm from "../components/forms/edit-profile-form";
import { getUserProfile } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `마이페이지 설정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  const profile = getUserProfile(client, { userId: user!.id });

  const { data: identitiesData } = await client.auth.getUserIdentities();
  const hasPassword =
    identitiesData?.identities?.some((i) => i.provider === "email") ?? false;

  return data({ user, profile, hasPassword }, { headers });
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { user, profile, hasPassword } = loaderData;
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const adultVerified = !!user?.user_metadata?.adult_verified;
  const identityVerified = !!user?.user_metadata?.verified_at;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 bg-[#F5F5F5] min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-[#181D27]">마이페이지</h1>
        <Button
          variant="ghost"
          asChild
          className="text-[#535862] hover:text-[#181D27]"
        >
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Link>
        </Button>
      </div>
      <p className="text-sm text-[#535862] mb-6">정보를 수정할 수 있습니다.</p>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="bg-white border border-[#D5D7DA] mb-6">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-[#00c4af] data-[state=active]:text-white text-[#181D27]"
          >
            프로필 수정
          </TabsTrigger>
          <TabsTrigger
            value="keywords"
            className="data-[state=active]:bg-[#00c4af] data-[state=active]:text-white text-[#181D27]"
          >
            내 키워드북
          </TabsTrigger>
          <TabsTrigger
            value="safety"
            className="data-[state=active]:bg-[#00c4af] data-[state=active]:text-white text-[#181D27]"
          >
            세이프티 수정
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Suspense
            fallback={
              <div className="bg-white animate-pulse h-60 w-full rounded-xl border border-[#D5D7DA]" />
            }
          >
            <Await resolve={profile}>
              {(profileData) => {
                if (!profileData) return null;
                const p = profileData as typeof profileData & { bio?: string | null };
                return (
                  <EditProfileForm
                    name={p.name ?? ""}
                    bio={p.bio ?? null}
                    avatarUrl={p.avatar_url ?? null}
                    marketingConsent={p.marketing_consent ?? false}
                    hasPassword={hasPassword}
                  />
                );
              }}
            </Await>
          </Suspense>
        </TabsContent>

        <TabsContent value="keywords">
          <KeywordBookTab />
        </TabsContent>

        <TabsContent value="safety">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#D5D7DA] p-6">
              <h3 className="text-lg font-semibold text-[#181D27] mb-1">
                본인인증
              </h3>
              <p className="text-sm text-[#535862] mb-4">
                본인인증하고 1,000젤리 받아가세요!
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      identityVerified
                        ? "bg-[#E0F7F5] text-[#00897B]"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {identityVerified ? "인증완료" : "미인증"}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={identityVerified}
                      className="bg-[#00c4af] hover:bg-[#00b39e] text-white disabled:opacity-50"
                    >
                      인증하기
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        본인인증이 완료되었습니다.
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction className="bg-[#00c4af] hover:bg-[#00b39e] text-white">
                        완료
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#D5D7DA] p-6">
              <h3 className="text-lg font-semibold text-[#181D27] mb-1">
                성인인증
              </h3>
              <p className="text-sm text-[#535862] mb-4">
                만 19세 이상 확인
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      adultVerified
                        ? "bg-[#E0F7F5] text-[#00897B]"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {adultVerified ? "인증완료" : "미인증"}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={adultVerified}
                      className="bg-[#00c4af] hover:bg-[#00b39e] text-white disabled:opacity-50"
                    >
                      인증하기
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        성인인증이 완료되었습니다.
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction className="bg-[#00c4af] hover:bg-[#00b39e] text-white">
                        완료
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#D5D7DA] p-6">
              <h3 className="text-lg font-semibold text-[#181D27] mb-1">
                세이프티
              </h3>
              {!adultVerified && (
                <p className="text-sm text-[#535862] mb-4">
                  성인 인증 후 세이프티를 끌 수 있어요!
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#181D27]">
                  세이프티 모드
                </span>
                <Switch disabled={!adultVerified} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
