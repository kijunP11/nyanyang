import type { Route } from "@rr/app/features/users/api/+types/change-password";

import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";

import FetcherFormButton from "~/core/components/fetcher-form-button";
import FormErrors from "~/core/components/form-error";
import FormSuccess from "~/core/components/form-success";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

export default function ChangePasswordForm({
  hasPassword,
}: {
  hasPassword: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fetcher = useFetcher<Route.ComponentProps["actionData"]>();
  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      formRef.current?.reset();
      formRef.current?.blur();
      formRef.current?.querySelectorAll("input").forEach((input) => {
        input.blur();
      });
    }
  }, [fetcher.data]);
  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      className="w-full max-w-screen-md"
      action="/api/users/password"
    >
      <Card className="justify-between">
        <CardHeader>
          <CardTitle>
            {hasPassword ? "Change password" : "Add password"}
          </CardTitle>
          <CardDescription>
            {hasPassword
              ? "Change your password."
              : "Add a password to your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full flex-col gap-7">
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="password"
                className="flex flex-col items-start gap-1"
              >
                New password
              </Label>
              <Input id="password" name="password" required type="password" />
              {fetcher.data &&
              "fieldErrors" in fetcher.data &&
              fetcher.data.fieldErrors?.password ? (
                <FormErrors errors={fetcher.data?.fieldErrors?.password} />
              ) : null}
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="flex flex-col items-start gap-1"
              >
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                required
                type="password"
              />
              {fetcher.data &&
              "fieldErrors" in fetcher.data &&
              fetcher.data.fieldErrors?.confirmPassword ? (
                <FormErrors
                  errors={fetcher.data?.fieldErrors?.confirmPassword}
                />
              ) : null}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <FetcherFormButton
            label={hasPassword ? "Change password" : "Add password"}
            className="w-full"
            submitting={fetcher.state === "submitting"}
          />
          {fetcher.data && "success" in fetcher.data && fetcher.data.success ? (
            <FormSuccess message="Password updated" />
          ) : null}
          {fetcher.data && "error" in fetcher.data && fetcher.data.error ? (
            <FormErrors errors={[fetcher.data.error]} />
          ) : null}
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
}
