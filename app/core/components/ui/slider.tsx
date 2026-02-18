"use client";

import * as React from "react";
import { cn } from "~/core/lib/utils";

interface SliderProps
  extends Omit<
    React.ComponentProps<"input">,
    "value" | "onChange" | "min" | "max" | "step"
  > {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value = [0],
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      disabled,
      ...props
    },
    ref
  ) => {
    const v = value[0] ?? min;
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={v}
        onChange={(e) => {
          const next = Number(e.target.value);
          onValueChange?.([next]);
        }}
        className={cn(
          "w-full cursor-pointer appearance-none rounded-full bg-[#E9EAEB] dark:bg-[#333741] h-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#14b8a6] [&::-webkit-slider-thumb]:border-0 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#14b8a6] [&::-moz-range-thumb]:border-0",
          className
        )}
        {...props}
      />
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
