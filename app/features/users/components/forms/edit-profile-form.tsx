import type { Route as EditProfileRoute } from "@rr/app/features/users/api/+types/edit-profile";
import { UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

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
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";

import FormErrors from "~/core/components/form-error";
import FormSuccess from "~/core/components/form-success";

interface EditProfileFormProps {
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  marketingConsent: boolean;
  hasPassword: boolean;
}

export default function EditProfileForm({
  name,
  bio,
  avatarUrl,
  marketingConsent,
  hasPassword,
}: EditProfileFormProps) {
  const profileFetcher = useFetcher<
    EditProfileRoute.ComponentProps["actionData"]
  >();
  const passwordFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const [nameValue, setNameValue] = useState(name);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatar(avatarUrl);
    setNameValue(name);
    setBioValue(bio ?? "");
  }, [avatarUrl, name, bio]);

  const onChangeAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-8">
      {/* 섹션 1: 프로필 수정 */}
      <profileFetcher.Form
        method="post"
        encType="multipart/form-data"
        action="/api/users/profile"
        className="bg-white rounded-xl border border-[#D5D7DA] p-6"
      >
        <h3 className="text-lg font-semibold text-[#181D27] mb-4">
          프로필 수정
        </h3>

        <div className="mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-40 aspect-[3/4] rounded-lg overflow-hidden bg-[#E8E8E8] border border-[#D5D7DA] hover:opacity-80 transition-opacity"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="프로필"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#717680]">
                <UserIcon className="h-10 w-10" />
                <span className="text-xs mt-1">이미지 선택</span>
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/gif"
            onChange={onChangeAvatar}
            className="hidden"
          />
          <p className="text-xs text-[#717680] mt-2">PNG, JPG, GIF / 최대 1MB</p>
        </div>

        <div className="mb-4">
          <Label htmlFor="name" className="text-sm font-medium text-[#181D27]">
            닉네임
          </Label>
          <div className="relative mt-1">
            <Input
              id="name"
              name="name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value.slice(0, 12))}
              minLength={2}
              maxLength={12}
              required
              placeholder="닉네임을 입력하세요"
              className="border-[#D5D7DA] pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#717680]">
              {nameValue.length}/12
            </span>
          </div>
          {profileFetcher.data &&
            "fieldErrors" in profileFetcher.data &&
            profileFetcher.data.fieldErrors?.name && (
              <FormErrors errors={profileFetcher.data.fieldErrors.name} />
            )}
        </div>

        <div className="mb-6">
          <Label htmlFor="bio" className="text-sm font-medium text-[#181D27]">
            자기소개
          </Label>
          <div className="relative mt-1">
            <Textarea
              id="bio"
              name="bio"
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={4}
              placeholder="자기소개를 입력하세요"
              className="border-[#D5D7DA] resize-none pr-14"
            />
            <span className="text-xs text-[#717680] absolute right-3 bottom-3">
              {bioValue.length}/500
            </span>
          </div>
        </div>

        <input
          type="hidden"
          name="marketingConsent"
          value={marketingConsent ? "true" : "false"}
        />

        <Button
          type="submit"
          disabled={profileFetcher.state === "submitting"}
          className="w-full bg-[#00c4af] hover:bg-[#00b39e] text-white"
        >
          {profileFetcher.state === "submitting"
            ? "저장 중..."
            : "프로필 수정하기"}
        </Button>
        {profileFetcher.data && "success" in profileFetcher.data && profileFetcher.data.success && (
          <FormSuccess message="프로필이 수정되었습니다." />
        )}
        {profileFetcher.data && "error" in profileFetcher.data && profileFetcher.data.error && (
          <FormErrors errors={[profileFetcher.data.error]} />
        )}
      </profileFetcher.Form>

      {/* 섹션 2: 비밀번호 수정 */}
      {hasPassword && (
        <div className="bg-white rounded-xl border border-[#D5D7DA] p-6">
          <h3 className="text-lg font-semibold text-[#181D27] mb-4">
            비밀번호 수정
          </h3>
          <passwordFetcher.Form
            method="post"
            action="/api/users/password"
            className="space-y-4"
          >
            <div>
              <Label
                htmlFor="password"
                className="text-sm font-medium text-[#181D27]"
              >
                새 비밀번호
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="8자 이상 입력하세요"
                className="mt-1 border-[#D5D7DA]"
              />
            </div>
            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-[#181D27]"
              >
                비밀번호 확인
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="비밀번호를 다시 입력하세요"
                className="mt-1 border-[#D5D7DA]"
              />
            </div>
            <Button
              type="submit"
              disabled={passwordFetcher.state === "submitting"}
              className="w-full bg-[#00c4af] hover:bg-[#00b39e] text-white"
            >
              {passwordFetcher.state === "submitting"
                ? "변경 중..."
                : "비밀번호 변경"}
            </Button>
            {passwordFetcher.data && "success" in passwordFetcher.data && passwordFetcher.data.success && (
              <FormSuccess message="비밀번호가 변경되었습니다." />
            )}
            {passwordFetcher.data && "error" in passwordFetcher.data && passwordFetcher.data.error && (
              <FormErrors errors={[passwordFetcher.data.error]} />
            )}
          </passwordFetcher.Form>
        </div>
      )}

      {/* 섹션 3: 회원 탈퇴 */}
      <div className="bg-white rounded-xl border border-[#D5D7DA] p-6">
        <h3 className="text-lg font-semibold text-[#181D27] mb-4">
          회원 탈퇴
        </h3>
        <p className="text-sm text-[#535862] mb-4">
          탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              회원 탈퇴
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>탈퇴하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                탈퇴 시 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수
                없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-[#D5D7DA]">
                돌아가기
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteFetcher.submit(null, {
                    method: "DELETE",
                    action: "/api/users",
                  });
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                탈퇴하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
