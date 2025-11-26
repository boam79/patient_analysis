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
  const currentModeRef = useRef<string>(mode) // 현재 모드 추적
  const abortControllerRef = useRef<AbortController | null>(null) // 비동기 작업 취소용
  const intervalRefsRef = useRef<Set<NodeJS.Timeout>>(new Set()) // 모든 interval 추적
  const timeoutRefsRef = useRef<Set<NodeJS.Timeout>>(new Set()) // 모든 timeout 추적
  const pluginLoadingRef = useRef<{ heat: boolean; cluster: boolean }>({ heat: false, cluster: false }) // 플러그인 로딩 상태 추적
  const [isLoading, setIsLoading] = useState(true)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // 모든 레이어 제거 헬퍼 함수 (useCallback으로 최적화)
  const clearAllLayers = useCallback(() => {
    const map = mapRef.current
    if (!map) return

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
  }, [])

  // 모든 interval/timeout 정리 헬퍼 함수
  const clearAllTimers = useCallback(() => {
    intervalRefsRef.current.forEach(interval => {
      clearInterval(interval)
    })
    intervalRefsRef.current.clear()

    timeoutRefsRef.current.forEach(timeout => {
      clearTimeout(timeout)
    })
    timeoutRefsRef.current.clear()
  }, [])

  // 안전한 setInterval (자동 추적)
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(() => {
      callback()
    }, delay)
    intervalRefsRef.current.add(interval)
    return interval
  }, [])

  // 안전한 setTimeout (자동 추적)
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      timeoutRefsRef.current.delete(timeout)
      callback()
    }, delay)
    timeoutRefsRef.current.add(timeout)
    return timeout
  }, [])

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
      clearAllTimers()
      clearAllLayers()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [center, zoom, clearAllLayers, clearAllTimers])

  // 데이터 렌더링 (히트맵 또는 마커)
  useEffect(() => {
    console.log('=== 지도 렌더링 useEffect 시작 ===', {
      leafletLoaded,
      hasMap: !!mapRef.current,
      mode,
      dataLength: data?.length || 0,
      timestamp: new Date().toISOString()
    })

    if (!leafletLoaded || !mapRef.current) {
      console.warn('지도 렌더링 대기:', { leafletLoaded, hasMap: !!mapRef.current })
      return
    }

    // 이전 비동기 작업 취소 및 타이머 정리
    if (abortControllerRef.current) {
      console.log('이전 비동기 작업 취소')
      abortControllerRef.current.abort()
    }
    clearAllTimers()
    
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // 현재 모드 업데이트
    const previousMode = currentModeRef.current
    currentModeRef.current = mode
    console.log('모드 업데이트:', { previousMode, newMode: mode })

    // 데이터가 비어있으면 기존 레이어만 제거
    if (!data || data.length === 0) {
      console.log('데이터가 비어있어 레이어 제거', { dataLength: data?.length || 0 })
      clearAllLayers()
      return
    }
    
    console.log('지도 데이터 렌더링 시작:', { 
      mode, 
      dataLength: data.length,
      firstDataPoint: data[0] ? { lat: data[0].latitude, lng: data[0].longitude, value: data[0].value } : null
    })

    // 기존 레이어 완전히 제거 (모드 전환 시 재생성 보장)
    console.log('기존 레이어 제거 시작:', {
      hasHeatLayer: !!heatLayerRef.current,
      hasMarkerLayer: !!markerLayerRef.current,
      hasClusterLayer: !!clusterLayerRef.current,
      hasCircleLayer: !!circleLayerRef.current
    })
    clearAllLayers()
    console.log('기존 레이어 제거 완료')
    
    // 레이어 제거 후 충분한 지연 시간 확보 (Leaflet 내부 정리 시간)
    // 이 지연은 플러그인이 이미 로드된 경우에도 적용되어 레이어 재생성 보장

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
        filtered: data.filter(p => p.latitude == null || p.longitude == null).length,
        invalidLatLng: data.filter(p => p.latitude == null || p.longitude == null).length,
        invalidValue: data.filter(p => p.value == null || isNaN(p.value)).length
      })
      return
    }
    
    console.log('유효한 데이터 확인 완료:', { 
      validDataLength: validData.length, 
      mode,
      sampleData: validData.slice(0, 3).map(d => ({ lat: d.latitude, lng: d.longitude, value: d.value }))
    })

    if (mode === 'heatmap') {
      // 히트맵 모드: leaflet.heat 플러그인 동적 로드
      const loadAndCreateHeatmap = async () => {
        if (!mapRef.current) {
          console.warn('히트맵 생성 취소: 지도 인스턴스가 없습니다')
          return
        }

        const L = (window as any).L
        
        if (!L) {
          console.error('window.L을 찾을 수 없습니다.')
          return
        }

        const createHeatLayer = (L: any, dataToUse: typeof validData) => {
          console.log('=== createHeatLayer 호출 ===', {
            signalAborted: signal.aborted,
            hasMap: !!mapRef.current,
            currentMode: currentModeRef.current,
            dataLength: dataToUse?.length || 0,
            timestamp: new Date().toISOString()
          })

          // AbortSignal 확인
          if (signal.aborted) {
            console.warn('히트맵 생성 취소: 작업이 중단됨')
            return
          }

          // 현재 모드 및 지도 인스턴스 재확인
          if (!mapRef.current) {
            console.error('히트맵 생성 취소: 지도 인스턴스가 없습니다')
            return
          }

          if (currentModeRef.current !== 'heatmap') {
            console.warn('히트맵 생성 취소: 모드가 변경됨', { 
              currentMode: currentModeRef.current, 
              expectedMode: 'heatmap' 
            })
            return
          }

          // 기존 히트맵 레이어가 있으면 제거 (이중 체크)
          if (heatLayerRef.current) {
            console.log('기존 히트맵 레이어 제거 시작 (createHeatLayer 내부)')
            try {
              // 지도에서 레이어 제거
              if (mapRef.current && mapRef.current.hasLayer && mapRef.current.hasLayer(heatLayerRef.current)) {
                mapRef.current.removeLayer(heatLayerRef.current)
                console.log('기존 히트맵 레이어 지도에서 제거 성공')
              } else {
                console.log('기존 히트맵 레이어가 이미 지도에서 제거됨')
              }
            } catch (e) {
              console.error('기존 히트맵 제거 중 오류:', e)
            }
            heatLayerRef.current = null
            console.log('히트맵 레이어 ref 초기화 완료')
          } else {
            console.log('기존 히트맵 레이어 없음 (정상)')
          }

          // 데이터 유효성 확인
          if (!dataToUse || dataToUse.length === 0) {
            console.error('히트맵 생성 취소: 데이터가 없습니다', { 
              dataToUse: dataToUse?.length || 0 
            })
            return
          }

          // 최대값 동적 계산
          const maxValue = Math.max(...dataToUse.map(d => d.value), 1)
          const minValue = Math.min(...dataToUse.map(d => d.value), 0)
          console.log('히트맵 데이터 계산:', {
            dataPoints: dataToUse.length,
            maxValue,
            minValue,
            sampleValues: dataToUse.slice(0, 5).map(d => d.value)
          })

          const heatData = dataToUse.map((point) => [
            point.latitude,
            point.longitude,
            maxValue > 0 ? point.value / maxValue : 0, // 정규화 (0-1)
          ])

          console.log('히트맵 레이어 생성 시작:', {
            heatDataPoints: heatData.length,
            sampleHeatData: heatData.slice(0, 3),
            hasHeatLayerFunction: !!L.heatLayer
          })

          try {
            const heatLayer = L.heatLayer(heatData, {
              radius: 30,
              blur: 20,
              maxZoom: 17,
              max: 1.0,
              minOpacity: 0.4,
              gradient: {
                0.0: '#1e40af',
                0.3: '#3b82f6',
                0.5: '#10b981',
                0.7: '#f59e0b',
                0.9: '#f97316',
                1.0: '#dc2626',
              },
            })

            console.log('히트맵 레이어 객체 생성 완료, 지도에 추가 시작')
            heatLayer.addTo(mapRef.current)
            heatLayerRef.current = heatLayer
            console.log('✅ 히트맵 레이어 생성 및 추가 완료', {
              layerType: typeof heatLayer,
              hasLayer: !!heatLayer,
              mapLayers: mapRef.current._layers ? Object.keys(mapRef.current._layers).length : 0
            })
          } catch (error) {
            console.error('❌ 히트맵 레이어 생성 중 오류:', error, {
              errorMessage: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined,
              LType: typeof L,
              heatLayerType: typeof L.heatLayer
            })
          }
        }

        // 플러그인 로딩 헬퍼 함수
        const waitForHeatPlugin = (maxAttempts = 50, attempt = 0): Promise<boolean> => {
          return new Promise((resolve) => {
            if (signal.aborted || !mapRef.current || currentModeRef.current !== 'heatmap') {
              resolve(false)
              return
            }

            // 여러 방법으로 플러그인 확인
            if (L.heatLayer || (window as any).L?.heatLayer || (L as any).heat?.Layer) {
              console.log('leaflet.heat 플러그인 확인됨', { attempt })
              resolve(true)
              return
            }

            if (attempt >= maxAttempts) {
              console.error('leaflet.heat 플러그인 로드 타임아웃', { attempts: attempt })
              resolve(false)
              return
            }

            safeSetTimeout(() => {
              waitForHeatPlugin(maxAttempts, attempt + 1).then(resolve)
            }, 100)
          })
        }

        // 플러그인이 이미 로드되어 있는지 즉시 확인
        const isHeatPluginLoaded = L.heatLayer || (window as any).L?.heatLayer || (L as any).heat?.Layer
        
        console.log('히트맵 플러그인 확인:', {
          L_heatLayer: !!L.heatLayer,
          window_L_heatLayer: !!(window as any).L?.heatLayer,
          L_heat_Layer: !!(L as any).heat?.Layer,
          isHeatPluginLoaded,
          pluginLoading: pluginLoadingRef.current.heat
        })

        if (isHeatPluginLoaded) {
          // 플러그인이 이미 로드되어 있으면 레이어 생성 (탭 전환 시 데이터 변경 반영)
          // 중요: clearAllLayers() 후 충분한 지연 시간을 두어 레이어 제거가 완료되도록 보장
          console.log('✅ leaflet.heat 플러그인 이미 로드됨, 레이어 재생성 시작', {
            validDataLength: validData.length,
            timestamp: new Date().toISOString(),
            previousHeatLayer: !!heatLayerRef.current
          })
          
          // 레이어 제거 후 충분한 지연 시간 확보 (200ms)
          safeSetTimeout(() => {
            console.log('히트맵 레이어 생성 setTimeout 실행:', {
              signalAborted: signal.aborted,
              hasMap: !!mapRef.current,
              currentMode: currentModeRef.current,
              expectedMode: 'heatmap',
              stillHasHeatLayer: !!heatLayerRef.current
            })
            
            // 추가 안전 체크: 이전 레이어가 완전히 제거되었는지 확인
            if (heatLayerRef.current) {
              console.warn('⚠️ 이전 히트맵 레이어가 아직 존재함, 강제 제거')
              try {
                if (mapRef.current) {
                  mapRef.current.removeLayer(heatLayerRef.current)
                }
              } catch (e) {
                console.warn('이전 히트맵 레이어 강제 제거 중 오류:', e)
              }
              heatLayerRef.current = null
            }
            
            if (signal.aborted || !mapRef.current || currentModeRef.current !== 'heatmap') {
              console.warn('히트맵 레이어 생성 취소 (setTimeout 내부)')
              return
            }
            
            console.log('히트맵 레이어 생성 함수 호출 시작')
            createHeatLayer(L, validData)
          }, 200) // 100ms -> 200ms로 증가하여 레이어 제거 완료 보장
        } else if (!pluginLoadingRef.current.heat) {
          console.log('히트맵 플러그인 로드 필요, 스크립트 확인 시작')
          // 스크립트가 이미 로드 중이면 대기
          const existingScript = document.getElementById('leaflet-heat-script')
          if (existingScript) {
            console.log('leaflet.heat 스크립트 이미 존재, 플러그인 등록 대기...', {
              scriptSrc: existingScript.getAttribute('src'),
              scriptId: existingScript.id
            })
            waitForHeatPlugin(50).then((loaded) => {
              console.log('히트맵 플러그인 대기 완료:', {
                loaded,
                signalAborted: signal.aborted,
                hasMap: !!mapRef.current,
                currentMode: currentModeRef.current
              })
              if (loaded && !signal.aborted && mapRef.current && currentModeRef.current === 'heatmap') {
                createHeatLayer(L, validData)
              } else if (!loaded) {
                console.error('❌ leaflet.heat 플러그인 로드 실패 - 스크립트는 있지만 플러그인이 등록되지 않음')
              } else {
                console.warn('히트맵 레이어 생성 취소:', {
                  loaded,
                  signalAborted: signal.aborted,
                  hasMap: !!mapRef.current,
                  currentMode: currentModeRef.current
                })
              }
            })
          } else {
            // 스크립트 태그로 플러그인 로드
            console.log('leaflet.heat 스크립트 새로 로드 시작')
            pluginLoadingRef.current.heat = true
            const script = document.createElement('script')
            script.id = 'leaflet-heat-script'
            script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js'
            script.async = true
            script.onload = () => {
              console.log('✅ leaflet.heat 스크립트 로드 완료, 플러그인 등록 대기...')
              waitForHeatPlugin(50).then((loaded) => {
                pluginLoadingRef.current.heat = false
                console.log('히트맵 플러그인 등록 확인 완료:', {
                  loaded,
                  signalAborted: signal.aborted,
                  hasMap: !!mapRef.current,
                  currentMode: currentModeRef.current
                })
                if (loaded && !signal.aborted && mapRef.current && currentModeRef.current === 'heatmap') {
                  createHeatLayer(L, validData)
                } else if (!loaded) {
                  console.error('❌ leaflet.heat 플러그인 등록 실패 - 스크립트는 로드되었지만 플러그인이 등록되지 않음')
                } else {
                  console.warn('히트맵 레이어 생성 취소 (스크립트 로드 후):', {
                    loaded,
                    signalAborted: signal.aborted,
                    hasMap: !!mapRef.current,
                    currentMode: currentModeRef.current
                  })
                }
              })
            }
            script.onerror = () => {
              pluginLoadingRef.current.heat = false
              console.error('❌ leaflet.heat 스크립트 로드 실패 - 네트워크 오류 또는 CDN 문제', {
                scriptSrc: script.src
              })
            }
            document.head.appendChild(script)
            console.log('leaflet.heat 스크립트 태그 추가 완료')
          }
        }
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

        const createClusterLayer = (L: any, dataToUse: typeof validData) => {
          console.log('=== createClusterLayer 호출 ===', {
            signalAborted: signal.aborted,
            hasMap: !!mapRef.current,
            currentMode: currentModeRef.current,
            dataLength: dataToUse?.length || 0,
            timestamp: new Date().toISOString()
          })

          // AbortSignal 확인
          if (signal.aborted) {
            console.warn('클러스터 생성 취소: 작업이 중단됨')
            return
          }

          // 현재 모드 및 지도 인스턴스 재확인
          if (!mapRef.current) {
            console.error('클러스터 생성 취소: 지도 인스턴스가 없습니다')
            return
          }

          if (currentModeRef.current !== 'cluster') {
            console.warn('클러스터 생성 취소: 모드가 변경됨', { 
              currentMode: currentModeRef.current, 
              expectedMode: 'cluster' 
            })
            return
          }

          // 기존 클러스터 레이어가 있으면 제거 (이중 체크)
          if (clusterLayerRef.current) {
            console.log('기존 클러스터 레이어 제거 시작 (createClusterLayer 내부)')
            try {
              // 지도에서 레이어 제거
              if (mapRef.current && mapRef.current.hasLayer && mapRef.current.hasLayer(clusterLayerRef.current)) {
                mapRef.current.removeLayer(clusterLayerRef.current)
                console.log('기존 클러스터 레이어 지도에서 제거 성공')
              } else {
                console.log('기존 클러스터 레이어가 이미 지도에서 제거됨')
              }
              // 클러스터 내부 레이어 정리
              if (clusterLayerRef.current.clearLayers) {
                clusterLayerRef.current.clearLayers()
                console.log('클러스터 내부 레이어 정리 완료')
              }
            } catch (e) {
              console.error('기존 클러스터 제거 중 오류:', e)
            }
            clusterLayerRef.current = null
            console.log('클러스터 레이어 ref 초기화 완료')
          } else {
            console.log('기존 클러스터 레이어 없음 (정상)')
          }

          // 데이터 유효성 확인
          if (!dataToUse || dataToUse.length === 0) {
            console.error('클러스터 생성 취소: 데이터가 없습니다', { 
              dataToUse: dataToUse?.length || 0 
            })
            return
          }

          // MarkerClusterGroup 찾기
          let MarkerClusterGroup: any = null
          
          if (L.markerClusterGroup) {
            MarkerClusterGroup = L.markerClusterGroup
          } else if (L.MarkerClusterGroup) {
            MarkerClusterGroup = L.MarkerClusterGroup
          }

          if (!MarkerClusterGroup) {
            console.error('MarkerClusterGroup을 찾을 수 없습니다.')
            return
          }

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

          dataToUse.forEach((point) => {
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

          console.log('클러스터 레이어 지도에 추가 시작:', {
            markersCount: dataToUse.length,
            hasMarkerClusterGroup: !!MarkerClusterGroup
          })
          
          try {
            markers.addTo(mapRef.current)
            clusterLayerRef.current = markers
            console.log('✅ 클러스터 레이어 생성 및 추가 완료', {
              layerType: typeof markers,
              hasLayer: !!markers,
              mapLayers: mapRef.current._layers ? Object.keys(mapRef.current._layers).length : 0
            })
          } catch (error) {
            console.error('❌ 클러스터 레이어 생성 중 오류:', error, {
              errorMessage: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined
            })
          }
        }

        // 플러그인 로딩 헬퍼 함수
        const waitForClusterPlugin = (maxAttempts = 50, attempt = 0): Promise<boolean> => {
          return new Promise((resolve) => {
            if (signal.aborted || !mapRef.current || currentModeRef.current !== 'cluster') {
              resolve(false)
              return
            }

            // 여러 방법으로 플러그인 확인
            if (L.markerClusterGroup || L.MarkerClusterGroup || 
                (window as any).L?.markerClusterGroup || (window as any).L?.MarkerClusterGroup ||
                (L as any).markerCluster?.Group) {
              console.log('leaflet.markercluster 플러그인 확인됨', { attempt })
              resolve(true)
              return
            }

            if (attempt >= maxAttempts) {
              console.error('leaflet.markercluster 플러그인 로드 타임아웃', { attempts: attempt })
              resolve(false)
              return
            }

            safeSetTimeout(() => {
              waitForClusterPlugin(maxAttempts, attempt + 1).then(resolve)
            }, 100)
          })
        }

        // CSS 먼저 로드
        if (!document.getElementById('leaflet-markercluster-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-markercluster-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'
          document.head.appendChild(link)
        }

        // 플러그인이 이미 로드되어 있는지 즉시 확인
        const isClusterPluginLoaded = L.markerClusterGroup || L.MarkerClusterGroup || 
          (window as any).L?.markerClusterGroup || (window as any).L?.MarkerClusterGroup ||
          (L as any).markerCluster?.Group

        console.log('클러스터 플러그인 확인:', {
          L_markerClusterGroup: !!L.markerClusterGroup,
          L_MarkerClusterGroup: !!L.MarkerClusterGroup,
          window_L_markerClusterGroup: !!(window as any).L?.markerClusterGroup,
          window_L_MarkerClusterGroup: !!(window as any).L?.MarkerClusterGroup,
          L_markerCluster_Group: !!(L as any).markerCluster?.Group,
          isClusterPluginLoaded,
          pluginLoading: pluginLoadingRef.current.cluster
        })

        if (isClusterPluginLoaded) {
          // 플러그인이 이미 로드되어 있으면 레이어 생성 (탭 전환 시 데이터 변경 반영)
          // 중요: clearAllLayers() 후 충분한 지연 시간을 두어 레이어 제거가 완료되도록 보장
          console.log('✅ leaflet.markercluster 플러그인 이미 로드됨, 레이어 재생성 시작', {
            validDataLength: validData.length,
            timestamp: new Date().toISOString(),
            previousClusterLayer: !!clusterLayerRef.current
          })
          
          // 레이어 제거 후 충분한 지연 시간 확보 (200ms)
          safeSetTimeout(() => {
            console.log('클러스터 레이어 생성 setTimeout 실행:', {
              signalAborted: signal.aborted,
              hasMap: !!mapRef.current,
              currentMode: currentModeRef.current,
              expectedMode: 'cluster',
              stillHasClusterLayer: !!clusterLayerRef.current
            })
            
            // 추가 안전 체크: 이전 레이어가 완전히 제거되었는지 확인
            if (clusterLayerRef.current) {
              console.warn('⚠️ 이전 클러스터 레이어가 아직 존재함, 강제 제거')
              try {
                if (mapRef.current) {
                  mapRef.current.removeLayer(clusterLayerRef.current)
                  if (clusterLayerRef.current.clearLayers) {
                    clusterLayerRef.current.clearLayers()
                  }
                }
              } catch (e) {
                console.warn('이전 클러스터 레이어 강제 제거 중 오류:', e)
              }
              clusterLayerRef.current = null
            }
            
            if (signal.aborted || !mapRef.current || currentModeRef.current !== 'cluster') {
              console.warn('클러스터 레이어 생성 취소 (setTimeout 내부)')
              return
            }
            
            console.log('클러스터 레이어 생성 함수 호출 시작')
            createClusterLayer(L, validData)
          }, 200) // 100ms -> 200ms로 증가하여 레이어 제거 완료 보장
        } else if (!pluginLoadingRef.current.cluster) {
          console.log('클러스터 플러그인 로드 필요, 스크립트 확인 시작')
          // 스크립트가 이미 로드 중이면 대기
          const existingScript = document.getElementById('leaflet-markercluster-script')
          if (existingScript) {
            console.log('leaflet.markercluster 스크립트 이미 존재, 플러그인 등록 대기...', {
              scriptSrc: existingScript.getAttribute('src'),
              scriptId: existingScript.id
            })
            waitForClusterPlugin(50).then((loaded) => {
              console.log('클러스터 플러그인 대기 완료:', {
                loaded,
                signalAborted: signal.aborted,
                hasMap: !!mapRef.current,
                currentMode: currentModeRef.current
              })
              if (loaded && !signal.aborted && mapRef.current && currentModeRef.current === 'cluster') {
                createClusterLayer(L, validData)
              } else if (!loaded) {
                console.error('❌ leaflet.markercluster 플러그인 로드 실패 - 스크립트는 있지만 플러그인이 등록되지 않음')
              } else {
                console.warn('클러스터 레이어 생성 취소:', {
                  loaded,
                  signalAborted: signal.aborted,
                  hasMap: !!mapRef.current,
                  currentMode: currentModeRef.current
                })
              }
            })
          } else {
            // 스크립트 태그로 플러그인 로드
            console.log('leaflet.markercluster 스크립트 새로 로드 시작')
            pluginLoadingRef.current.cluster = true
            const script = document.createElement('script')
            script.id = 'leaflet-markercluster-script'
            script.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'
            script.async = true
            script.onload = () => {
              console.log('✅ leaflet.markercluster 스크립트 로드 완료, 플러그인 등록 대기...')
              waitForClusterPlugin(50).then((loaded) => {
                pluginLoadingRef.current.cluster = false
                console.log('클러스터 플러그인 등록 확인 완료:', {
                  loaded,
                  signalAborted: signal.aborted,
                  hasMap: !!mapRef.current,
                  currentMode: currentModeRef.current
                })
                if (loaded && !signal.aborted && mapRef.current && currentModeRef.current === 'cluster') {
                  createClusterLayer(L, validData)
                } else if (!loaded) {
                  console.error('❌ leaflet.markercluster 플러그인 등록 실패 - 스크립트는 로드되었지만 플러그인이 등록되지 않음')
                } else {
                  console.warn('클러스터 레이어 생성 취소 (스크립트 로드 후):', {
                    loaded,
                    signalAborted: signal.aborted,
                    hasMap: !!mapRef.current,
                    currentMode: currentModeRef.current
                  })
                }
              })
            }
            script.onerror = () => {
              pluginLoadingRef.current.cluster = false
              console.error('❌ leaflet.markercluster 스크립트 로드 실패 - 네트워크 오류 또는 CDN 문제', {
                scriptSrc: script.src
              })
            }
            document.head.appendChild(script)
            console.log('leaflet.markercluster 스크립트 태그 추가 완료')
          }
        }
      }

      loadAndCreateCluster()
    } else if (mode === 'markers') {
      // AbortSignal 확인
      if (signal.aborted) {
        console.log('마커 생성 취소: 작업이 중단됨')
        return
      }

      // 현재 모드 재확인
      if (currentModeRef.current !== 'markers') {
        console.log('마커 생성 취소: 모드가 변경됨', { currentMode: currentModeRef.current })
        return
      }

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
      console.log('마커 레이어 생성 완료')
    } else if (mode === 'circle') {
      // AbortSignal 확인
      if (signal.aborted) {
        console.log('원형 생성 취소: 작업이 중단됨')
        return
      }

      // 현재 모드 재확인
      if (currentModeRef.current !== 'circle') {
        console.log('원형 생성 취소: 모드가 변경됨', { currentMode: currentModeRef.current })
        return
      }

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
        let radius = 5
        if (point.value > 0 && maxValue > 0) {
          const normalizedValue = (point.value - minValue) / (maxValue - minValue || 1)
          radius = Math.max(5, Math.min(50, 5 + normalizedValue * 45))
        }

        let fillColor = '#94a3b8'
        if (point.value > 0) {
          const normalizedValue = maxValue > 0 ? point.value / maxValue : 0
          if (normalizedValue < 0.33) {
            fillColor = '#3b82f6'
          } else if (normalizedValue < 0.66) {
            fillColor = '#f59e0b'
          } else {
            fillColor = '#ef4444'
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
      console.log('원형 레이어 생성 완료')
    }

    // 클린업 함수: 컴포넌트 언마운트 또는 의존성 변경 시 실행
    return () => {
      clearAllTimers()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [leafletLoaded, data, mode, center, zoom, clearAllLayers, clearAllTimers, safeSetInterval, safeSetTimeout])

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
