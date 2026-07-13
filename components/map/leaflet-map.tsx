'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface LeafletMapPoint {
  latitude: number
  longitude: number
  value: number
  region?: string
  h3Index?: string
}

interface LeafletMapProps {
  center?: [number, number]
  zoom?: number
  data?: LeafletMapPoint[]
  mode?: 'markers' | 'circle' | 'heatmap'
  /** 선택된 지역 — 마커/원형 하이라이트 */
  selectedRegions?: string[]
  /** 클릭 시 해당 좌표로 부드럽게 이동 */
  flyToOnSelect?: boolean
  flyToZoom?: number
  minHeight?: number
  onLocationSelect?: (h3Index: string, data: LeafletMapPoint) => void
}

export function LeafletMap({
  center = [37.5665, 126.978],
  zoom = 11,
  data = [],
  mode = 'markers',
  selectedRegions = [],
  flyToOnSelect = false,
  flyToZoom = 12,
  minHeight = 500,
  onLocationSelect,
}: LeafletMapProps) {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerLayerRef = useRef<any>(null)
  const circleLayerRef = useRef<any>(null)
  const heatLayerRef = useRef<any>(null)
  const heatGenerationRef = useRef(0)
  const markersByKeyRef = useRef<Map<string, { marker: any; point: LeafletMapPoint }>>(
    new Map()
  )
  const [isLoading, setIsLoading] = useState(true)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  const clearAllLayers = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    const removeLayer = (layerRef: { current: any }) => {
      if (!layerRef.current) return
      try {
        map.removeLayer(layerRef.current)
        if (layerRef.current.clearLayers) {
          layerRef.current.clearLayers()
        }
      } catch (error) {
        console.warn('레이어 제거 중 오류:', error)
      }
      layerRef.current = null
    }

    removeLayer(markerLayerRef)
    removeLayer(circleLayerRef)
    removeLayer(heatLayerRef)
    markersByKeyRef.current.clear()
  }, [])

  // 지도 초기화 — center/zoom은 최초 1회만 (변경 시 setView로 처리)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mapContainerRef.current || mapRef.current) return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    let cancelled = false

    import('leaflet')
      .then((L) => {
        if (cancelled || !mapContainerRef.current || mapRef.current) return

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        ;(window as any).L = L

        const map = L.map(mapContainerRef.current, {
          center,
          zoom,
          zoomControl: true,
          attributionControl: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        mapRef.current = map
        setLeafletLoaded(true)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Leaflet 로드 실패:', err)
        setIsLoading(false)
      })

    return () => {
      cancelled = true
      clearAllLayers()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      setLeafletLoaded(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; center/zoom via setView
  }, [clearAllLayers])

  const pointKey = (point: LeafletMapPoint, index: number) =>
    point.h3Index || point.region || `pt-${index}`

  const isSelected = useCallback(
    (point: LeafletMapPoint) =>
      Boolean(point.region && selectedRegions.includes(point.region)),
    [selectedRegions]
  )

  const handlePointClick = useCallback(
    (point: LeafletMapPoint) => {
      const key = point.h3Index || `region-${point.region || 'unknown'}`
      onLocationSelect?.(key, point)
      if (flyToOnSelect && mapRef.current) {
        mapRef.current.flyTo([point.latitude, point.longitude], flyToZoom, {
          duration: 0.6,
        })
      }
    },
    [onLocationSelect, flyToOnSelect, flyToZoom]
  )

  const makeDivIcon = useCallback((L: any, selected: boolean) => {
    const size = selected ? 14 : 12
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${selected ? '#10B981' : '#0B6E6E'};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [size, size],
    })
  }, [])

  const renderMarkers = useCallback(
    (points: LeafletMapPoint[]) => {
      const L = (window as any).L
      if (!L || !mapRef.current) return

      const markerLayer = L.layerGroup()
      markersByKeyRef.current.clear()

      points.forEach((point, index) => {
        const selected = isSelected(point)
        const marker = L.marker([point.latitude, point.longitude], {
          icon: makeDivIcon(L, selected),
        })
        const popupContent = point.region
          ? `<div><strong>${point.region}</strong><br/>값: ${point.value.toLocaleString()}</div>`
          : `<div><strong>값: ${point.value.toLocaleString()}</strong></div>`

        marker.bindPopup(popupContent)
        marker.on('click', () => handlePointClick(point))
        marker.addTo(markerLayer)
        markersByKeyRef.current.set(pointKey(point, index), { marker, point })
      })

      markerLayer.addTo(mapRef.current)
      markerLayerRef.current = markerLayer
    },
    [handlePointClick, isSelected, makeDivIcon]
  )

  const renderCircles = useCallback(
    (points: LeafletMapPoint[]) => {
      const L = (window as any).L
      if (!L || !mapRef.current) return

      const circleLayer = L.layerGroup()
      const maxValue = Math.max(...points.map((d) => d.value), 1)
      const minValue = Math.min(...points.map((d) => d.value), 0)

      points.forEach((point) => {
        let radius = 5
        if (point.value > 0 && maxValue > 0) {
          const normalizedValue =
            (point.value - minValue) / (maxValue - minValue || 1)
          radius = Math.max(5, Math.min(50, 5 + normalizedValue * 45))
        }

        const selected = isSelected(point)
        let fillColor = '#94a3b8'
        if (selected) {
          fillColor = '#10B981'
        } else if (point.value > 0) {
          const normalizedValue = maxValue > 0 ? point.value / maxValue : 0
          if (normalizedValue < 0.33) fillColor = '#0B6E6E'
          else if (normalizedValue < 0.66) fillColor = '#C47A12'
          else fillColor = '#C23B3B'
        }

        const circle = L.circleMarker([point.latitude, point.longitude], {
          radius: selected ? radius + 2 : radius,
          fillColor,
          color: selected ? '#047857' : '#0A2F2F',
          weight: selected ? 3 : 2,
          fillOpacity: 0.7,
        })

        const popupContent = point.region
          ? `<div><strong>${point.region}</strong><br/>값: ${point.value.toLocaleString()}</div>`
          : `<div><strong>값: ${point.value.toLocaleString()}</strong></div>`

        circle.bindPopup(popupContent)
        circle.on('click', () => handlePointClick(point))
        circle.addTo(circleLayer)
      })

      circleLayer.addTo(mapRef.current)
      circleLayerRef.current = circleLayer
    },
    [handlePointClick, isSelected]
  )

  const renderHeatmap = useCallback(
    async (points: LeafletMapPoint[], generation: number) => {
      const L = (window as any).L
      if (!L || !mapRef.current) return

      await import('leaflet.heat')
      if (!mapRef.current) return
      if (heatGenerationRef.current !== generation) return

      const maxValue = Math.max(...points.map((d) => d.value), 1)
      const heatData = points.map((point) => [
        point.latitude,
        point.longitude,
        Math.min(1, point.value / maxValue),
      ])

      const heatLayer = (L as any).heatLayer(heatData, {
        radius: 28,
        blur: 18,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.0: '#0B6E6E',
          0.5: '#C47A12',
          1.0: '#C23B3B',
        },
      })

      if (heatGenerationRef.current !== generation) return
      heatLayer.addTo(mapRef.current)
      heatLayerRef.current = heatLayer

      // 히트맵은 클릭 이벤트가 없으므로 투명 원으로 선택/상세 연결
      const clickLayer = L.layerGroup()
      points.forEach((point) => {
        const circle = L.circleMarker([point.latitude, point.longitude], {
          radius: 14,
          fillColor: '#000',
          color: '#000',
          weight: 0,
          fillOpacity: 0,
          opacity: 0,
        })
        const popupContent = point.region
          ? `<div><strong>${point.region}</strong><br/>값: ${point.value.toLocaleString()}</div>`
          : `<div><strong>값: ${point.value.toLocaleString()}</strong></div>`
        circle.bindPopup(popupContent)
        circle.on('click', () => handlePointClick(point))
        clickLayer.addLayer(circle)
      })
      clickLayer.addTo(mapRef.current)
      circleLayerRef.current = clickLayer
    },
    [handlePointClick]
  )

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return

    if (!data || data.length === 0) {
      clearAllLayers()
      return
    }

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
      clearAllLayers()
      return
    }

    clearAllLayers()

    if (mode === 'circle') {
      renderCircles(validData)
    } else if (mode === 'heatmap') {
      const generation = ++heatGenerationRef.current
      void renderHeatmap(validData, generation)
    } else {
      renderMarkers(validData)
    }

    return () => {
      heatGenerationRef.current++
      clearAllLayers()
    }
  }, [
    leafletLoaded,
    data,
    mode,
    selectedRegions,
    clearAllLayers,
    renderMarkers,
    renderCircles,
    renderHeatmap,
  ])

  // 외부 center/zoom 변경 시 remount 없이 이동
  useEffect(() => {
    if (leafletLoaded && mapRef.current && center) {
      mapRef.current.setView(center, zoom, { animate: true })
    }
  }, [leafletLoaded, center, zoom])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight, zIndex: 0 }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  )
}
