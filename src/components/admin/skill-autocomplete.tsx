"use client"

import { useState, useMemo, useRef, useEffect, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus, Loader2 } from "lucide-react"
import { syncSkillFromProject } from "@/app/admin/projects/actions"

interface SkillOption {
  id: string
  name: string
  category: string
}

interface SkillAutocompleteProps {
  skills: SkillOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onSkillCreated?: (skill: SkillOption) => void
}

const CATEGORIES = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "devops", label: "DevOps" },
  { value: "database", label: "Database" },
  { value: "tools", label: "Tools" },
]

export function SkillAutocomplete({
  skills,
  selectedIds,
  onChange,
  onSkillCreated,
}: SkillAutocompleteProps) {
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createCategory, setCreateCategory] = useState("")
  const [isPending, startTransition] = useTransition()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedSkills = skills.filter((s) => selectedIds.includes(s.id))

  const filtered = useMemo(() => {
    if (!search.trim()) return []
    return skills
      .filter(
        (s) => !selectedIds.includes(s.id) && s.name.toLowerCase().includes(search.toLowerCase()),
      )
      .slice(0, 8)
  }, [search, skills, selectedIds])

  const exactMatch = skills.some((s) => s.name.toLowerCase() === search.trim().toLowerCase())

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowCreate(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function add(id: string) {
    onChange([...selectedIds, id])
    setSearch("")
    setIsOpen(false)
    setShowCreate(false)
  }

  function remove(id: string) {
    onChange(selectedIds.filter((i) => i !== id))
  }

  function handleCreateNew(category: string) {
    const name = search.trim()
    if (!name || !category) return

    startTransition(async () => {
      const result = await syncSkillFromProject(name, category)
      if (result.skill_id) {
        const newSkill = { id: result.skill_id, name, category }
        onSkillCreated?.(newSkill)
        add(result.skill_id)
      }
    })
  }

  return (
    <div className="space-y-2">
      {/* Selected skills as badges */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <Badge key={skill.id} variant="secondary" className="gap-1 pr-1">
              {skill.name}
              <button
                type="button"
                onClick={() => remove(skill.id)}
                className="hover:bg-muted ml-1 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative" ref={dropdownRef}>
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
            setShowCreate(false)
            setCreateCategory("")
          }}
          onFocus={() => search.trim() && setIsOpen(true)}
          placeholder="Search or add skills..."
        />

        {/* Dropdown */}
        {isOpen && search.trim() && (
          <div className="bg-popover absolute z-20 mt-1 w-full rounded-lg border shadow-lg">
            {filtered.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => add(skill.id)}
                className="hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-left text-sm"
              >
                <span>{skill.name}</span>
                <span className="text-muted-foreground text-xs">{skill.category}</span>
              </button>
            ))}

            {/* Create new skill option */}
            {!exactMatch && search.trim().length > 0 && (
              <div className="border-t">
                {!showCreate ? (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="text-primary hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create &quot;{search.trim()}&quot;
                  </button>
                ) : (
                  <div className="space-y-2 p-3">
                    <p className="text-muted-foreground text-xs">
                      Choose a category for &quot;{search.trim()}&quot;:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <Button
                          key={cat.value}
                          type="button"
                          variant={createCategory === cat.value ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs"
                          disabled={isPending}
                          onClick={() => {
                            setCreateCategory(cat.value)
                            handleCreateNew(cat.value)
                          }}
                        >
                          {isPending && createCategory === cat.value ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : null}
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {filtered.length === 0 && exactMatch && (
              <p className="text-muted-foreground px-3 py-2 text-sm">Already added or no matches</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
