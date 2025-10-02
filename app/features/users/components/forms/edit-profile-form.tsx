import { type Route } from "@rr/app/features/users/api/+types/edit-profile";
import { UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import FetcherFormButton from "~/core/components/fetcher-form-button";
import FormErrors from "~/core/components/form-error";
import FormSuccess from "~/core/components/form-success";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

export default function EditProfileForm({
  name,
  avatarUrl,
  marketingConsent,
}: {
  name: string;
  marketingConsent: boolean;
  avatarUrl: string | null;
}) {
  const fetcher = useFetcher<Route.ComponentProps["actionData"]>();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      formRef.current?.blur();
      formRef.current?.querySelectorAll("input").forEach((input) => {
        input.blur();
      });
    }
  }, [fetcher.data]);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const onChangeAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };
  return (
    <fetcher.Form
      method="post"
      className="w-full max-w-screen-md"
      encType="multipart/form-data"
      ref={formRef}
      action="/api/users/profile"
    >
      <Card className="justify-between">
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>Manage your profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full flex-col gap-7">
            <div className="flex items-center gap-10">
              <Label
                htmlFor="avatar"
                className="flex flex-col items-start gap-2"
              >
                <span>Avatar</span>
                <Avatar className="size-24">
                  {avatar ? <AvatarImage src={avatar} alt="Avatar" /> : null}
                  <AvatarFallback>
                    <UserIcon className="text-muted-foreground size-10" />
                  </AvatarFallback>
                </Avatar>
              </Label>
              <div className="text-muted-foreground flex w-1/2 flex-col gap-2 text-sm">
                <div className="flex flex-col gap-1">
                  <span>Max size: 1MB</span>
                  <span>Allowed formats: PNG, JPG, GIF</span>
                </div>
                <Input
                  id="avatar"
                  name="avatar"
                  type="file"
                  onChange={onChangeAvatar}
                />
              </div>
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="name" className="flex flex-col items-start gap-1">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                required
                type="text"
                placeholder="Nico"
                defaultValue={name}
              />
              {fetcher.data &&
              "fieldErrors" in fetcher.data &&
              fetcher.data.fieldErrors?.name ? (
                <FormErrors errors={fetcher.data?.fieldErrors?.name} />
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="marketingConsent"
                name="marketingConsent"
                defaultChecked={marketingConsent}
              />
              <Label htmlFor="marketingConsent">
                Consent to marketing emails
              </Label>
            </div>
            {fetcher.data &&
            "fieldErrors" in fetcher.data &&
            fetcher.data.fieldErrors?.marketingConsent ? (
              <FormErrors
                errors={fetcher.data?.fieldErrors?.marketingConsent}
              />
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <FetcherFormButton
            submitting={fetcher.state === "submitting"}
            label="Save profile"
            className="w-full"
          />
          {fetcher.data && "success" in fetcher.data && fetcher.data.success ? (
            <FormSuccess message="Profile updated" />
          ) : null}
          {fetcher.data && "error" in fetcher.data && fetcher.data.error ? (
            <FormErrors errors={[fetcher.data.error]} />
          ) : null}
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
}
