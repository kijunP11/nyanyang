/**
 * Language Switcher Component
 *
 * A dropdown menu component that allows users to switch between different application languages.
 * This component provides internationalization (i18n) support throughout the application.
 *
 * Features:
 * - Visual indication of the current language with country flag emoji
 * - Dropdown menu with language options
 * - Integration with i18next for language switching
 * - Server-side persistence of language preference
 * - Support for multiple languages (English, Korean, Spanish)
 * - Translated language names in the current language
 */
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/**
 * LangSwitcher component for changing the application language
 * 
 * This component uses i18next and React Router to handle language switching.
 * It displays a dropdown menu with language options, with the current language
 * indicated by the appropriate country flag emoji on the trigger button.
 * 
 * When a language is selected, it:
 * 1. Changes the language in the i18n context (client-side)
 * 2. Persists the language preference on the server via an API call
 * 
 * @returns A dropdown menu component for switching languages
 */
export default function LangSwitcher() {
  // Get translation function and i18n instance
  const { t, i18n } = useTranslation();
  
  // Get fetcher for making API requests
  const fetcher = useFetcher();
  
  /**
   * Handle language change by updating both client and server state
   * @param locale - The language code to switch to (e.g., 'en', 'ko', 'es')
   */
  const handleLocaleChange = async (locale: string) => {
    // Change language in i18n context (client-side)
    i18n.changeLanguage(locale);
    
    // Persist language preference on the server
    await fetcher.submit(null, {
      method: "POST",
      action: "/api/settings/locale?locale=" + locale,
    });
  };
  
  return (
    <DropdownMenu>
      {/* Dropdown trigger button with current language flag */}
      <DropdownMenuTrigger
        asChild
        className="cursor-pointer"
        data-testid="lang-switcher" // For testing purposes
      >
        <Button variant="ghost" size="icon" className="text-lg">
          {/* Conditionally render the appropriate flag based on current language */}
          {i18n.language === "en"
            ? "🇬🇧" // UK flag for English
            : i18n.language === "ko"
              ? "🇰🇷" // South Korea flag for Korean
              : i18n.language === "es"
                ? "🇪🇸" // Spain flag for Spanish
                : null}
        </Button>
      </DropdownMenuTrigger>
      
      {/* Dropdown menu with language options */}
      <DropdownMenuContent align="end">
        {/* Spanish language option */}
        <DropdownMenuItem onClick={() => handleLocaleChange("es")}>
          🇪🇸 {t("navigation.es")} {/* Translated name of Spanish */}
        </DropdownMenuItem>
        
        {/* Korean language option */}
        <DropdownMenuItem onClick={() => handleLocaleChange("ko")}>
          🇰🇷 {t("navigation.kr")} {/* Translated name of Korean */}
        </DropdownMenuItem>
        
        {/* English language option */}
        <DropdownMenuItem onClick={() => handleLocaleChange("en")}>
          🇬🇧 {t("navigation.en")} {/* Translated name of English */}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
