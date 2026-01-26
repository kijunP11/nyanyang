/**
 * Notice and Event Banner Component
 * 
 * Displays announcements and events on the main page
 */
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/core/components/ui/alert";
import { Button } from "~/core/components/ui/button";

export interface NoticeData {
  id: string;
  type: "notice" | "event";
  title: string;
  content: string;
  date?: string;
  link?: string;
  imageUrl?: string;
}

interface NoticeBannerProps {
  notices: NoticeData[];
  onDismiss?: (id: string) => void;
}

export function NoticeBanner({ notices, onDismiss }: NoticeBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (notices.length === 0) return null;

  const activeNotices = notices.filter((notice) => !dismissed.has(notice.id));

  if (activeNotices.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    onDismiss?.(id);
  };

  return (
    <div className="space-y-4">
      {activeNotices.map((notice) => (
        <Alert
          key={notice.id}
          variant={notice.type === "event" ? "default" : "default"}
          className="relative border-[#41C7BD]/20 bg-gradient-to-r from-[#41C7BD]/10 to-transparent"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#41C7BD]" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <AlertTitle className="text-base font-semibold">
                  {notice.title}
                </AlertTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleDismiss(notice.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AlertDescription className="mt-2 text-sm">
                {notice.content}
              </AlertDescription>
              {notice.date && (
                <p className="text-muted-foreground mt-2 text-xs">
                  {notice.date}
                </p>
              )}
              {notice.link && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 h-auto p-0 text-[#41C7BD]"
                  asChild
                >
                  <a href={notice.link} target="_blank" rel="noopener noreferrer">
                    자세히 보기 →
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}


