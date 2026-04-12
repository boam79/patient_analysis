# OpenStreetMap 지오코딩 및 지도 설정

## OpenStreetMap Nominatim 지오코딩 API

### 기본 URL
```
NOMINATIM_GEOCODING_URL=https://nominatim.openstreetmap.org/search
```

### 사용 제한
- **레이트리밋**: 1초당 1회 요청 (공식 서버)
- **User-Agent 필수**: 요청 시 반드시 User-Agent 헤더 포함
- **프록시 권장**: FastAPI 백엔드를 통한 프록시 사용 권장 (레이트리밋 관리)

### 요청 예시
```
GET https://nominatim.openstreetmap.org/search?q=경기도 양주시 은현면 용암로 123&format=json&limit=5&countrycodes=kr&accept-language=ko
Headers:
  User-Agent: Hospital-CRM/1.0
```

## Leaflet.js 지도 라이브러리

### CDN 링크
```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Leaflet Heat 플러그인 (히트맵용) -->
<script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
```

### NPM 설치 (Next.js 프로젝트)
```bash
npm install leaflet leaflet.heat
npm install --save-dev @types/leaflet
```

### 참고 문서
- [OpenStreetMap](https://www.openstreetmap.org/) - 오픈소스 지도 데이터
- [Nominatim API 문서](https://nominatim.org/release-docs/latest/api/Overview/)
- [Leaflet.js 공식 문서](https://leafletjs.com/)
- [Leaflet Heat 플러그인](https://github.com/Leaflet/Leaflet.heat)

---

## 🆕 네이버 맵 (추후 업데이트용)

### 네이버 지오코딩 API URL (네이버 클라우드 플랫폼 공식 문서 기준)
```
NAVER_GEOCODING_URL=https://maps.apigw.ntruss.com/map-geocode/v2/geocode
```

### 네이버 맵 JavaScript API 설정 (클라이언트 사이드 - 브라우저용)
참고: https://www.ncloud.com/product/applicationService/maps

### 참고 문서
- https://api.ncloud-docs.com/docs/ko/application-maps-overview
- https://api.ncloud-docs.com/docs/application-maps-dynamic
- https://api.ncloud-docs.com/docs/application-maps-static
- https://api.ncloud-docs.com/docs/application-maps-geocoding

**참고**: 네이버 맵은 v4.5+ 버전에서 국내 주소 정확도 향상을 위한 선택적 업그레이드로 계획되어 있습니다.

