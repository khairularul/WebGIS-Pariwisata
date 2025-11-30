var map = L.map("map2", {
  center: [-5.1477, 119.4327], // Lokasi Makassar
  zoom: 12,
});

// === Basemap ===
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
});

var esriSat = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles © Esri",
  }
);

var cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; CartoDB",
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

var topoMap = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
  attribution: "© OpenTopoMap",
});

var baseMaps = {
  OpenStreetMap: osm,
  "Esri World Imagery": esriSat,
  "CartoDB Light": cartoLight,
  OpenTopoMap: topoMap,
};

L.control.layers(baseMaps).addTo(map);

// === Geocoder (Search Box) ===
L.Control.geocoder({
  defaultMarkGeocode: true,
  placeholder: "Cari lokasi...",
  position: "topleft",
}).addTo(map);

// === Marker Kota Makassar ===
L.marker([-5.1477, 119.4327]).addTo(map).bindPopup("Pusat Kota Makassar").openPopup();

// === Scale Bar ===
L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

// ===== Simbolisasi Marker Faskes =====
const icon = L.icon({
  iconUrl: "aset/icon.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// ===== LOAD LAYER DENGAN FETCH =====
let destinasiLayer = L.layerGroup().addTo(map);
let batasKecamatanLayer = L.layerGroup().addTo(map);
let radiusLayer = L.layerGroup().addTo(map);
let jalanLayer = L.layerGroup().addTo(map);

// === Destinasi ===
fetch("./data/Destinasi.geojson")
  .then((res) => res.json())
  .then((data) => {
    L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.marker(latlng, { icon: icon }),
      onEachFeature: function (feature, layer) {
        const p = feature.properties;
        const popup = `
            <b>${p.Nama}</b><br>
            <i>${p.Jenis}</i><br>
            ${p.Alamat ? `<b>Alamat:</b> ${p.Alamat}<br>` : ""}
            ${p.Kecamatan ? `<b>Kecamatan:</b> ${p.Kecamatan}<br>` : ""}
            ${p.Operasiona ? `<b>Operasional:</b> ${p.Operasiona}<br>` : ""}
        `;
        layer.bindPopup(popup);
      },
    }).addTo(destinasiLayer);
  })
  .catch((err) => console.error("Gagal load Faskes.geojson", err));

// === BATAS KECAMATAN ===
fetch("./data/BatasKecamatan.geojson")
  .then((res) => res.json())
  .then((data) => {
    L.geoJSON(data, {
      style: {
        color: "black",
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0,
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup("Kecamatan: " + feature.properties.WADMKC);
      },
    }).addTo(batasKecamatanLayer);
  })
  .catch((err) => console.error("Gagal load BatasKecamatan.geojson", err));

// === RADIUS ===
function getRadiusColor(Waktu) {
  if (Waktu <= 5) return "#a1d99b";
  else if (Waktu <= 10) return "#41ab5d";
  else if (Waktu <= 15) return "#238b45";
  else return "#005a32";
}

fetch("./data/Isochrone.geojson")
  .then((res) => res.json())
  .then((data) => {
    L.geoJSON(data, {
      style: (feature) => ({
        color: getRadiusColor(feature.properties.Waktu),
        weight: 1,
        fillOpacity: 0.3,
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup("Populasi: " + feature.properties.Populasi + " jiwa");
      },
    }).addTo(radiusLayer);
  })
  .catch((err) => console.error("Gagal load Radius.geojson", err));

// === JALAN ===
function getJalanColor(rem) {
  switch (rem) {
    case "Jalan Arteri":
      return "#e31a1c";
    case "Jalan Kolektor":
      return "#fd8d3c";
    case "Jalan Tol Dua Jalur Dengan Pemisah Fisik":
      return "#fecc5c";
    default:
      return "#cccccc";
  }
}

fetch("./data/Jalan.geojson")
  .then((res) => res.json())
  .then((data) => {
    L.geoJSON(data, {
      style: (feature) => ({
        color: getJalanColor(feature.properties.Jenis),
        weight: 2,
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup("Jalan: " + (feature.properties.Jenis || "Tidak diketahui"));
      },
    }).addTo(jalanLayer);
  })
  .catch((err) => console.error("Gagal load Jalan.geojson", err));

// ===== Legend =====
const legendControl = L.control({ position: "bottomright" });

legendControl.onAdd = function () {
  const div = L.DomUtil.create("div", "info legend");

  div.innerHTML = `
    <h4>Legenda & Layer</h4>
    
    <label><input type="checkbox" id="toggleRadius" checked> Radius Pelayanan</label><br>
    <label><input type="checkbox" id="toggleJalan" checked> Jaringan Jalan</label><br>
    <label><input type="checkbox" id="toggleFaskes" checked> Titik Destinasi</label><br>
    <label><input type="checkbox" id="toggleBatas" checked> Batas Kecamatan</label><br><br>

    <b>Simbolisasi:</b><br>
    <b>Radius (m)</b><br>
    <i style="background:#41ab5d"></i> 0 - 5<br>
    <i style="background:#238b45"></i> 5 - 10<br>
    <i style="background:#005a32"></i> > 10<br><br>

    <b>Jenis Jalan</b><br>
    <i style="background:#e31a1c"></i> Arteri<br>
    <i style="background:#fd8d3c"></i> Kolektor<br>
    <i style="background:#fecc5c"></i> Lokal<br>
    <i style="background:#ffffb2"></i> Setapak<br><br>

    <b>Destinasi</b><br>
    <img src="aset/icon.png" width="14" height="14"> Titik Destinasi<br><br>

    <b>Batas Kecamatan</b><br>
    <i style="background:none; border:2px solid black;"></i> Garis Administrasi<br>
  `;

  div.style.background = "white";
  div.style.padding = "10px";
  div.style.borderRadius = "5px";
  div.style.fontSize = "12px";
  div.style.boxShadow = "0 0 5px rgba(0,0,0,0.4)";

  return div;
};

legendControl.addTo(map);

// Fungsi toggle layer berdasarkan checkbox
document.getElementById("toggleRadius").addEventListener("change", function () {
  if (this.checked) map.addLayer(radiusLayer);
  else map.removeLayer(radiusLayer);
});

document.getElementById("toggleJalan").addEventListener("change", function () {
  if (this.checked) map.addLayer(jalanLayer);
  else map.removeLayer(jalanLayer);
});

document.getElementById("toggleDestinasi").addEventListener("change", function () {
  if (this.checked) map.addLayer(destinasiLayerLayer);
  else map.removeLayer(destinasiLayer);
});

document.getElementById("toggleBatas").addEventListener("change", function () {
  if (this.checked) map.addLayer(batasKecamatanLayer);
  else map.removeLayer(batasKecamatanLayer);
});
