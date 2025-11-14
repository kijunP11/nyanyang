import type { Route as ConnectProviderRoute } from "@rr/app/features/users/api/+types/connect-provider";
import type { Route as DisconnectProviderRoute } from "@rr/app/features/users/api/+types/disconnect-provider";

import {
  CheckCircle2Icon,
  Loader2Icon,
  PlugIcon,
  XCircleIcon,
} from "lucide-react";
import { Form, useFetcher, useNavigation } from "react-router";

import FormErrors from "~/core/components/form-error";
import { Button } from "~/core/components/ui/button";

export function ConnectProviderButton({
  provider,
  logo,
  providerKey,
}: {
  provider: string;
  logo: React.ReactNode;
  providerKey: string;
}) {
  const fetcher =
    useFetcher<ConnectProviderRoute.ComponentProps["actionData"]>();
  const navigation = useNavigation();
  return (
    <fetcher.Form method={"post"} action={"/api/users/providers"}>
      <input type="hidden" name="provider" value={providerKey} />
      <Button
        disabled={fetcher.state === "submitting"}
        className="w-1/3 justify-between"
        variant={"outline"}
      >
        <div className="flex w-1/5 items-center gap-2">
          <span>{logo}</span>
          <span>{provider}</span>
        </div>
        <div className="inline-flex items-center justify-center gap-2">
          <span className="flex items-center gap-2 text-xs">
            {fetcher.state === "idle" && navigation.state !== "loading" ? (
              <>
                <PlugIcon className="block size-4" />
              </>
            ) : null}
            {fetcher.state !== "idle" || navigation.state !== "idle" ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
          </span>
        </div>
      </Button>
    </fetcher.Form>
  );
}

export function DisconnectProviderButton({
  provider,
  logo,
  providerKey,
}: {
  provider: string;
  logo: React.ReactNode;
  providerKey: string;
}) {
  const fetcher =
    useFetcher<DisconnectProviderRoute.ComponentProps["actionData"]>();
  const navigation = useNavigation();
  return (
    <fetcher.Form
      method={"delete"}
      action={`/api/users/providers/${providerKey}`}
      className="group"
    >
      <input type="hidden" name="provider" value={providerKey} />
      <Button
        disabled={fetcher.state === "submitting"}
        className="w-1/3 justify-between"
        variant={"outline"}
      >
        <div className="flex w-1/5 items-center gap-2">
          <span>{logo}</span>
          <span>{provider}</span>
        </div>
        <div className="inline-flex items-center justify-center gap-2">
          <span className="flex items-center gap-2 text-xs">
            {fetcher.state === "idle" && navigation.state !== "loading" ? (
              <>
                <XCircleIcon className="hidden size-4 text-red-500 group-hover:block" />
                <CheckCircle2Icon className="block size-4 text-green-500 group-hover:hidden" />
              </>
            ) : null}
            {(fetcher.state === "submitting" ||
              navigation.state === "loading") && (
              <Loader2Icon className="block size-4 animate-spin" />
            )}
          </span>
        </div>
      </Button>
      {fetcher.data && "error" in fetcher.data ? (
        <FormErrors errors={[fetcher.data.error]} />
      ) : null}
    </fetcher.Form>
  );
}
