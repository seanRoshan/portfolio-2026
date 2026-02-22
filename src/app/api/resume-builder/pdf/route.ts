import { NextRequest, NextResponse } from 'next/server'
import { getResumeWithRelations } from '@/lib/resume-builder/queries'
import { generateResumePdfHtml } from '@/lib/resume-builder/pdf/generate-html'

export async function GET(request: NextRequest) {
  const resumeId = request.nextUrl.searchParams.get('resumeId')
  if (!resumeId) {
    return NextResponse.json({ error: 'resumeId required' }, { status: 400 })
  }

  try {
    const resume = await getResumeWithRelations(resumeId)
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const html = generateResumePdfHtml(resume)

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

    const fileName =
      resume.contact_info?.full_name?.replace(/\s+/g, '_') || 'Resume'

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}_Resume.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
