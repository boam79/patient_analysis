import Link from 'next/link'

/** 랜딩 히어로용 제품 스틸 (대시보드 UI 스케치 — 실사진 대신 인앱 목업) */
function ProductStill() {
  return (
    <div
      className="relative mx-auto w-full max-w-lg overflow-hidden rounded-lg border border-border/80 bg-card shadow-[0_20px_50px_-24px_rgba(10,47,47,0.35)]"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-border/70 bg-brand-ink px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-white/30" />
        <span className="h-2 w-2 rounded-full bg-white/30" />
        <span className="h-2 w-2 rounded-full bg-white/30" />
        <span className="ml-2 font-display text-[10px] font-medium text-white/70">
          병원 CRM · 통합 대시보드
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 bg-surface p-3">
        {['재방문율', '고유 환자', '방문'].map((label, i) => (
          <div
            key={label}
            className="rounded-md border border-border/60 bg-card px-2 py-2"
          >
            <p className="text-[9px] text-muted-foreground">{label}</p>
            <p className="font-display text-sm font-bold text-brand-ink">
              {['42%', '3.2k', '10k'][i]}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 bg-surface px-3 pb-3">
        <div className="col-span-3 h-28 rounded-md border border-border/60 bg-card p-2">
          <p className="mb-2 text-[9px] font-medium text-muted-foreground">
            지역 분포
          </p>
          <svg viewBox="0 0 200 80" className="h-[72px] w-full">
            <rect x="10" y="40" width="18" height="30" fill="hsl(180 70% 32%)" opacity="0.85" />
            <rect x="38" y="25" width="18" height="45" fill="hsl(180 70% 32%)" opacity="0.7" />
            <rect x="66" y="15" width="18" height="55" fill="hsl(180 70% 32%)" />
            <rect x="94" y="30" width="18" height="40" fill="hsl(200 18% 42%)" opacity="0.8" />
            <rect x="122" y="35" width="18" height="35" fill="hsl(200 18% 42%)" opacity="0.65" />
            <rect x="150" y="45" width="18" height="25" fill="hsl(32 70% 48%)" opacity="0.75" />
          </svg>
        </div>
        <div className="col-span-2 h-28 rounded-md border border-border/60 bg-card p-2">
          <p className="mb-2 text-[9px] font-medium text-muted-foreground">지도</p>
          <div className="relative h-[72px] overflow-hidden rounded bg-gradient-to-br from-[#d8ecec] to-[#c5d9de]">
            <span className="absolute left-[30%] top-[35%] h-2.5 w-2.5 rounded-full bg-brand" />
            <span className="absolute left-[55%] top-[50%] h-2 w-2 rounded-full bg-brand/70" />
            <span className="absolute left-[45%] top-[22%] h-1.5 w-1.5 rounded-full bg-warning" />
            <span className="absolute left-[70%] top-[40%] h-2 w-2 rounded-full bg-brand/50" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d8ecec] via-[#eef4f5] to-[#dce8ec]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.14]"
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
        </svg>
      </div>

      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-10">
        <div>
          <p className="font-display animate-fade-up text-5xl font-bold tracking-tight text-brand md:text-6xl lg:text-7xl">
            병원 CRM
          </p>
          <h1 className="font-display animate-fade-up-delay mt-5 max-w-xl text-2xl font-semibold leading-snug text-foreground md:text-3xl">
            방문 데이터로 재방문·지역·전략을 한눈에
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-md text-base text-muted-foreground md:text-lg">
            브라우저에서 안전하게 분석합니다. PHI를 최소화하고, 지도·차트·전략
            인사이트를 바로 확인하세요.
          </p>
          <div className="animate-fade-up-delay-2 mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard/upload"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              파일 업로드
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card/80 px-6 text-sm font-medium text-brand transition-colors hover:bg-accent"
            >
              샘플로 둘러보기
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            업로드 → 검증 → 대시보드 · 브라우저에서만 처리합니다
          </p>
        </div>

        <div className="animate-fade-up-delay hidden md:block">
          <ProductStill />
        </div>
      </section>

      {/* 모바일에서도 제품 앵커가 보이도록 히어로 아래 배치 */}
      <div className="px-6 pb-10 md:hidden">
        <ProductStill />
      </div>

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
