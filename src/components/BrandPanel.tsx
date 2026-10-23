import type { Messages } from "@/lib/i18n";

export function BrandPanel({
  locale,
  messages,
}: {
  locale: string;
  messages: Messages;
}) {
  const features =
    locale === "am"
      ? [
          "የተሽከርካሪ የአካል ጉዳት ምዘና",
          "የእቃዎች ፍለጋ ከ1,200 በላይ",
          "ራስ-ሰር የሪፖርት ቁጥር አሰጣጥ",
          "በአማርኛ እና በእንግሊዝኛ የሚታተም ፎርም",
        ]
      : [
          "Motor damage assessment in minutes",
          "Search 1,200+ spare parts instantly",
          "Automatic report numbering per branch",
          "Printable bilingual A4 forms",
        ];

  return (
    <aside className="relative hidden overflow-hidden bg-[color:var(--acc)] lg:flex lg:flex-col">
      {/* Layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#005baa] via-[#00417e] to-[#002a54]" />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#ffffff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg ring-1 ring-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Awash" className="h-9 w-9 rounded-lg object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight">
              {messages.app.title}
            </div>
            <div className="text-xs text-white/70">{messages.app.subtitle}</div>
          </div>
        </div>

        <div className="my-16 max-w-md space-y-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/90 ring-1 ring-white/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--wave)]" />
              Awash Insurance · Motor Survey
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              {locale === "am"
                ? "የተሽከርካሪ የአካል ጉዳት ምዘና በአንድ ቦታ"
                : "Motor damage surveys, done properly."}
            </h1>
            <p className="mt-4 text-base text-white/75">
              {locale === "am"
                ? "ለሰርቬየሮች የተዘጋጀ ፈጣን፣ ትክክለኛ እና በሁለት ቋንቋ የሚሰራ መሳሪያ።"
                : "A fast, accurate, bilingual tool built for surveyors in the field."}
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-white/90"
              >
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-white/60">
          © {new Date().getFullYear()} Awash Insurance ·{" "}
          <span className="text-white/80">{messages.app.subtitle}</span>
          
                  </div>
      </div>
    </aside>
  );
}