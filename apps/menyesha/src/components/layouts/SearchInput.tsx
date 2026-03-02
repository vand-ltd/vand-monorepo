import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export function SearchInput() {
  return (
    <div className="relative w-full max-w-md">
      <Input
        type="search"
        placeholder="Search..."
        className="pr-12" // space for button
      />
      <Button
        type="submit"
        size="sm"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2"
      >
        <Search className="w-4 h-4" />
      </Button>
    </div>
  )
}
