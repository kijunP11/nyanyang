import type { Route } from "./+types/navigation.layout";

import { Suspense } from "react";
import { Await, Outlet } from "react-router";

import Footer from "../components/footer";
import { NavigationBar } from "../components/navigation-bar";
import makeServerClient from "../lib/supa-client.server";

export interface NavigationOutletContext {
  user: {
    name: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
  loading: boolean;
}

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userPromise = client.auth.getUser();
  return { userPromise };
}

export default function NavigationLayout({ loaderData }: Route.ComponentProps) {
  const { userPromise } = loaderData;
  return (
    <div className="flex min-h-screen flex-col justify-between bg-white dark:bg-[#181D27]">
      <Suspense
        fallback={
          <>
            <NavigationBar loading={true} />
            <div className="mx-auto my-16 w-full max-w-screen-2xl px-5 md:my-32">
              <Outlet context={{ user: null, loading: true } satisfies NavigationOutletContext} />
            </div>
            <Footer />
          </>
        }
      >
        <Await resolve={userPromise}>
          {({ data: { user } }) => {
            const ctx: NavigationOutletContext = {
              user: user
                ? {
                    name: user.user_metadata.name || "Anonymous",
                    email: user.email,
                    avatarUrl: user.user_metadata.avatar_url,
                  }
                : null,
              loading: false,
            };
            return (
              <>
                {user === null ? (
                  <NavigationBar loading={false} />
                ) : (
                  <NavigationBar
                    name={ctx.user!.name}
                    email={ctx.user!.email}
                    avatarUrl={ctx.user!.avatarUrl}
                    loading={false}
                  />
                )}
                <div className="mx-auto my-16 w-full max-w-screen-2xl px-5 md:my-32">
                  <Outlet context={ctx} />
                </div>
                <Footer />
              </>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}
