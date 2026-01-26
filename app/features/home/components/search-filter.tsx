/**
 * Search and Filter Component
 * 
 * Provides search input and filter options (genre, sort by popularity/newest/tags)
 */
import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";

export type SortOption = "popular" | "newest" | "tags";
export type GenreFilter = "all" | "romance" | "fantasy" | "action" | "daily";

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  genre: GenreFilter;
  onGenreChange: (genre: GenreFilter) => void;
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  genre,
  onGenreChange,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="스토리 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Genre Filter */}
      <Select value={genre} onValueChange={onGenreChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="장르" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="romance">로맨스</SelectItem>
          <SelectItem value="fantasy">판타지</SelectItem>
          <SelectItem value="action">액션</SelectItem>
          <SelectItem value="daily">일상</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Options */}
      <div className="flex gap-2">
        <Button
          variant={sortBy === "popular" ? "default" : "outline"}
          size="sm"
          onClick={() => onSortChange("popular")}
        >
          인기순
        </Button>
        <Button
          variant={sortBy === "newest" ? "default" : "outline"}
          size="sm"
          onClick={() => onSortChange("newest")}
        >
          최신순
        </Button>
        <Button
          variant={sortBy === "tags" ? "default" : "outline"}
          size="sm"
          onClick={() => onSortChange("tags")}
        >
          태그별
        </Button>
      </div>
    </div>
  );
}


