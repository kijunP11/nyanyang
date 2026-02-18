/**
 * My Content — /dashboard와 중복이므로 /dashboard로 리다이렉트
 */
import { redirect } from "react-router";

export function loader() {
  return redirect("/dashboard");
}

export default function MyContentRedirect() {
  return null;
}
