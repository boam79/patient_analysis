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

      // window.L에 Leaflet 객체 저장 (플러그인들이 사용할 수 있도록)
      ;(window as any).L = L

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
    if (!leafletLoaded || !mapRef.current) {
      console.log('지도 렌더링 대기:', { leafletLoaded, hasMap: !!mapRef.current })
      return
    }

    // 데이터가 비어있으면 기존 레이어만 제거
    if (!data || data.length === 0) {
      console.log('데이터가 비어있어 레이어 제거')
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
    
    console.log('지도 데이터 렌더링 시작:', { mode, dataLength: data.length })

    const map = mapRef.current

    // 기존 레이어 완전히 제거 (모드 전환 시 재생성 보장)
    if (heatLayerRef.current) {
      try {
        map.removeLayer(heatLayerRef.current)
        if (heatLayerRef.current.clearLayers) {
          heatLayerRef.current.clearLayers()
        }
      } catch (e) {
        console.warn('히트맵 레이어 제거 중 오류:', e)
      }
      heatLayerRef.current = null
    }
    if (markerLayerRef.current) {
      try {
        map.removeLayer(markerLayerRef.current)
        if (markerLayerRef.current.clearLayers) {
          markerLayerRef.current.clearLayers()
        }
      } catch (e) {
        console.warn('마커 레이어 제거 중 오류:', e)
      }
      markerLayerRef.current = null
    }
    if (clusterLayerRef.current) {
      try {
        map.removeLayer(clusterLayerRef.current)
        if (clusterLayerRef.current.clearLayers) {
          clusterLayerRef.current.clearLayers()
        }
      } catch (e) {
        console.warn('클러스터 레이어 제거 중 오류:', e)
      }
      clusterLayerRef.current = null
    }
    if (circleLayerRef.current) {
      try {
        map.removeLayer(circleLayerRef.current)
        if (circleLayerRef.current.clearLayers) {
          circleLayerRef.current.clearLayers()
        }
      } catch (e) {
        console.warn('원형 레이어 제거 중 오류:', e)
      }
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
      console.warn('유효한 데이터가 없습니다.', { 
        originalLength: data.length,
        filtered: data.filter(p => p.latitude == null || p.longitude == null).length
      })
      return
    }
    
    console.log('유효한 데이터:', { validDataLength: validData.length, mode })

    if (mode === 'heatmap') {
      // 히트맵 모드: leaflet.heat 플러그인 동적 로드
      const loadAndCreateHeatmap = async () => {
        if (!mapRef.current) return

        const L = (window as any).L
        
        if (!L) {
          console.error('window.L을 찾을 수 없습니다.')
          return
        }

        // 이미 로드되어 있으면 바로 생성 (기존 레이어는 이미 제거됨)
        if (L.heatLayer) {
          // 약간의 지연을 두어 이전 레이어가 완전히 제거되도록 보장
          setTimeout(() => {
            if (mapRef.current && mode === 'heatmap') {
              createHeatLayer(L)
            }
          }, 100)
          return
        }

        // 스크립트가 이미 로드 중이면 대기
        if (document.getElementById('leaflet-heat-script')) {
          const checkInterval = setInterval(() => {
            if (L.heatLayer) {
              clearInterval(checkInterval)
              createHeatLayer(L)
            }
          }, 100)
          setTimeout(() => {
            clearInterval(checkInterval)
            if (L.heatLayer) {
              createHeatLayer(L)
            } else {
              console.error('leaflet.heat 로드 타임아웃')
            }
          }, 5000)
          return
        }

        // 스크립트 태그로 플러그인 로드
        const script = document.createElement('script')
        script.id = 'leaflet-heat-script'
        script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js'
        script.async = true
        script.onload = () => {
          // 플러그인이 등록될 때까지 대기
          const checkInterval = setInterval(() => {
            if (L.heatLayer) {
              clearInterval(checkInterval)
              createHeatLayer(L)
            }
          }, 100)
          setTimeout(() => {
            clearInterval(checkInterval)
            if (L.heatLayer) {
              createHeatLayer(L)
            } else {
              console.error('leaflet.heat 등록 실패')
            }
          }, 3000)
        }
        script.onerror = () => {
          console.error('leaflet.heat 스크립트 로드 실패')
        }
        document.head.appendChild(script)
      }

      const createHeatLayer = (L: any) => {
        if (!mapRef.current || mode !== 'heatmap') {
          console.log('히트맵 생성 취소:', { hasMap: !!mapRef.current, currentMode: mode })
          return
        }

        // 기존 히트맵 레이어가 있으면 제거
        if (heatLayerRef.current) {
          try {
            mapRef.current.removeLayer(heatLayerRef.current)
          } catch (e) {
            console.warn('기존 히트맵 제거 중 오류:', e)
          }
          heatLayerRef.current = null
        }

        // 최대값 동적 계산
        const maxValue = Math.max(...validData.map(d => d.value), 1)

        const heatData = validData.map((point) => [
          point.latitude,
          point.longitude,
          maxValue > 0 ? point.value / maxValue : 0, // 정규화 (0-1)
        ])

        const heatLayer = L.heatLayer(heatData, {
          radius: 30, // 반경 증가 (더 넓은 영역 표시)
          blur: 20, // 블러 증가 (더 부드러운 그라데이션)
          maxZoom: 17,
          max: 1.0,
          minOpacity: 0.4, // 최소 투명도 증가 (더 선명하게)
          gradient: {
            0.0: '#1e40af', // 진한 파란색 (낮음) - 대비 증가
            0.3: '#3b82f6', // 파란색
            0.5: '#10b981', // 초록색 (중간)
            0.7: '#f59e0b', // 주황색
            0.9: '#f97316', // 진한 주황색
            1.0: '#dc2626', // 진한 빨간색 (높음) - 대비 증가
          },
        })

        heatLayer.addTo(mapRef.current)
        heatLayerRef.current = heatLayer
      }

      loadAndCreateHeatmap()
    } else if (mode === 'cluster') {
      // 클러스터 모드: leaflet.markercluster 플러그인 동적 로드
      const loadAndCreateCluster = async () => {
        if (!mapRef.current) return

        const L = (window as any).L
        
        if (!L) {
          console.error('window.L을 찾을 수 없습니다.')
          return
        }

        // 이미 로드되어 있으면 바로 생성 (기존 레이어는 이미 제거됨)
        if (L.markerClusterGroup || L.MarkerClusterGroup) {
          // 약간의 지연을 두어 이전 레이어가 완전히 제거되도록 보장
          setTimeout(() => {
            if (mapRef.current && mode === 'cluster') {
              createClusterLayer(L)
            }
          }, 100)
          return
        }

        // CSS 먼저 로드
        if (!document.getElementById('leaflet-markercluster-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-markercluster-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'
          document.head.appendChild(link)
        }

        // 스크립트가 이미 로드 중이면 대기
        if (document.getElementById('leaflet-markercluster-script')) {
          const checkInterval = setInterval(() => {
            if (L.markerClusterGroup || L.MarkerClusterGroup) {
              clearInterval(checkInterval)
              createClusterLayer(L)
            }
          }, 100)
          setTimeout(() => {
            clearInterval(checkInterval)
            if (L.markerClusterGroup || L.MarkerClusterGroup) {
              createClusterLayer(L)
            } else {
              console.error('leaflet.markercluster 로드 타임아웃')
            }
          }, 5000)
          return
        }

        // 스크립트 태그로 플러그인 로드
        const script = document.createElement('script')
        script.id = 'leaflet-markercluster-script'
        script.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'
        script.async = true
        script.onload = () => {
          // 플러그인이 등록될 때까지 대기
          const checkInterval = setInterval(() => {
            if (L.markerClusterGroup || L.MarkerClusterGroup) {
              clearInterval(checkInterval)
              createClusterLayer(L)
            }
          }, 100)
          setTimeout(() => {
            clearInterval(checkInterval)
            if (L.markerClusterGroup || L.MarkerClusterGroup) {
              createClusterLayer(L)
            } else {
              console.error('leaflet.markercluster 등록 실패')
            }
          }, 3000)
        }
        script.onerror = () => {
          console.error('leaflet.markercluster 스크립트 로드 실패')
        }
        document.head.appendChild(script)
      }

      const createClusterLayer = (L: any) => {
        if (!mapRef.current || mode !== 'cluster') {
          console.log('클러스터 생성 취소:', { hasMap: !!mapRef.current, currentMode: mode })
          return
        }

        // 기존 클러스터 레이어가 있으면 제거
        if (clusterLayerRef.current) {
          try {
            mapRef.current.removeLayer(clusterLayerRef.current)
            if (clusterLayerRef.current.clearLayers) {
              clusterLayerRef.current.clearLayers()
            }
          } catch (e) {
            console.warn('기존 클러스터 제거 중 오류:', e)
          }
          clusterLayerRef.current = null
        }

        // MarkerClusterGroup 찾기 (여러 방법 시도)
        let MarkerClusterGroup: any = null
        
        if (L.markerClusterGroup) {
          // L.markerClusterGroup은 함수이므로 직접 사용
          MarkerClusterGroup = L.markerClusterGroup
        } else if (L.MarkerClusterGroup) {
          // L.MarkerClusterGroup은 클래스이므로 new로 생성
          MarkerClusterGroup = L.MarkerClusterGroup
        }

        if (!MarkerClusterGroup) {
          console.error('MarkerClusterGroup을 찾을 수 없습니다.')
          return
        }

        // markerClusterGroup이 함수인지 클래스인지 확인
        const markers = typeof MarkerClusterGroup === 'function' && !MarkerClusterGroup.prototype
          ? MarkerClusterGroup({
              chunkedLoading: true,
              animateAddingMarkers: true,
              singleMarkerMode: false,
              showCoverageOnHover: true,
              zoomToBoundsOnClick: true,
            })
          : new MarkerClusterGroup({
              chunkedLoading: true,
              animateAddingMarkers: true,
              singleMarkerMode: false,
              showCoverageOnHover: true,
              zoomToBoundsOnClick: true,
            })

        validData.forEach((point) => {
          const marker = L.marker([point.latitude, point.longitude])
          
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
      }

      loadAndCreateCluster()
    } else if (mode === 'markers') {
      // 마커 모드: window.L 사용
      const L = (window as any).L
      
      if (!L) {
        console.error('window.L을 찾을 수 없습니다.')
        return
      }

      // 기존 마커 레이어가 있으면 제거
      if (markerLayerRef.current) {
        try {
          mapRef.current.removeLayer(markerLayerRef.current)
          if (markerLayerRef.current.clearLayers) {
            markerLayerRef.current.clearLayers()
          }
        } catch (e) {
          console.warn('기존 마커 레이어 제거 중 오류:', e)
        }
        markerLayerRef.current = null
      }

      // 마커 레이어
      const markerLayer = L.layerGroup()

      validData.forEach((point) => {
        const marker = L.marker([point.latitude, point.longitude])
        
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
      // 원형 마커 모드: window.L 사용
      const L = (window as any).L
      
      if (!L) {
        console.error('window.L을 찾을 수 없습니다.')
        return
      }

      // 기존 원형 레이어가 있으면 제거
      if (circleLayerRef.current) {
        try {
          mapRef.current.removeLayer(circleLayerRef.current)
          if (circleLayerRef.current.clearLayers) {
            circleLayerRef.current.clearLayers()
          }
        } catch (e) {
          console.warn('기존 원형 레이어 제거 중 오류:', e)
        }
        circleLayerRef.current = null
      }

      // 원형 마커 모드 (크기로 값 표현)
      const circleLayer = L.layerGroup()

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

        const circle = L.circleMarker([point.latitude, point.longitude], {
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
  }, [leafletLoaded, data, mode, onLocationSelect, center, zoom])

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
