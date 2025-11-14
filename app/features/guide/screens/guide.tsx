import type { Route } from "./+types/guide";

export const meta: Route.MetaFunction = () => [
  { title: `Guide | ${import.meta.env.VITE_APP_NAME}` },
];

export default function Guide() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <h1 className="text-2xl font-semibold">이용 가이드</h1>
      <p className="text-muted-foreground">
        네비게이션 데모용 가이드 페이지입니다.
      </p>
    </div>
  );
}
