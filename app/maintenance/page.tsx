export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-mist px-6 text-center">
      <h1 className="font-display text-3xl font-bold text-brand-ink">
        시스템 유지보수 중
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        현재 서비스가 일시적으로 중단되었습니다. 잠시 후 다시 이용해 주세요.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        관리자는{' '}
        <a href="/login-admin" className="text-primary underline">
          관리자 로그인
        </a>
        으로 접속할 수 있습니다.
      </p>
    </main>
  )
}
