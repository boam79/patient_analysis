'use client'

import { useEffect, useRef, useState } from 'react'
import { useFilterStore } from '@/stores/filter-store'
import type L from 'leaflet'

interface MapData {
  latitude: number
  longitude: number
  value: number
  h3Index: string
  region?: string
}

interface InteractiveMapProps {
  data?: MapData[]
  mode?: 'heatmap' | 'markers'
}

export function InteractiveMap({
  data = [],
  mode = 'heatmap',
}: InteractiveMapProps) {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const heatLayerRef = useRef<any>(null)
  const markerLayerRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map()) // 마커 참조 저장
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  
  const { selectedH3Index, selectedRegions, setSelectedH3Index, addRegion, removeRegion, setSelectedChartData } =
    useFilterStore()

  // Leaflet 동적 로드 및 지도 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return

    let map: any = null

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

    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapRef.current) return

      // Leaflet 아이콘 설정 수정
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      map = L.map(mapContainerRef.current, {
        center: [36.5, 127.5], // 한국 중심
        zoom: 7, // 전국이 보이는 줌 레벨
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      setLeafletLoaded(true)
    }).catch(err => {
      console.error('Leaflet 로드 실패:', err)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // 데이터 렌더링 (히트맵 또는 마커) - data가 변경될 때만 실행
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
    markersRef.current.clear()

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      if (mode === 'heatmap') {
        import('leaflet.heat').then(() => {
          if (!mapRef.current) return

          const heatData = data.map((point) => [
            point.latitude,
            point.longitude,
            point.value,
          ])

          // @ts-ignore
          const heatLayer = (L as any).heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            gradient: {
              0.0: '#3b82f6',
              0.5: '#f59e0b',
              1.0: '#ef4444',
            },
          })

          heatLayer.addTo(mapRef.current)
          heatLayerRef.current = heatLayer
        })
      } else if (mode === 'markers') {
        const markerLayer = L.default.layerGroup()

        data.forEach((point) => {
          // 초기 선택 상태 확인
          const isRegionSelected = point.region && selectedRegions.includes(point.region)
          const isH3Selected = selectedH3Index === point.h3Index
          const isSelected = isRegionSelected || isH3Selected
          
          const icon = L.default.divIcon({
            className: 'custom-marker',
            html: `<div style="
              background-color: ${isSelected ? '#10B981' : '#3b82f6'};
              width: ${isSelected ? '14px' : '12px'};
              height: ${isSelected ? '14px' : '12px'};
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [isSelected ? 14 : 12, isSelected ? 14 : 12],
          })

          const marker = L.default.marker([point.latitude, point.longitude], { icon })

          // 팝업 제거 - 클릭으로만 상호작용

          // 각 마커에 고유한 클릭 핸들러 (토글 기능 포함)
          marker.on('click', ((capturedPoint) => {
            return () => {
              requestAnimationFrame(() => {
                const currentRegions = useFilterStore.getState().selectedRegions
                
                // 이미 선택된 지역이면 제거 (토글)
                if (capturedPoint.region && currentRegions.includes(capturedPoint.region)) {
                  removeRegion(capturedPoint.region)
                  setSelectedH3Index(null)
                } else {
                  // 선택되지 않은 지역이면 추가
                  setSelectedH3Index(capturedPoint.h3Index)
                  setSelectedChartData('region', capturedPoint.region || capturedPoint.h3Index)
                  
                  if (capturedPoint.region) {
                    addRegion(capturedPoint.region)
                  }
                }
              })
            }
          })(point))

          marker.addTo(markerLayer)
          
          // 마커 참조 저장 (나중에 아이콘 업데이트용)
          markersRef.current.set(point.h3Index, { marker, point })
        })

        markerLayer.addTo(map)
        markerLayerRef.current = markerLayer
      }
    })
  }, [leafletLoaded, data, mode])

  // 선택 상태가 변경될 때 마커 아이콘만 업데이트 (전체 재렌더링 방지)
  useEffect(() => {
    if (!leafletLoaded || mode !== 'markers' || markersRef.current.size === 0) return

    import('leaflet').then((L) => {
      markersRef.current.forEach(({ marker, point }) => {
        const isRegionSelected = point.region && selectedRegions.includes(point.region)
        const isH3Selected = selectedH3Index === point.h3Index
        const isSelected = isRegionSelected || isH3Selected

        const newIcon = L.default.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: ${isSelected ? '#10B981' : '#3b82f6'};
            width: ${isSelected ? '14px' : '12px'};
            height: ${isSelected ? '14px' : '12px'};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [isSelected ? 14 : 12, isSelected ? 14 : 12],
        })

        marker.setIcon(newIcon)
      })
    })
  }, [leafletLoaded, mode, selectedH3Index, selectedRegions])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '500px' }}
      />
      {selectedH3Index && (
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border">
          <p className="text-xs font-medium">선택된 영역</p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedH3Index.slice(0, 12)}...
          </p>
          <button
            onClick={() => setSelectedH3Index(null)}
            className="text-xs text-primary hover:underline mt-1"
          >
            선택 해제
          </button>
        </div>
      )}
    </div>
  )
}

