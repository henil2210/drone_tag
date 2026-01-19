

document.addEventListener('DOMContentLoaded', function () {
  /* ================= DOM ================= */
  const fetchBtn = document.getElementById('fetch-btn');
  const trackerInput = document.getElementById('tracker-id');
  const sensorInput = document.getElementById('sensor-id');
  const statusMessage = document.getElementById('status-message');
  const lastUpdatedDiv = document.querySelector('.last-updated');
  const imagesGrid = document.getElementById('images-grid');

  /* ================= REAL-TIME UPDATE CONFIG ================= */
  let realtimeUpdateInterval = null;
  const realtimeUpdateConfig = {
    enabled: false,
    interval: 5000,
    trackers: new Set(),
    lastFetched: {},
    maxRetryCount: 3,
    retryDelay: 1000
  };

  /* ================= GROUP AUTO-REFRESH ================= */

let groupAutoInterval = null;
let groupAutoSeconds = 30000; // 30 sec default

function startGroupAutoRefresh() {
  if (groupAutoInterval) clearInterval(groupAutoInterval);

  groupAutoInterval = setInterval(() => {
    if (!activeGroup) {
      console.log("⚠️ No active group, skipping auto-refresh");
      return;
    }
    console.log("🔄 Auto-refreshing group:", activeGroup);

    const event = new Event('click');
    document.getElementById('fetchGroupBtn').dispatchEvent(event);

  }, groupAutoSeconds);

  console.log("▶️ Group auto-refresh started");
}

function stopGroupAutoRefresh() {
  if (groupAutoInterval) {
    clearInterval(groupAutoInterval);
    groupAutoInterval = null;
    console.log("⏹ Group auto-refresh stopped");
  }
}


  /* ================= MAP ================= */
  const map = L.map('map').setView([23.0225, 72.5714], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  const markersLayer = L.layerGroup().addTo(map);
  const polylineLayer = L.layerGroup().addTo(map);

  let lastUpdateTime = null;
  let activeGroup = null;

  /* ================= TRACKER STATE ================= */
  const trackerPolylines = {};
  const trackerMarkers = {};
  const trackerColorMap = {};
  const trackerVisibility = {};
  const trackerAllData = {};

  const COLORS = ['#2563eb', '#eab308', '#9333ea', '#ea580c', '#0891b2', '#4f46e5'];
  let colorIndex = 0;

  // Group settings from localStorage
  let groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};

  function getTrackerColor(trackerId) {
    if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
      return groupSettings[activeGroup][trackerId].color;
    }
    
    if (trackerColorMap[trackerId]) {
      return trackerColorMap[trackerId];
    }
    
    const color = COLORS[colorIndex++ % COLORS.length];
    trackerColorMap[trackerId] = color;
    updateLegend();
    return color;
  }

  function isTrackerVisible(trackerId) {
    if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
      return groupSettings[activeGroup][trackerId].visible;
    }
    
    return trackerVisibility[trackerId] !== false;
  }

  
  
  /* ================= REAL-TIME AUTO-UPDATE FUNCTIONS ================= */
  function startRealtimeUpdates() {
    if (realtimeUpdateInterval) {
      clearInterval(realtimeUpdateInterval);
    }
    
    realtimeUpdateInterval = setInterval(async () => {
      if (realtimeUpdateConfig.trackers.size === 0) return;
      
      const now = Date.now();
      const trackersToUpdate = Array.from(realtimeUpdateConfig.trackers);
      
      for (const trackerId of trackersToUpdate) {
        if (realtimeUpdateConfig.lastFetched[trackerId] && 
            (now - realtimeUpdateConfig.lastFetched[trackerId]) < realtimeUpdateConfig.interval) {
          continue;
        }
        
        await fetchLatestTrackerData(trackerId);
        realtimeUpdateConfig.lastFetched[trackerId] = now;
      }
    }, realtimeUpdateConfig.interval);
  }

  function stopRealtimeUpdates() {
    if (realtimeUpdateInterval) {
      clearInterval(realtimeUpdateInterval);
      realtimeUpdateInterval = null;
    }
  }

  function addTrackerToRealtimeUpdates(trackerId) {
    realtimeUpdateConfig.trackers.add(trackerId);
    if (!realtimeUpdateInterval) {
      startRealtimeUpdates();
    }
    showStatus(`Tracker ${trackerId} added to real-time updates`, 'success');
  }

  function removeTrackerFromRealtimeUpdates(trackerId) {
    realtimeUpdateConfig.trackers.delete(trackerId);
    if (realtimeUpdateConfig.trackers.size === 0) {
      stopRealtimeUpdates();
    }
  }

  function toggleRealtimeUpdates(trackerId, enable) {
    if (enable) {
      addTrackerToRealtimeUpdates(trackerId);
    } else {
      removeTrackerFromRealtimeUpdates(trackerId);
    }
  }

  async function fetchLatestTrackerData(trackerId) {
    try {
      const res = await fetch('/api/trajectory/latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracker_id: trackerId,
          last_timestamp: trackerAllData[trackerId] && trackerAllData[trackerId].length > 0 ? 
                         trackerAllData[trackerId][trackerAllData[trackerId].length - 1].timestamp : null
        })
      });

      if (!res.ok) throw new Error('Server error');

      const data = await res.json();
      
      if (data.points && data.points.length > 0) {
        const newPoints = data.points.map(p => ({
          lat: +p.lat,
          lon: +p.lon,
          time: p.timestamp,
          timestamp: p.timestamp,
          latitude: +p.lat,
          longitude: +p.lon,
          altitude: p.altitude || 0,
          uin_no: p.uin_no || 'N/A',
          application: p.application || 'Unknown',
          category: p.category || 'General'
        }));

        if (!trackerAllData[trackerId]) {
          trackerAllData[trackerId] = [];
        }
        
        newPoints.forEach(newPoint => {
          const exists = trackerAllData[trackerId].some(p => p.timestamp === newPoint.timestamp);
          if (!exists) {
            trackerAllData[trackerId].push(newPoint);
          }
        });

        if (newPoints.length > 0) {
          updateTrackerLatestPoint(trackerId, newPoints[newPoints.length - 1]);
        }
        
        displayAllTrackerData(trackerId);
        
        lastUpdateTime = new Date();
        updateLastUpdatedTime();
      }
      
    } catch (err) {
      console.error(`Failed to fetch latest data for ${trackerId}:`, err);
    }
  }

  function updateTrackerLatestPoint(trackerId, point) {
    const color = getTrackerColor(trackerId);
    
    if (trackerMarkers[trackerId]) {
      const markers = trackerMarkers[trackerId];
      if (markers.length > 0) {
        const endMarker = markers[markers.length - 1];
        endMarker.setLatLng([point.lat, point.lon]);
        const popupContent = createPopupContent(trackerId, point, 'Latest Point');
        endMarker.setPopupContent(popupContent);
      }
    }

    if (trackerPolylines[trackerId]) {
      const polyline = trackerPolylines[trackerId];
      const currentLatLngs = polyline.getLatLngs();
      currentLatLngs.push([point.lat, point.lon]);
      polyline.setLatLngs(currentLatLngs);
    }
  }

  /* ================= ICONS ================= */
  function createPinIcon(color, size = 34) {
    return L.divIcon({
      className: '',
      html: `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size]
    });
  }

  function createDotIcon(color, size = 8) {
    return L.divIcon({
      className: '',
      html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  const START_ICON = createPinIcon('green');
  const END_ICON = createPinIcon('red');

  /* ================= LEGEND ================= */
  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'map-legend');
    div.style.background = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    div.style.fontSize = '13px';
    return div;
  };

  legend.addTo(map);

  function updateLegend() {
    const div = document.querySelector('.map-legend');
    if (!div) return;

    const pin = (color) => `
      <svg width="14" height="22" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
      </svg>
    `;

    let html = `
      <strong>Legend</strong><br><br>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        ${pin('green')}
        <span style="font-weight:600;">Start</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        ${pin('red')}
        <span style="font-weight:600;">End</span>
      </div>
      <hr style="margin:6px 0">
    `;

    Object.entries(trackerColorMap).forEach(([id, color]) => {
      if (isTrackerVisible(id)) {
        html += `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:${color};font-size:14px;">●</span>
            ${id} ${realtimeUpdateConfig.trackers.has(id) ? '🔄' : ''}
          </div>
        `;
      }
    });

    div.innerHTML = html;
  }

  /* ================= EVENTS ================= */
  fetchBtn?.addEventListener('click', () => {
    const id = trackerInput.value.trim();
    if (id) fetchSingleTracker(id, true);
  });

  /* ================= FETCH SINGLE TRACKER ================= */
  async function fetchSingleTracker(trackerId, clearBefore = false, enableRealtime = false) {
    if (!trackerId) return;

    if (clearBefore) clearMap();

    const color = getTrackerColor(trackerId);
    trackerVisibility[trackerId] = true;
    showStatus(`Fetching tracker ${trackerId}...`, 'loading');

    try {
      const res = await fetch('/api/trajectory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracker_id: trackerId,
          interval_seconds: 30,
          max_gap_seconds: 120
        })
      });

      if (!res.ok) throw new Error('Server error');

      const data = await res.json();
      console.log('Received data from server:', data); // Debug log
      
      const points = (data.points || []).map(p => ({
        lat: +p.lat,
        lon: +p.lon,
        time: p.timestamp,
        timestamp: p.timestamp,
        latitude: +p.lat,
        longitude: +p.lon,
        altitude: p.altitude || 0,
        uin_no: p.uin_no || 'N/A',
        application: p.application || 'Unknown',
        category: p.category || 'General'
      }));

      console.log(`Parsed ${points.length} points for tracker ${trackerId}`); // Debug log
      
      // Store ALL points for this tracker
      trackerAllData[trackerId] = points;

      plotTrackerPath(trackerId, points, color);
      
      if (points.length > 0) {
        // Display ALL points in the table
        displayAllTrackerData(trackerId);
        
        // Auto-enable real-time updates if specified
        if (enableRealtime) {
          addTrackerToRealtimeUpdates(trackerId);
        }
      }

      lastUpdateTime = new Date();
      updateLastUpdatedTime();
      showStatus(`Loaded ${points.length} points for tracker ${trackerId}`, 'success');

    } catch (err) {
      console.error('Error fetching tracker:', err);
      showStatus(`${trackerId}: ${err.message}`, 'error');
    }
  }

  /* ================= DISPLAY ALL TRACKER DATA ================= */
  /* ================= DISPLAY ALL TRACKER DATA ================= */
function displayAllTrackerData(trackerId) {
  if (!trackerId || !trackerAllData[trackerId] || trackerAllData[trackerId].length === 0) {
    console.log(`No data to display for tracker ${trackerId}`);
    return;
  }
  
  console.log(`Displaying ${trackerAllData[trackerId].length} points for tracker ${trackerId}`);
  
  // Get selected parameters for this tracker
  let selectedParams = null;
  if (window.getRealtimeParameters) {
    selectedParams = window.getRealtimeParameters(trackerId);
  }
  
  if (!selectedParams) {
    selectedParams = {
      timestamp: true,
      latitude: true,
      longitude: true,
      altitude: true,
      uin_no: true,
      application: true,
      category: true
    };
  }
  
  // Create array of all points formatted for the table
  const allPointsData = trackerAllData[trackerId].map((point, index) => {
    return {
      'Tracker ID': trackerId,
      'Point #': index + 1,
      'timestamp': point.timestamp || point.time || new Date().toISOString(),
      'latitude': point.latitude || point.lat,
      'longitude': point.longitude || point.lon,
      'altitude': point.altitude || 0,
      'uin_no': point.uin_no || 'N/A',
      'application': point.application || 'Unknown',
      'category': point.category || 'General'
    };
  });
  
  console.log(`Formatted ${allPointsData.length} points for table display`);
  
  // Update the real-time table with ALL points
  if (window.updateRealtimeTableAllPoints && allPointsData && allPointsData.length > 0) {
    console.log('Calling updateRealtimeTableAllPoints');
    window.updateRealtimeTableAllPoints(trackerId, allPointsData, selectedParams);
  } else {
    console.error('updateRealtimeTableAllPoints is not defined or no data to display!');
  }
  
  // Auto-expand the real-time panel
  const realtimePanel = document.getElementById('realtimeTablePanel');
  if (realtimePanel && realtimePanel.classList.contains('minimized')) {
    realtimePanel.classList.remove('minimized');
    const chevron = document.getElementById('realtimeTablePanelChevron');
    if (chevron) chevron.classList.remove('rotated');
    const container = document.getElementById('realtimeTableContainer');
    if (container) container.style.display = 'block';
  }
}


  /* ================= GROUP FETCH ================= */
  window.fetchGroupTrackers = function (trackerIds, enableRealtime = false) {
    if (!trackerIds?.length) {
      alert('Group empty');
      return;
    }
    
    const visibleTrackers = trackerIds.filter(id => isTrackerVisible(id));
    
    if (visibleTrackers.length === 0) {
      alert('No visible trackers in this group');
      return;
    }
    
    clearMap();
    console.log(`Fetching ${visibleTrackers.length} trackers from group`);
    
    visibleTrackers.forEach((id, i) => {
      setTimeout(() => {
        console.log(`Fetching tracker ${id} (${i + 1}/${visibleTrackers.length})`);
        fetchSingleTracker(id, false, enableRealtime);
      }, i * 800);
    });
  };

  /* ================= PLOT ================= */
  function plotTrackerPath(trackerId, points, color) {
    if (!points.length) return;

    if (!isTrackerVisible(trackerId)) {
      console.log(`${trackerId} is hidden, not plotting`);
      return;
    }

    const latlngs = points.map(p => [p.lat, p.lon]);

    // Polyline
    const polyline = L.polyline(latlngs, {
      color: color,
      weight: 4,
      opacity: 0.85
    }).addTo(polylineLayer);

    trackerPolylines[trackerId] = polyline;
    
    if (!window.trajectoryOverlays) {
      window.trajectoryOverlays = {};
    }
    window.trajectoryOverlays[trackerId] = polyline;

    function createPopupContent(trackerId, point, label) {
      let content = `<b>${trackerId}</b><br>${label}<br>`;
      
      if (point.time) {
        content += `Time: ${formatTimestamp(point.time)}<br>`;
      }
      
      if (point.lat !== undefined) {
        content += `Latitude: ${point.lat.toFixed(6)}<br>`;
      }
      if (point.lon !== undefined) {
        content += `Longitude: ${point.lon.toFixed(6)}<br>`;
      }
      
      if (point.altitude !== undefined) {
        content += `Altitude: ${point.altitude}m<br>`;
      }
      if (point.uin_no && point.uin_no !== 'N/A') {
        content += `UIN: ${point.uin_no}<br>`;
      }
      if (point.application && point.application !== 'Unknown') {
        content += `Application: ${point.application}<br>`;
      }
      if (point.category && point.category !== 'General') {
        content += `Category: ${point.category}<br>`;
      }
      
      return content;
    }

    // Markers
    trackerMarkers[trackerId] = [];

    // START marker
    const startMarker = L.marker(latlngs[0], { icon: START_ICON })
      .addTo(markersLayer)
      .bindPopup(createPopupContent(trackerId, points[0], 'Start Point'));
    trackerMarkers[trackerId].push(startMarker);

    // END marker
    const endMarker = L.marker(latlngs.at(-1), { icon: END_ICON })
      .addTo(markersLayer)
      .bindPopup(createPopupContent(trackerId, points.at(-1), 'Latest Point'));
    trackerMarkers[trackerId].push(endMarker);

    updateMapBounds();
  }

  /* ================= VISIBILITY TOGGLE ================= */
  window.toggleTrackerVisibility = function (trackerId, visible) {
    trackerVisibility[trackerId] = visible;
    
    if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
      groupSettings[activeGroup][trackerId].visible = visible;
      localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
    }
    
    if (trackerPolylines[trackerId]) {
      if (visible) {
        polylineLayer.addLayer(trackerPolylines[trackerId]);
      } else {
        polylineLayer.removeLayer(trackerPolylines[trackerId]);
      }
    }

    (trackerMarkers[trackerId] || []).forEach(m => {
      if (visible) {
        markersLayer.addLayer(m);
      } else {
        markersLayer.removeLayer(m);
      }
    });
    
    if (!visible) {
      removeTrackerFromRealtimeUpdates(trackerId);
    }
    
    updateLegend();
    updateMapBounds();
  };

  /* ================= COLOR CHANGE ================= */
  window.changeTrackerColor = function (trackerId, color) {
    trackerColorMap[trackerId] = color;
    
    if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
      groupSettings[activeGroup][trackerId].color = color;
      localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
    }

    if (trackerPolylines[trackerId] && isTrackerVisible(trackerId)) {
      trackerPolylines[trackerId].setStyle({ color: color });
    }

    (trackerMarkers[trackerId] || []).forEach(m => {
      if (m.options.icon && isTrackerVisible(trackerId)) {
        const iconHtml = m.options.icon.options?.html || '';
        if (iconHtml.includes('border-radius:50%')) {
          m.setIcon(createDotIcon(color, 8));
        }
      }
    });

    updateLegend();
  };

  /* ================= HELPERS ================= */
  /* ================= HELPERS ================= */
function clearMap() {
  markersLayer.clearLayers();
  polylineLayer.clearLayers();
  Object.keys(trackerPolylines).forEach(k => delete trackerPolylines[k]);
  Object.keys(trackerMarkers).forEach(k => delete trackerMarkers[k]);
  Object.keys(trackerAllData).forEach(k => delete trackerAllData[k]);
  updateLegend();
  
  realtimeUpdateConfig.trackers.clear();
  stopRealtimeUpdates();
  
  if (imagesGrid) {
    imagesGrid.innerHTML = '';
  }
  
  // Clear real-time table data - FIXED: Don't call the function without parameters
  if (window.realtimeTableDataAllPoints) {
    window.realtimeTableDataAllPoints = {};
  }
  
  // Only call updateRealtimeTableWithAllPoints if it exists
  if (typeof updateRealtimeTableWithAllPoints === 'function') {
    updateRealtimeTableWithAllPoints();
  }
}

  function updateLastUpdatedTime() {
    if (lastUpdatedDiv && lastUpdateTime) {
      lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
    }
  }

  function showStatus(msg, type) {
    if (!statusMessage) return;
    statusMessage.textContent = msg;
    statusMessage.className = `status-${type}`;
    if (type !== 'loading') setTimeout(() => statusMessage.textContent = '', 4000);
  }

  function formatTimestamp(ts) {
    return new Date(ts).toLocaleString();
  }

  function updateMapBounds() {
    const allVisiblePoints = [];
    
    Object.keys(trackerPolylines).forEach(trackerId => {
      if (isTrackerVisible(trackerId) && trackerPolylines[trackerId]._latlngs) {
        allVisiblePoints.push(...trackerPolylines[trackerId]._latlngs);
      }
    });
    
    if (allVisiblePoints.length > 0) {
      map.fitBounds(allVisiblePoints, { padding: [40, 40] });
    }
  }

  /* ================= EXPOSE FUNCTIONS TO WINDOW ================= */
  window.setActiveGroup = function(groupName) {
    activeGroup = groupName;
    groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};
  };

  window.updateTrackerVisibilityFromGroup = function(trackerId, isVisible) {
    window.toggleTrackerVisibility(trackerId, isVisible);
  };

  window.updateTrackerColorFromGroup = function(trackerId, color) {
    window.changeTrackerColor(trackerId, color);
  };

  window.handleFetch = function(trackerId, enableRealtime = false) {
    fetchSingleTracker(trackerId, true, enableRealtime);
  };

  window.startRealtimeUpdatesForTracker = function(trackerId) {
    addTrackerToRealtimeUpdates(trackerId);
  };

  window.stopRealtimeUpdatesForTracker = function(trackerId) {
    removeTrackerFromRealtimeUpdates(trackerId);
  };

  window.toggleRealtimeUpdatesForTracker = function(trackerId, enable) {
    toggleRealtimeUpdates(trackerId, enable);
  };

  // Initialize global objects
  window.trajectoryOverlays = {};
  window.realtimeTableDataAllPoints = {};
  window.sensorTableData = {};

  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'r') {
      e.preventDefault();
      const realtimeBtn = document.getElementById('openRealtimePopup');
      if (realtimeBtn) realtimeBtn.click();
    }
    
    if (e.altKey && e.key === 'a') {
      e.preventDefault();
      const trackerId = trackerInput.value.trim();
      if (trackerId) {
        const isEnabled = realtimeUpdateConfig.trackers.has(trackerId);
        toggleRealtimeUpdates(trackerId, !isEnabled);
        showStatus(`Real-time updates ${!isEnabled ? 'enabled' : 'disabled'} for ${trackerId}`, 'success');
      }
    }
  });

  // Fetch data for saved trackers on page load
  window.addEventListener('load', function() {
    const savedTrackers = JSON.parse(localStorage.getItem('saved_trackers')) || [];
    const savedSensors = JSON.parse(localStorage.getItem('saved_sensors')) || [];
    
    const autoUpdateEnabled = JSON.parse(localStorage.getItem('auto_update_enabled')) || false;
    const autoUpdateTrackers = JSON.parse(localStorage.getItem('auto_update_trackers')) || [];
    
    if (savedTrackers.length > 0) {
      showStatus(`Loading ${savedTrackers.length} saved trackers...`, 'loading');
      
      setTimeout(() => {
        savedTrackers.forEach((trackerId, index) => {
          setTimeout(() => {
            const enableRealtime = autoUpdateEnabled && autoUpdateTrackers.includes(trackerId);
            fetchSingleTracker(trackerId, index === 0, enableRealtime);
          }, index * 1000);
        });
      }, 1500);
    }
    
    if (savedSensors.length > 0) {
      setTimeout(() => {
        savedSensors.forEach((sensorId, index) => {
          setTimeout(() => {
            if (window.fetchSensorData) {
              window.fetchSensorData(sensorId);
            }
          }, index * 1500);
        });
      }, 3000);
    }
  });

  // Save auto-update state before page unload - FIXED: Use beforeunload instead of unload
  window.addEventListener('beforeunload', function() {
    localStorage.setItem('auto_update_enabled', JSON.stringify(realtimeUpdateConfig.trackers.size > 0));
    localStorage.setItem('auto_update_trackers', JSON.stringify(Array.from(realtimeUpdateConfig.trackers)));
    stopRealtimeUpdates();
  });
});

/* ================= SENSOR DATA FETCH ================= */
  async function fetchSensorData(sensorId) {
    try {
        const res = await fetch('/api/sensor/all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_id: sensorId })
        });

        if (!res.ok) throw new Error(`Failed to fetch sensor ${sensorId}`);

        const data = await res.json();
        const points = data.points || [];

        // Ensure sensorLayer exists
        if (!window.sensorLayer) {
            window.sensorLayer = L.layerGroup().addTo(map);
        } else {
            window.sensorLayer.clearLayers();
        }

        points.forEach(p => {
            const lat = parseFloat(p.Latitude);
            const lon = parseFloat(p.Longitude);
            if (!isNaN(lat) && !isNaN(lon)) {
                const marker = L.marker([lat, lon], {
                    icon: L.divIcon({
                        className: 'sensor-marker',
                        html: `<div style="background:#ff5722;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>`,
                        iconSize: [12, 12],
                        iconAnchor: [6, 6]
                    })
                }).bindPopup(`
                    <b>Sensor ID:</b> ${p.SensorId}<br>
                    <b>Timestamp:</b> ${p.Timestamp}<br>
                    <b>Moisture:</b> ${p.Moisture}<br>
                    <b>Temperature:</b> ${p.Temperature}<br>
                    <b>EC:</b> ${p.EC}<br>
                    <b>PHValue:</b> ${p.PHValue}<br>
                    <b>Nitrogen:</b> ${p.Nitrogen}<br>
                    <b>Phosphorous:</b> ${p.Phosphorous}<br>
                    <b>Potassium:</b> ${p.Potassium}<br>
                    ${p.Altitude ? `<b>Altitude:</b> ${p.Altitude}<br>` : ''}
                    ${p.Maplink ? `<a href="${p.Maplink}" target="_blank">View on Map</a>` : ''}
                `);
                window.sensorLayer.addLayer(marker);
            }
        });

        // Populate sensor table
        const tableBody = document.getElementById('sensorTableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            points.forEach(p => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${p.SensorId}</td>
                    <td>${p.Timestamp}</td>
                    <td>${p.Moisture}</td>
                    <td>${p.Temperature}</td>
                    <td>${p.EC}</td>
                    <td>${p.PHValue}</td>
                    <td>${p.Nitrogen}</td>
                    <td>${p.Phosphorous}</td>
                    <td>${p.Potassium}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        // Fit map to markers
        if (points.length > 0) {
            const latlngs = points
                .map(p => [parseFloat(p.Latitude), parseFloat(p.Longitude)])
                .filter(p => !isNaN(p[0]) && !isNaN(p[1]));
            if (latlngs.length > 0) {
                map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
            }
        }

        console.log(`Loaded ${points.length} points for Sensor ${sensorId}`);
    } catch (err) {
        console.error("Error fetching sensor data:", err);
    }
}

window.fetchSensorData = fetchSensorData;

// Expose globally
window.fetchSensorData = fetchSensorData;



// Save auto-update state before unload
window.addEventListener('beforeunload', () => {
    localStorage.setItem('auto_update_enabled', JSON.stringify(realtimeUpdateConfig.trackers.size > 0));
    localStorage.setItem('auto_update_trackers', JSON.stringify(Array.from(realtimeUpdateConfig.trackers)));
    stopRealtimeUpdates();
});



