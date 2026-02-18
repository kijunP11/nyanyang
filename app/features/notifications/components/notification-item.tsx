/**
 * 알림 항목 카드 — 타입별 아이콘/색상, 날짜, 제목/본문/부제
 */
import {
  CircleCheckBig,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";

interface Notification {
  notification_id: number;
  type: string;
  title: string;
  body: string;
  subtitle: string | null;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
}

const ICON_CONFIG: Record<
  string,
  { icon: typeof Heart; className: string }
> = {
  checkin: { icon: CircleCheckBig, className: "text-[#00C4AF]" },
  like: { icon: Heart, className: "text-[#F87171]" },
  comment: { icon: MessageCircle, className: "text-[#3B82F6]" },
  follow: { icon: UserPlus, className: "text-[#F97316]" },
};

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const config = ICON_CONFIG[notification.type] ?? ICON_CONFIG.checkin;
  const Icon = config.icon;

  return (
    <div className="flex gap-3 border-b border-[#E9EAEB] py-4 last:border-b-0 dark:border-[#333741]">
      <div className="flex size-10 shrink-0 items-center justify-center">
        <Icon className={`size-6 ${config.className}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-black dark:text-white">
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-[#717680]">
            {formatDate(notification.created_at)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-black dark:text-white">{notification.body}</p>
        {notification.subtitle && (
          <p className="mt-0.5 text-sm text-[#717680]">
            {notification.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
