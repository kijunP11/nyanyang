/**
 * Point Packages Definition
 *
 * 냥젤리 포인트 상품 구성
 */

export const POINT_PACKAGES = [
  {
    id: "starter",
    points: 2000,
    bonusPoints: 0,
    price: 2000,
    label: "스타터",
    recommended: false,
  },
  {
    id: "basic",
    points: 4900,
    bonusPoints: 100,
    price: 4900,
    label: "베이직",
    recommended: false,
  },
  {
    id: "standard",
    points: 9600,
    bonusPoints: 400,
    price: 9600,
    label: "스탠다드",
    recommended: false,
  },
  {
    id: "premium",
    points: 28000,
    bonusPoints: 2000,
    price: 28000,
    label: "프리미엄",
    recommended: true,
  },
  {
    id: "pro",
    points: 46000,
    bonusPoints: 4000,
    price: 46000,
    label: "프로",
    recommended: false,
  },
  {
    id: "mega",
    points: 90000,
    bonusPoints: 10000,
    price: 90000,
    label: "메가",
    recommended: false,
  },
] as const;

export type PointPackageId = (typeof POINT_PACKAGES)[number]["id"];
export type PointPackage = (typeof POINT_PACKAGES)[number];
