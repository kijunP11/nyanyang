import { useState } from "react";
import { data, Link, useFetcher, useSearchParams } from "react-router";
import { desc, eq, sql } from "drizzle-orm";

import type { Route } from "./+types/my-content";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "~/features/characters/schema";
import { chatRooms } from "~/features/chat/schema";
import { comments } from "~/features/comments/schema";

const ITEMS_PER_PAGE = 5;

/** Map DB status to UI status */
function mapStatus(
  dbStatus: "draft" | "pending_review" | "approved" | "rejected" | "archived",
): string {
  switch (dbStatus) {
    case "approved":
      return "published";
    case "rejected":
      return "rejected";
    default:
      return "reviewing";
  }
}

/** Format like count for display (e.g. 1100 → "1.1K") */
function formatLikeCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(count);
}

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const db = drizzle;

  // 1) Fetch user's characters with extended columns
  const myChars = await db
    .select({
      character_id: characters.character_id,
      name: characters.name,
      display_name: characters.display_name,
      description: characters.description,
      tagline: characters.tagline,
      avatar_url: characters.avatar_url,
      gallery_urls: characters.gallery_urls,
      personality_traits: characters.personality_traits,
      tags: characters.tags,
      status: characters.status,
      like_count: characters.like_count,
      chat_count: characters.chat_count,
      created_at: characters.created_at,
    })
    .from(characters)
    .where(eq(characters.creator_id, user.id))
    .orderBy(desc(characters.created_at))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  // 2) Total count for pagination
  const [{ count: totalCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(characters)
    .where(eq(characters.creator_id, user.id));

  // 3) Check existing chat rooms for each character (batch)
  const charIds = myChars.map((c) => c.character_id);
  let chatRoomMap: Record<number, boolean> = {};
  if (charIds.length > 0) {
    const existingRooms = await db
      .select({ character_id: chatRooms.character_id })
      .from(chatRooms)
      .where(
        sql`${chatRooms.user_id} = ${user.id} AND ${chatRooms.character_id} IN (${sql.join(
          charIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
    for (const r of existingRooms) {
      chatRoomMap[r.character_id] = true;
    }
  }

  // 4) Comment counts + latest comment per character (batch)
  let commentDataMap: Record<
    number,
    { commentCount: number; latestComment: string | null }
  > = {};
  if (charIds.length > 0) {
    const commentCounts = await db
      .select({
        character_id: comments.character_id,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(
        sql`${comments.character_id} IN (${sql.join(
          charIds.map((id) => sql`${id}`),
          sql`, `,
        )}) AND ${comments.is_deleted} = 0`,
      )
      .groupBy(comments.character_id);

    for (const row of commentCounts) {
      commentDataMap[row.character_id] = {
        commentCount: row.count,
        latestComment: null,
      };
    }

    // Latest comment per character
    const latestComments = await db
      .select({
        character_id: comments.character_id,
        content: comments.content,
      })
      .from(comments)
      .where(
        sql`${comments.character_id} IN (${sql.join(
          charIds.map((id) => sql`${id}`),
          sql`, `,
        )}) AND ${comments.is_deleted} = 0`,
      )
      .orderBy(desc(comments.created_at))
      .limit(charIds.length);

    // De-duplicate: keep only first (latest) per character_id
    const seen = new Set<number>();
    for (const row of latestComments) {
      if (!seen.has(row.character_id)) {
        seen.add(row.character_id);
        if (commentDataMap[row.character_id]) {
          commentDataMap[row.character_id].latestComment = row.content;
        } else {
          commentDataMap[row.character_id] = {
            commentCount: 0,
            latestComment: row.content,
          };
        }
      }
    }
  }

  // 5) Build items for the UI
  const items = myChars.map((c) => {
    const galleryUrls = (c.gallery_urls as string[] | null) ?? [];
    const cData = commentDataMap[c.character_id] ?? {
      commentCount: 0,
      latestComment: null,
    };
    return {
      id: c.character_id,
      title: c.display_name || c.name,
      characterName: c.name,
      tags:
        (c.tags ?? []).length > 0
          ? (c.tags ?? []).map((t) => `#${t}`).join(" ")
          : "",
      status: mapStatus(c.status),
      date: c.created_at
        ? new Date(c.created_at).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "",
      avatarUrl: c.avatar_url,
      character: {
        name: c.name,
        username: c.display_name || c.name,
        isVerified: c.status === "approved",
        tags: c.tags ?? [],
        tagline: c.tagline ?? "",
        hashtags: c.personality_traits ?? [],
        description: c.description ?? "",
        likeCount: formatLikeCount(c.like_count),
        imageCount: galleryUrls.length,
        galleryUrls,
        commentCount: cData.commentCount,
        latestComment: cData.latestComment,
        hasExistingChat: !!chatRoomMap[c.character_id],
      },
    };
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  return data(
    { items, currentPage: page, totalPages },
    { headers },
  );
}

export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const characterId = Number(formData.get("characterId"));
    if (!characterId) throw new Response("Bad Request", { status: 400 });

    const db = drizzle;
    await db
      .delete(characters)
      .where(
        sql`${characters.character_id} = ${characterId} AND ${characters.creator_id} = ${user.id}`,
      );
  }

  return data(null, { headers });
}

/** Plus icon — Figma Untitled UI, viewBox 0 0 13.3367 13.3367 */
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 13.3367 13.3367"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.66833 0.835V12.5017M0.835 6.66833H12.5017"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Arrow-down icon — Figma Untitled UI, viewBox 0 0 10.6667 10.6667 */
function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 10.6667 10.6667"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.33333 0.666667V10M5.33333 10L10 5.33333M5.33333 10L0.666667 5.33333"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Dots-vertical (more-vertical) icon — Figma Untitled UI, viewBox 0 0 4 18 */
function DotsVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 4 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 10C2.55228 10 3 9.55228 3 9C3 8.44772 2.55228 8 2 8C1.44772 8 1 8.44772 1 9C1 9.55228 1.44772 10 2 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 3C2.55228 3 3 2.55228 3 2C3 1.44772 2.55228 1 2 1C1.44772 1 1 1.44772 1 2C1 2.55228 1.44772 3 2 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 17C2.55228 17 3 16.5523 3 16C3 15.4477 2.55228 15 2 15C1.44772 15 1 15.4477 1 16C1 16.5523 1.44772 17 2 17Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Edit icon — Figma Untitled UI edit-3, viewBox 0 0 16.6667 15.9345 */
function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16.6667 15.9345"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.33335 15.1011H15.8334M12.0834 1.3511C12.4149 1.01958 12.8645 0.833333 13.3334 0.833333C13.5655 0.833333 13.7954 0.879058 14.0098 0.967897C14.2243 1.05674 14.4192 1.18695 14.5834 1.3511C14.7475 1.51525 14.8777 1.71013 14.9666 1.9246C15.0554 2.13908 15.1011 2.36895 15.1011 2.6011C15.1011 2.83325 15.0554 3.06312 14.9666 3.2776C14.8777 3.49207 14.7475 3.68695 14.5834 3.8511L4.16668 14.2678L0.833351 15.1011L1.66668 11.7678L12.0834 1.3511Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Trash icon — Figma Untitled UI trash-2, viewBox 0 0 16.6667 18.3333 */
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16.6667 18.3333"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.833333 4.16667H2.5M2.5 4.16667H15.8333M2.5 4.16667V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H12.5C12.942 17.5 13.366 17.3244 13.6785 17.0118C13.9911 16.6993 14.1667 16.2754 14.1667 15.8333V4.16667H2.5ZM5 4.16667V2.5C5 2.05797 5.17559 1.63405 5.48816 1.32149C5.80072 1.00893 6.22464 0.833333 6.66667 0.833333H10C10.442 0.833333 10.866 1.00893 11.1785 1.32149C11.4911 1.63405 11.6667 2.05797 11.6667 2.5V4.16667M6.66667 8.33333V13.3333M10 8.33333V13.3333"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Empty state placeholder avatar — Figma 140x140, bg-[#ededed], silhouette */
function EmptyAvatar() {
  return (
    <div className="relative size-[140px] rounded-[8px]">
      <div className="absolute left-0 top-0 size-[140px] overflow-hidden rounded-[8px] bg-[#ededed]">
        <div className="absolute inset-[7.14%_5.71%_-20.71%_5%]">
          <svg
            className="absolute size-full"
            viewBox="0 0 125 159"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M125 132.477C109.414 148.82 87.4376 159 63.0834 159C38.7291 159 15.6466 148.298 0 131.229L42.9363 116.006L43.1972 105.137C37.9281 105.553 35.6887 104.853 34.7364 104.189C34.2935 103.88 34.4293 103.198 34.9556 103.079C38.2584 102.333 39.186 99.9383 39.186 99.9383C28.1664 103.207 23.2492 97.0399 22.0207 95.1164C21.8339 94.8244 21.9281 94.4428 22.2229 94.2635C26.4934 91.6649 26.2202 89.2006 26.2202 89.2006C19.2442 89.6116 16.7748 88.5811 15.9723 88.0357C15.784 87.9075 15.7932 87.6294 15.9892 87.5181C20.1702 85.1327 19.9973 82.0427 19.9973 82.0427C17.4986 84.2768 15.6127 84.629 14.6434 84.6182C14.3641 84.6151 14.2375 84.2613 14.452 84.0821C19.7581 79.6001 18.7025 76.745 18.7025 76.745C13.5214 67.2757 12.5089 60.8501 13.6341 50.9282C14.7592 41.0079 21.5176 26.6905 25.7958 18.5747C30.0755 10.4573 34.3552 6.96257 44.8285 2.67833C52.7058 -0.54297 58.0366 1.40062 60.1927 2.56245C60.8687 2.92552 61.6897 2.89927 62.3287 2.47285C69.9575 -2.63951 78.6034 0.822795 88.072 6.96257C97.9819 13.3882 108.653 35.4274 110.596 40.5861C112.539 45.7433 112.96 47.6884 113.382 58.0027C113.804 68.317 109.806 71.6712 108.004 75.0547C106.683 77.5313 108.477 81.8867 109.529 84.0373C109.801 84.5935 109.25 85.2038 108.674 84.9751C106.199 83.9894 103.836 81.1976 103.836 81.1976C103.084 83.5012 106.19 87.5444 107.555 89.1713C107.863 89.5374 107.711 90.1044 107.258 90.2558C102.911 91.7236 98.1486 88.9194 98.1486 88.9194C97.4248 90.3238 100.373 94.5664 101.559 96.1793C101.867 96.5965 101.882 97.165 101.592 97.5945C98.0066 102.926 86.3419 100.858 86.7184 101.826C87.0163 102.594 89.532 103.714 90.7451 104.216C91.0445 104.341 91.0862 104.76 90.8068 104.927C87.95 106.64 81.2009 105.378 81.2009 105.378V116.281L124.997 132.479L125 132.477Z"
              fill="#C6C6C6"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Status badge colors by status type */
const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  published: {
    bg: "bg-[#ecfdf3]",
    text: "text-[#027a48]",
    dot: "bg-[#12b76a]",
    label: "공개",
  },
  rejected: {
    bg: "bg-[#fef3f2]",
    text: "text-[#b42318]",
    dot: "bg-[#f04438]",
    label: "심사불가",
  },
  reviewing: {
    bg: "bg-[#fff6ed]",
    text: "text-[#c4320a]",
    dot: "bg-[#feb273]",
    label: "심사중",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.reviewing;
  return (
    <div className="flex items-start mix-blend-multiply">
      <div
        className={`flex items-center gap-[6px] rounded-[16px] pl-[6px] pr-[8px] py-[2px] ${config.bg}`}
      >
        <div className="flex size-[8px] items-center justify-center overflow-hidden">
          <div className={`size-[6px] rounded-full ${config.dot}`} />
        </div>
        <span
          className={`whitespace-nowrap text-center font-medium text-[12px] leading-[18px] ${config.text}`}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

/** X close icon — Figma, viewBox 0 0 14 14 */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 1L1 13M1 1L13 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Chevron-left icon — Figma, viewBox 0 0 7.60494 13.3086 */
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 7.60494 13.3086"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.65432 12.358L0.950617 6.65432L6.65432 0.950617"
        stroke="currentColor"
        strokeWidth="1.90123"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Chevron-right icon — Figma, viewBox 0 0 7.60494 13.3086 */
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 7.60494 13.3086"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.950617 12.358L6.65432 6.65432L0.950617 0.950617"
        stroke="currentColor"
        strokeWidth="1.90123"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Heart icon — Figma, viewBox 0 0 19.0893 16.8632 */
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 19.0893 16.8632"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.9111 2.17819C16.4854 1.75236 15.9801 1.41456 15.4239 1.18409C14.8677 0.953623 14.2715 0.835 13.6694 0.835C13.0673 0.835 12.4712 0.953623 11.9149 1.18409C11.3587 1.41456 10.8534 1.75236 10.4277 2.17819L9.54441 3.06152L8.66108 2.17819C7.80133 1.31844 6.63527 0.835446 5.41941 0.835446C4.20355 0.835446 3.03749 1.31844 2.17774 2.17819C1.318 3.03793 0.835 4.20399 0.835 5.41985C0.835 6.63572 1.318 7.80178 2.17774 8.66152L3.06108 9.54485L9.54441 16.0282L16.0277 9.54485L16.9111 8.66152C17.3369 8.23589 17.6747 7.73053 17.9052 7.17432C18.1356 6.6181 18.2543 6.02193 18.2543 5.41985C18.2543 4.81778 18.1356 4.22161 17.9052 3.66539C17.6747 3.10918 17.3369 2.60382 16.9111 2.17819V2.17819Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Image icon — Figma, viewBox 0 0 13.3333 13.3333 */
function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 13.3333 13.3333"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 12.6667H11.3333C12.0697 12.6667 12.6667 12.0697 12.6667 11.3333V2C12.6667 1.26362 12.0697 0.666667 11.3333 0.666667H2C1.26362 0.666667 0.666667 1.26362 0.666667 2V11.3333C0.666667 12.0697 1.26362 12.6667 2 12.6667ZM2 12.6667L9.33333 5.33333L12.6667 8.66667M5.33333 4.33333C5.33333 4.88562 4.88562 5.33333 4.33333 5.33333C3.78105 5.33333 3.33333 4.88562 3.33333 4.33333C3.33333 3.78105 3.78105 3.33333 4.33333 3.33333C4.88562 3.33333 5.33333 3.78105 5.33333 4.33333Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Verified badge — Figma hexagon + star composite */
function VerifiedBadge() {
  return (
    <div className="relative h-[14px] w-[11.581px]">
      <svg
        className="absolute size-full"
        viewBox="0 0 11.581 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.4607 4.43398C11.3892 4.27262 11.2871 4.12537 11.161 4.00024C11.0758 3.91509 10.9799 3.84029 10.8736 3.77961L6.49807 1.25433C6.49055 1.24962 6.48302 1.24539 6.47361 1.24209C6.03987 1.0017 5.51346 1.00641 5.08302 1.25433L0.707529 3.77961C0.269557 4.03223 0 4.50078 0 5.00602V10.0585C0 10.4174 0.136896 10.7585 0.372582 11.0167C0.46855 11.1216 0.580984 11.2115 0.707059 11.2844L0.822785 11.3512L3.18859 12.7159L4.56695 13.5133L5.08255 13.8102C5.21474 13.8864 5.35634 13.9409 5.50264 13.9701C5.83712 14.0402 6.19182 13.987 6.4976 13.8102L10.8731 11.2849C11.3111 11.0323 11.5806 10.5637 11.5806 10.0585V5.00602C11.5806 4.80515 11.5378 4.61039 11.4607 4.43398Z"
          fill="url(#paint0_hex)"
        />
        <path
          d="M11.0696 2.99539C10.9858 2.91165 10.8917 2.83827 10.7868 2.77852L6.48615 0.296052C6.47862 0.291348 6.47109 0.287114 6.46215 0.284291C6.03594 0.0481344 5.51847 0.0523683 5.09555 0.296052L0.794864 2.77852C0.363948 3.02691 0.0995654 3.48746 0.0995654 3.98377V8.95012C0.0995654 9.30294 0.234109 9.63789 0.466031 9.89239C0.560118 9.99541 0.67067 10.0839 0.794864 10.1554L0.908708 10.2212L3.23405 11.5624L4.5889 12.3462L5.09602 12.6378C5.22633 12.7126 5.36511 12.7663 5.50859 12.795C5.83742 12.8636 6.18601 12.8114 6.48662 12.6378L10.7873 10.1554C11.2182 9.90698 11.4826 9.44642 11.4826 8.95012V3.98377C11.4826 3.78619 11.4407 3.59519 11.3645 3.4216C11.2944 3.26307 11.1942 3.11817 11.07 2.99539H11.0696Z"
          fill="url(#paint1_hex)"
        />
        <path
          d="M10.8735 2.71454L6.49801 0.189256C6.49048 0.184551 6.48295 0.180323 6.47355 0.17703L0.000403916 4.38645V8.99292C0.000403916 9.35186 0.137299 9.69292 0.372986 9.95119L11.1609 2.9347C11.0758 2.84955 10.9798 2.77475 10.8735 2.71407V2.71454ZM11.4606 3.36891L0.823189 10.2866L3.18899 11.6513L11.5806 6.19432V3.94142C11.5806 3.74055 11.5377 3.54579 11.4606 3.36938V3.36891ZM4.56736 12.4482L5.08295 12.7451C5.21514 12.8213 5.35674 12.8759 5.50304 12.905L11.581 8.95246V7.8874L4.56783 12.4482H4.56736Z"
          fill="url(#paint2_hex)"
        />
        <path
          d="M0.997269 9.07228V3.86083C0.997269 3.76063 1.0509 3.66795 1.13746 3.61809L5.65078 1.01237C5.73734 0.9625 5.8446 0.9625 5.93116 1.01237L10.444 3.61809C10.5306 3.66842 10.5842 3.76063 10.5842 3.86083V9.07228C10.5842 9.17248 10.5306 9.26516 10.444 9.31502L5.93069 11.9207C5.84413 11.9711 5.73687 11.9711 5.65031 11.9207L1.13746 9.31502C1.0509 9.26469 0.997269 9.17248 0.997269 9.07228Z"
          fill="#015047"
        />
        <path
          d="M1.78531 8.61737V4.31574C1.78531 4.21554 1.83894 4.12287 1.9255 4.073L5.65085 1.92219C5.73741 1.87232 5.84467 1.87232 5.93123 1.92219L9.6561 4.073C9.74266 4.12287 9.79629 4.21554 9.79629 4.31574V8.61737C9.79629 8.71757 9.74266 8.81025 9.6561 8.86011L5.93075 11.0109C5.8442 11.0613 5.73694 11.0613 5.65038 11.0109L1.9255 8.86011C1.83894 8.80978 1.78531 8.71757 1.78531 8.61737Z"
          fill="#076E63"
        />
        <path
          d="M11.4607 3.36894C11.3892 3.20758 11.2871 3.06033 11.161 2.9352C11.0759 2.85005 10.9799 2.77525 10.8736 2.71456L6.49809 0.189284C6.49057 0.184579 6.48304 0.180351 6.47363 0.177058C6.03989 -0.063333 5.51348 -0.058634 5.08303 0.189284L0.707547 2.71456C0.269575 2.96719 1.76774e-05 3.43573 1.76774e-05 3.94098V8.99342C1.76774e-05 9.35235 0.136914 9.69342 0.3726 9.95168C0.468568 10.0566 0.581001 10.1464 0.707077 10.2194L0.822803 10.2862L3.1886 11.6509L4.56697 12.4483L5.08256 12.7451C5.21475 12.8213 5.35635 12.8759 5.50266 12.9051C5.83714 12.9752 6.19184 12.922 6.49762 12.7451L10.8731 10.2198C11.3111 9.96721 11.5806 9.49866 11.5806 8.99342V3.94098C11.5806 3.7401 11.5378 3.54535 11.4607 3.36894ZM11.4823 8.95014C11.4823 9.44644 11.2175 9.907 10.787 10.1554L6.48633 12.6379C6.18573 12.8114 5.83714 12.8637 5.5083 12.795C5.36482 12.7668 5.22557 12.7127 5.09574 12.6379L4.58861 12.3462L3.23377 11.5624L0.908422 10.2212L0.794577 10.1554C0.670383 10.0834 0.559832 9.99543 0.465745 9.89241C0.233822 9.63838 0.0992788 9.30343 0.0992788 8.95014V3.98379C0.0992788 3.48748 0.364132 3.02693 0.794577 2.77854L5.09526 0.296072C5.51865 0.0523888 6.03566 0.0476845 6.46187 0.284312C6.47081 0.287134 6.47833 0.291839 6.48586 0.296072L10.7865 2.77854C10.8915 2.83829 10.9855 2.91167 11.0693 2.99541C11.1935 3.11819 11.2937 3.26309 11.3638 3.42162C11.44 3.59521 11.4818 3.78668 11.4818 3.98379V8.95014H11.4823Z"
          fill="url(#paint3_hex)"
        />
        <defs>
          <linearGradient id="paint0_hex" x1="0.000470432" y1="7.53224" x2="11.5811" y2="7.53224" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00C4AF" />
            <stop offset="1" stopColor="#05433D" />
          </linearGradient>
          <linearGradient id="paint1_hex" x1="1.31469" y1="9.48124" x2="10.7567" y2="3.12288" gradientUnits="userSpaceOnUse">
            <stop stopColor="#57CFC4" />
            <stop offset="1" stopColor="#5BD9CE" />
          </linearGradient>
          <linearGradient id="paint2_hex" x1="0.468199" y1="10.1313" x2="11.2843" y2="3.09654" gradientUnits="userSpaceOnUse">
            <stop stopColor="#66EDE1" />
            <stop offset="1" stopColor="#B1FFF8" />
          </linearGradient>
          <radialGradient id="paint3_hex" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(5.79103 6.4672) scale(6.13819)">
            <stop stopColor="#6CEEE3" />
            <stop offset="1" stopColor="#01A795" />
          </radialGradient>
        </defs>
      </svg>
      <svg
        className="absolute left-[25.74%] top-[25.44%] h-[5.979px] w-[5.62px]"
        viewBox="0 0 5.61998 5.97911"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.96409 0.729909L3.45145 2.22965C3.51167 2.41547 3.68479 2.54107 3.88049 2.54107H5.45737C5.6145 2.54107 5.67989 2.74242 5.55287 2.83462L4.27706 3.76184C4.119 3.87663 4.05266 4.08033 4.11335 4.26615L4.60072 5.76588C4.64917 5.91548 4.47794 6.03967 4.35092 5.94747L3.07511 5.02072C2.91704 4.90593 2.703 4.90593 2.54493 5.02072L1.26912 5.94747C1.1421 6.03967 0.970866 5.91548 1.01932 5.76588L1.50669 4.26615C1.5669 4.08033 1.50104 3.87663 1.34298 3.76184L0.0671663 2.83462C-0.0598503 2.74242 0.00553971 2.54107 0.162664 2.54107H1.73955C1.93478 2.54107 2.1079 2.41547 2.16859 2.22965L2.65595 0.729909C2.70441 0.580312 2.9161 0.580312 2.96456 0.729909H2.96409Z"
          fill="#015047"
        />
        <path
          d="M2.964 0.112198L3.45137 1.61193C3.51158 1.79776 3.6847 1.92336 3.8804 1.92336H5.45729C5.61441 1.92336 5.6798 2.1247 5.55278 2.21691L4.27697 3.14366C4.11891 3.25844 4.05258 3.46214 4.11326 3.64797L4.60063 5.1477C4.64908 5.2973 4.47785 5.42149 4.35083 5.32929L3.07502 4.40206C2.91695 4.28728 2.70291 4.28728 2.54484 4.40206L1.26903 5.32929C1.14202 5.42149 0.970778 5.2973 1.01923 5.1477L1.5066 3.64797C1.56682 3.46214 1.50096 3.25844 1.34289 3.14366L0.0670785 2.21691C-0.0599381 2.1247 0.00545186 1.92336 0.162576 1.92336H1.73946C1.93469 1.92336 2.10781 1.79776 2.1685 1.61193L2.65586 0.112198C2.70432 -0.0373993 2.91601 -0.0373993 2.96447 0.112198H2.964Z"
          fill="url(#paint_star)"
        />
        <defs>
          <radialGradient id="paint_star" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(2.8097 2.68076) scale(2.74638)">
            <stop stopColor="#6CEEE3" />
            <stop offset="1" stopColor="#00C2AD" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

/** User icon — Figma, viewBox 0 0 15.0033 16.67 */
function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 15.0033 16.67"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.1683 15.835V14.1683C14.1683 13.2843 13.8171 12.4364 13.192 11.8113C12.5669 11.1862 11.7191 10.835 10.835 10.835H4.16833C3.28428 10.835 2.43643 11.1862 1.81131 11.8113C1.18619 12.4364 0.835 13.2843 0.835 14.1683V15.835M10.835 4.16833C10.835 6.00928 9.34262 7.50167 7.50167 7.50167C5.66072 7.50167 4.16833 6.00928 4.16833 4.16833C4.16833 2.32738 5.66072 0.835 7.50167 0.835C9.34262 0.835 10.835 2.32738 10.835 4.16833Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Character data for the modal */
interface CharacterInfo {
  name: string;
  username: string;
  isVerified: boolean;
  tags: string[];
  tagline: string;
  hashtags: string[];
  description: string;
  likeCount: string;
  imageCount: number;
  galleryUrls: string[];
  commentCount: number;
  latestComment: string | null;
  hasExistingChat: boolean;
}

/** Character Info Modal */
function CharacterInfoModal({
  character,
  onClose,
}: {
  character: CharacterInfo;
  onClose: () => void;
}) {
  const [currentImage, setCurrentImage] = useState(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,24,40,0.7)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[90vh] w-[400px] flex-col overflow-clip rounded-[8px] bg-white">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-[24px] pt-[24px] pb-[24px]">
          <p className="font-semibold text-[20px] leading-[30px] text-black">
            캐릭터 정보
          </p>
          <button type="button" onClick={onClose} className="size-[24px]">
            <XIcon className="mx-auto size-[14px] text-[#181d27]" />
          </button>
        </div>

        {/* Image Area */}
        <div className="relative h-[400px] w-full shrink-0 bg-[#d9d9d9]">
          {character.galleryUrls[currentImage - 1] ? (
            <img
              src={character.galleryUrls[currentImage - 1]}
              alt={`${character.name} ${currentImage}`}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[#d9d9d9]" />
          )}

          {/* Left arrow */}
          <button
            type="button"
            className="absolute left-[14px] top-1/2 flex size-[48px] -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(0,0,0,0.6)] backdrop-blur-[6.519px]"
            onClick={() =>
              setCurrentImage((p) =>
                p > 1 ? p - 1 : character.imageCount,
              )
            }
          >
            <ChevronLeftIcon className="h-[13.309px] w-[7.605px] text-white" />
          </button>

          {/* Right arrow */}
          <button
            type="button"
            className="absolute right-[14px] top-1/2 flex size-[48px] -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(0,0,0,0.6)] backdrop-blur-[6.519px]"
            onClick={() =>
              setCurrentImage((p) =>
                p < character.imageCount ? p + 1 : 1,
              )
            }
          >
            <ChevronRightIcon className="h-[13.309px] w-[7.605px] text-white" />
          </button>

          {/* Like button — right side */}
          <div className="absolute bottom-[22px] right-[24px] flex items-center gap-[8px] rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]">
            <HeartIcon className="size-[20px] text-[#414651]" />
            <span className="font-semibold text-[14px] leading-[20px] text-[#414651]">
              {character.likeCount}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Character Info */}
          <div className="flex flex-col gap-[14px] px-[24px] pt-[24px]">
            {/* Name + Username */}
            <div className="flex flex-col gap-[8px]">
              <p className="font-semibold text-[20px] leading-[30px] text-black">
                {character.name}
              </p>
              <div className="flex items-center gap-[2px] self-start overflow-hidden rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px]">
                <span className="text-[12px] leading-[16px] text-[#9ca3af]">
                  @{character.username}
                </span>
                {character.isVerified && <VerifiedBadge />}
              </div>
            </div>

            {/* Tags */}
            {character.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-[4px]">
                {character.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center justify-center overflow-hidden rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px]"
                  >
                    <span className="text-[12px] leading-[16px] text-[#9ca3af]">
                      #{tag}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tagline + Hashtags */}
          <div className="mt-[24px] flex flex-col gap-[4px] px-[24px]">
            <p className="font-medium text-[16px] leading-[24px] text-black">
              {character.tagline}
            </p>
            {character.hashtags.length > 0 && (
              <div className="flex flex-wrap items-center gap-[5px] text-[16px] leading-[24px] text-[#535862]">
                {character.hashtags.map((h) => (
                  <span key={h}>#{h}</span>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mt-[24px] h-px w-full bg-[#d5d7da]" />

          {/* 상세 설명 Section */}
          {character.description && (
            <>
              <div className="px-[24px] pt-[21px]">
                <p className="font-semibold text-[20px] leading-[30px] text-black">
                  상세 설명
                </p>
                <div className="mt-[14px] w-[352px] whitespace-pre-wrap text-[14px] leading-[20px] text-black">
                  {character.description}
                </div>
              </div>

              {/* Divider */}
              <div className="mt-[24px] h-px w-full bg-[#d5d7da]" />
            </>
          )}

          {/* 댓글 Section */}
          <div className="px-[24px] pt-[21px] pb-[24px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[8px]">
                <p className="font-semibold text-[20px] leading-[30px] text-black">
                  댓글
                </p>
                <div className="flex items-center justify-center overflow-hidden rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px]">
                  <span className="text-[12px] leading-[16px] text-[#9ca3af]">
                    {character.commentCount}개
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="text-[14px] leading-[20px] text-black"
              >
                전체보기
              </button>
            </div>

            {/* Latest Comment or Empty */}
            <div className="mt-[12px] flex w-full items-center gap-[8px] overflow-hidden rounded-[8px] bg-[#f5f5f5] px-[14px] py-[12px]">
              <UserIcon className="size-[20px] shrink-0 text-[#535862]" />
              <span className="truncate font-semibold text-[14px] leading-[20px] text-[#535862]">
                {character.latestComment ?? "첫 댓글을 남겨보세요!"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex h-[92px] shrink-0 items-start border-t border-[#d5d7da] p-[24px] shadow-[4px_0px_16px_0px_rgba(0,0,0,0.65)]">
          <div className="flex w-full flex-1 items-start gap-[12px]">
            {/* Heart button */}
            <button
              type="button"
              className="flex h-[44px] w-[44px] items-center justify-center rounded-[8px] border border-[#d5d7da] bg-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
            >
              <HeartIcon className="size-[20px] text-[#414651]" />
            </button>

            {character.hasExistingChat ? (
              <>
                {/* 이어서 대화하기 */}
                <button
                  type="button"
                  className="flex h-[44px] flex-1 items-center justify-center overflow-hidden rounded-[8px] border border-[#e9faf7] bg-[#e9faf7] px-[18px] py-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
                >
                  <span className="whitespace-nowrap font-semibold text-[16px] leading-[24px] text-[#28a393]">
                    이어서 대화하기
                  </span>
                </button>
                {/* 새 대화하기 */}
                <button
                  type="button"
                  className="flex h-[44px] flex-1 items-center justify-center overflow-hidden rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
                >
                  <span className="whitespace-nowrap font-semibold text-[16px] leading-[24px] text-white">
                    새 대화하기
                  </span>
                </button>
              </>
            ) : (
              /* 대화하기 (첫 진입) */
              <button
                type="button"
                className="flex h-[44px] flex-1 items-center justify-center overflow-hidden rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
              >
                <span className="font-semibold text-[16px] leading-[24px] text-white">
                  대화하기
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Delete Confirmation Modal */
function DeleteConfirmModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,24,40,0.7)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-[400px] flex-col gap-[32px] overflow-clip rounded-[12px] bg-white p-[24px] shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03)]">
        {/* Text */}
        <div className="flex w-full flex-col gap-[8px]">
          <p className="font-semibold text-[18px] leading-[28px] text-[#181d27]">
            캐릭터를 삭제하시겠습니까?
          </p>
          <p className="text-[14px] leading-[20px] text-[#535862]">
            다시 한번 확인해주세요
          </p>
        </div>
        {/* Actions */}
        <div className="flex w-full gap-[12px]">
          <button
            type="button"
            onClick={onClose}
            className="flex flex-1 items-center justify-center overflow-clip rounded-[8px] border border-[#d5d7da] bg-white px-[18px] py-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
          >
            <span className="whitespace-nowrap font-semibold text-[16px] leading-[24px] text-[#414651]">
              돌아가기
            </span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center overflow-clip rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
          >
            <span className="whitespace-nowrap font-semibold text-[16px] leading-[24px] text-white">
              삭제하기
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Content item for table rows */
interface ContentItem {
  id: number;
  title: string;
  characterName: string;
  tags: string;
  status: string;
  date: string;
  avatarUrl: string | null;
  character: CharacterInfo;
}

export default function MyContent({ loaderData }: Route.ComponentProps) {
  const { items, currentPage, totalPages } = loaderData as {
    items: ContentItem[];
    currentPage: number;
    totalPages: number;
  };
  const isEmpty = items.length === 0;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterInfo | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const fetcher = useFetcher();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    setSearchParams(params);
  }

  function handleDelete() {
    if (deleteTargetId === null) return;
    fetcher.submit(
      { intent: "delete", characterId: String(deleteTargetId) },
      { method: "post" },
    );
    setDeleteTargetId(null);
  }

  return (
    <div className="min-h-screen bg-[#fdfdfd]">
      {selectedCharacter && (
        <CharacterInfoModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
      {deleteTargetId !== null && (
        <DeleteConfirmModal
          onClose={() => setDeleteTargetId(null)}
          onConfirm={handleDelete}
        />
      )}
      <div className="mx-auto flex max-w-[816px] flex-col gap-[30px] py-[40px]">
        {/* Page Header */}
        <div className="flex gap-[16px] items-start">
          <div className="flex min-h-px min-w-px flex-1 flex-col gap-[4px]">
            <h1 className="font-semibold text-[24px] leading-[32px] text-[#181d27]">
              내 컨텐츠
            </h1>
            <p className="text-[16px] leading-[24px] text-[#535862]">
              마음에 드는 캐릭터와 작품을 만들어보세요!
            </p>
          </div>
          <div className="flex items-center gap-[12px]">
            <Link
              to="#"
              className="flex items-center justify-center gap-[8px] overflow-hidden rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[16px] py-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
            >
              <div className="flex size-[20px] items-center justify-center overflow-hidden">
                <PlusIcon className="size-[11.67px] text-white" />
              </div>
              <span className="whitespace-nowrap font-semibold text-[14px] leading-[20px] text-white">
                컨텐츠 만들기
              </span>
            </Link>
            <Link
              to="/characters/create"
              className="flex items-center justify-center gap-[8px] overflow-hidden rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[16px] py-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
            >
              <div className="flex size-[20px] items-center justify-center overflow-hidden">
                <PlusIcon className="size-[11.67px] text-white" />
              </div>
              <span className="whitespace-nowrap font-semibold text-[14px] leading-[20px] text-white">
                캐릭터 만들기
              </span>
            </Link>
          </div>
        </div>

        {/* Table Card */}
        <div className="flex w-full flex-col overflow-hidden rounded-[12px] border border-[#e9eaeb] bg-white shadow-[0px_1px_3px_0px_rgba(10,13,18,0.1),0px_1px_2px_0px_rgba(10,13,18,0.06)]">
          {/* Card Header */}
          <div className="flex flex-col bg-white">
            <div className="flex items-start gap-[16px] px-[24px] pt-[20px] pb-[19px]">
              <p className="min-h-px min-w-px flex-1 font-medium text-[18px] leading-[28px] text-[#181d27]">
                전체 작품
              </p>
              <div className="flex items-center">
                <button
                  type="button"
                  className="overflow-hidden size-[20px] text-[#181d27]"
                >
                  <DotsVerticalIcon className="mx-auto h-[13.33px] w-[3px]" />
                </button>
              </div>
            </div>
            <div className="h-px w-full bg-[#e9eaeb]" />
          </div>

          {/* Table Content */}
          <div className="flex w-full">
            {/* 작품명 column */}
            <div className="flex min-h-px min-w-px flex-1 flex-col">
              <div className="flex h-[44px] items-center gap-[12px] border-b border-[#e9eaeb] bg-[#fafafa] px-[24px] py-[12px]">
                <span className="whitespace-nowrap font-medium text-[12px] leading-[18px] text-[#535862]">
                  작품명
                </span>
              </div>
              {!isEmpty &&
                items.map((item) => (
                  <div
                    key={`title-${item.id}`}
                    className="flex h-[72px] items-center gap-[12px] border-b border-[#e9eaeb] px-[24px] py-[16px]"
                  >
                    <p className="font-medium text-[14px] leading-[20px] text-[#181d27]">
                      {item.title}
                    </p>
                  </div>
                ))}
            </div>
            {/* 캐릭터명 column */}
            <div className="flex w-[209px] flex-col">
              <div className="flex h-[44px] items-center border-b border-[#e9eaeb] bg-[#fafafa] px-[24px] py-[12px]">
                <span className="whitespace-nowrap font-medium text-[12px] leading-[18px] text-[#535862]">
                  캐릭터명
                </span>
              </div>
              {!isEmpty &&
                items.map((item) => (
                  <button
                    type="button"
                    key={`char-${item.id}`}
                    className="flex h-[72px] w-full items-center gap-[12px] border-b border-[#e9eaeb] px-[24px] py-[16px] text-left"
                    onClick={() => setSelectedCharacter(item.character)}
                  >
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.characterName}
                        className="size-[32px] shrink-0 rounded-[200px] object-cover"
                      />
                    ) : (
                      <div className="size-[32px] shrink-0 rounded-[200px] bg-[#aa9c75]" />
                    )}
                    <div className="flex flex-col whitespace-nowrap text-[14px] leading-[20px]">
                      <span className="text-[#181d27]">
                        {item.characterName}
                      </span>
                      <span className="text-[#535862]">{item.tags}</span>
                    </div>
                  </button>
                ))}
            </div>
            {/* Status column */}
            <div className="flex w-[118px] flex-col">
              <div className="flex h-[44px] items-center border-b border-[#e9eaeb] bg-[#fafafa] px-[24px] py-[12px]">
                <span className="whitespace-nowrap font-medium text-[12px] leading-[18px] text-[#535862]">
                  Status
                </span>
              </div>
              {!isEmpty &&
                items.map((item) => (
                  <div
                    key={`status-${item.id}`}
                    className="flex h-[72px] items-center border-b border-[#e9eaeb] px-[24px] py-[16px]"
                  >
                    <StatusBadge status={item.status} />
                  </div>
                ))}
            </div>
            {/* 만든 일자 column */}
            <div className="flex w-[125px] flex-col">
              <div className="flex h-[44px] items-center gap-[4px] border-b border-[#e9eaeb] bg-[#fafafa] px-[24px] py-[12px]">
                <span className="whitespace-nowrap font-medium text-[12px] leading-[18px] text-[#535862]">
                  만든 일자
                </span>
                <div className="flex size-[16px] items-center justify-center overflow-hidden text-[#535862]">
                  <ArrowDownIcon className="size-[9.33px]" />
                </div>
              </div>
              {!isEmpty &&
                items.map((item) => (
                  <div
                    key={`date-${item.id}`}
                    className="flex h-[72px] items-center border-b border-[#e9eaeb] px-[24px] py-[16px]"
                  >
                    <p className="whitespace-nowrap text-[14px] leading-[20px] text-[#535862]">
                      {item.date}
                    </p>
                  </div>
                ))}
            </div>
            {/* Action column */}
            <div className="flex shrink-0 flex-col">
              <div className="h-[44px] border-b border-[#e9eaeb] bg-[#fafafa]" />
              {!isEmpty &&
                items.map((item) => (
                  <div
                    key={`action-${item.id}`}
                    className="flex h-[72px] items-center gap-[4px] border-b border-[#e9eaeb] p-[16px]"
                  >
                    <button
                      type="button"
                      className="flex items-center justify-center overflow-hidden rounded-[8px] p-[10px] text-[#535862]"
                    >
                      <EditIcon className="size-[20px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(item.id)}
                      className="flex items-center justify-center overflow-hidden rounded-[8px] p-[10px] text-[#535862]"
                    >
                      <TrashIcon className="size-[20px]" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Empty State */}
          {isEmpty && (
            <div className="relative h-[360px] w-full overflow-hidden">
              <div className="absolute left-1/2 top-[calc(50%+0.5px)] flex w-[196px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[17px]">
                <EmptyAvatar />
                <div className="flex h-[56px] w-full flex-col items-center justify-center gap-[4px] text-center">
                  <p className="min-w-full font-bold text-[18px] leading-[28px] text-[#181d27]">
                    내 캐릭터가 없습니다.
                  </p>
                  <p className="whitespace-nowrap text-[16px] leading-[24px] text-[#535862]">
                    첫 번째 캐릭터를 만들어보세요!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[#e9eaeb] px-[24px] pt-[12px] pb-[16px]">
            <p className="whitespace-nowrap font-medium text-[14px] leading-[20px] text-[#414651]">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-start gap-[12px]">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                className="flex items-center justify-center overflow-hidden rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
              >
                <span className="whitespace-nowrap font-semibold text-[14px] leading-[20px] text-[#414651]">
                  이전
                </span>
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="flex items-center justify-center overflow-hidden rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]"
              >
                <span className="whitespace-nowrap font-semibold text-[14px] leading-[20px] text-[#414651]">
                  다음
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
