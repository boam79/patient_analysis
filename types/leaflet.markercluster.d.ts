declare module 'leaflet.markercluster' {
  import * as L from 'leaflet'

  namespace MarkerClusterGroup {
    interface Options {
      chunkedLoading?: boolean
      chunkInterval?: number
      chunkDelay?: number
      singleMarkerMode?: boolean
      animateAddingMarkers?: boolean
      disableClusteringAtZoom?: number
      maxClusterRadius?: number | ((zoom: number) => number)
      spiderfyOnMaxZoom?: boolean
      showCoverageOnHover?: boolean
      zoomToBoundsOnClick?: boolean
      removeOutsideVisibleBounds?: boolean
      iconCreateFunction?: (cluster: MarkerCluster) => L.Icon | L.DivIcon
    }
  }

  class MarkerClusterGroup extends L.LayerGroup {
    constructor(options?: MarkerClusterGroup.Options)
    addLayers(layers: L.Layer[]): this
    removeLayers(layers: L.Layer[]): this
    clearLayers(): this
    refreshClusters(): this
    zoomToBounds(options?: { padding?: L.Point | [number, number] }): this
    getBounds(): L.LatLngBounds
  }

  class MarkerCluster extends L.Marker {
    getAllChildMarkers(): L.Marker[]
    getChildCount(): number
    zoomToBounds(options?: { padding?: L.Point | [number, number] }): this
  }

  export = MarkerClusterGroup
}

