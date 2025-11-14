import { Link } from "react-router";

import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2.5">
      <h1 className="text-5xl font-semibold">Page not found</h1>
      <h2 className="text-2xl">The page you are looking for does not exist.</h2>
      <Button variant="outline" asChild>
        <Link to="/">Go home &rarr;</Link>
      </Button>
    </div>
  );
}
