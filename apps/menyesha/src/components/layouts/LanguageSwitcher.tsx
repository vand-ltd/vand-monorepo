// components/language-switcher.tsx
"use client"

import { usePathname, useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"

const languages = [
  { locale: "en", label: "English", flag: "🇺🇸" },
  { locale: "fr", label: "Français", flag: "🇫🇷" },
  { locale: "rw", label: "Kinyarwanda", flag: "🇷🇼" },
]

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  const handleChange = (locale: string) => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${locale}`)
    router.push(newPath)
  }

  const currentLang = languages.find((l) => l.locale === currentLocale)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>{currentLang?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.locale}
            onClick={() => handleChange(lang.locale)}
            className={cn(currentLocale === lang.locale && "font-bold")}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
