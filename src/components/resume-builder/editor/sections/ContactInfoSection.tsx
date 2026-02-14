'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateContactInfo } from '@/app/admin/resume-builder/actions'
import { contactInfoSchema, type ContactInfoFormValues } from '@/lib/schemas/resume-builder'
import { EditorSection } from '../EditorSection'
import type { ResumeContactInfo } from '@/types/resume-builder'

interface Props {
  resumeId: string
  contactInfo: ResumeContactInfo | null
}

export function ContactInfoSection({ resumeId, contactInfo }: Props) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ContactInfoFormValues>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      full_name: contactInfo?.full_name ?? '',
      email: contactInfo?.email ?? '',
      phone: contactInfo?.phone ?? '',
      city: contactInfo?.city ?? '',
      country: contactInfo?.country ?? '',
      linkedin_url: contactInfo?.linkedin_url ?? '',
      github_url: contactInfo?.github_url ?? '',
      portfolio_url: contactInfo?.portfolio_url ?? '',
      blog_url: contactInfo?.blog_url ?? '',
    },
  })

  function onSubmit(data: ContactInfoFormValues) {
    startTransition(async () => {
      try {
        await updateContactInfo(resumeId, data)
        toast.success('Contact info saved')
      } catch {
        toast.error('Failed to save contact info')
      }
    })
  }

  return (
    <EditorSection
      title="Contact Details"
      icon={User}
      id="contact"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="text-destructive mt-1 text-xs">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                id="email"
                {...register('email')}
                placeholder="john@example.com"
                className="pl-9"
              />
            </div>
            {errors.email && (
              <p className="text-destructive mt-1 text-xs">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+1 (555) 123-4567"
                className="pl-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="city">City *</Label>
              <div className="relative">
                <MapPin className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="San Francisco"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="USA"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <div className="relative">
              <Linkedin className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                id="linkedin_url"
                {...register('linkedin_url')}
                placeholder="https://linkedin.com/in/johndoe"
                className="pl-9"
              />
            </div>
            {errors.linkedin_url && (
              <p className="text-destructive mt-1 text-xs">
                {errors.linkedin_url.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="github_url">GitHub</Label>
            <div className="relative">
              <Github className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                id="github_url"
                {...register('github_url')}
                placeholder="https://github.com/johndoe"
                className="pl-9"
              />
            </div>
            {errors.github_url && (
              <p className="text-destructive mt-1 text-xs">
                {errors.github_url.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="portfolio_url">Portfolio</Label>
            <div className="relative">
              <Globe className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                id="portfolio_url"
                {...register('portfolio_url')}
                placeholder="https://johndoe.dev"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="blog_url">Blog</Label>
            <div className="relative">
              <BookOpen className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                id="blog_url"
                {...register('blog_url')}
                placeholder="https://blog.johndoe.dev"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isPending || !isDirty} size="sm">
          {isPending ? 'Saving...' : 'Save Contact Info'}
        </Button>
      </form>
    </EditorSection>
  )
}
