import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FormSectionProps {
  id?: string
  title: string
  description?: string
  children: React.ReactNode
}

export function FormSection({ id, title, description, children }: FormSectionProps) {
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
