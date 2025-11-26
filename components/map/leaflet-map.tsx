'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

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
  mode?: 'markers' | 'circle'
  onLocationSelect?: (h3Index: string, data: any) => void
}

export function LeafletMap({
  center = [37.5665, 126.9780],
  zoom = 11,
  data = [],
  mode = 'markers',
  onLocationSelect,
}: LeafletMapProps) {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerLayerRef = useRef<any>(null)
  const circleLayerRef = useRef<any>(null)
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
  }, [])

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

    import('leaflet')
      .then((L) => {
        if (!mapContainerRef.current || mapRef.current) return

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        ;(window as any).L = L

        const map = L.map(mapContainerRef.current, {
          center,
          zoom,
          zoomControl: true,
          attributionControl: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
      clearAllLayers()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      setLeafletLoaded(false)
    }
  }, [center, zoom, clearAllLayers])

  const renderMarkers = useCallback(
    (points: NonNullable<LeafletMapProps['data']>) => {
      const L = (window as any).L
      if (!L || !mapRef.current) return

      const markerLayer = L.layerGroup()

      points.forEach((point) => {
        const marker = L.marker([point.latitude, point.longitude])
        const popupContent = point.region
          ? `<div><strong>${point.region}</strong><br/>값: ${point.value.toLocaleString()}</div>`
          : `<div><strong>값: ${point.value.toLocaleString()}</strong></div>`

        marker.bindPopup(popupContent)

        marker.on('click', () => {
          onLocationSelect?.(point.h3Index || 'temp_h3_index', point)
        })

        marker.addTo(markerLayer)
      })

      markerLayer.addTo(mapRef.current)
      markerLayerRef.current = markerLayer
    },
    [onLocationSelect]
  )

  const renderCircles = useCallback(
    (points: NonNullable<LeafletMapProps['data']>) => {
      const L = (window as any).L
      if (!L || !mapRef.current) return

      const circleLayer = L.layerGroup()
      const maxValue = Math.max(...points.map((d) => d.value), 1)
      const minValue = Math.min(...points.map((d) => d.value), 0)

      points.forEach((point) => {
        let radius = 5
        if (point.value > 0 && maxValue > 0) {
          const normalizedValue = (point.value - minValue) / (maxValue - minValue || 1)
          radius = Math.max(5, Math.min(50, 5 + normalizedValue * 45))
        }

        let fillColor = '#94a3b8'
        if (point.value > 0) {
          const normalizedValue = maxValue > 0 ? point.value / maxValue : 0
          if (normalizedValue < 0.33) fillColor = '#3b82f6'
          else if (normalizedValue < 0.66) fillColor = '#f59e0b'
          else fillColor = '#ef4444'
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
          onLocationSelect?.(point.h3Index || 'temp_h3_index', point)
        })
        circle.addTo(circleLayer)
      })

      circleLayer.addTo(mapRef.current)
      circleLayerRef.current = circleLayer
    },
    [onLocationSelect]
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

    if (mode === 'circle') {
      renderCircles(validData)
    } else {
      renderMarkers(validData)
    }

    return () => {
      clearAllLayers()
    }
  }, [leafletLoaded, data, mode, clearAllLayers, renderMarkers, renderCircles])

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


