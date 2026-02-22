import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateResumePdfHtml } from '@/lib/resume-builder/pdf/generate-html'
import type { ResumeWithRelations } from '@/types/resume-builder'

/**
 * Generates a PDF of the master resume data using a specific template
 * from the resume-builder template system.
 *
 * Query params:
 *  - templateId: one of the 6 resume template UUIDs
 *  - hiddenSections: comma-separated list of sections to hide
 */
export async function GET(request: NextRequest) {
  const templateId = request.nextUrl.searchParams.get('templateId')
  const hiddenSectionsParam = request.nextUrl.searchParams.get('hiddenSections') || ''

  if (!templateId) {
    return NextResponse.json({ error: 'templateId required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Fetch master resume data from old resume table
    const [
      { data: resume },
      { data: skills },
      { data: experience },
      { data: educationData },
      { data: certificationData },
    ] = await Promise.all([
      supabase.from('resume').select('*').single(),
      supabase
        .from('skills')
        .select('name, category')
        .eq('published', true)
        .eq('show_on_resume', true)
        .order('sort_order'),
      supabase
        .from('experience')
        .select('*')
        .eq('published', true)
        .eq('show_on_resume', true)
        .order('sort_order'),
      supabase
        .from('education')
        .select('*')
        .eq('published', true)
        .eq('show_on_resume', true)
        .order('sort_order'),
      supabase
        .from('certifications')
        .select('*')
        .eq('published', true)
        .eq('show_on_resume', true)
        .order('sort_order'),
    ])

    if (!resume) {
      return NextResponse.json({ error: 'No resume data found' }, { status: 404 })
    }

    const hiddenSections = hiddenSectionsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    // Group skills by category
    const skillCategories = new Map<string, string[]>()
    for (const skill of skills ?? []) {
      if (!skillCategories.has(skill.category)) {
        skillCategories.set(skill.category, [])
      }
      skillCategories.get(skill.category)!.push(skill.name)
    }

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]

    // Convert to ResumeWithRelations format
    const resumeWithRelations: ResumeWithRelations = {
      id: resume.id,
      user_id: null,
      title: 'Master Resume',
      template_id: templateId,
      experience_level: null,
      target_role: null,
      company_name: null,
      job_location: null,
      work_mode: null,
      is_master: true,
      parent_resume_id: null,
      short_id: null,
      created_at: resume.updated_at,
      updated_at: resume.updated_at,
      template: null,
      contact_info: {
        id: 'ci-master',
        resume_id: resume.id,
        full_name: resume.full_name,
        email: resume.email,
        phone: resume.phone,
        city: resume.location,
        state: null,
        country: null,
        linkedin_url: resume.linkedin,
        github_url: resume.github,
        portfolio_url: resume.website,
        blog_url: null,
      },
      summary: {
        id: 'sum-master',
        resume_id: resume.id,
        text: resume.summary,
        is_visible: !hiddenSections.includes('summary') && !!resume.summary,
      },
      work_experiences: hiddenSections.includes('experience')
        ? []
        : (experience ?? []).map((e, i) => {
            const start = new Date(e.start_date)
            const achievements = (e.resume_achievements ?? e.achievements ?? []) as string[]
            return {
              id: `exp-${i}`,
              resume_id: resume.id,
              job_title: e.role as string,
              company: e.company as string,
              location: (e.location as string) || null,
              start_date: e.start_date as string,
              end_date: (e.end_date as string) || null,
              is_promotion: false,
              parent_experience_id: null,
              sort_order: i,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              achievements: achievements.map((text, j) => ({
                id: `ach-${i}-${j}`,
                parent_id: `exp-${i}`,
                parent_type: 'work' as const,
                text,
                has_metric: false,
                sort_order: j,
                created_at: new Date().toISOString(),
              })),
            }
          }),
      skill_categories: hiddenSections.includes('skills')
        ? []
        : Array.from(skillCategories.entries()).map(([category, names], i) => ({
            id: `skill-${i}`,
            resume_id: resume.id,
            name: category,
            skills: names,
            sort_order: i,
          })),
      education: hiddenSections.includes('education')
        ? []
        : (educationData ?? []).map((edu, i) => ({
            id: `edu-${i}`,
            resume_id: resume.id,
            degree: edu.degree as string,
            institution: edu.school as string,
            field_of_study: (edu.field as string) || null,
            graduation_date: edu.year ? `${edu.year}-01-01` : null,
            gpa: null,
            relevant_coursework: null,
            honors: (edu.details as string) || null,
            sort_order: i,
            created_at: new Date().toISOString(),
          })),
      projects: [],
      certifications: hiddenSections.includes('certifications')
        ? []
        : (certificationData ?? []).map((cert, i) => ({
            id: `cert-${i}`,
            resume_id: resume.id,
            name: cert.name as string,
            issuer: (cert.issuer as string) || null,
            date: cert.year ? `${cert.year}-01-01` : null,
            sort_order: i,
          })),
      extracurriculars: hiddenSections.includes('additional')
        ? []
        : ((resume.additional_sections as { title: string; items: string[] }[]) ?? []).flatMap(
            (section, i) =>
              section.items.map((item, j) => ({
                id: `extra-${i}-${j}`,
                resume_id: resume.id,
                type: null,
                title: `${section.title}: ${item}`,
                description: null,
                url: null,
                sort_order: i * 100 + j,
              }))
          ),
      settings: {
        id: 'settings-master',
        resume_id: resume.id,
        accent_color: '#000000',
        font_family: 'inter',
        font_size_preset: 'comfortable',
        date_format: 'month_year',
        section_order: [
          'contact',
          'summary',
          'experience',
          'skills',
          'education',
          'certifications',
          'extracurriculars',
        ],
        hidden_sections: hiddenSections,
        page_limit: 2,
      },
    }

    const html = generateResumePdfHtml(resumeWithRelations)

    // Use Puppeteer for PDF generation
    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    await browser.close()

    const fileName = resume.full_name?.replace(/\s+/g, '_') || 'Resume'

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}_Resume.pdf"`,
      },
    })
  } catch (error) {
    console.error('Master resume PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
