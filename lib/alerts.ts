/**
 * 시스템 이상탐지 알림 채널 (Slack Incoming Webhook)
 *
 * SLACK_WEBHOOK_URL 환경변수가 설정된 경우에만 동작하며, 설정되지 않은 경우
 * 조용히 스킵한다(선택적 기능). 알림 전송 실패가 호출자의 로직에 영향을
 * 주지 않도록 항상 에러를 삼킨다.
 */
export async function sendSlackAlert(text: string): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return false

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    return response.ok
  } catch (error) {
    console.error('Slack alert failed:', error)
    return false
  }
}
