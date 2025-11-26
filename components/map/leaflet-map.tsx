'use client'

import { useEffect, useRef, useState } from 'react'

interface LeafletMapProps {
  center?: [number, number]
  zoom?: number
  data?: {
    latitude: number
    longitude: number
    value: number
    region?: string
    h3Index?: string
  }[]
  mode?: 'heatmap' | 'markers' | 'cluster' | 'circle'
  onLocationSelect?: (h3Index: string, data: any) => void
}

export function LeafletMap({
  center = [37.5665, 126.9780], // 서울 기본 좌표
  zoom = 11,
  data = [],
  mode = 'heatmap',
  onLocationSelect,
}: LeafletMapProps) {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const heatLayerRef = useRef<any>(null)
  const markerLayerRef = useRef<any>(null)
  const clusterLayerRef = useRef<any>(null)
  const circleLayerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Leaflet 동적 로드 및 지도 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mapContainerRef.current || mapRef.current) return

    // Leaflet CSS 동적 로드
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    // Leaflet 라이브러리 동적 로드
    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapRef.current) return

      // Leaflet 아이콘 설정
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // Leaflet 지도 생성
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      })

      // OpenStreetMap 타일 레이어 추가
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      setLeafletLoaded(true)
      setIsLoading(false)
    }).catch(err => {
      console.error('Leaflet 로드 실패:', err)
      setIsLoading(false)
    })

    // 클린업
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [center, zoom])

  // 데이터 렌더링 (히트맵 또는 마커)
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !data.length) return

    const map = mapRef.current

    // 기존 레이어 제거
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }
    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current)
      markerLayerRef.current = null
    }
    if (clusterLayerRef.current) {
      map.removeLayer(clusterLayerRef.current)
      clusterLayerRef.current = null
    }
    if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current)
      circleLayerRef.current = null
    }

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      if (mode === 'heatmap') {
        // Leaflet.heat 동적 로드
        import('leaflet.heat').then(() => {
          if (!mapRef.current) return

          const heatData = data.map((point) => [
            point.latitude,
            point.longitude,
            point.value,
          ])

          // @ts-ignore - leaflet.heat 타입 이슈
          const heatLayer = (L as any).heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            gradient: {
              0.0: '#3b82f6', // 파란색 (낮음)
              0.5: '#f59e0b', // 주황색 (중간)
              1.0: '#ef4444', // 빨간색 (높음)
            },
          })

          heatLayer.addTo(mapRef.current)
          heatLayerRef.current = heatLayer
        }).catch(err => {
          console.error('Leaflet.heat 로드 실패:', err)
        })
      } else if (mode === 'markers') {
        // 마커 레이어
        const markerLayer = L.default.layerGroup()

        data.forEach((point) => {
          const marker = L.default.marker([point.latitude, point.longitude])
          
          marker.bindPopup(`
            <div>
              <strong>값: ${point.value}</strong>
            </div>
          `)

          marker.on('click', () => {
            if (onLocationSelect) {
              onLocationSelect('temp_h3_index', point)
            }
          })

          marker.addTo(markerLayer)
        })

        markerLayer.addTo(map)
        markerLayerRef.current = markerLayer
      } else if (mode === 'cluster') {
        // 클러스터 모드
        import('leaflet.markercluster').then((MarkerClusterGroup) => {
          if (!mapRef.current) return

          // MarkerClusterGroup CSS 동적 로드
          if (!document.getElementById('leaflet-markercluster-css')) {
            const link = document.createElement('link')
            link.id = 'leaflet-markercluster-css'
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'
            document.head.appendChild(link)
          }

          const markers = new MarkerClusterGroup.default({
            chunkedLoading: true,
            animateAddingMarkers: true,
            singleMarkerMode: false,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true,
          })

          data.forEach((point) => {
            const marker = L.default.marker([point.latitude, point.longitude])
            
            const popupContent = point.region 
              ? `<div><strong>${point.region}</strong><br/>값: ${point.value}</div>`
              : `<div><strong>값: ${point.value}</strong></div>`
            
            marker.bindPopup(popupContent)

            marker.on('click', () => {
              if (onLocationSelect) {
                onLocationSelect(point.h3Index || 'temp_h3_index', point)
              }
            })

            markers.addLayer(marker)
          })

          markers.addTo(map)
          clusterLayerRef.current = markers
        }).catch(err => {
          console.error('Leaflet.markercluster 로드 실패:', err)
        })
      } else if (mode === 'circle') {
        // 원형 마커 모드 (크기로 값 표현)
        const circleLayer = L.default.layerGroup()

        data.forEach((point) => {
          // 값에 따라 반지름 계산 (최소 5px, 최대 50px)
          const maxValue = Math.max(...data.map(d => d.value), 1)
          const radius = Math.max(5, Math.min(50, (point.value / maxValue) * 50))

          const circle = L.default.circleMarker([point.latitude, point.longitude], {
            radius,
            fillColor: '#3b82f6',
            color: '#1e40af',
            weight: 2,
            fillOpacity: 0.6,
          })

          const popupContent = point.region 
            ? `<div><strong>${point.region}</strong><br/>값: ${point.value}</div>`
            : `<div><strong>값: ${point.value}</strong></div>`
          
          circle.bindPopup(popupContent)

          circle.on('click', () => {
            if (onLocationSelect) {
              onLocationSelect(point.h3Index || 'temp_h3_index', point)
            }
          })

          circle.addTo(circleLayer)
        })

        circleLayer.addTo(map)
        circleLayerRef.current = circleLayer
      }
    }).catch(err => {
      console.error('Leaflet 로드 실패:', err)
    })
  }, [leafletLoaded, data, mode, onLocationSelect])

  // 지도 중심 변경
  useEffect(() => {
    if (leafletLoaded && mapRef.current && center) {
      mapRef.current.setView(center, zoom)
    }
  }, [leafletLoaded, center, zoom])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '500px' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  )
}
