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
    if (!leafletLoaded || !mapRef.current) return

    // 데이터가 비어있으면 기존 레이어만 제거
    if (!data || data.length === 0) {
      const map = mapRef.current
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
      return
    }

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

    // 유효한 데이터만 필터링 (좌표가 있는 경우만)
    const validData = data.filter(
      (point) => 
        point.latitude != null && 
        point.longitude != null && 
        !isNaN(point.latitude) && 
        !isNaN(point.longitude) &&
        point.value != null &&
        !isNaN(point.value)
    )

    if (validData.length === 0) {
      console.warn('유효한 데이터가 없습니다.')
      return
    }

    if (mode === 'heatmap') {
      // 히트맵 모드: leaflet과 leaflet.heat를 함께 로드
      // leaflet.heat는 import하면 자동으로 window.L.heatLayer를 추가합니다
      Promise.all([
        import('leaflet'),
        import('leaflet.heat')
      ]).then(([leafletModule]) => {
        if (!mapRef.current) return

        // leaflet.heat를 import하면 window.L.heatLayer가 자동으로 추가됩니다
        const Leaflet = (window as any).L
        
        if (!Leaflet || !Leaflet.heatLayer) {
          console.error('L.heatLayer를 찾을 수 없습니다. window.L:', (window as any).L)
          return
        }

        // 최대값 동적 계산
        const maxValue = Math.max(...validData.map(d => d.value), 1)

        const heatData = validData.map((point) => [
          point.latitude,
          point.longitude,
          maxValue > 0 ? point.value / maxValue : 0, // 정규화 (0-1)
        ])

        const heatLayer = Leaflet.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          max: 1.0,
          minOpacity: 0.2,
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
    } else if (mode === 'cluster') {
      // 클러스터 모드: leaflet과 leaflet.markercluster를 함께 로드
      Promise.all([
        import('leaflet'),
        import('leaflet.markercluster')
      ]).then(([leafletModule, clusterModule]) => {
        if (!mapRef.current) return

        // MarkerClusterGroup CSS 동적 로드
        if (!document.getElementById('leaflet-markercluster-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-markercluster-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'
          document.head.appendChild(link)
        }

        const Leaflet = (window as any).L || leafletModule.default || leafletModule
        
        // MarkerClusterGroup 가져오기 - 여러 방법 시도
        let MarkerClusterGroup: any = clusterModule.default
        
        // default가 없으면 다른 방법 시도
        if (!MarkerClusterGroup) {
          MarkerClusterGroup = (clusterModule as any).MarkerClusterGroup
        }
        
        // 여전히 없으면 clusterModule 자체를 확인
        if (!MarkerClusterGroup && (clusterModule as any).default) {
          MarkerClusterGroup = (clusterModule as any).default
        }

        if (!MarkerClusterGroup) {
          console.error('MarkerClusterGroup을 찾을 수 없습니다.', clusterModule)
          return
        }

        const markers = new MarkerClusterGroup({
          chunkedLoading: true,
          animateAddingMarkers: true,
          singleMarkerMode: false,
          showCoverageOnHover: true,
          zoomToBoundsOnClick: true,
        })

        validData.forEach((point) => {
          const marker = Leaflet.marker([point.latitude, point.longitude])
          
          const popupContent = point.region 
            ? `<div><strong>${point.region}</strong><br/>값: ${point.value.toLocaleString()}</div>`
            : `<div><strong>값: ${point.value.toLocaleString()}</strong></div>`
          
          marker.bindPopup(popupContent)

          marker.on('click', () => {
            if (onLocationSelect) {
              onLocationSelect(point.h3Index || 'temp_h3_index', point)
            }
          })

          markers.addLayer(marker)
        })

        markers.addTo(mapRef.current)
        clusterLayerRef.current = markers
      }).catch(err => {
        console.error('Leaflet.markercluster 로드 실패:', err)
      })
    } else {
      // 마커 및 원형 모드: leaflet만 로드
      import('leaflet').then((L) => {
        if (!mapRef.current) return

        if (mode === 'markers') {
          // 마커 레이어
          const markerLayer = L.default.layerGroup()

          validData.forEach((point) => {
            const marker = L.default.marker([point.latitude, point.longitude])
            
            const popupContent = point.region 
              ? `<div><strong>${point.region}</strong><br/>값: ${point.value.toLocaleString()}</div>`
              : `<div><strong>값: ${point.value.toLocaleString()}</strong></div>`
            
            marker.bindPopup(popupContent)

            marker.on('click', () => {
              if (onLocationSelect) {
                onLocationSelect(point.h3Index || 'temp_h3_index', point)
              }
            })

            marker.addTo(markerLayer)
          })

          markerLayer.addTo(mapRef.current)
          markerLayerRef.current = markerLayer
        } else if (mode === 'circle') {
          // 원형 마커 모드 (크기로 값 표현)
          const circleLayer = L.default.layerGroup()

          // 최대값과 최소값 계산
          const maxValue = Math.max(...validData.map(d => d.value), 1)
          const minValue = Math.min(...validData.map(d => d.value), 0)

          validData.forEach((point) => {
            // 값에 따라 반지름 계산 (최소 5px, 최대 50px)
            // 값이 0인 경우 최소 반지름 사용
            let radius = 5
            if (point.value > 0 && maxValue > 0) {
              const normalizedValue = (point.value - minValue) / (maxValue - minValue || 1)
              radius = Math.max(5, Math.min(50, 5 + normalizedValue * 45))
            }

            // 값에 따라 색상 결정
            let fillColor = '#94a3b8' // 회색 (값이 0인 경우)
            if (point.value > 0) {
              const normalizedValue = maxValue > 0 ? point.value / maxValue : 0
              if (normalizedValue < 0.33) {
                fillColor = '#3b82f6' // 파란색 (낮음)
              } else if (normalizedValue < 0.66) {
                fillColor = '#f59e0b' // 주황색 (중간)
              } else {
                fillColor = '#ef4444' // 빨간색 (높음)
              }
            }

            const circle = L.default.circleMarker([point.latitude, point.longitude], {
              radius,
              fillColor,
              color: '#1e40af',
              weight: 2,
              fillOpacity: 0.7,
            })

            const popupContent = point.region 
              ? `<div><strong>${point.region}</strong><br/>값: ${point.value.toLocaleString()}</div>`
              : `<div><strong>값: ${point.value.toLocaleString()}</strong></div>`
            
            circle.bindPopup(popupContent)

            circle.on('click', () => {
              if (onLocationSelect) {
                onLocationSelect(point.h3Index || 'temp_h3_index', point)
              }
            })

            circle.addTo(circleLayer)
          })

          circleLayer.addTo(mapRef.current)
          circleLayerRef.current = circleLayer
        }
      }).catch(err => {
        console.error('Leaflet 로드 실패:', err)
      })
    }
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
        style={{ minHeight: '500px', zIndex: 0 }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  )
}
