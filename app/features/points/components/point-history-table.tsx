/**
 * Point History Table
 *
 * 포인트 거래 내역 테이블
 */

import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";

interface Transaction {
  transaction_id: number;
  amount: number;
  balance_after: number;
  type: string;
  reason: string | null;
  created_at: Date;
}

interface PointHistoryTableProps {
  transactions: Transaction[];
  showMoreLink?: boolean;
}

function getTypeBadge(type: string) {
  switch (type) {
    case "charge":
      return (
        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
          충전
        </Badge>
      );
    case "usage":
      return (
        <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
          사용
        </Badge>
      );
    case "reward":
      return (
        <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
          보상
        </Badge>
      );
    default:
      return (
        <Badge className="bg-[#3f3f46] text-[#9ca3af]">{type}</Badge>
      );
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PointHistoryTable({
  transactions,
  showMoreLink = true,
}: PointHistoryTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-[#232323] border border-[#3f3f46] rounded-xl p-8 text-center">
        <p className="text-[#9ca3af]">거래 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-[#232323] border border-[#3f3f46] rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-[#3f3f46] hover:bg-transparent">
            <TableHead className="text-[#9ca3af]">일시</TableHead>
            <TableHead className="text-[#9ca3af]">구분</TableHead>
            <TableHead className="text-[#9ca3af]">내용</TableHead>
            <TableHead className="text-[#9ca3af] text-right">금액</TableHead>
            <TableHead className="text-[#9ca3af] text-right">잔액</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow
              key={tx.transaction_id}
              className="border-[#3f3f46] hover:bg-[#2f2f2f]"
            >
              <TableCell className="text-[#9ca3af] text-sm">
                {formatDate(tx.created_at)}
              </TableCell>
              <TableCell>{getTypeBadge(tx.type)}</TableCell>
              <TableCell className="text-white">
                {tx.reason || "-"}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  tx.amount > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {tx.amount > 0 ? "+" : ""}
                {tx.amount.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-white">
                {tx.balance_after.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showMoreLink && (
        <div className="border-t border-[#3f3f46] p-4 text-center">
          <Button
            variant="ghost"
            asChild
            className="text-[#14b8a6] hover:text-[#0d9488]"
          >
            <Link to="/dashboard/payments">더보기 →</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
