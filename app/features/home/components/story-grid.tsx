/**
 * Story Grid Component
 * 
 * Displays stories in a responsive grid layout.
 * Based on Figma design with 305px × 138px cards.
 */
import { StoryCard, type StoryCardData } from "./story-card";

interface StoryGridProps {
  stories: StoryCardData[];
}

export function StoryGrid({ stories }: StoryGridProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  );
}

