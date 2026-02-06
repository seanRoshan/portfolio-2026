import Script from "next/script";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Alex Rivera",
  url: "https://alexrivera.dev",
  jobTitle: "Senior Full-Stack Developer",
  sameAs: [
    "https://github.com/alexrivera",
    "https://linkedin.com/in/alexrivera",
    "https://x.com/alexrivera",
  ],
};

export function JsonLd() {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      strategy="afterInteractive"
    >
      {JSON.stringify(jsonLd)}
    </Script>
  );
}
