/**
 * Utility Functions Module
 *
 * This module provides utility functions used throughout the application.
 * It includes helpers for class name management and other common operations.
 *
 * The primary utility here is the `cn` function which combines the power of
 * clsx (for conditional class names) and tailwind-merge (for resolving
 * Tailwind CSS class conflicts).
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single className string
 * 
 * This utility function combines the power of clsx and tailwind-merge to:
 * 1. Process conditional class names, arrays, objects, etc. with clsx
 * 2. Properly merge Tailwind CSS classes and handle conflicts with tailwind-merge
 * 
 * Use this function whenever you need to combine multiple classes, especially
 * when working with conditional classes or component variants.
 * 
 * @example
 * // Basic usage
 * cn('text-red-500', 'bg-blue-500')
 * 
 * // With conditionals
 * cn('text-base', isLarge && 'text-lg')
 * 
 * // With object syntax
 * cn({ 'text-red-500': isError, 'text-green-500': isSuccess })
 * 
 * // Resolving conflicts (last one wins)
 * cn('text-red-500', 'text-blue-500') // -> 'text-blue-500'
 * 
 * @param inputs - Any number of class values (strings, objects, arrays, etc.)
 * @returns A merged className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
