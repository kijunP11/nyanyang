/**
 * Story Card Component
 * 
 * Displays a story card with thumbnail, title, stats, description, author, and tags.
 * Based on Figma design: 305px × 138px card with 89px × 138px thumbnail.
 */
import { Eye, Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router";

import { formatNumber } from "../lib/utils";

export interface StoryCardData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  comments: number;
  author: {
    username: string;
    displayName?: string;
  };
  tags?: string[];
  slug: string;
}

interface StoryCardProps {
  story: StoryCardData;
}

export function StoryCard({ story }: StoryCardProps) {
  return (
    <Link
      to={`/story/${story.slug}`}
      className="group flex h-[138px] w-[305px] gap-4 transition-opacity hover:opacity-90"
      viewTransition
    >
      {/* Thumbnail - 89px × 138px */}
      <div className="relative h-[138px] w-[89px] flex-shrink-0 overflow-hidden rounded">
        <img
          src={story.thumbnailUrl}
          alt={story.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Content area - 200px width */}
      <div className="flex w-[200px] flex-shrink-0 flex-col">
        {/* Title - 24px height */}
        <div className="mb-1 h-6">
          <h3 className="line-clamp-1 text-sm font-medium leading-6">
            {story.title}
          </h3>
        </div>

        {/* Stats row - views, likes, comments */}
        <div className="mb-1 flex items-center gap-3 text-xs leading-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{formatNumber(story.views)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{formatNumber(story.likes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{formatNumber(story.comments)}</span>
          </div>
        </div>

        {/* Description - 16px or 32px height, 2 lines max */}
        <div className="mb-2 min-h-[16px] flex-1">
          <p className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {story.description}
          </p>
        </div>

        {/* Author and tags row */}
        <div className="mt-auto flex items-center gap-2">
          <Link
            to={`/user/${story.author.username}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            @{story.author.username}
          </Link>
          
          {/* Tags/Badges - 18px × 18px */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex gap-1">
              {story.tags.slice(0, 3).map((tag) => (
                <div
                  key={tag}
                  className="h-[18px] w-[18px] rounded bg-muted"
                  title={tag}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

