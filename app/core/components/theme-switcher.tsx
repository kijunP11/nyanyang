/**
 * Theme Switcher Component
 *
 * A dropdown menu component that allows users to switch between light, dark, and system themes.
 * This component provides a consistent interface for theme switching throughout the application.
 *
 * Features:
 * - Visual indication of the current theme (sun, moon, or monitor icon)
 * - Dropdown menu with theme options
 * - Integration with remix-themes for theme persistence
 * - Support for light, dark, and system themes
 * - Accessible button with appropriate aria attributes
 */
import { SunIcon } from "lucide-react";
import { MoonIcon } from "lucide-react";
import { MonitorIcon } from "lucide-react";
import { Theme, useTheme } from "remix-themes";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/**
 * ThemeSwitcher component for toggling between light, dark, and system themes
 * 
 * This component uses the remix-themes hook to access and modify the current theme.
 * It displays a dropdown menu with options for light, dark, and system themes,
 * with the current theme indicated by the appropriate icon on the trigger button.
 * 
 * @returns A dropdown menu component for switching themes
 */
export default function ThemeSwitcher() {
  // Get the current theme, setter function, and metadata from remix-themes
  const [theme, setTheme, metadata] = useTheme();
  
  return (
    <DropdownMenu>
      {/* Dropdown trigger button with current theme icon */}
      <DropdownMenuTrigger
        asChild
        className="cursor-pointer"
        data-testid="theme-switcher" // For testing purposes
      >
        <Button variant="ghost" size="icon">
          {/* Conditionally render the appropriate icon based on current theme */}
          {metadata.definedBy === "SYSTEM" ? (
            <MonitorIcon className="size-4" />
          ) : theme === Theme.LIGHT ? (
            <SunIcon className="size-4" />
          ) : theme === Theme.DARK ? (
            <MoonIcon className="size-4" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      
      {/* Dropdown menu with theme options */}
      <DropdownMenuContent align="end">
        {/* Light theme option */}
        <DropdownMenuItem onClick={() => setTheme(Theme.LIGHT)}>
          <SunIcon className="size-4" />
          Light
        </DropdownMenuItem>
        
        {/* Dark theme option */}
        <DropdownMenuItem onClick={() => setTheme(Theme.DARK)}>
          <MoonIcon className="size-4" /> Dark
        </DropdownMenuItem>
        
        {/* System theme option (follows OS preference) */}
        <DropdownMenuItem onClick={() => setTheme(null)}>
          <MonitorIcon className="size-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
