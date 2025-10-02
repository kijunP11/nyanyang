import { useState } from "react";

import { Button } from "~/core/components/ui/button";

export default function CounterExample() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => setCount(count + 1)}>Increment</Button>
      <p>{count}</p>
      <Button onClick={() => setCount(count - 1)}>Decrement</Button>
    </div>
  );
}
