"use client"

import { useSyncExternalStore } from "react"

/**
 * Renders email/phone only on the client side with fragment obfuscation.
 * Server HTML contains nothing — defeats crawlers that scrape SSR output.
 *
 * Technique: Text is split into spans with invisible zero-width joiners
 * between them. Bots that scrape text content get fragmented gibberish.
 * Humans see the text rendered normally.
 */

const ZWJ = "\u200D" // zero-width joiner — invisible in rendering

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

function FragmentedText({ text }: { text: string }) {
  // Split into 2-3 char chunks with ZWJ between spans
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += 3) {
    chunks.push(text.slice(i, i + 3))
  }
  return (
    <>
      {chunks.map((chunk, i) => (
        <span key={i}>
          {i > 0 && ZWJ}
          {chunk}
        </span>
      ))}
    </>
  )
}

export function ObfuscatedEmail({ email, className }: { email: string; className?: string }) {
  const mounted = useIsMounted()

  if (!mounted || !email) return null

  return (
    <a href={`mailto:${email}`} className={className} aria-label="Email address">
      <FragmentedText text={email} />
    </a>
  )
}

export function ObfuscatedPhone({ phone, className }: { phone: string; className?: string }) {
  const mounted = useIsMounted()

  if (!mounted || !phone) return null

  const telHref = `tel:${phone.replace(/[^+\d]/g, "")}`

  return (
    <a href={telHref} className={className} aria-label="Phone number">
      <FragmentedText text={phone} />
    </a>
  )
}
