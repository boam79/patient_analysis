declare module 'leaflet.heat' {
  import * as L from 'leaflet'

  module 'leaflet' {
    interface HeatLayerOptions {
      minOpacity?: number
      maxZoom?: number
      max?: number
      radius?: number
      blur?: number
      gradient?: { [key: number]: string }
    }

    function heatLayer(
      latlngs: Array<[number, number, number]>,
      options?: HeatLayerOptions
    ): L.Layer

    namespace heatLayer {
      function addLatLng(latlng: [number, number, number]): void
      function setLatLngs(latlngs: Array<[number, number, number]>): void
      function setOptions(options: HeatLayerOptions): void
      function redraw(): void
    }
  }

  export = L
}

