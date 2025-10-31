import type { Route } from "./+types/points";

export const meta: Route.MetaFunction = () => [
  { title: `Points | ${import.meta.env.VITE_APP_NAME}` },
];

export default function Points() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <h1 className="text-2xl font-semibold">포인트</h1>
      <p className="text-muted-foreground">
        여기는 데모용 포인트 페이지입니다.
      </p>
    </div>
  );
}
