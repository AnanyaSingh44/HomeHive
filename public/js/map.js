mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
  container: "map",
  center: coordinates,
  zoom: 9,
});
const marker1 = new mapboxgl.Marker({ color: "red" })
  .setLngLat(coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 3 })
      .setHTML("<h6> Exact location will be provided after booking <h6/>")
      .setMaxWidth("300px"),
  )
  .addTo(map);
