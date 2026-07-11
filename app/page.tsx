import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      {/* Full-bleed hero atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#d8ecec] via-[#eef4f5] to-[#dce8ec]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.18]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M80 420 C180 300 260 520 360 400 S520 280 620 380 S780 520 900 360 S1080 280 1180 420"
            fill="none"
            stroke="#0B6E6E"
            strokeWidth="2"
          />
          <path
            d="M40 520 C160 440 240 600 340 500 S500 400 600 500 S760 620 880 480 S1060 400 1160 540"
            fill="none"
            stroke="#0B6E6E"
            strokeWidth="1.5"
          />
          <circle cx="360" cy="400" r="5" fill="#0B6E6E" />
          <circle cx="620" cy="380" r="7" fill="#0B6E6E" />
          <circle cx="900" cy="360" r="5" fill="#0B6E6E" />
          <circle cx="520" cy="460" r="4" fill="#0B6E6E" />
          <circle cx="780" cy="500" r="4" fill="#0B6E6E" />
        </svg>
      </div>

      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center px-6 py-16 md:px-10">
        <p className="font-display animate-fade-up text-5xl font-bold tracking-tight text-brand md:text-7xl">
          병원 CRM
        </p>
        <h1 className="font-display animate-fade-up-delay mt-6 max-w-2xl text-2xl font-semibold leading-snug text-foreground md:text-4xl">
          방문 데이터로 재방문·지역·전략을 한눈에
        </h1>
        <p className="animate-fade-up-delay-2 mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          브라우저에서 안전하게 분석합니다. PHI를 최소화하고, 지도·차트·전략
          인사이트를 바로 확인하세요.
        </p>
        <div className="animate-fade-up-delay-2 mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard/upload"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            데이터 시작하기
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            대시보드 보기
          </Link>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-3 md:px-10">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-ink">
              로컬 처리
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              환자 데이터는 브라우저 안에서 집계됩니다. 서버로 원본을 올리지
              않습니다.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-ink">
              4대 분석 축
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              재방문·공간·질병·수술. 필터 한 번으로 차트와 지도가 함께
              움직입니다.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-ink">
              전략 인사이트
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              경영 지표부터 세그먼트·예측까지, 운영 의사결정을 돕는 화면을
              제공합니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
