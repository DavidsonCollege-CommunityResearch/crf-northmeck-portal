// Mental-health facility map on healthcare.html (Leaflet + address search).
// Carried over unchanged from the Astro page's healthcare.js (Block 4): it is
// a Leaflet map, not a chart, so it stays plain JS. Loaded as a module so it
// runs after main.js (window.loadData, window.mdShowError, tabChange events).

(async function() {
      const northMeckCenter = L.latLng(35.48, -80.85);
      let facilities = null;
      let loadFailed = false;
      let map = null;
      let activeCenter = northMeckCenter;
      let userMarker = null;
      let radiusCircle = null;
      let allMarkers = [];

      function popupHtml(f) {
        var hasPhone = f.phone && f.phone.trim().length > 0;
        var hasWebsite = f.website && f.website.trim().length > 8;
        return '<div style="min-width:190px;font-family:\'Hanken Grotesk\',sans-serif">'
          + '<div style="font-weight:600;color:#1B4F72;font-size:13px;margin-bottom:4px">'+f.name+'</div>'
          + '<div style="color:#555;font-size:11px;margin-bottom:3px">'+f.address+'</div>'
          + (f.type ? '<div style="color:#888;font-size:11px;margin-bottom:6px">'+f.type+'</div>' : '')
          + (hasPhone ? '<div style="font-size:11px;color:#555;margin-bottom:6px">'+f.phone+'</div>' : '')
          + (hasWebsite ? '<a href="'+f.website+'" target="_blank" rel="noopener" style="display:block;text-align:center;background:#2E86AB;color:#fff;font-size:11px;padding:5px 10px;border-radius:4px;text-decoration:none;margin-top:4px">Visit website →</a>' : '')
          + '</div>';
      }

      // Applies the currently-selected radius chip (defaults to "all" before any click)
      function applyActiveRadiusFilter() {
        var activeBtn = document.querySelector('[data-mh-radius].on');
        var val = activeBtn ? (activeBtn.dataset.mhRadius === 'all' ? 'all' : Number(activeBtn.dataset.mhRadius)) : 'all';
        updateRadiusCircle(activeCenter, val);
        filterMarkers(val);
      }

      function addMarkers() {
        if (!map || !facilities || allMarkers.length) return;
        allMarkers = facilities.map(function(f){
          const m = L.marker([f.lat, f.lng]).addTo(map).bindPopup(popupHtml(f));
          return { marker: m, lat: f.lat, lng: f.lng, distance: activeCenter.distanceTo(L.latLng(f.lat, f.lng)) / 1609.34 };
        });
        applyActiveRadiusFilter();
      }

      // The map container sits in a hidden .tabpane (display:none) until the
      // "Mental Health" tab is opened. Leaflet measures container size at
      // L.map() init time, so creating it while hidden yields a 0×0 map and
      // broken/offset tiles. Initialize lazily, once the pane is visible.
      function initMap() {
        if (map || loadFailed) return;
        const el = document.getElementById('mh-facility-map');
        if (!el) return;
        map = L.map('mh-facility-map').setView([35.48, -80.85], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        }).addTo(map);
        addMarkers();
      }

      function updateRadiusCircle(center, radiusMi) {
        if (!map) return;
        if (radiusCircle) { map.removeLayer(radiusCircle); radiusCircle = null; }
        if (radiusMi === 'all') return;
        radiusCircle = L.circle(center, {
          radius: radiusMi * 1609.34,
          color: '#2E86AB', fillColor: '#2E86AB', fillOpacity: 0.08, weight: 1.5
        }).addTo(map);
        map.fitBounds(radiusCircle.getBounds());
      }

      function filterMarkers(radiusMi) {
        allMarkers.forEach(function(item){
          if (radiusMi === 'all' || item.distance <= radiusMi) {
            if (!map.hasLayer(item.marker)) item.marker.addTo(map);
          } else {
            if (map.hasLayer(item.marker)) map.removeLayer(item.marker);
          }
        });
      }

      document.addEventListener('tabChange', function(e){
        if (e.detail.pane !== 'hc-mental') return;
        setTimeout(function(){
          initMap();
          if (map) map.invalidateSize();
        }, 60);
      });

      // Defensive: if this pane is somehow already active on load, init right away
      var mentalPane = document.querySelector('.tabpane[data-pane="hc-mental"]');
      if (mentalPane && mentalPane.classList.contains('active')) {
        setTimeout(initMap, 60);
      }

      document.querySelectorAll('[data-mh-radius]').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (!map) return;
          document.querySelectorAll('[data-mh-radius]').forEach(function(b){ b.classList.remove('on'); });
          this.classList.add('on');
          const r = this.dataset.mhRadius;
          const val = r === 'all' ? 'all' : Number(r);
          updateRadiusCircle(activeCenter, val);
          filterMarkers(val);
        });
      });

      document.getElementById('mh-address-btn').addEventListener('click', function(){
        if (!map) return;
        const addr = document.getElementById('mh-address-input').value.trim();
        if (!addr) return;
        fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(addr))
          .then(function(res){return res.json();})
          .then(function(results){
            if (!results.length) { alert('Address not found. Try again.'); return; }
            const lat = parseFloat(results[0].lat);
            const lng = parseFloat(results[0].lon);
            const loc = L.latLng(lat, lng);
            activeCenter = loc;
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.circleMarker(loc, {
              radius: 10, color: '#2E86AB', fillColor: '#2E86AB', fillOpacity: 0.8
            }).addTo(map).bindPopup('Your location');
            allMarkers.forEach(function(item){
              item.distance = loc.distanceTo(L.latLng(item.lat, item.lng)) / 1609.34;
            });
            map.setView(loc, 13);
            applyActiveRadiusFilter();
          });
      });

      try {
        const rows = await window.loadData('mental-health-facilities');
        facilities = rows.map(function(d){
          return {
            name: d.facility_name,
            address: (d.street1||'') + (d.city ? ', '+d.city : ''),
            lat: Number(d.latitude),
            lng: Number(d.longitude),
            type: d.types || '',
            phone: d.phone || '',
            website: d.website || ''
          };
        });
        addMarkers();
      } catch(e) {
        console.error('Facility map data load failed:', e);
        loadFailed = true;
        window.mdShowError('mh-facility-map');
      }
})();
