declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module 'leaflet/dist/leaflet.css'
declare module 'leaflet/dist/images/marker-icon.png'
declare module 'leaflet/dist/images/marker-shadow.png'
declare module 'leaflet/dist/images/marker-icon-2x.png'
declare module 'leaflet.markercluster/dist/MarkerCluster.css'
declare module 'leaflet.markercluster/dist/MarkerCluster.Default.css'
