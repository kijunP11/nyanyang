/**
 * Admin Dashboard — KPI, 서비스 상태, 긴급 알림, 퀵 액션 (F10 리디자인)
 */
import type { Route } from "./+types/dashboard";

import { BarChart3, Bell, Layers, Search, Users } from "lucide-react";
import { Link, useLoaderData } from "react-router";

import { requireAdmin } from "../lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

function KpiCard({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: number;
  change: number;
  positive: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
      <p className="mb-1 text-sm text-[#535862]">{label}</p>
      <p className="mb-2 text-3xl font-bold text-[#181D27]">
        {value.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <span
          className={`text-sm font-medium ${positive ? "text-green-600" : "text-red-500"}`}
        >
          {positive ? "↑" : "↓"} {change}%
        </span>
        <span className="text-xs text-[#717680]">vs 전 달 대비</span>
      </div>
      <svg className="mt-3 h-8 w-full" viewBox="0 0 100 30">
        <polyline
          points="0,25 15,20 30,22 45,15 60,18 75,10 100,5"
          fill="none"
          stroke={positive ? "#22c55e" : "#ef4444"}
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function StatusCard({
  label,
  name,
  status,
  color,
}: {
  label: string;
  name?: string;
  status: string;
  color: "green" | "orange" | "red";
}) {
  const dotColor = {
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  }[color];

  return (
    <div className="rounded-lg bg-[#F9FAFB] p-4">
      <p className="mb-2 text-xs text-[#717680]">{label}</p>
      {name && (
        <p className="mb-1 text-sm font-semibold text-[#181D27]">{name}</p>
      )}
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${dotColor}`} />
        <span className="text-sm text-[#414651]">{status}</span>
      </div>
    </div>
  );
}

function AlertCard({
  icon,
  label,
  count,
  href,
  bgColor,
  textColor,
}: {
  icon: string;
  label: string;
  count: number;
  href: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <Link
      to={href}
      className={`flex items-center justify-between rounded-lg border p-4 ${bgColor}`}
    >
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{count}건</span>
      </div>
      <span className="rounded border border-[#D5D7DA] px-2 py-1 text-xs text-[#535862]">
        처리하기 &gt;
      </span>
    </Link>
  );
}

function QuickActionCard({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Search;
  label: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex flex-col gap-3 rounded-lg border border-[#E9EAEB] p-6 transition-colors hover:bg-[#F5F5F5]"
    >
      <Icon className="size-6 text-[#717680]" />
      <span className="text-sm font-medium text-[#414651]">{label}</span>
    </Link>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const statsResponse = await fetch(
    new URL("/api/admin/stats", request.url).toString(),
    {
      headers: Object.fromEntries(request.headers.entries()),
    }
  );

  if (!statsResponse.ok) {
    throw new Response("Failed to load statistics", { status: 500 });
  }

  const statsData = await statsResponse.json();

  return { stats: statsData, headers };
}

export default function AdminDashboard() {
  const { stats } = useLoaderData<typeof loader>();
  const s = stats?.stats ?? {};
  const users = s.users ?? {};
  const messages = s.messages ?? {};
  const chats = s.chats ?? {};

  return (
    <div className="max-w-[1200px] p-8">
      <h2 className="mb-4 text-lg font-semibold text-[#181D27]">KPI</h2>
      <div className="mb-8 grid grid-cols-3 gap-4">
        <KpiCard
          label="전체 유저 수"
          value={users.total_users ?? 0}
          change={40}
          positive={true}
        />
        <KpiCard
          label="오늘 활성 유저(DAU)"
          value={
            (messages.messages_today ?? 0) > 0
              ? (users.new_users_today ?? 0) * 10
              : 0
          }
          change={10}
          positive={false}
        />
        <KpiCard
          label="현재 접속 중"
          value={chats.active_chat_rooms_today ?? 0}
          change={20}
          positive={true}
        />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-[#181D27]">
            서비스 상태
          </h2>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E9EAEB] p-4">
            <StatusCard
              label="모델 상태"
              name="Gemini"
              status="정상"
              color="green"
            />
            <StatusCard
              label="모델 상태"
              name="Opus"
              status="지연"
              color="orange"
            />
            <StatusCard label="서버 상태" status="정상" color="green" />
            <StatusCard label="로그 적재 상태" status="정상" color="green" />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-[#181D27]">
            긴급 알림 / 처리 대기
          </h2>
          <div className="flex flex-col gap-3">
            <AlertCard
              icon="📢"
              label="신고 대기"
              count={12}
              href="/admin/reports/users"
              bgColor="border-red-200 bg-red-50"
              textColor="text-red-700"
            />
            <AlertCard
              icon="⚠️"
              label="자동 블라인드"
              count={3}
              href="/admin/reports/characters"
              bgColor="border-orange-200 bg-orange-50"
              textColor="text-orange-700"
            />
            <AlertCard
              icon="📄"
              label="환불요청"
              count={2}
              href="/admin/payments/refunds"
              bgColor="border-yellow-200 bg-yellow-50"
              textColor="text-yellow-700"
            />
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-[#181D27]">
        오늘 할일 / 운영 퀵 액션
      </h2>
      <div className="grid grid-cols-5 gap-4">
        <QuickActionCard
          icon={Search}
          label="신고 처리하기"
          href="/admin/reports/users"
        />
        <QuickActionCard icon={Users} label="유저 검색" href="/admin/users" />
        <QuickActionCard
          icon={Layers}
          label="캐릭터 승인"
          href="/admin/characters"
        />
        <QuickActionCard icon={Bell} label="공지 등록" href="/admin/notices" />
        <QuickActionCard
          icon={BarChart3}
          label="통계 보기"
          href="/admin/stats/usage"
        />
      </div>
    </div>
  );
}
