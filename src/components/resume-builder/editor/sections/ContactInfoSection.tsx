'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Link,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateContactInfo } from '@/app/admin/resume-builder/actions'
import {
  contactInfoSchema,
  type ContactInfoFormValues,
} from '@/lib/schemas/resume-builder'
import { EditorSection } from '../EditorSection'
import type { ResumeContactInfo } from '@/types/resume-builder'

/* ── tiny reusable pieces ─────────────────────── */

function GroupCard({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-foreground/60" />
        <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/60 select-none">
          {label}
        </p>
      </div>
      {children}
    </div>
  )
}

function IconInput({
  icon: Icon,
  id,
  error,
  className = '',
  ...rest
}: {
  icon: React.ComponentType<{ className?: string }>
  id: string
  error?: string
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1">
      <div className="relative">
        <Icon className="text-muted-foreground/40 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" />
        <Input id={id} className={`h-9 pl-9 text-sm ${className}`} {...rest} />
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

/* ── main component ───────────────────────────── */

interface Props {
  resumeId: string
  contactInfo: ResumeContactInfo | null
}

export function ContactInfoSection({ resumeId, contactInfo }: Props) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ContactInfoFormValues>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      full_name: contactInfo?.full_name ?? '',
      email: contactInfo?.email ?? '',
      phone: contactInfo?.phone ?? '',
      city: contactInfo?.city ?? '',
      state: contactInfo?.state ?? '',
      country: contactInfo?.country ?? '',
      linkedin_url: contactInfo?.linkedin_url ?? '',
      github_url: contactInfo?.github_url ?? '',
      portfolio_url: contactInfo?.portfolio_url ?? '',
    },
  })

  function onSubmit(data: ContactInfoFormValues) {
    startTransition(async () => {
      try {
        await updateContactInfo(resumeId, data)
        reset(data)
        toast.success('Contact info saved')
      } catch {
        toast.error('Failed to save contact info')
      }
    })
  }

  return (
    <EditorSection title="Contact Details" icon={User} id="contact">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ── Identity ─────────────────────────── */}
        <GroupCard label="Identity" icon={User}>
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="Jane Doe"
              className="h-10 font-medium"
            />
            {errors.full_name && (
              <p className="text-destructive text-xs">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
              <IconInput
                icon={Mail}
                id="email"
                {...register('email')}
                placeholder="jane@example.com"
                error={errors.email?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium">
                Phone
              </Label>
              <IconInput
                icon={Phone}
                id="phone"
                {...register('phone')}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </GroupCard>

        {/* ── Location ─────────────────────────── */}
        <GroupCard label="Location" icon={MapPin}>
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-medium">
                City
              </Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="San Francisco"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-xs font-medium">
                State
              </Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="CA"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs font-medium">
                Country
              </Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="USA"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </GroupCard>

        {/* ── Online Presence ──────────────────── */}
        <GroupCard label="Online Presence" icon={Link}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url" className="text-xs font-medium">
                LinkedIn
              </Label>
              <IconInput
                icon={Linkedin}
                id="linkedin_url"
                {...register('linkedin_url')}
                placeholder="https://linkedin.com/in/janedoe"
                error={errors.linkedin_url?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="github_url" className="text-xs font-medium">
                GitHub
              </Label>
              <IconInput
                icon={Github}
                id="github_url"
                {...register('github_url')}
                placeholder="https://github.com/janedoe"
                error={errors.github_url?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="portfolio_url" className="text-xs font-medium">
                Website
              </Label>
              <IconInput
                icon={Globe}
                id="portfolio_url"
                {...register('portfolio_url')}
                placeholder="https://janedoe.dev"
              />
            </div>
          </div>
        </GroupCard>

        {/* ── Save bar — slides in when dirty ──── */}
        <div
          className="grid transition-all duration-300 ease-out"
          style={{
            gridTemplateRows: isDirty ? '1fr' : '0fr',
            opacity: isDirty ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => reset()}
              >
                Discard
              </Button>
              <Button type="submit" disabled={isPending} size="sm" className="h-8">
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save Contact Info'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </EditorSection>
  )
}
