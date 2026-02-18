/**
 * 키워드북 카드
 *
 * 제목, N개, 날짜, 호버 시 edit/delete 아이콘
 */
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/core/components/ui/alert-dialog";
import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Input } from "~/core/components/ui/input";

interface BookData {
  keyword_book_id: number;
  title: string;
  book_type: string;
  character_id: number | null;
  item_count: number;
  created_at: string;
}

interface KeywordBookCardProps {
  book: BookData;
  onRefresh: () => void;
}

export default function KeywordBookCard({
  book,
  onRefresh,
}: KeywordBookCardProps) {
  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher();
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(book.title);

  const formattedDate = new Date(book.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const handleDelete = () => {
    deleteFetcher.submit(JSON.stringify({ book_id: book.keyword_book_id }), {
      method: "DELETE",
      action: "/api/keywords/delete-book",
      encType: "application/json",
    });
    setShowDelete(false);
    setTimeout(onRefresh, 300);
  };

  const handleEdit = () => {
    editFetcher.submit(
      JSON.stringify({
        book_id: book.keyword_book_id,
        title: editTitle,
      }),
      {
        method: "POST",
        action: "/api/keywords/update-book",
        encType: "application/json",
      }
    );
    setShowEdit(false);
    setTimeout(onRefresh, 300);
  };

  return (
    <>
      <div className="group relative rounded-lg border border-[#E9EAEB] p-4 hover:border-[#00c4af] transition-colors cursor-pointer">
        <h4 className="font-medium text-[#181D27] truncate">{book.title}</h4>
        <p className="text-xs text-[#717680] mt-1">{book.item_count}개</p>
        <p className="text-xs text-[#717680] mt-0.5">{formattedDate}</p>

        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEdit(true);
            }}
            className="p-1.5 rounded-md hover:bg-[#F5F5F5] text-[#717680]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDelete(true);
            }}
            className="p-1.5 rounded-md hover:bg-red-50 text-[#717680] hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              키워드북을 삭제하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{book.title}&quot; 키워드북과 포함된 키워드가 모두 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#D5D7DA]">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>키워드북 이름 수정</DialogTitle>
          </DialogHeader>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={100}
            placeholder="키워드북 이름"
            className="border-[#D5D7DA]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              className="border-[#D5D7DA]"
            >
              취소
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editTitle.trim()}
              className="bg-[#00c4af] hover:bg-[#00b39e] text-white"
            >
              수정하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
