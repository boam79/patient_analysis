# 병원 CRM v4.5 배포 가이드

## 🚀 배포 옵션

### Option 1: Vercel (권장) ⭐

Vercel은 Next.js를 만든 회사로, Next.js 애플리케이션에 최적화되어 있습니다.

#### 1-1. Vercel CLI로 배포

```bash
# 1. 프로젝트 디렉토리로 이동
cd /Users/parkjaemin/Documents/app/Patient_Analysis

# 2. Vercel에 로그인
vercel login

# 3. 배포 (프리뷰)
vercel

# 4. 프로덕션 배포
vercel --prod
```

#### 1-2. Vercel Dashboard로 배포 (더 간단)

1. **GitHub에 푸시**:
   ```bash
   # GitHub repository 생성 후
   git remote add origin https://github.com/YOUR_USERNAME/hospital-crm.git
   git push -u origin main
   ```

2. **Vercel에서 Import**:
   - https://vercel.com 접속 및 로그인
   - "New Project" 클릭
   - GitHub repository 선택
   - 자동으로 Next.js 프로젝트 인식
   - "Deploy" 클릭

3. **환경 변수 설정**:
   - Vercel Dashboard → Project Settings → Environment Variables
   - `.env.example` 참고하여 설정:
     ```
     NOMINATIM_API_URL=https://nominatim.openstreetmap.org/search
     NOMINATIM_USER_AGENT=Hospital-CRM/4.1
     NEXT_TELEMETRY_DISABLED=1
     ```

#### Vercel 배포 장점
- ✅ 자동 HTTPS
- ✅ 무제한 무료 호스팅 (취미 프로젝트)
- ✅ 자동 스케일링
- ✅ Edge Network (전 세계 빠른 속도)
- ✅ Git push만으로 자동 배포
- ✅ Preview 배포 (PR마다 별도 URL)

---

### Option 2: Docker 배포

#### 2-1. Docker 이미지 빌드

```bash
# 1. Docker 이미지 빌드
docker build -t hospital-crm:latest .

# 2. 컨테이너 실행
docker run -p 3000:3000 \
  -e NOMINATIM_API_URL=https://nominatim.openstreetmap.org/search \
  -e NOMINATIM_USER_AGENT=Hospital-CRM/4.1 \
  hospital-crm:latest

# 3. 브라우저에서 확인
# http://localhost:3000
```

#### 2-2. Docker Compose 사용

```bash
# 1. 환경 변수 파일 생성
cp .env.example .env
# .env 파일 수정

# 2. Docker Compose로 실행
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f

# 4. 중지
docker-compose down
```

---

### Option 3: NCP (Naver Cloud Platform)

#### 3-1. Cloud Functions로 서버리스 배포

```bash
# 1. NCP CLI 설치
npm install -g @ncloud/cli

# 2. 인증 설정
ncloud configure

# 3. 빌드
npm run build

# 4. 배포
ncloud functions deploy \
  --name hospital-crm \
  --runtime nodejs18 \
  --entry-point .next/standalone
```

#### 3-2. Container Registry + Cloud Server

```bash
# 1. Docker 이미지를 NCP Container Registry에 푸시
docker tag hospital-crm:latest \
  kr.ncr.ntruss.com/YOUR_REGISTRY/hospital-crm:latest

docker push kr.ncr.ntruss.com/YOUR_REGISTRY/hospital-crm:latest

# 2. NCP Cloud Server에서 실행
# NCP 콘솔에서 Cloud Server 생성 후:
ssh your-server
docker pull kr.ncr.ntruss.com/YOUR_REGISTRY/hospital-crm:latest
docker run -d -p 80:3000 kr.ncr.ntruss.com/YOUR_REGISTRY/hospital-crm:latest
```

---

### Option 4: 자체 서버 (VPS, AWS EC2 등)

#### 4-1. PM2로 프로세스 관리

```bash
# 1. 서버에 코드 배포
git clone https://github.com/YOUR_USERNAME/hospital-crm.git
cd hospital-crm

# 2. 의존성 설치 및 빌드
npm install
npm run build

# 3. PM2 설치
npm install -g pm2

# 4. PM2로 실행
pm2 start npm --name "hospital-crm" -- start

# 5. 시스템 부팅시 자동 시작
pm2 startup
pm2 save

# 6. 로그 확인
pm2 logs hospital-crm
```

#### 4-2. Nginx 리버스 프록시 설정

```bash
# 1. Nginx 설치
sudo apt update
sudo apt install nginx

# 2. Nginx 설정
sudo nano /etc/nginx/sites-available/hospital-crm

# 아래 내용 입력:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 3. 설정 활성화
sudo ln -s /etc/nginx/sites-available/hospital-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. HTTPS 설정 (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔐 환경 변수 설정

배포 전에 다음 환경 변수를 설정해야 합니다:

### 필수 환경 변수
```bash
# OpenStreetMap Nominatim API
NOMINATIM_API_URL=https://nominatim.openstreetmap.org/search
NOMINATIM_USER_AGENT=Hospital-CRM/4.1

# Next.js
NEXT_TELEMETRY_DISABLED=1
```

### 선택적 환경 변수 (인증 시스템 재구현 시)
```bash
# 데이터베이스
DATABASE_URL=postgresql://user:password@host:5432/database

# Next-Auth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## ✅ 배포 전 체크리스트

- [ ] 환경 변수 설정 완료
- [ ] `.env.example`을 `.env`로 복사 및 수정
- [ ] `npm run build` 로컬 테스트 성공
- [ ] Git repository 생성 및 푸시
- [ ] 배포 플랫폼 선택
- [ ] 도메인 설정 (선택사항)
- [ ] HTTPS 인증서 설정 (프로덕션)

---

## 🎯 권장 배포 방법

### 개발/테스트용
**Vercel (무료)** 추천
- 가장 빠르고 간단
- Git push만으로 자동 배포
- Preview 배포로 변경사항 미리 확인

### 프로덕션용
1. **트래픽 적음**: Vercel Pro ($20/월)
2. **트래픽 많음**: Docker + Cloud Server (AWS, NCP 등)
3. **기업용**: NCP Cloud Functions + Load Balancer

---

## 📊 배포 후 모니터링

### Vercel
- Dashboard에서 자동 모니터링
- Analytics 기능 제공
- 로그 실시간 확인

### 자체 서버
```bash
# PM2 모니터링
pm2 monit

# Docker 로그
docker logs -f container_id

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🚨 트러블슈팅

### 빌드 실패
```bash
# 캐시 삭제 후 재빌드
rm -rf .next node_modules
npm install
npm run build
```

### 메모리 부족
```bash
# Node.js 메모리 제한 증가
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 포트 충돌
```bash
# 다른 포트로 실행
PORT=3001 npm start
```

---

## 📝 다음 단계

배포 완료 후:
1. ✅ 헬스 체크 확인: `https://your-domain.com/api/health`
2. ✅ 더미 데이터 업로드 테스트
3. ✅ 필터링 기능 테스트
4. ✅ 차트/지도 렌더링 확인
5. ✅ 성능 모니터링 설정

---

**작성일**: 2024-11-16  
**버전**: 병원 CRM v4.5  
**배포 상태**: 준비 완료 ✅

