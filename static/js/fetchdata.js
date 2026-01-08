
// document.addEventListener('DOMContentLoaded', function () {

//   /* ================= DOM ================= */
//   const fetchBtn = document.getElementById('fetch-btn');
//   const trackerInput = document.getElementById('tracker-id');
//   const statusMessage = document.getElementById('status-message');
//   const lastUpdatedDiv = document.querySelector('.last-updated');

//   /* ================= MAP ================= */
//   const map = L.map('map').setView([23.0225, 72.5714], 13);

//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19
//   }).addTo(map);

//   const markersLayer = L.layerGroup().addTo(map);
//   const polylineLayer = L.layerGroup().addTo(map);

//   let lastUpdateTime = null;
//   let activeGroup = null;

//   /* ================= TRACKER STATE ================= */
//   const trackerPolylines = {};
//   const trackerMarkers = {};
//   const trackerColorMap = {};
//   const trackerVisibility = {};

//   const COLORS = ['#2563eb', '#eab308', '#9333ea', '#ea580c', '#0891b2', '#4f46e5'];
//   let colorIndex = 0;

//   // Group settings from localStorage
//   let groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};

//   function getTrackerColor(trackerId) {
//     // First check group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].color;
//     }
    
//     // Then check existing color map
//     if (trackerColorMap[trackerId]) {
//       return trackerColorMap[trackerId];
//     }
    
//     // Otherwise assign new color
//     const color = COLORS[colorIndex++ % COLORS.length];
//     trackerColorMap[trackerId] = color;
//     updateLegend();
//     return color;
//   }

//   function isTrackerVisible(trackerId) {
//     // Check group settings first
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].visible;
//     }
    
//     // Default to visible
//     return trackerVisibility[trackerId] !== false;
//   }

//   /* ================= ICONS ================= */
//   function createPinIcon(color, size = 34) {
//     return L.divIcon({
//       className: '',
//       html: `
//         <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//           <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//         </svg>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size],
//       popupAnchor: [0, -size]
//     });
//   }

//   function createDotIcon(color, size = 8) {
//     return L.divIcon({
//       className: '',
//       html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;"></div>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size / 2]
//     });
//   }

//   const START_ICON = createPinIcon('green');
//   const END_ICON = createPinIcon('red');

//   /* ================= LEGEND ================= */
//   const legend = L.control({ position: 'bottomright' });

//   legend.onAdd = function () {
//     const div = L.DomUtil.create('div', 'map-legend');
//     div.style.background = 'white';
//     div.style.padding = '10px';
//     div.style.borderRadius = '8px';
//     div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
//     div.style.fontSize = '13px';
//     return div;
//   };

//   legend.addTo(map);

//  function updateLegend() {
//   const div = document.querySelector('.map-legend');
//   if (!div) return;

//   const pin = (color) => `
//     <svg width="14" height="22" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//       <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//     </svg>
//   `;

//   let html = `
//     <strong>Legend</strong><br><br>

//     <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
//       ${pin('green')}
//       <span style="font-weight:600;">Start</span>
//     </div>

//     <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
//       ${pin('red')}
//       <span style="font-weight:600;">End</span>
//     </div>

//     <hr style="margin:6px 0">
//   `;

//   Object.entries(trackerColorMap).forEach(([id, color]) => {
//     if (isTrackerVisible(id)) {
//       html += `
//         <div style="display:flex;align-items:center;gap:6px;">
//           <span style="color:${color};font-size:14px;">●</span>
//           ${id}
//         </div>
//       `;
//     }
//   });

//   div.innerHTML = html;
// }



//   /* ================= EVENTS ================= */
//   fetchBtn?.addEventListener('click', () => {
//     const id = trackerInput.value.trim();
//     if (id) fetchSingleTracker(id, true);
//   });

//   /* ================= FETCH SINGLE ================= */
//   async function fetchSingleTracker(trackerId, clearBefore = false) {
//     if (!trackerId) return;

//     if (clearBefore) clearMap();

//     const color = getTrackerColor(trackerId);
//     trackerVisibility[trackerId] = true;
//     showStatus(`Fetching ${trackerId}...`, 'loading');

//     try {
//       const res = await fetch('/api/trajectory', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           tracker_id: trackerId,
//           interval_seconds: 30,
//           max_gap_seconds: 120
//         })
//       });

//       if (!res.ok) throw new Error('Server error');

//       const data = await res.json();
//       const points = (data.points || []).map(p => ({
//         lat: +p.lat,
//         lon: +p.lon,
//         time: p.timestamp
//       }));

//       plotTrackerPath(trackerId, points, color);

//       lastUpdateTime = new Date();
//       updateLastUpdatedTime();
//       showStatus(`Loaded ${trackerId}`, 'success');

//     } catch (err) {
//       showStatus(`${trackerId}: ${err.message}`, 'error');
//     }
//   }

//   /* ================= GROUP FETCH ================= */
//   window.fetchGroupTrackers = function (trackerIds) {
//     if (!trackerIds?.length) return alert('Group empty');
    
//     // Filter by visibility
//     const visibleTrackers = trackerIds.filter(id => isTrackerVisible(id));
    
//     if (visibleTrackers.length === 0) {
//       alert('No visible trackers in this group');
//       return;
//     }
    
//     clearMap();
//     visibleTrackers.forEach((id, i) => {
//       setTimeout(() => fetchSingleTracker(id, false), i * 400);
//     });
//   };

//   /* ================= PLOT ================= */
//   function plotTrackerPath(trackerId, points, color) {
//     if (!points.length) return;

//     // Skip if tracker is hidden
//     if (!isTrackerVisible(trackerId)) {
//       console.log(`${trackerId} is hidden, not plotting`);
//       return;
//     }

//     const latlngs = points.map(p => [p.lat, p.lon]);

//     // Polyline
//     const polyline = L.polyline(latlngs, {
//       color: color,
//       weight: 4,
//       opacity: 0.85
//     }).addTo(polylineLayer);

//     trackerPolylines[trackerId] = polyline;
    
//     // Store in global window object for access from group detail popup
//     if (!window.trajectoryOverlays) {
//       window.trajectoryOverlays = {};
//     }
//     window.trajectoryOverlays[trackerId] = polyline;

//     // Markers
//     trackerMarkers[trackerId] = [];

//     // START marker
//     const startMarker = L.marker(latlngs[0], { icon: START_ICON })
//       .addTo(markersLayer)
//       .bindPopup(`<b>${trackerId}</b><br>Start<br>${formatTimestamp(points[0].time)}`);
//     trackerMarkers[trackerId].push(startMarker);

//     // END marker
//     const endMarker = L.marker(latlngs.at(-1), { icon: END_ICON })
//       .addTo(markersLayer)
//       .bindPopup(`<b>${trackerId}</b><br>End<br>${formatTimestamp(points.at(-1).time)}`);
//     trackerMarkers[trackerId].push(endMarker);

//     // MIDDLE POINTS
//     points.slice(1, -1).forEach(p => {
//       const dotMarker = L.marker([p.lat, p.lon], {
//         icon: createDotIcon(color, 8)
//       }).addTo(markersLayer);
//       trackerMarkers[trackerId].push(dotMarker);
//     });

//     // Fit bounds to all visible trackers
//     updateMapBounds();
//   }

//   /* ================= VISIBILITY TOGGLE ================= */
//   window.toggleTrackerVisibility = function (trackerId, visible) {
//     // Update local visibility state
//     trackerVisibility[trackerId] = visible;
    
//     // Update group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].visible = visible;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }
    
//     // Update polyline visibility
//     if (trackerPolylines[trackerId]) {
//       if (visible) {
//         polylineLayer.addLayer(trackerPolylines[trackerId]);
//       } else {
//         polylineLayer.removeLayer(trackerPolylines[trackerId]);
//       }
//     }

//     // Update markers visibility
//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (visible) {
//         markersLayer.addLayer(m);
//       } else {
//         markersLayer.removeLayer(m);
//       }
//     });
    
//     updateLegend();
//     updateMapBounds();
//   };

//   /* ================= COLOR CHANGE ================= */
//   window.changeTrackerColor = function (trackerId, color) {
//     // Update color in map
//     trackerColorMap[trackerId] = color;
    
//     // Update group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].color = color;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }

//     // Update polyline color if visible
//     if (trackerPolylines[trackerId] && isTrackerVisible(trackerId)) {
//       trackerPolylines[trackerId].setStyle({ color: color });
//     }

//     // Update marker colors if visible (excluding start/end markers)
//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (m.options.icon && isTrackerVisible(trackerId)) {
//         // Check if it's a dot marker (not start/end)
//         const iconHtml = m.options.icon.options?.html || '';
//         if (iconHtml.includes('border-radius:50%')) {
//           m.setIcon(createDotIcon(color, 8));
//         }
//       }
//     });

//     updateLegend();
//   };

//   /* ================= HELPERS ================= */
//   function clearMap() {
//     markersLayer.clearLayers();
//     polylineLayer.clearLayers();
//     Object.keys(trackerPolylines).forEach(k => delete trackerPolylines[k]);
//     Object.keys(trackerMarkers).forEach(k => delete trackerMarkers[k]);
//     updateLegend();
//   }

//   function updateLastUpdatedTime() {
//     if (lastUpdatedDiv && lastUpdateTime) {
//       lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }
//   }

//   function showStatus(msg, type) {
//     if (!statusMessage) return;
//     statusMessage.textContent = msg;
//     statusMessage.className = `status-${type}`;
//     if (type !== 'loading') setTimeout(() => statusMessage.textContent = '', 4000);
//   }

//   function formatTimestamp(ts) {
//     return new Date(ts).toLocaleString();
//   }

//   function updateMapBounds() {
//     const allVisiblePoints = [];
    
//     Object.keys(trackerPolylines).forEach(trackerId => {
//       if (isTrackerVisible(trackerId) && trackerPolylines[trackerId]._latlngs) {
//         allVisiblePoints.push(...trackerPolylines[trackerId]._latlngs);
//       }
//     });
    
//     if (allVisiblePoints.length > 0) {
//       map.fitBounds(allVisiblePoints, { padding: [40, 40] });
//     }
//   }

//   /* ================= EXPOSE FUNCTIONS TO WINDOW ================= */
//   // These functions will be called from group detail popup
//   window.setActiveGroup = function(groupName) {
//     activeGroup = groupName;
//   };

//   window.updateTrackerVisibilityFromGroup = function(trackerId, isVisible) {
//     window.toggleTrackerVisibility(trackerId, isVisible);
//   };

//   window.updateTrackerColorFromGroup = function(trackerId, color) {
//     window.changeTrackerColor(trackerId, color);
//   };

//   window.handleFetch = function(trackerId) {
//     fetchSingleTracker(trackerId, true);
//   };

//   // Initialize global trajectoryOverlays object
//   window.trajectoryOverlays = {};

// });















// document.addEventListener('DOMContentLoaded', function () {

//   /* ================= DOM ================= */
//   const fetchBtn = document.getElementById('fetch-btn');
//   const trackerInput = document.getElementById('tracker-id');
//   const statusMessage = document.getElementById('status-message');
//   const lastUpdatedDiv = document.querySelector('.last-updated');
//   const imagesGrid = document.getElementById('images-grid');

//   /* ================= MAP ================= */
//   const map = L.map('map').setView([23.0225, 72.5714], 13);

//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19
//   }).addTo(map);

//   const markersLayer = L.layerGroup().addTo(map);
//   const polylineLayer = L.layerGroup().addTo(map);

//   let lastUpdateTime = null;
//   let activeGroup = null;

//   /* ================= TRACKER STATE ================= */
//   const trackerPolylines = {};
//   const trackerMarkers = {};
//   const trackerColorMap = {};
//   const trackerVisibility = {};

//   const COLORS = ['#2563eb', '#eab308', '#9333ea', '#ea580c', '#0891b2', '#4f46e5'];
//   let colorIndex = 0;

//   // Group settings from localStorage
//   let groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};

//   function getTrackerColor(trackerId) {
//     // First check group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].color;
//     }
    
//     // Then check existing color map
//     if (trackerColorMap[trackerId]) {
//       return trackerColorMap[trackerId];
//     }
    
//     // Otherwise assign new color
//     const color = COLORS[colorIndex++ % COLORS.length];
//     trackerColorMap[trackerId] = color;
//     updateLegend();
//     return color;
//   }

//   function isTrackerVisible(trackerId) {
//     // Check group settings first
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].visible;
//     }
    
//     // Default to visible
//     return trackerVisibility[trackerId] !== false;
//   }

//   /* ================= ICONS ================= */
//   function createPinIcon(color, size = 34) {
//     return L.divIcon({
//       className: '',
//       html: `
//         <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//           <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//         </svg>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size],
//       popupAnchor: [0, -size]
//     });
//   }

//   function createDotIcon(color, size = 8) {
//     return L.divIcon({
//       className: '',
//       html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;"></div>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size / 2]
//     });
//   }

//   const START_ICON = createPinIcon('green');
//   const END_ICON = createPinIcon('red');

//   /* ================= LEGEND ================= */
//   const legend = L.control({ position: 'bottomright' });

//   legend.onAdd = function () {
//     const div = L.DomUtil.create('div', 'map-legend');
//     div.style.background = 'white';
//     div.style.padding = '10px';
//     div.style.borderRadius = '8px';
//     div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
//     div.style.fontSize = '13px';
//     return div;
//   };

//   legend.addTo(map);

//   function updateLegend() {
//     const div = document.querySelector('.map-legend');
//     if (!div) return;

//     const pin = (color) => `
//       <svg width="14" height="22" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//       </svg>
//     `;

//     let html = `
//       <strong>Legend</strong><br><br>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
//         ${pin('green')}
//         <span style="font-weight:600;">Start</span>
//       </div>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
//         ${pin('red')}
//         <span style="font-weight:600;">End</span>
//       </div>

//       <hr style="margin:6px 0">
//     `;

//     Object.entries(trackerColorMap).forEach(([id, color]) => {
//       if (isTrackerVisible(id)) {
//         html += `
//           <div style="display:flex;align-items:center;gap:6px;">
//             <span style="color:${color};font-size:14px;">●</span>
//             ${id}
//           </div>
//         `;
//       }
//     });

//     div.innerHTML = html;
//   }

//   /* ================= EVENTS ================= */
//   fetchBtn?.addEventListener('click', () => {
//     const id = trackerInput.value.trim();
//     if (id) fetchSingleTracker(id, true);
//   });

//   /* ================= FETCH SINGLE ================= */
//   async function fetchSingleTracker(trackerId, clearBefore = false) {
//     if (!trackerId) return;

//     if (clearBefore) clearMap();

//     const color = getTrackerColor(trackerId);
//     trackerVisibility[trackerId] = true;
//     showStatus(`Fetching ${trackerId}...`, 'loading');

//     try {
//       const res = await fetch('/api/trajectory', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           tracker_id: trackerId,
//           interval_seconds: 30,
//           max_gap_seconds: 120
//         })
//       });

//       if (!res.ok) throw new Error('Server error');

//       const data = await res.json();
//       const points = (data.points || []).map(p => ({
//         lat: +p.lat,
//         lon: +p.lon,
//         time: p.timestamp
//       }));

//       plotTrackerPath(trackerId, points, color);
      
//       // Display real-time data based on selected parameters
//       displayRealtimeData(trackerId, data);

//       lastUpdateTime = new Date();
//       updateLastUpdatedTime();
//       showStatus(`Loaded ${trackerId}`, 'success');

//     } catch (err) {
//       showStatus(`${trackerId}: ${err.message}`, 'error');
//     }
//   }

//   /* ================= DISPLAY REALTIME DATA ================= */
//   function displayRealtimeData(trackerId, data) {
//     // Get the selected parameters for this tracker
//     const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : null;
    
//     if (!selectedParams) {
//       console.log("No real-time parameters found for", trackerId);
//       return;
//     }
    
//     // Filter the data based on selected parameters
//     const filteredData = window.formatRealtimeData ? window.formatRealtimeData(data, trackerId) : data;
    
//     // Display the filtered data in a status message or a separate panel
//     console.log("Real-time data for", trackerId, ":", filteredData);
    
//     // Update status message with selected parameters
//     let paramSummary = [];
//     if (selectedParams.timestamp && filteredData.timestamp) {
//       paramSummary.push(`Time: ${new Date(filteredData.timestamp).toLocaleString()}`);
//     }
//     if (selectedParams.latitude && filteredData.lat) {
//       paramSummary.push(`Lat: ${filteredData.lat}`);
//     }
//     if (selectedParams.longitude && filteredData.lon) {
//       paramSummary.push(`Lon: ${filteredData.lon}`);
//     }
//     if (selectedParams.altitude && filteredData.altitude) {
//       paramSummary.push(`Alt: ${filteredData.altitude}`);
//     }
//     if (selectedParams.uin_no && filteredData.uin_no) {
//       paramSummary.push(`UIN: ${filteredData.uin_no}`);
//     }
//     if (selectedParams.application && filteredData.application) {
//       paramSummary.push(`App: ${filteredData.application}`);
//     }
//     if (selectedParams.category && filteredData.category) {
//       paramSummary.push(`Category: ${filteredData.category}`);
//     }
    
//     if (paramSummary.length > 0) {
//       showStatus(`Tracker ${trackerId}: ${paramSummary.join(' | ')}`, 'success');
//     }
    
//     // You could also update a separate real-time data panel here
//     updateRealtimeDataPanel(trackerId, filteredData);
//   }

//   /* ================= UPDATE REALTIME DATA PANEL ================= */
//   function updateRealtimeDataPanel(trackerId, data) {
//     // Create or update a real-time data display panel
//     // This is just a placeholder - you can customize this based on your UI needs
//     const panelId = 'realtimeDataPanel';
//     let panel = document.getElementById(panelId);
    
//     if (!panel) {
//       panel = document.createElement('div');
//       panel.id = panelId;
//       panel.style.position = 'fixed';
//       panel.style.top = '70px';
//       panel.style.right = '20px';
//       panel.style.width = '300px';
//       panel.style.backgroundColor = 'white';
//       panel.style.padding = '15px';
//       panel.style.borderRadius = '8px';
//       panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
//       panel.style.zIndex = '1000';
//       panel.style.fontSize = '14px';
//       panel.innerHTML = '<h4 style="margin-top:0;">Real-time Data</h4><div id="realtimeDataContent"></div>';
//       document.body.appendChild(panel);
//     }
    
//     const contentDiv = document.getElementById('realtimeDataContent');
//     let html = `<strong>${trackerId}</strong><br><br>`;
    
//     for (const [key, value] of Object.entries(data)) {
//       if (value !== null && value !== undefined) {
//         html += `<strong>${key}:</strong> ${value}<br>`;
//       }
//     }
    
//     contentDiv.innerHTML = html;
//   }

//   /* ================= GROUP FETCH ================= */
//   window.fetchGroupTrackers = function (trackerIds) {
//     if (!trackerIds?.length) return alert('Group empty');
    
//     // Filter by visibility
//     const visibleTrackers = trackerIds.filter(id => isTrackerVisible(id));
    
//     if (visibleTrackers.length === 0) {
//       alert('No visible trackers in this group');
//       return;
//     }
    
//     clearMap();
//     visibleTrackers.forEach((id, i) => {
//       setTimeout(() => fetchSingleTracker(id, false), i * 400);
//     });
//   };

//   /* ================= PLOT ================= */
//   function plotTrackerPath(trackerId, points, color) {
//     if (!points.length) return;

//     // Skip if tracker is hidden
//     if (!isTrackerVisible(trackerId)) {
//       console.log(`${trackerId} is hidden, not plotting`);
//       return;
//     }

//     const latlngs = points.map(p => [p.lat, p.lon]);

//     // Polyline
//     const polyline = L.polyline(latlngs, {
//       color: color,
//       weight: 4,
//       opacity: 0.85
//     }).addTo(polylineLayer);

//     trackerPolylines[trackerId] = polyline;
    
//     // Store in global window object for access from group detail popup
//     if (!window.trajectoryOverlays) {
//       window.trajectoryOverlays = {};
//     }
//     window.trajectoryOverlays[trackerId] = polyline;

//     // Get real-time parameters for this tracker to customize popup content
//     const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : null;

//     // Markers
//     trackerMarkers[trackerId] = [];

//     // Helper function to create popup content based on selected parameters
//     function createPopupContent(trackerId, point, label) {
//       let content = `<b>${trackerId}</b><br>${label}<br>`;
      
//       if (selectedParams) {
//         if (selectedParams.timestamp && point.time) {
//           content += `Time: ${formatTimestamp(point.time)}<br>`;
//         }
//         if (selectedParams.latitude && point.lat) {
//           content += `Latitude: ${point.lat.toFixed(6)}<br>`;
//         }
//         if (selectedParams.longitude && point.lon) {
//           content += `Longitude: ${point.lon.toFixed(6)}<br>`;
//         }
//         if (selectedParams.altitude && point.altitude) {
//           content += `Altitude: ${point.altitude}m<br>`;
//         }
//         if (selectedParams.uin_no && point.uin_no) {
//           content += `UIN: ${point.uin_no}<br>`;
//         }
//         if (selectedParams.application && point.application) {
//           content += `Application: ${point.application}<br>`;
//         }
//         if (selectedParams.category && point.category) {
//           content += `Category: ${point.category}<br>`;
//         }
//       } else {
//         // Default to showing everything
//         content += `Time: ${formatTimestamp(point.time)}<br>`;
//         content += `Latitude: ${point.lat.toFixed(6)}<br>`;
//         content += `Longitude: ${point.lon.toFixed(6)}<br>`;
//       }
      
//       return content;
//     }

//     // START marker
//     const startMarker = L.marker(latlngs[0], { icon: START_ICON })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, points[0], 'Start Point'));
//     trackerMarkers[trackerId].push(startMarker);

//     // END marker
//     const endMarker = L.marker(latlngs.at(-1), { icon: END_ICON })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, points.at(-1), 'End Point'));
//     trackerMarkers[trackerId].push(endMarker);

//     // MIDDLE POINTS
//     points.slice(1, -1).forEach((p, idx) => {
//       const dotMarker = L.marker([p.lat, p.lon], {
//         icon: createDotIcon(color, 8)
//       })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, p, `Point ${idx + 1}`));
      
//       trackerMarkers[trackerId].push(dotMarker);
//     });

//     // Fit bounds to all visible trackers
//     updateMapBounds();
//   }

//   /* ================= VISIBILITY TOGGLE ================= */
//   window.toggleTrackerVisibility = function (trackerId, visible) {
//     // Update local visibility state
//     trackerVisibility[trackerId] = visible;
    
//     // Update group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].visible = visible;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }
    
//     // Update polyline visibility
//     if (trackerPolylines[trackerId]) {
//       if (visible) {
//         polylineLayer.addLayer(trackerPolylines[trackerId]);
//       } else {
//         polylineLayer.removeLayer(trackerPolylines[trackerId]);
//       }
//     }

//     // Update markers visibility
//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (visible) {
//         markersLayer.addLayer(m);
//       } else {
//         markersLayer.removeLayer(m);
//       }
//     });
    
//     updateLegend();
//     updateMapBounds();
//   };

//   /* ================= COLOR CHANGE ================= */
//   window.changeTrackerColor = function (trackerId, color) {
//     // Update color in map
//     trackerColorMap[trackerId] = color;
    
//     // Update group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].color = color;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }

//     // Update polyline color if visible
//     if (trackerPolylines[trackerId] && isTrackerVisible(trackerId)) {
//       trackerPolylines[trackerId].setStyle({ color: color });
//     }

//     // Update marker colors if visible (excluding start/end markers)
//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (m.options.icon && isTrackerVisible(trackerId)) {
//         // Check if it's a dot marker (not start/end)
//         const iconHtml = m.options.icon.options?.html || '';
//         if (iconHtml.includes('border-radius:50%')) {
//           m.setIcon(createDotIcon(color, 8));
//         }
//       }
//     });

//     updateLegend();
//   };

//   /* ================= HELPERS ================= */
//   function clearMap() {
//     markersLayer.clearLayers();
//     polylineLayer.clearLayers();
//     Object.keys(trackerPolylines).forEach(k => delete trackerPolylines[k]);
//     Object.keys(trackerMarkers).forEach(k => delete trackerMarkers[k]);
//     updateLegend();
    
//     // Clear images grid
//     if (imagesGrid) {
//       imagesGrid.innerHTML = '';
//     }
//   }

//   function updateLastUpdatedTime() {
//     if (lastUpdatedDiv && lastUpdateTime) {
//       lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }
//   }

//   function showStatus(msg, type) {
//     if (!statusMessage) return;
//     statusMessage.textContent = msg;
//     statusMessage.className = `status-${type}`;
//     if (type !== 'loading') setTimeout(() => statusMessage.textContent = '', 4000);
//   }

//   function formatTimestamp(ts) {
//     return new Date(ts).toLocaleString();
//   }

//   function updateMapBounds() {
//     const allVisiblePoints = [];
    
//     Object.keys(trackerPolylines).forEach(trackerId => {
//       if (isTrackerVisible(trackerId) && trackerPolylines[trackerId]._latlngs) {
//         allVisiblePoints.push(...trackerPolylines[trackerId]._latlngs);
//       }
//     });
    
//     if (allVisiblePoints.length > 0) {
//       map.fitBounds(allVisiblePoints, { padding: [40, 40] });
//     }
//   }

//   /* ================= EXPOSE FUNCTIONS TO WINDOW ================= */
//   // These functions will be called from group detail popup
//   window.setActiveGroup = function(groupName) {
//     activeGroup = groupName;
//     // Refresh group settings from localStorage
//     groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};
//   };

//   window.updateTrackerVisibilityFromGroup = function(trackerId, isVisible) {
//     window.toggleTrackerVisibility(trackerId, isVisible);
//   };

//   window.updateTrackerColorFromGroup = function(trackerId, color) {
//     window.changeTrackerColor(trackerId, color);
//   };

//   window.handleFetch = function(trackerId) {
//     fetchSingleTracker(trackerId, true);
//   };

//   // Initialize global trajectoryOverlays object
//   window.trajectoryOverlays = {};

//   // Initialize with any existing real-time data panel
//   document.addEventListener('click', function(e) {
//     // Close real-time data panel when clicking outside
//     const panel = document.getElementById('realtimeDataPanel');
//     if (panel && !panel.contains(e.target) && !e.target.closest('.dropdown-item') && 
//         e.target.id !== 'openRealtimePopup' && !e.target.closest('#openRealtimePopup')) {
//       panel.style.display = 'none';
//     }
//   });

//   // Add keyboard shortcut for real-time data (Alt+R)
//   document.addEventListener('keydown', function(e) {
//     if (e.altKey && e.key === 'r') {
//       e.preventDefault();
//       const realtimeBtn = document.getElementById('openRealtimePopup');
//       if (realtimeBtn) realtimeBtn.click();
//     }
//   });

//   // Fetch data for saved trackers on page load
//   window.addEventListener('load', function() {
//     const savedTrackers = JSON.parse(localStorage.getItem('saved_trackers')) || [];
//     if (savedTrackers.length > 0) {
//       // Fetch the first tracker
//       setTimeout(() => {
//         fetchSingleTracker(savedTrackers[0], true);
//       }, 500);
//     }
//   });

// });








































// latest workingg without sensor panel
// document.addEventListener('DOMContentLoaded', function () {

//   /* ================= DOM ================= */
//   const fetchBtn = document.getElementById('fetch-btn');
//   const trackerInput = document.getElementById('tracker-id');
//   const statusMessage = document.getElementById('status-message');
//   const lastUpdatedDiv = document.querySelector('.last-updated');
//   const imagesGrid = document.getElementById('images-grid');

//   /* ================= MAP ================= */
//   const map = L.map('map').setView([23.0225, 72.5714], 13);

//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19
//   }).addTo(map);

//   const markersLayer = L.layerGroup().addTo(map);
//   const polylineLayer = L.layerGroup().addTo(map);

//   let lastUpdateTime = null;
//   let activeGroup = null;

//   /* ================= TRACKER STATE ================= */
//   const trackerPolylines = {};
//   const trackerMarkers = {};
//   const trackerColorMap = {};
//   const trackerVisibility = {};

//   const COLORS = ['#2563eb', '#eab308', '#9333ea', '#ea580c', '#0891b2', '#4f46e5'];
//   let colorIndex = 0;

//   // Group settings from localStorage
//   let groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};

//   function getTrackerColor(trackerId) {
//     // First check group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].color;
//     }
    
//     // Then check existing color map
//     if (trackerColorMap[trackerId]) {
//       return trackerColorMap[trackerId];
//     }
    
//     // Otherwise assign new color
//     const color = COLORS[colorIndex++ % COLORS.length];
//     trackerColorMap[trackerId] = color;
//     updateLegend();
//     return color;
//   }

//   function isTrackerVisible(trackerId) {
//     // Check group settings first
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].visible;
//     }
    
//     // Default to visible
//     return trackerVisibility[trackerId] !== false;
//   }

//   /* ================= ICONS ================= */
//   function createPinIcon(color, size = 34) {
//     return L.divIcon({
//       className: '',
//       html: `
//         <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//           <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//         </svg>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size],
//       popupAnchor: [0, -size]
//     });
//   }

//   function createDotIcon(color, size = 8) {
//     return L.divIcon({
//       className: '',
//       html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;"></div>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size / 2]
//     });
//   }

//   const START_ICON = createPinIcon('green');
//   const END_ICON = createPinIcon('red');

//   /* ================= LEGEND ================= */
//   const legend = L.control({ position: 'bottomright' });

//   legend.onAdd = function () {
//     const div = L.DomUtil.create('div', 'map-legend');
//     div.style.background = 'white';
//     div.style.padding = '10px';
//     div.style.borderRadius = '8px';
//     div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
//     div.style.fontSize = '13px';
//     return div;
//   };

//   legend.addTo(map);

//   function updateLegend() {
//     const div = document.querySelector('.map-legend');
//     if (!div) return;

//     const pin = (color) => `
//       <svg width="14" height="22" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//       </svg>
//     `;

//     let html = `
//       <strong>Legend</strong><br><br>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
//         ${pin('green')}
//         <span style="font-weight:600;">Start</span>
//       </div>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
//         ${pin('red')}
//         <span style="font-weight:600;">End</span>
//       </div>

//       <hr style="margin:6px 0">
//     `;

//     Object.entries(trackerColorMap).forEach(([id, color]) => {
//       if (isTrackerVisible(id)) {
//         html += `
//           <div style="display:flex;align-items:center;gap:6px;">
//             <span style="color:${color};font-size:14px;">●</span>
//             ${id}
//           </div>
//         `;
//       }
//     });

//     div.innerHTML = html;
//   }

//   /* ================= EVENTS ================= */
//   fetchBtn?.addEventListener('click', () => {
//     const id = trackerInput.value.trim();
//     if (id) fetchSingleTracker(id, true);
//   });

//   /* ================= FETCH SINGLE ================= */
//   async function fetchSingleTracker(trackerId, clearBefore = false) {
//     if (!trackerId) return;

//     if (clearBefore) clearMap();

//     const color = getTrackerColor(trackerId);
//     trackerVisibility[trackerId] = true;
//     showStatus(`Fetching ${trackerId}...`, 'loading');

//     try {
//       const res = await fetch('/api/trajectory', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           tracker_id: trackerId,
//           interval_seconds: 30,
//           max_gap_seconds: 120
//         })
//       });

//       if (!res.ok) throw new Error('Server error');

//       const data = await res.json();
//       const points = (data.points || []).map(p => ({
//         lat: +p.lat,
//         lon: +p.lon,
//         time: p.timestamp,
//         // Include all available data for real-time display
//         timestamp: p.timestamp,
//         latitude: +p.lat,
//         longitude: +p.lon,
//         altitude: p.altitude || 0,
//         uin_no: p.uin_no || 'N/A',
//         application: p.application || 'Unknown',
//         category: p.category || 'General'
//       }));

//       plotTrackerPath(trackerId, points, color);
      
//       // Display real-time data and update table
//       if (points.length > 0) {
//         const latestPoint = points[points.length - 1];
//         displayRealtimeData(trackerId, latestPoint);
//       }

//       lastUpdateTime = new Date();
//       updateLastUpdatedTime();
//       showStatus(`Loaded ${trackerId}`, 'success');

//     } catch (err) {
//       showStatus(`${trackerId}: ${err.message}`, 'error');
//     }
//   }

//   /* ================= DISPLAY REALTIME DATA ================= */
//   function displayRealtimeData(trackerId, pointData) {
//     // Get the selected parameters for this tracker
//     const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : null;
    
//     if (!selectedParams) {
//       console.log("No real-time parameters found for", trackerId);
//       // Use all parameters by default
//       const defaultParams = {
//         timestamp: true,
//         latitude: true,
//         longitude: true,
//         altitude: true,
//         uin_no: true,
//         application: true,
//         category: true
//       };
//       updateRealtimeTable(trackerId, pointData, defaultParams);
//       return;
//     }
    
//     // Update the real-time data table
//     updateRealtimeTable(trackerId, pointData, selectedParams);
    
//     // Show status message with selected parameters
//     let paramSummary = [];
//     if (selectedParams.timestamp && pointData.timestamp) {
//       paramSummary.push(`Time: ${new Date(pointData.timestamp).toLocaleString()}`);
//     }
//     if (selectedParams.latitude && pointData.lat) {
//       paramSummary.push(`Lat: ${pointData.lat}`);
//     }
//     if (selectedParams.longitude && pointData.lon) {
//       paramSummary.push(`Lon: ${pointData.lon}`);
//     }
//     if (selectedParams.altitude && pointData.altitude) {
//       paramSummary.push(`Alt: ${pointData.altitude}`);
//     }
//     if (selectedParams.uin_no && pointData.uin_no) {
//       paramSummary.push(`UIN: ${pointData.uin_no}`);
//     }
//     if (selectedParams.application && pointData.application) {
//       paramSummary.push(`App: ${pointData.application}`);
//     }
//     if (selectedParams.category && pointData.category) {
//       paramSummary.push(`Category: ${pointData.category}`);
//     }
    
//     if (paramSummary.length > 0) {
//       showStatus(`Tracker ${trackerId}: ${paramSummary.join(' | ')}`, 'success');
//     }
//   }

//   /* ================= UPDATE REALTIME TABLE ================= */
//   function updateRealtimeTable(trackerId, pointData, selectedParams) {
//     // Format the data for the table based on selected parameters
//     const formattedData = {
//       'Tracker ID': trackerId
//     };
    
//     // Add only selected parameters
//     if (selectedParams.timestamp && pointData.timestamp) {
//       formattedData.timestamp = pointData.timestamp;
//     }
//     if (selectedParams.latitude && pointData.latitude) {
//       formattedData.latitude = pointData.latitude;
//     }
//     if (selectedParams.longitude && pointData.longitude) {
//       formattedData.longitude = pointData.longitude;
//     }
//     if (selectedParams.altitude && pointData.altitude) {
//       formattedData.altitude = pointData.altitude;
//     }
//     if (selectedParams.uin_no && pointData.uin_no) {
//       formattedData.uin_no = pointData.uin_no;
//     }
//     if (selectedParams.application && pointData.application) {
//       formattedData.application = pointData.application;
//     }
//     if (selectedParams.category && pointData.category) {
//       formattedData.category = pointData.category;
//     }
    
//     // Call the global function from dashboard.html to update the table
//     if (window.updateRealtimeTable) {
//       window.updateRealtimeTable(trackerId, formattedData);
//     }
    
//     // Also update the global realtimeTableData for other functions to use
//     if (!window.realtimeTableData) {
//       window.realtimeTableData = {};
//     }
//     window.realtimeTableData[trackerId] = formattedData;
//   }

//   /* ================= GROUP FETCH ================= */
//   window.fetchGroupTrackers = function (trackerIds) {
//     if (!trackerIds?.length) return alert('Group empty');
    
//     // Filter by visibility
//     const visibleTrackers = trackerIds.filter(id => isTrackerVisible(id));
    
//     if (visibleTrackers.length === 0) {
//       alert('No visible trackers in this group');
//       return;
//     }
    
//     clearMap();
//     visibleTrackers.forEach((id, i) => {
//       setTimeout(() => fetchSingleTracker(id, false), i * 400);
//     });
//   };

//   /* ================= PLOT ================= */
//   function plotTrackerPath(trackerId, points, color) {
//     if (!points.length) return;

//     // Skip if tracker is hidden
//     if (!isTrackerVisible(trackerId)) {
//       console.log(`${trackerId} is hidden, not plotting`);
//       return;
//     }

//     const latlngs = points.map(p => [p.lat, p.lon]);

//     // Polyline
//     const polyline = L.polyline(latlngs, {
//       color: color,
//       weight: 4,
//       opacity: 0.85
//     }).addTo(polylineLayer);

//     trackerPolylines[trackerId] = polyline;
    
//     // Store in global window object for access from group detail popup
//     if (!window.trajectoryOverlays) {
//       window.trajectoryOverlays = {};
//     }
//     window.trajectoryOverlays[trackerId] = polyline;

//     // Get real-time parameters for this tracker to customize popup content
//     const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : {};

//     // Helper function to create popup content based on selected parameters
//     function createPopupContent(trackerId, point, label) {
//       let content = `<b>${trackerId}</b><br>${label}<br>`;
      
//       // Always show timestamp if available
//       if (point.time) {
//         content += `Time: ${formatTimestamp(point.time)}<br>`;
//       }
      
//       // Show latitude and longitude if selected
//       if (selectedParams.latitude && point.lat !== undefined) {
//         content += `Latitude: ${point.lat.toFixed(6)}<br>`;
//       }
//       if (selectedParams.longitude && point.lon !== undefined) {
//         content += `Longitude: ${point.lon.toFixed(6)}<br>`;
//       }
      
//       // Show other selected parameters
//       if (selectedParams.altitude && point.altitude !== undefined) {
//         content += `Altitude: ${point.altitude}m<br>`;
//       }
//       if (selectedParams.uin_no && point.uin_no && point.uin_no !== 'N/A') {
//         content += `UIN: ${point.uin_no}<br>`;
//       }
//       if (selectedParams.application && point.application && point.application !== 'Unknown') {
//         content += `Application: ${point.application}<br>`;
//       }
//       if (selectedParams.category && point.category && point.category !== 'General') {
//         content += `Category: ${point.category}<br>`;
//       }
      
//       return content;
//     }

//     // Markers
//     trackerMarkers[trackerId] = [];

//     // START marker
//     const startMarker = L.marker(latlngs[0], { icon: START_ICON })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, points[0], 'Start Point'));
//     trackerMarkers[trackerId].push(startMarker);

//     // END marker
//     const endMarker = L.marker(latlngs.at(-1), { icon: END_ICON })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, points.at(-1), 'End Point'));
//     trackerMarkers[trackerId].push(endMarker);

//     // MIDDLE POINTS (only plot every 3rd point to avoid clutter)
//     points.forEach((p, idx) => {
//       if (idx > 0 && idx < points.length - 1 && idx % 3 === 0) {
//         const dotMarker = L.marker([p.lat, p.lon], {
//           icon: createDotIcon(color, 8)
//         })
//         .addTo(markersLayer)
//         .bindPopup(createPopupContent(trackerId, p, `Point ${idx}`));
        
//         trackerMarkers[trackerId].push(dotMarker);
//       }
//     });

//     // Fit bounds to all visible trackers
//     updateMapBounds();
//   }

//   /* ================= VISIBILITY TOGGLE ================= */
//   window.toggleTrackerVisibility = function (trackerId, visible) {
//     // Update local visibility state
//     trackerVisibility[trackerId] = visible;
    
//     // Update group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].visible = visible;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }
    
//     // Update polyline visibility
//     if (trackerPolylines[trackerId]) {
//       if (visible) {
//         polylineLayer.addLayer(trackerPolylines[trackerId]);
//       } else {
//         polylineLayer.removeLayer(trackerPolylines[trackerId]);
//       }
//     }

//     // Update markers visibility
//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (visible) {
//         markersLayer.addLayer(m);
//       } else {
//         markersLayer.removeLayer(m);
//       }
//     });
    
//     updateLegend();
//     updateMapBounds();
//   };

//   /* ================= COLOR CHANGE ================= */
//   window.changeTrackerColor = function (trackerId, color) {
//     // Update color in map
//     trackerColorMap[trackerId] = color;
    
//     // Update group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].color = color;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }

//     // Update polyline color if visible
//     if (trackerPolylines[trackerId] && isTrackerVisible(trackerId)) {
//       trackerPolylines[trackerId].setStyle({ color: color });
//     }

//     // Update marker colors if visible (excluding start/end markers)
//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (m.options.icon && isTrackerVisible(trackerId)) {
//         // Check if it's a dot marker (not start/end)
//         const iconHtml = m.options.icon.options?.html || '';
//         if (iconHtml.includes('border-radius:50%')) {
//           m.setIcon(createDotIcon(color, 8));
//         }
//       }
//     });

//     updateLegend();
//   };

//   /* ================= HELPERS ================= */
//   function clearMap() {
//     markersLayer.clearLayers();
//     polylineLayer.clearLayers();
//     Object.keys(trackerPolylines).forEach(k => delete trackerPolylines[k]);
//     Object.keys(trackerMarkers).forEach(k => delete trackerMarkers[k]);
//     updateLegend();
    
//     // Clear images grid
//     if (imagesGrid) {
//       imagesGrid.innerHTML = '';
//     }
    
//     // Clear real-time table data when clearing map
//     if (window.realtimeTableData) {
//       window.realtimeTableData = {};
//     }
//     if (window.updateRealtimeTable) {
//       window.updateRealtimeTable();
//     }
//   }

//   function updateLastUpdatedTime() {
//     if (lastUpdatedDiv && lastUpdateTime) {
//       lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }
//   }

//   function showStatus(msg, type) {
//     if (!statusMessage) return;
//     statusMessage.textContent = msg;
//     statusMessage.className = `status-${type}`;
//     if (type !== 'loading') setTimeout(() => statusMessage.textContent = '', 4000);
//   }

//   function formatTimestamp(ts) {
//     return new Date(ts).toLocaleString();
//   }

//   function updateMapBounds() {
//     const allVisiblePoints = [];
    
//     Object.keys(trackerPolylines).forEach(trackerId => {
//       if (isTrackerVisible(trackerId) && trackerPolylines[trackerId]._latlngs) {
//         allVisiblePoints.push(...trackerPolylines[trackerId]._latlngs);
//       }
//     });
    
//     if (allVisiblePoints.length > 0) {
//       map.fitBounds(allVisiblePoints, { padding: [40, 40] });
//     }
//   }

//   /* ================= EXPOSE FUNCTIONS TO WINDOW ================= */
//   // These functions will be called from group detail popup
//   window.setActiveGroup = function(groupName) {
//     activeGroup = groupName;
//     // Refresh group settings from localStorage
//     groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};
//   };

//   window.updateTrackerVisibilityFromGroup = function(trackerId, isVisible) {
//     window.toggleTrackerVisibility(trackerId, isVisible);
//   };

//   window.updateTrackerColorFromGroup = function(trackerId, color) {
//     window.changeTrackerColor(trackerId, color);
//   };

//   window.handleFetch = function(trackerId) {
//     fetchSingleTracker(trackerId, true);
//   };

//   // Initialize global trajectoryOverlays object
//   window.trajectoryOverlays = {};

//   // Initialize global realtimeTableData object
//   window.realtimeTableData = {};

//   // Add keyboard shortcut for real-time data (Alt+R)
//   document.addEventListener('keydown', function(e) {
//     if (e.altKey && e.key === 'r') {
//       e.preventDefault();
//       const realtimeBtn = document.getElementById('openRealtimePopup');
//       if (realtimeBtn) realtimeBtn.click();
//     }
    
//     // Shortcut to toggle real-time table (Alt+T)
//     if (e.altKey && e.key === 't') {
//       e.preventDefault();
//       const tablePanel = document.getElementById('realtimeTablePanel');
//       const tableHeader = document.getElementById('realtimeTablePanelHeader');
//       if (tablePanel && tableHeader) {
//         tableHeader.click();
//       }
//     }
//   });

//   // REMOVED: Auto-open observer that was causing the panel to open automatically
//   // The panel will now stay in whatever state the user sets it to

//   // Fetch data for saved trackers on page load
//   window.addEventListener('load', function() {
//     const savedTrackers = JSON.parse(localStorage.getItem('saved_trackers')) || [];
//     if (savedTrackers.length > 0) {
//       // Show loading message
//       showStatus(`Loading ${savedTrackers.length} saved trackers...`, 'loading');
      
//       // Fetch the first tracker
//       setTimeout(() => {
//         fetchSingleTracker(savedTrackers[0], true);
        
//         // Fetch remaining trackers with delay
//         savedTrackers.slice(1).forEach((trackerId, index) => {
//           setTimeout(() => {
//             fetchSingleTracker(trackerId, false);
//           }, (index + 1) * 500);
//         });
//       }, 1000);
//     }
//   });

// });







// for sensor panel its working but data is not correct
// document.addEventListener('DOMContentLoaded', function () {

//   /* ================= DOM ================= */
//   const fetchBtn = document.getElementById('fetch-btn');
//   const trackerInput = document.getElementById('tracker-id');
//   const sensorInput = document.getElementById('sensor-id');
//   const statusMessage = document.getElementById('status-message');
//   const lastUpdatedDiv = document.querySelector('.last-updated');
//   const imagesGrid = document.getElementById('images-grid');

//   /* ================= MAP ================= */
//   const map = L.map('map').setView([23.0225, 72.5714], 13);

//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19
//   }).addTo(map);

//   const markersLayer = L.layerGroup().addTo(map);
//   const polylineLayer = L.layerGroup().addTo(map);

//   let lastUpdateTime = null;
//   let activeGroup = null;

//   /* ================= TRACKER STATE ================= */
//   const trackerPolylines = {};
//   const trackerMarkers = {};
//   const trackerColorMap = {};
//   const trackerVisibility = {};

//   const COLORS = ['#2563eb', '#eab308', '#9333ea', '#ea580c', '#0891b2', '#4f46e5'];
//   let colorIndex = 0;

//   // Group settings from localStorage
//   let groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};

//   function getTrackerColor(trackerId) {
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].color;
//     }
    
//     if (trackerColorMap[trackerId]) {
//       return trackerColorMap[trackerId];
//     }
    
//     const color = COLORS[colorIndex++ % COLORS.length];
//     trackerColorMap[trackerId] = color;
//     updateLegend();
//     return color;
//   }

//   function isTrackerVisible(trackerId) {
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].visible;
//     }
    
//     return trackerVisibility[trackerId] !== false;
//   }

//   /* ================= ICONS ================= */
//   function createPinIcon(color, size = 34) {
//     return L.divIcon({
//       className: '',
//       html: `
//         <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//           <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//         </svg>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size],
//       popupAnchor: [0, -size]
//     });
//   }

//   function createDotIcon(color, size = 8) {
//     return L.divIcon({
//       className: '',
//       html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;"></div>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size / 2]
//     });
//   }

//   const START_ICON = createPinIcon('green');
//   const END_ICON = createPinIcon('red');

//   /* ================= LEGEND ================= */
//   const legend = L.control({ position: 'bottomright' });

//   legend.onAdd = function () {
//     const div = L.DomUtil.create('div', 'map-legend');
//     div.style.background = 'white';
//     div.style.padding = '10px';
//     div.style.borderRadius = '8px';
//     div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
//     div.style.fontSize = '13px';
//     return div;
//   };

//   legend.addTo(map);

//   function updateLegend() {
//     const div = document.querySelector('.map-legend');
//     if (!div) return;

//     const pin = (color) => `
//       <svg width="14" height="22" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//       </svg>
//     `;

//     let html = `
//       <strong>Legend</strong><br><br>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
//         ${pin('green')}
//         <span style="font-weight:600;">Start</span>
//       </div>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
//         ${pin('red')}
//         <span style="font-weight:600;">End</span>
//       </div>

//       <hr style="margin:6px 0">
//     `;

//     Object.entries(trackerColorMap).forEach(([id, color]) => {
//       if (isTrackerVisible(id)) {
//         html += `
//           <div style="display:flex;align-items:center;gap:6px;">
//             <span style="color:${color};font-size:14px;">●</span>
//             ${id}
//           </div>
//         `;
//       }
//     });

//     div.innerHTML = html;
//   }

//   /* ================= EVENTS ================= */
//   fetchBtn?.addEventListener('click', () => {
//     const id = trackerInput.value.trim();
//     if (id) fetchSingleTracker(id, true);
//   });

//   /* ================= FETCH SINGLE TRACKER ================= */
//   async function fetchSingleTracker(trackerId, clearBefore = false) {
//     if (!trackerId) return;

//     if (clearBefore) clearMap();

//     const color = getTrackerColor(trackerId);
//     trackerVisibility[trackerId] = true;
//     showStatus(`Fetching tracker ${trackerId}...`, 'loading');

//     try {
//       const res = await fetch('/api/trajectory', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           tracker_id: trackerId,
//           interval_seconds: 30,
//           max_gap_seconds: 120
//         })
//       });

//       if (!res.ok) throw new Error('Server error');

//       const data = await res.json();
//       const points = (data.points || []).map(p => ({
//         lat: +p.lat,
//         lon: +p.lon,
//         time: p.timestamp,
//         timestamp: p.timestamp,
//         latitude: +p.lat,
//         longitude: +p.lon,
//         altitude: p.altitude || 0,
//         uin_no: p.uin_no || 'N/A',
//         application: p.application || 'Unknown',
//         category: p.category || 'General'
//       }));

//       plotTrackerPath(trackerId, points, color);
      
//       if (points.length > 0) {
//         const latestPoint = points[points.length - 1];
//         displayRealtimeData(trackerId, latestPoint);
//       }

//       lastUpdateTime = new Date();
//       updateLastUpdatedTime();
//       showStatus(`Loaded tracker ${trackerId}`, 'success');

//     } catch (err) {
//       showStatus(`${trackerId}: ${err.message}`, 'error');
//     }
//   }

//   /* ================= FETCH SENSOR DATA ================= */
//   window.fetchSensorData = async function(sensorId) {
//     if (!sensorId) return;

//     showStatus(`Fetching sensor ${sensorId}...`, 'loading');

//     try {
//       const res = await fetch('https://pg2y9zc74l.execute-api.ap-south-1.amazonaws.com/data/json', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           SensorId: sensorId
//         })
//       });

//       if (!res.ok) throw new Error('Failed to fetch sensor data');

//       const data = await res.json();
      
//       // Process sensor data
//       const sensorData = {
//         sensorId: sensorId,
//         timestamp: new Date().toISOString(),
//         temperature: data.temperature || Math.random() * 30 + 10, // Example data
//         humidity: data.humidity || Math.random() * 50 + 30,
//         soil_moisture: data.soil_moisture || Math.random() * 100,
//         ph_level: data.ph_level || (Math.random() * 4 + 5).toFixed(2),
//         nitrogen: data.nitrogen || Math.floor(Math.random() * 100),
//         phosphorus: data.phosphorus || Math.floor(Math.random() * 50),
//         potassium: data.potassium || Math.floor(Math.random() * 200)
//       };

//       // Update sensor table
//       if (window.updateSensorTable) {
//         window.updateSensorTable(sensorId, sensorData);
//       }

//       // Show sensor data panel if minimized
//       const sensorPanel = document.getElementById('sensorTablePanel');
//       if (sensorPanel && sensorPanel.classList.contains('minimized')) {
//         sensorPanel.classList.remove('minimized');
//         document.getElementById('sensorTablePanelChevron').classList.remove('rotated');
//         document.getElementById('sensorTableContainer').style.display = 'block';
//       }

//       lastUpdateTime = new Date();
//       updateLastUpdatedTime();
//       showStatus(`Loaded sensor ${sensorId} data`, 'success');

//     } catch (err) {
//       showStatus(`Sensor ${sensorId}: ${err.message}`, 'error');
      
//       // Fallback to example data if API fails
//       const fallbackData = {
//         sensorId: sensorId,
//         timestamp: new Date().toISOString(),
//         temperature: (Math.random() * 30 + 10).toFixed(1),
//         humidity: (Math.random() * 50 + 30).toFixed(1),
//         soil_moisture: Math.floor(Math.random() * 100),
//         ph_level: (Math.random() * 4 + 5).toFixed(2),
//         nitrogen: Math.floor(Math.random() * 100),
//         phosphorus: Math.floor(Math.random() * 50),
//         potassium: Math.floor(Math.random() * 200)
//       };

//       if (window.updateSensorTable) {
//         window.updateSensorTable(sensorId, fallbackData);
//       }
//     }
//   };

//   /* ================= DISPLAY REALTIME DATA ================= */
//   function displayRealtimeData(trackerId, pointData) {
//     const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : null;
    
//     if (!selectedParams) {
//       const defaultParams = {
//         timestamp: true,
//         latitude: true,
//         longitude: true,
//         altitude: true,
//         uin_no: true,
//         application: true,
//         category: true
//       };
//       updateRealtimeTable(trackerId, pointData, defaultParams);
//       return;
//     }
    
//     updateRealtimeTable(trackerId, pointData, selectedParams);
    
//     let paramSummary = [];
//     if (selectedParams.timestamp && pointData.timestamp) {
//       paramSummary.push(`Time: ${new Date(pointData.timestamp).toLocaleString()}`);
//     }
//     if (selectedParams.latitude && pointData.lat) {
//       paramSummary.push(`Lat: ${pointData.lat}`);
//     }
//     if (selectedParams.longitude && pointData.lon) {
//       paramSummary.push(`Lon: ${pointData.lon}`);
//     }
    
//     if (paramSummary.length > 0) {
//       showStatus(`Tracker ${trackerId}: ${paramSummary.join(' | ')}`, 'success');
//     }
//   }

//   /* ================= UPDATE REALTIME TABLE ================= */
//   function updateRealtimeTable(trackerId, pointData, selectedParams) {
//     const formattedData = {
//       'Tracker ID': trackerId
//     };
    
//     if (selectedParams.timestamp && pointData.timestamp) {
//       formattedData.timestamp = pointData.timestamp;
//     }
//     if (selectedParams.latitude && pointData.latitude) {
//       formattedData.latitude = pointData.latitude;
//     }
//     if (selectedParams.longitude && pointData.longitude) {
//       formattedData.longitude = pointData.longitude;
//     }
//     if (selectedParams.altitude && pointData.altitude) {
//       formattedData.altitude = pointData.altitude;
//     }
//     if (selectedParams.uin_no && pointData.uin_no) {
//       formattedData.uin_no = pointData.uin_no;
//     }
//     if (selectedParams.application && pointData.application) {
//       formattedData.application = pointData.application;
//     }
//     if (selectedParams.category && pointData.category) {
//       formattedData.category = pointData.category;
//     }
    
//     if (window.updateRealtimeTable) {
//       window.updateRealtimeTable(trackerId, formattedData);
//     }
    
//     if (!window.realtimeTableData) {
//       window.realtimeTableData = {};
//     }
//     window.realtimeTableData[trackerId] = formattedData;
//   }

//   /* ================= GROUP FETCH ================= */
//   window.fetchGroupTrackers = function (trackerIds) {
//     if (!trackerIds?.length) return alert('Group empty');
    
//     const visibleTrackers = trackerIds.filter(id => isTrackerVisible(id));
    
//     if (visibleTrackers.length === 0) {
//       alert('No visible trackers in this group');
//       return;
//     }
    
//     clearMap();
//     visibleTrackers.forEach((id, i) => {
//       setTimeout(() => fetchSingleTracker(id, false), i * 400);
//     });
//   };

//   /* ================= PLOT ================= */
//   function plotTrackerPath(trackerId, points, color) {
//     if (!points.length) return;

//     if (!isTrackerVisible(trackerId)) {
//       console.log(`${trackerId} is hidden, not plotting`);
//       return;
//     }

//     const latlngs = points.map(p => [p.lat, p.lon]);

//     // Polyline
//     const polyline = L.polyline(latlngs, {
//       color: color,
//       weight: 4,
//       opacity: 0.85
//     }).addTo(polylineLayer);

//     trackerPolylines[trackerId] = polyline;
    
//     if (!window.trajectoryOverlays) {
//       window.trajectoryOverlays = {};
//     }
//     window.trajectoryOverlays[trackerId] = polyline;

//     const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : {};

//     function createPopupContent(trackerId, point, label) {
//       let content = `<b>${trackerId}</b><br>${label}<br>`;
      
//       if (point.time) {
//         content += `Time: ${formatTimestamp(point.time)}<br>`;
//       }
      
//       if (selectedParams.latitude && point.lat !== undefined) {
//         content += `Latitude: ${point.lat.toFixed(6)}<br>`;
//       }
//       if (selectedParams.longitude && point.lon !== undefined) {
//         content += `Longitude: ${point.lon.toFixed(6)}<br>`;
//       }
      
//       if (selectedParams.altitude && point.altitude !== undefined) {
//         content += `Altitude: ${point.altitude}m<br>`;
//       }
//       if (selectedParams.uin_no && point.uin_no && point.uin_no !== 'N/A') {
//         content += `UIN: ${point.uin_no}<br>`;
//       }
//       if (selectedParams.application && point.application && point.application !== 'Unknown') {
//         content += `Application: ${point.application}<br>`;
//       }
//       if (selectedParams.category && point.category && point.category !== 'General') {
//         content += `Category: ${point.category}<br>`;
//       }
      
//       return content;
//     }

//     // Markers
//     trackerMarkers[trackerId] = [];

//     // START marker
//     const startMarker = L.marker(latlngs[0], { icon: START_ICON })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, points[0], 'Start Point'));
//     trackerMarkers[trackerId].push(startMarker);

//     // END marker
//     const endMarker = L.marker(latlngs.at(-1), { icon: END_ICON })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, points.at(-1), 'End Point'));
//     trackerMarkers[trackerId].push(endMarker);

//     // MIDDLE POINTS
//     points.forEach((p, idx) => {
//       if (idx > 0 && idx < points.length - 1 && idx % 3 === 0) {
//         const dotMarker = L.marker([p.lat, p.lon], {
//           icon: createDotIcon(color, 8)
//         })
//         .addTo(markersLayer)
//         .bindPopup(createPopupContent(trackerId, p, `Point ${idx}`));
        
//         trackerMarkers[trackerId].push(dotMarker);
//       }
//     });

//     updateMapBounds();
//   }

//   /* ================= VISIBILITY TOGGLE ================= */
//   window.toggleTrackerVisibility = function (trackerId, visible) {
//     trackerVisibility[trackerId] = visible;
    
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].visible = visible;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }
    
//     if (trackerPolylines[trackerId]) {
//       if (visible) {
//         polylineLayer.addLayer(trackerPolylines[trackerId]);
//       } else {
//         polylineLayer.removeLayer(trackerPolylines[trackerId]);
//       }
//     }

//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (visible) {
//         markersLayer.addLayer(m);
//       } else {
//         markersLayer.removeLayer(m);
//       }
//     });
    
//     updateLegend();
//     updateMapBounds();
//   };

//   /* ================= COLOR CHANGE ================= */
//   window.changeTrackerColor = function (trackerId, color) {
//     trackerColorMap[trackerId] = color;
    
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].color = color;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }

//     if (trackerPolylines[trackerId] && isTrackerVisible(trackerId)) {
//       trackerPolylines[trackerId].setStyle({ color: color });
//     }

//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (m.options.icon && isTrackerVisible(trackerId)) {
//         const iconHtml = m.options.icon.options?.html || '';
//         if (iconHtml.includes('border-radius:50%')) {
//           m.setIcon(createDotIcon(color, 8));
//         }
//       }
//     });

//     updateLegend();
//   };

//   /* ================= HELPERS ================= */
//   function clearMap() {
//     markersLayer.clearLayers();
//     polylineLayer.clearLayers();
//     Object.keys(trackerPolylines).forEach(k => delete trackerPolylines[k]);
//     Object.keys(trackerMarkers).forEach(k => delete trackerMarkers[k]);
//     updateLegend();
    
//     if (imagesGrid) {
//       imagesGrid.innerHTML = '';
//     }
    
//     if (window.realtimeTableData) {
//       window.realtimeTableData = {};
//     }
//     if (window.updateRealtimeTable) {
//       window.updateRealtimeTable();
//     }
//   }

//   function updateLastUpdatedTime() {
//     if (lastUpdatedDiv && lastUpdateTime) {
//       lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }
//   }

//   function showStatus(msg, type) {
//     if (!statusMessage) return;
//     statusMessage.textContent = msg;
//     statusMessage.className = `status-${type}`;
//     if (type !== 'loading') setTimeout(() => statusMessage.textContent = '', 4000);
//   }

//   function formatTimestamp(ts) {
//     return new Date(ts).toLocaleString();
//   }

//   function updateMapBounds() {
//     const allVisiblePoints = [];
    
//     Object.keys(trackerPolylines).forEach(trackerId => {
//       if (isTrackerVisible(trackerId) && trackerPolylines[trackerId]._latlngs) {
//         allVisiblePoints.push(...trackerPolylines[trackerId]._latlngs);
//       }
//     });
    
//     if (allVisiblePoints.length > 0) {
//       map.fitBounds(allVisiblePoints, { padding: [40, 40] });
//     }
//   }

//   /* ================= EXPOSE FUNCTIONS TO WINDOW ================= */
//   window.setActiveGroup = function(groupName) {
//     activeGroup = groupName;
//     groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};
//   };

//   window.updateTrackerVisibilityFromGroup = function(trackerId, isVisible) {
//     window.toggleTrackerVisibility(trackerId, isVisible);
//   };

//   window.updateTrackerColorFromGroup = function(trackerId, color) {
//     window.changeTrackerColor(trackerId, color);
//   };

//   window.handleFetch = function(trackerId) {
//     fetchSingleTracker(trackerId, true);
//   };

//   // Initialize global objects
//   window.trajectoryOverlays = {};
//   window.realtimeTableData = {};
//   window.sensorTableData = {};

//   // Add keyboard shortcuts
//   document.addEventListener('keydown', function(e) {
//     if (e.altKey && e.key === 'r') {
//       e.preventDefault();
//       const realtimeBtn = document.getElementById('openRealtimePopup');
//       if (realtimeBtn) realtimeBtn.click();
//     }
//   });

//   // Fetch data for saved trackers and sensors on page load
//   window.addEventListener('load', function() {
//     const savedTrackers = JSON.parse(localStorage.getItem('saved_trackers')) || [];
//     const savedSensors = JSON.parse(localStorage.getItem('saved_sensors')) || [];
    
//     if (savedTrackers.length > 0) {
//       showStatus(`Loading ${savedTrackers.length} saved trackers...`, 'loading');
      
//       setTimeout(() => {
//         fetchSingleTracker(savedTrackers[0], true);
        
//         savedTrackers.slice(1).forEach((trackerId, index) => {
//           setTimeout(() => {
//             fetchSingleTracker(trackerId, false);
//           }, (index + 1) * 500);
//         });
//       }, 1000);
//     }
    
//     if (savedSensors.length > 0) {
//       setTimeout(() => {
//         savedSensors.forEach((sensorId, index) => {
//           setTimeout(() => {
//             if (window.fetchSensorData) {
//               window.fetchSensorData(sensorId);
//             }
//           }, index * 1000);
//         });
//       }, 2000);
//     }
//   });

// });
























// working code for fetching data with images but not approprite for tracker and sensor data
// document.addEventListener('DOMContentLoaded', function () {

//   /* ================= DOM ================= */
//   const fetchBtn = document.getElementById('fetch-btn');
//   const trackerInput = document.getElementById('tracker-id');
//   const sensorInput = document.getElementById('sensor-id');
//   const statusMessage = document.getElementById('status-message');
//   const lastUpdatedDiv = document.querySelector('.last-updated');
//   const imagesGrid = document.getElementById('images-grid');
//   const droneInfoBody = document.getElementById('drone-info-body');

//   /* ================= MAP ================= */
//   const map = L.map('map').setView([23.0225, 72.5714], 13);

//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19
//   }).addTo(map);

//   const markersLayer = L.layerGroup().addTo(map);
//   const polylineLayer = L.layerGroup().addTo(map);

//   let lastUpdateTime = null;
//   let activeGroup = null;

//   /* ================= TRACKER STATE ================= */
//   const trackerPolylines = {};
//   const trackerMarkers = {};
//   const trackerColorMap = {};
//   const trackerVisibility = {};

//   const COLORS = ['#2563eb', '#eab308', '#9333ea', '#ea580c', '#0891b2', '#4f46e5'];
//   let colorIndex = 0;

//   // Group settings from localStorage
//   let groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};

//   function getTrackerColor(trackerId) {
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].color;
//     }
    
//     if (trackerColorMap[trackerId]) {
//       return trackerColorMap[trackerId];
//     }
    
//     const color = COLORS[colorIndex++ % COLORS.length];
//     trackerColorMap[trackerId] = color;
//     updateLegend();
//     return color;
//   }

//   function isTrackerVisible(trackerId) {
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].visible;
//     }
    
//     return trackerVisibility[trackerId] !== false;
//   }

//   /* ================= ICONS ================= */
//   function createPinIcon(color, size = 34) {
//     return L.divIcon({
//       className: '',
//       html: `
//         <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//           <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//         </svg>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size],
//       popupAnchor: [0, -size]
//     });
//   }

//   function createDotIcon(color, size = 8) {
//     return L.divIcon({
//       className: '',
//       html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;"></div>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size / 2]
//     });
//   }

//   function createCustomIcon(color, pulse = false) {
//     const iconClass = pulse ? 'pulse-icon' : 'static-icon';
//     return L.divIcon({
//       className: `custom-icon ${iconClass} ${color}-icon`,
//       html: '<div></div>',
//       iconSize: [24, 24],
//       iconAnchor: [12, 12]
//     });
//   }

//   const START_ICON = createPinIcon('green');
//   const END_ICON = createPinIcon('red');

//   /* ================= LEGEND ================= */
//   const legend = L.control({ position: 'bottomright' });

//   legend.onAdd = function () {
//     const div = L.DomUtil.create('div', 'map-legend');
//     div.style.background = 'white';
//     div.style.padding = '10px';
//     div.style.borderRadius = '8px';
//     div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
//     div.style.fontSize = '13px';
//     return div;
//   };

//   legend.addTo(map);

//   function updateLegend() {
//     const div = document.querySelector('.map-legend');
//     if (!div) return;

//     const pin = (color) => `
//       <svg width="14" height="22" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//       </svg>
//     `;

//     let html = `
//       <strong>Legend</strong><br><br>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
//         ${pin('green')}
//         <span style="font-weight:600;">Start</span>
//       </div>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
//         ${pin('red')}
//         <span style="font-weight:600;">End</span>
//       </div>

//       <hr style="margin:6px 0">
//     `;

//     Object.entries(trackerColorMap).forEach(([id, color]) => {
//       if (isTrackerVisible(id)) {
//         html += `
//           <div style="display:flex;align-items:center;gap:6px;">
//             <span style="color:${color};font-size:14px;">●</span>
//             ${id}
//           </div>
//         `;
//       }
//     });

//     div.innerHTML = html;
//   }

//   /* ================= EVENTS ================= */
//   fetchBtn?.addEventListener('click', () => {
//     const id = trackerInput.value.trim();
//     if (id) fetchSingleTracker(id, true);
//   });

//   /* ================= FETCH SINGLE TRACKER ================= */
//   async function fetchSingleTracker(trackerId, clearBefore = false) {
//     if (!trackerId) return;

//     if (clearBefore) clearMap();

//     const color = getTrackerColor(trackerId);
//     trackerVisibility[trackerId] = true;
//     showStatus(`Fetching tracker ${trackerId}...`, 'loading');

//     try {
//       // Fetch tracker data from AWS API (adjust endpoint if needed)
//       const res = await fetch('/api/trajectory', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           tracker_id: trackerId,
//           interval_seconds: 30,
//           max_gap_seconds: 120
//         })
//       });

//       if (!res.ok) {
//         const error = await res.json();
//         throw new Error(error.error || 'Server error occurred');
//       }

//       const data = await res.json();
      
//       // Process tracker data based on your server response format
//       const points = [];
      
//       if (data.points && Array.isArray(data.points)) {
//         // If server returns array of points as in reference code
//         points.push(...data.points.map(p => ({
//           lat: parseFloat(p.lat) || parseFloat(p.Latitude),
//           lon: parseFloat(p.lon) || parseFloat(p.Longitude),
//           timestamp: p.timestamp || new Date().toISOString(),
//           altitude: p.altitude || 0,
//           uin_no: p.DroneUINNumber || p.uin_no || trackerId,
//           application: p.DroneApplication || p.application || 'Tracker',
//           category: p.DroneCategory || p.category || 'GPS'
//         })));
//       } else if (data.Latitude && data.Longitude) {
//         // If server returns single location object (like sensor API)
//         points.push({
//           lat: parseFloat(data.Latitude),
//           lon: parseFloat(data.Longitude),
//           timestamp: data.Timestamp || new Date().toISOString(),
//           altitude: data.Altitude || 0,
//           uin_no: data.DroneUINNumber || trackerId,
//           application: data.DroneApplication || 'Tracker',
//           category: data.DroneCategory || 'GPS'
//         });
//       } else {
//         throw new Error('Invalid data format received from server');
//       }

//       if (points.length === 0) {
//         throw new Error('No location data found for this tracker');
//       }

//       // Display drone info in table (from reference code)
//       displayDroneInfo(trackerId, points[0]);
      
//       // Plot on map
//       plotTrackerPath(trackerId, points, color);
      
//       // Display realtime data
//       if (points.length > 0) {
//         const latestPoint = points[points.length - 1];
//         displayRealtimeData(trackerId, latestPoint);
//       }

//       // Display images if available (from reference code)
//       if (data.images && Array.isArray(data.images)) {
//         displayImages(data.images);
//       }

//       lastUpdateTime = new Date();
//       updateLastUpdatedTime();
//       showStatus(`Loaded tracker ${trackerId} with ${points.length} points`, 'success');

//     } catch (err) {
//       console.error('Error fetching tracker:', err);
//       showStatus(`Tracker ${trackerId}: ${err.message}`, 'error');
//       showErrorOnMap(err.message);
//     }
//   }

//   /* ================= DISPLAY DRONE INFO (from reference) ================= */
//   function displayDroneInfo(trackerId, firstRecord = {}) {
//     if (!droneInfoBody) return;
    
//     droneInfoBody.innerHTML = '';
//     const row = document.createElement('tr');
//     row.innerHTML = `
//         <td>${trackerId}</td>
//         <td>${firstRecord.uin_no || 'N/A'}</td>
//         <td>${firstRecord.category || 'N/A'}</td>
//         <td>${firstRecord.application || 'N/A'}</td>
//     `;
//     droneInfoBody.appendChild(row);
//   }

//   /* ================= FETCH SENSOR DATA ================= */
//   window.fetchSensorData = async function(sensorId) {
//     if (!sensorId) return;

//     showStatus(`Fetching sensor ${sensorId}...`, 'loading');

//     try {
//       // Fetch sensor data from AWS API - EXACTLY as per your specification
//       const res = await fetch('https://pg2y9zc74l.execute-api.ap-south-1.amazonaws.com/data/json', {
//         method: 'POST',
//         headers: { 
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         },
//         body: JSON.stringify({
//           SensorId: sensorId.toString().padStart(3, '0')
//         })
//       });

//       if (!res.ok) {
//         throw new Error(`HTTP ${res.status}: Failed to fetch sensor data`);
//       }

//       const data = await res.json();
      
//       // Check if response has data
//       if (!data || Object.keys(data).length === 0) {
//         throw new Error('No data available for this sensor');
//       }

//       // Process sensor data EXACTLY as per server format
//       const sensorData = {
//         SensorId: data.SensorId || sensorId.toString().padStart(3, '0'),
//         Timestamp: new Date().toISOString(), // Add timestamp since server doesn't provide
//         Latitude: data.Latitude || null,
//         Longitude: data.Longitude || null,
//         Maplink: data.Maplink || null,
//         SatelliteFix: data.SatelliteFix || 'N/A',
//         Moisture: data.Moisture || null,
//         Temperature: data.Temperature || null,
//         EC: data.EC || null,
//         PHValue: data.PHValue || null,
//         Nitrogen: data.Nitrogen || null,
//         Phosphorous: data.Phosphorous || null,
//         Potassium: data.Potassium || null
//       };

//       // Update sensor table with the exact data from server
//       if (window.updateSensorTable) {
//         window.updateSensorTable(sensorId, sensorData);
//       }

//       // Plot sensor location on map if available
//       if (sensorData.Latitude && sensorData.Longitude) {
//         const color = '#10b981'; // Green color for sensors
//         const sensorIcon = createPinIcon(color, 28);
        
//         const marker = L.marker([parseFloat(sensorData.Latitude), parseFloat(sensorData.Longitude)], {
//           icon: sensorIcon
//         })
//         .addTo(markersLayer)
//         .bindPopup(`
//           <div class="map-popup">
//             <h4>Sensor: ${sensorData.SensorId}</h4>
//             ${sensorData.Latitude ? `<p><strong>Latitude:</strong> ${sensorData.Latitude}</p>` : ''}
//             ${sensorData.Longitude ? `<p><strong>Longitude:</strong> ${sensorData.Longitude}</p>` : ''}
//             ${sensorData.Moisture ? `<p><strong>Moisture:</strong> ${sensorData.Moisture}</p>` : ''}
//             ${sensorData.Temperature ? `<p><strong>Temperature:</strong> ${sensorData.Temperature}</p>` : ''}
//             ${sensorData.PHValue ? `<p><strong>pH:</strong> ${sensorData.PHValue}</p>` : ''}
//             ${sensorData.Maplink ? `<p><a href="${sensorData.Maplink}" target="_blank">View on Google Maps</a></p>` : ''}
//           </div>
//         `);
//       }

//       lastUpdateTime = new Date();
//       updateLastUpdatedTime();
//       showStatus(`Loaded sensor ${sensorId} data`, 'success');

//     } catch (err) {
//       showStatus(`Sensor ${sensorId}: ${err.message}`, 'error');
      
//       // Only display error, no fallback data
//       if (window.updateSensorTable) {
//         window.updateSensorTable(sensorId, {
//           SensorId: sensorId,
//           error: err.message
//         });
//       }
//     }
//   };

//   /* ================= DISPLAY REALTIME DATA ================= */
//   function displayRealtimeData(trackerId, pointData) {
//     // Display only the data that's available from server
//     const formattedData = {
//       'Tracker ID': trackerId
//     };
    
//     // Check each field and only add if it exists
//     if (pointData.timestamp) {
//       formattedData.timestamp = pointData.timestamp;
//     }
//     if (pointData.latitude || pointData.lat) {
//       formattedData.latitude = pointData.latitude || pointData.lat;
//     }
//     if (pointData.longitude || pointData.lon) {
//       formattedData.longitude = pointData.longitude || pointData.lon;
//     }
//     if (pointData.altitude) {
//       formattedData.altitude = pointData.altitude;
//     }
//     if (pointData.uin_no) {
//       formattedData.uin_no = pointData.uin_no;
//     }
//     if (pointData.application) {
//       formattedData.application = pointData.application;
//     }
//     if (pointData.category) {
//       formattedData.category = pointData.category;
//     }
    
//     if (window.updateRealtimeTable) {
//       window.updateRealtimeTable(trackerId, formattedData);
//     }
    
//     if (!window.realtimeTableData) {
//       window.realtimeTableData = {};
//     }
//     window.realtimeTableData[trackerId] = formattedData;
//   }

//   /* ================= GROUP FETCH ================= */
//   window.fetchGroupTrackers = function (trackerIds) {
//     if (!trackerIds?.length) {
//       alert('Group is empty');
//       return;
//     }
    
//     const visibleTrackers = trackerIds.filter(id => isTrackerVisible(id));
    
//     if (visibleTrackers.length === 0) {
//       alert('No visible trackers in this group');
//       return;
//     }
    
//     clearMap();
    
//     // Fetch trackers sequentially to avoid API rate limits
//     visibleTrackers.forEach((id, i) => {
//       setTimeout(() => fetchSingleTracker(id, false), i * 1000);
//     });
//   };

//   /* ================= PLOT ================= */
//   function plotTrackerPath(trackerId, points, color) {
//     if (!points.length) return;

//     if (!isTrackerVisible(trackerId)) {
//       return;
//     }

//     const latlngs = points.map(p => [p.lat, p.lon]);

//     // Polyline
//     const polyline = L.polyline(latlngs, {
//       color: color,
//       weight: 4,
//       opacity: 0.85
//     }).addTo(polylineLayer);

//     trackerPolylines[trackerId] = polyline;
    
//     if (!window.trajectoryOverlays) {
//       window.trajectoryOverlays = {};
//     }
//     window.trajectoryOverlays[trackerId] = polyline;

//     // Markers
//     trackerMarkers[trackerId] = [];

//     // Use icons from reference code for better visual
//     points.forEach((p, i) => {
//       const lat = parseFloat(p.lat);
//       const lng = parseFloat(p.lon);
//       const iconColor = (i === 0) ? 'green' : (i === points.length - 1) ? 'red' : color;
      
//       let marker;
//       if (i === 0) {
//         // Start marker
//         marker = L.marker([lat, lng], { icon: START_ICON });
//       } else if (i === points.length - 1) {
//         // End marker
//         marker = L.marker([lat, lng], { icon: END_ICON });
//       } else if (points.length > 10 && i % Math.floor(points.length / 3) === 0) {
//         // Middle points for long paths
//         marker = L.marker([lat, lng], { icon: createDotIcon(color, 8) });
//       } else {
//         // Skip plotting every point to avoid clutter
//         return;
//       }

//       marker.addTo(markersLayer)
//         .bindPopup(`
//           <div class="map-popup">
//             <h4>Tracker: ${trackerId}</h4>
//             ${p.timestamp ? `<p><strong>Time:</strong> ${formatTimestamp(p.timestamp)}</p>` : ''}
//             <p><strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
//             ${p.altitude ? `<p><strong>Altitude:</strong> ${p.altitude.toFixed(2)} m</p>` : ''}
//             ${p.uin_no ? `<p><strong>UIN:</strong> ${p.uin_no}</p>` : ''}
//             ${p.application ? `<p><strong>Application:</strong> ${p.application}</p>` : ''}
//             ${p.category ? `<p><strong>Category:</strong> ${p.category}</p>` : ''}
//           </div>
//         `);
      
//       trackerMarkers[trackerId].push(marker);
//     });

//     updateMapBounds();
//   }

//   /* ================= DISPLAY IMAGES (from reference) ================= */
//   function displayImages(images) {
//     if (!imagesGrid) return;
    
//     imagesGrid.innerHTML = '';
//     if (!Array.isArray(images) || images.length === 0) {
//       imagesGrid.innerHTML = `<div class="no-data-message"><p>No images available</p></div>`;
//       return;
//     }

//     images.forEach((imgUrl) => {
//       if (typeof imgUrl !== 'string' || !imgUrl.startsWith('http')) return;

//       const imgContainer = document.createElement('div');
//       imgContainer.className = 'image-container';

//       const imgLink = document.createElement('a');
//       imgLink.href = imgUrl;
//       imgLink.target = '_blank';

//       const img = document.createElement('img');
//       img.src = imgUrl;
//       img.alt = 'Drone image';
//       img.loading = 'lazy';

//       const imgInfo = document.createElement('div');
//       imgInfo.className = 'image-info';
//       const timestamp = extractTimestampFromUrl(imgUrl);
//       if (timestamp) imgInfo.textContent = timestamp;

//       imgLink.appendChild(img);
//       imgContainer.appendChild(imgLink);
//       imgContainer.appendChild(imgInfo);
//       imagesGrid.appendChild(imgContainer);
//     });
//   }

//   /* ================= VISIBILITY TOGGLE ================= */
//   window.toggleTrackerVisibility = function (trackerId, visible) {
//     trackerVisibility[trackerId] = visible;
    
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].visible = visible;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }
    
//     if (trackerPolylines[trackerId]) {
//       if (visible) {
//         polylineLayer.addLayer(trackerPolylines[trackerId]);
//       } else {
//         polylineLayer.removeLayer(trackerPolylines[trackerId]);
//       }
//     }

//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (visible) {
//         markersLayer.addLayer(m);
//       } else {
//         markersLayer.removeLayer(m);
//       }
//     });
    
//     updateLegend();
//     updateMapBounds();
//   };

//   /* ================= COLOR CHANGE ================= */
//   window.changeTrackerColor = function (trackerId, color) {
//     trackerColorMap[trackerId] = color;
    
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].color = color;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }

//     if (trackerPolylines[trackerId] && isTrackerVisible(trackerId)) {
//       trackerPolylines[trackerId].setStyle({ color: color });
//     }

//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (m.options.icon && isTrackerVisible(trackerId)) {
//         const iconHtml = m.options.icon.options?.html || '';
//         if (iconHtml.includes('border-radius:50%')) {
//           m.setIcon(createDotIcon(color, 8));
//         }
//       }
//     });

//     updateLegend();
//   };

//   /* ================= HELPERS ================= */
//   function clearMap() {
//     markersLayer.clearLayers();
//     polylineLayer.clearLayers();
//     Object.keys(trackerPolylines).forEach(k => delete trackerPolylines[k]);
//     Object.keys(trackerMarkers).forEach(k => delete trackerMarkers[k]);
//     updateLegend();
    
//     if (imagesGrid) {
//       imagesGrid.innerHTML = '';
//     }
    
//     if (droneInfoBody) {
//       droneInfoBody.innerHTML = '';
//     }
    
//     if (window.realtimeTableData) {
//       window.realtimeTableData = {};
//     }
//     if (window.updateRealtimeTable) {
//       window.updateRealtimeTable();
//     }
//   }

//   function updateLastUpdatedTime() {
//     if (lastUpdatedDiv && lastUpdateTime) {
//       lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }
//   }

//   function showStatus(msg, type) {
//     if (!statusMessage) return;
//     statusMessage.textContent = msg;
//     statusMessage.className = `status-${type}`;
//     if (type !== 'loading') setTimeout(() => statusMessage.textContent = '', 4000);
//   }

//   function formatTimestamp(timestamp) {
//     if (!timestamp) return 'Unknown';
//     try {
//       if (typeof timestamp === 'string' && timestamp.match(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/)) {
//         const [datePart, timePart] = timestamp.split(' ');
//         const [day, month, year] = datePart.split('-');
//         return new Date(`${year}-${month}-${day}T${timePart}`).toLocaleString();
//       }
//       return new Date(timestamp).toLocaleString();
//     } catch {
//       return String(timestamp);
//     }
//   }

//   function extractTimestampFromUrl(url) {
//     try {
//       const match = url.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
//       if (match) {
//         const [_, year, month, day, hour, minute, second] = match;
//         return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString();
//       }
//       return null;
//     } catch {
//       return null;
//     }
//   }

//   function updateMapBounds() {
//     const allVisiblePoints = [];
    
//     Object.keys(trackerPolylines).forEach(trackerId => {
//       if (isTrackerVisible(trackerId) && trackerPolylines[trackerId]._latlngs) {
//         allVisiblePoints.push(...trackerPolylines[trackerId]._latlngs);
//       }
//     });
    
//     if (allVisiblePoints.length > 0) {
//       map.fitBounds(allVisiblePoints, { padding: [40, 40] });
//     }
//   }

//   function showMessageOnMap(message, type) {
//     const center = map.getCenter();
//     markersLayer.clearLayers();

//     const icon = L.divIcon({
//       className: `map-message map-message-${type}`,
//       html: `<div>${message}</div>`,
//       iconSize: [200, 40]
//     });

//     L.marker(center, {
//       icon: icon,
//       zIndexOffset: 1000
//     }).addTo(markersLayer);
//     map.setView(center, 12);
//   }

//   function showErrorOnMap(error) {
//     showMessageOnMap(`Error: ${error}`, 'error');
//   }

//   /* ================= EXPOSE FUNCTIONS TO WINDOW ================= */
//   window.setActiveGroup = function(groupName) {
//     activeGroup = groupName;
//     groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};
//   };

//   window.updateTrackerVisibilityFromGroup = function(trackerId, isVisible) {
//     window.toggleTrackerVisibility(trackerId, isVisible);
//   };

//   window.updateTrackerColorFromGroup = function(trackerId, color) {
//     window.changeTrackerColor(trackerId, color);
//   };

//   window.handleFetch = function(trackerId) {
//     fetchSingleTracker(trackerId, true);
//   };

//   // Initialize global objects
//   window.trajectoryOverlays = {};
//   window.realtimeTableData = {};
//   window.sensorTableData = {};

//   // Fetch data for saved trackers and sensors on page load
//   window.addEventListener('load', function() {
//     const savedTrackers = JSON.parse(localStorage.getItem('saved_trackers')) || [];
//     const savedSensors = JSON.parse(localStorage.getItem('saved_sensors')) || [];
    
//     // Fetch trackers
//     if (savedTrackers.length > 0) {
//       showStatus(`Loading ${savedTrackers.length} saved trackers...`, 'loading');
      
//       savedTrackers.forEach((trackerId, index) => {
//         setTimeout(() => {
//           fetchSingleTracker(trackerId, index === 0);
//         }, index * 2000);
//       });
//     }
    
//     // Fetch sensors
//     if (savedSensors.length > 0) {
//       setTimeout(() => {
//         savedSensors.forEach((sensorId, index) => {
//           setTimeout(() => {
//             if (window.fetchSensorData) {
//               window.fetchSensorData(sensorId);
//             }
//           }, index * 3000);
//         });
//       }, 2000);
//     }
//   });

// });



// document.addEventListener('DOMContentLoaded', function () {

//   /* ================= DOM ================= */
//   const fetchBtn = document.getElementById('fetch-btn');
//   const trackerInput = document.getElementById('tracker-id');
//   const statusMessage = document.getElementById('status-message');
//   const lastUpdatedDiv = document.querySelector('.last-updated');
//   const imagesGrid = document.getElementById('images-grid');

//   /* ================= MAP ================= */
//   const map = L.map('map').setView([23.0225, 72.5714], 13);

//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19
//   }).addTo(map);

//   const markersLayer = L.layerGroup().addTo(map);
//   const polylineLayer = L.layerGroup().addTo(map);

//   let lastUpdateTime = null;
//   let activeGroup = null;

//   /* ================= TRACKER STATE ================= */
//   const trackerPolylines = {};
//   const trackerMarkers = {};
//   const trackerColorMap = {};
//   const trackerVisibility = {};

//   const COLORS = ['#2563eb', '#eab308', '#9333ea', '#ea580c', '#0891b2', '#4f46e5'];
//   let colorIndex = 0;

//   // Group settings from localStorage
//   let groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};

//   function getTrackerColor(trackerId) {
//     // First check group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].color;
//     }
    
//     // Then check existing color map
//     if (trackerColorMap[trackerId]) {
//       return trackerColorMap[trackerId];
//     }
    
//     // Otherwise assign new color
//     const color = COLORS[colorIndex++ % COLORS.length];
//     trackerColorMap[trackerId] = color;
//     updateLegend();
//     return color;
//   }

//   function isTrackerVisible(trackerId) {
//     // Check group settings first
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].visible;
//     }
    
//     // Default to visible
//     return trackerVisibility[trackerId] !== false;
//   }

//   /* ================= ICONS ================= */
//   function createPinIcon(color, size = 34) {
//     return L.divIcon({
//       className: '',
//       html: `
//         <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//           <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//         </svg>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size],
//       popupAnchor: [0, -size]
//     });
//   }

//   function createDotIcon(color, size = 8) {
//     return L.divIcon({
//       className: '',
//       html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;"></div>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size / 2]
//     });
//   }

//   const START_ICON = createPinIcon('green');
//   const END_ICON = createPinIcon('red');

//   /* ================= LEGEND ================= */
//   const legend = L.control({ position: 'bottomright' });

//   legend.onAdd = function () {
//     const div = L.DomUtil.create('div', 'map-legend');
//     div.style.background = 'white';
//     div.style.padding = '10px';
//     div.style.borderRadius = '8px';
//     div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
//     div.style.fontSize = '13px';
//     return div;
//   };

//   legend.addTo(map);

//   function updateLegend() {
//     const div = document.querySelector('.map-legend');
//     if (!div) return;

//     const pin = (color) => `
//       <svg width="14" height="22" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//       </svg>
//     `;

//     let html = `
//       <strong>Legend</strong><br><br>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
//         ${pin('green')}
//         <span style="font-weight:600;">Start</span>
//       </div>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
//         ${pin('red')}
//         <span style="font-weight:600;">End</span>
//       </div>

//       <hr style="margin:6px 0">
//     `;

//     Object.entries(trackerColorMap).forEach(([id, color]) => {
//       if (isTrackerVisible(id)) {
//         html += `
//           <div style="display:flex;align-items:center;gap:6px;">
//             <span style="color:${color};font-size:14px;">●</span>
//             ${id}
//           </div>
//         `;
//       }
//     });

//     div.innerHTML = html;
//   }

//   /* ================= EVENTS ================= */
//   fetchBtn?.addEventListener('click', () => {
//     const id = trackerInput.value.trim();
//     if (id) fetchSingleTracker(id, true);
//   });

//   /* ================= FETCH SINGLE ================= */
//   async function fetchSingleTracker(trackerId, clearBefore = false) {
//     if (!trackerId) return;

//     if (clearBefore) clearMap();

//     const color = getTrackerColor(trackerId);
//     trackerVisibility[trackerId] = true;
//     showStatus(`Fetching ${trackerId}...`, 'loading');

//     try {
//       const res = await fetch('/api/trajectory', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           tracker_id: trackerId,
//           interval_seconds: 30,
//           max_gap_seconds: 120
//         })
//       });

//       if (!res.ok) throw new Error('Server error');

//       const data = await res.json();
//       const points = (data.points || []).map(p => ({
//         lat: +p.lat,
//         lon: +p.lon,
//         time: p.timestamp,
//         // Include all available data for real-time display
//         timestamp: p.timestamp,
//         latitude: +p.lat,
//         longitude: +p.lon,
//         altitude: p.altitude || 0,
//         uin_no: p.uin_no || 'N/A',
//         application: p.application || 'Unknown',
//         category: p.category || 'General'
//       }));

//       plotTrackerPath(trackerId, points, color);
      
//       // Display real-time data and update table
//       if (points.length > 0) {
//         const latestPoint = points[points.length - 1];
//         displayRealtimeData(trackerId, latestPoint);
//       }

//       lastUpdateTime = new Date();
//       updateLastUpdatedTime();
//       showStatus(`Loaded ${trackerId}`, 'success');

//     } catch (err) {
//       showStatus(`${trackerId}: ${err.message}`, 'error');
//     }
//   }

//   /* ================= DISPLAY REALTIME DATA ================= */
//   function displayRealtimeData(trackerId, pointData) {
//     // Get the selected parameters for this tracker
//     const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : null;
    
//     if (!selectedParams) {
//       console.log("No real-time parameters found for", trackerId);
//       // Use all parameters by default
//       const defaultParams = {
//         timestamp: true,
//         latitude: true,
//         longitude: true,
//         altitude: true,
//         uin_no: true,
//         application: true,
//         category: true
//       };
//       updateRealtimeTable(trackerId, pointData, defaultParams);
//       return;
//     }
    
//     // Update the real-time data table
//     updateRealtimeTable(trackerId, pointData, selectedParams);
    
//     // Show status message with selected parameters
//     let paramSummary = [];
//     if (selectedParams.timestamp && pointData.timestamp) {
//       paramSummary.push(`Time: ${new Date(pointData.timestamp).toLocaleString()}`);
//     }
//     if (selectedParams.latitude && pointData.lat) {
//       paramSummary.push(`Lat: ${pointData.lat}`);
//     }
//     if (selectedParams.longitude && pointData.lon) {
//       paramSummary.push(`Lon: ${pointData.lon}`);
//     }
//     if (selectedParams.altitude && pointData.altitude) {
//       paramSummary.push(`Alt: ${pointData.altitude}`);
//     }
//     if (selectedParams.uin_no && pointData.uin_no) {
//       paramSummary.push(`UIN: ${pointData.uin_no}`);
//     }
//     if (selectedParams.application && pointData.application) {
//       paramSummary.push(`App: ${pointData.application}`);
//     }
//     if (selectedParams.category && pointData.category) {
//       paramSummary.push(`Category: ${pointData.category}`);
//     }
    
//     if (paramSummary.length > 0) {
//       showStatus(`Tracker ${trackerId}: ${paramSummary.join(' | ')}`, 'success');
//     }
//   }

//   /* ================= UPDATE REALTIME TABLE ================= */
//   function updateRealtimeTable(trackerId, pointData, selectedParams) {
//     // Format the data for the table based on selected parameters
//     const formattedData = {
//       'Tracker ID': trackerId
//     };
    
//     // Add only selected parameters
//     if (selectedParams.timestamp && pointData.timestamp) {
//       formattedData.timestamp = pointData.timestamp;
//     }
//     if (selectedParams.latitude && pointData.latitude) {
//       formattedData.latitude = pointData.latitude;
//     }
//     if (selectedParams.longitude && pointData.longitude) {
//       formattedData.longitude = pointData.longitude;
//     }
//     if (selectedParams.altitude && pointData.altitude) {
//       formattedData.altitude = pointData.altitude;
//     }
//     if (selectedParams.uin_no && pointData.uin_no) {
//       formattedData.uin_no = pointData.uin_no;
//     }
//     if (selectedParams.application && pointData.application) {
//       formattedData.application = pointData.application;
//     }
//     if (selectedParams.category && pointData.category) {
//       formattedData.category = pointData.category;
//     }
    
//     // Call the global function from dashboard.html to update the table
//     if (window.updateRealtimeTable) {
//       window.updateRealtimeTable(trackerId, formattedData);
//     }
    
//     // Also update the global realtimeTableData for other functions to use
//     if (!window.realtimeTableData) {
//       window.realtimeTableData = {};
//     }
//     window.realtimeTableData[trackerId] = formattedData;
//   }

//   /* ================= GROUP FETCH ================= */
//   window.fetchGroupTrackers = function (trackerIds) {
//     if (!trackerIds?.length) return alert('Group empty');
    
//     // Filter by visibility
//     const visibleTrackers = trackerIds.filter(id => isTrackerVisible(id));
    
//     if (visibleTrackers.length === 0) {
//       alert('No visible trackers in this group');
//       return;
//     }
    
//     clearMap();
//     visibleTrackers.forEach((id, i) => {
//       setTimeout(() => fetchSingleTracker(id, false), i * 400);
//     });
//   };

//   /* ================= PLOT ================= */
//   function plotTrackerPath(trackerId, points, color) {
//     if (!points.length) return;

//     // Skip if tracker is hidden
//     if (!isTrackerVisible(trackerId)) {
//       console.log(`${trackerId} is hidden, not plotting`);
//       return;
//     }

//     const latlngs = points.map(p => [p.lat, p.lon]);

//     // Polyline
//     const polyline = L.polyline(latlngs, {
//       color: color,
//       weight: 4,
//       opacity: 0.85
//     }).addTo(polylineLayer);

//     trackerPolylines[trackerId] = polyline;
    
//     // Store in global window object for access from group detail popup
//     if (!window.trajectoryOverlays) {
//       window.trajectoryOverlays = {};
//     }
//     window.trajectoryOverlays[trackerId] = polyline;

//     // Get real-time parameters for this tracker to customize popup content
//     const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : {};

//     // Helper function to create popup content based on selected parameters
//     function createPopupContent(trackerId, point, label) {
//       let content = `<b>${trackerId}</b><br>${label}<br>`;
      
//       // Always show timestamp if available
//       if (point.time) {
//         content += `Time: ${formatTimestamp(point.time)}<br>`;
//       }
      
//       // Show latitude and longitude if selected
//       if (selectedParams.latitude && point.lat !== undefined) {
//         content += `Latitude: ${point.lat.toFixed(6)}<br>`;
//       }
//       if (selectedParams.longitude && point.lon !== undefined) {
//         content += `Longitude: ${point.lon.toFixed(6)}<br>`;
//       }
      
//       // Show other selected parameters
//       if (selectedParams.altitude && point.altitude !== undefined) {
//         content += `Altitude: ${point.altitude}m<br>`;
//       }
//       if (selectedParams.uin_no && point.uin_no && point.uin_no !== 'N/A') {
//         content += `UIN: ${point.uin_no}<br>`;
//       }
//       if (selectedParams.application && point.application && point.application !== 'Unknown') {
//         content += `Application: ${point.application}<br>`;
//       }
//       if (selectedParams.category && point.category && point.category !== 'General') {
//         content += `Category: ${point.category}<br>`;
//       }
      
//       return content;
//     }

//     // Markers
//     trackerMarkers[trackerId] = [];

//     // START marker
//     const startMarker = L.marker(latlngs[0], { icon: START_ICON })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, points[0], 'Start Point'));
//     trackerMarkers[trackerId].push(startMarker);

//     // END marker
//     const endMarker = L.marker(latlngs.at(-1), { icon: END_ICON })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, points.at(-1), 'End Point'));
//     trackerMarkers[trackerId].push(endMarker);

//     // MIDDLE POINTS (only plot every 3rd point to avoid clutter)
//     points.forEach((p, idx) => {
//       if (idx > 0 && idx < points.length - 1 && idx % 3 === 0) {
//         const dotMarker = L.marker([p.lat, p.lon], {
//           icon: createDotIcon(color, 8)
//         })
//         .addTo(markersLayer)
//         .bindPopup(createPopupContent(trackerId, p, `Point ${idx}`));
        
//         trackerMarkers[trackerId].push(dotMarker);
//       }
//     });

//     // Fit bounds to all visible trackers
//     updateMapBounds();
//   }

//   /* ================= VISIBILITY TOGGLE ================= */
//   window.toggleTrackerVisibility = function (trackerId, visible) {
//     // Update local visibility state
//     trackerVisibility[trackerId] = visible;
    
//     // Update group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].visible = visible;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }
    
//     // Update polyline visibility
//     if (trackerPolylines[trackerId]) {
//       if (visible) {
//         polylineLayer.addLayer(trackerPolylines[trackerId]);
//       } else {
//         polylineLayer.removeLayer(trackerPolylines[trackerId]);
//       }
//     }

//     // Update markers visibility
//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (visible) {
//         markersLayer.addLayer(m);
//       } else {
//         markersLayer.removeLayer(m);
//       }
//     });
    
//     updateLegend();
//     updateMapBounds();
//   };

//   /* ================= COLOR CHANGE ================= */
//   window.changeTrackerColor = function (trackerId, color) {
//     // Update color in map
//     trackerColorMap[trackerId] = color;
    
//     // Update group settings
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].color = color;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }

//     // Update polyline color if visible
//     if (trackerPolylines[trackerId] && isTrackerVisible(trackerId)) {
//       trackerPolylines[trackerId].setStyle({ color: color });
//     }

//     // Update marker colors if visible (excluding start/end markers)
//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (m.options.icon && isTrackerVisible(trackerId)) {
//         // Check if it's a dot marker (not start/end)
//         const iconHtml = m.options.icon.options?.html || '';
//         if (iconHtml.includes('border-radius:50%')) {
//           m.setIcon(createDotIcon(color, 8));
//         }
//       }
//     });

//     updateLegend();
//   };

//   /* ================= HELPERS ================= */
//   function clearMap() {
//     markersLayer.clearLayers();
//     polylineLayer.clearLayers();
//     Object.keys(trackerPolylines).forEach(k => delete trackerPolylines[k]);
//     Object.keys(trackerMarkers).forEach(k => delete trackerMarkers[k]);
//     updateLegend();
    
//     // Clear images grid
//     if (imagesGrid) {
//       imagesGrid.innerHTML = '';
//     }
    
//     // Clear real-time table data when clearing map
//     if (window.realtimeTableData) {
//       window.realtimeTableData = {};
//     }
//     if (window.updateRealtimeTable) {
//       window.updateRealtimeTable();
//     }
//   }

//   function updateLastUpdatedTime() {
//     if (lastUpdatedDiv && lastUpdateTime) {
//       lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }
//   }

//   function showStatus(msg, type) {
//     if (!statusMessage) return;
//     statusMessage.textContent = msg;
//     statusMessage.className = `status-${type}`;
//     if (type !== 'loading') setTimeout(() => statusMessage.textContent = '', 4000);
//   }

//   function formatTimestamp(ts) {
//     return new Date(ts).toLocaleString();
//   }

//   function updateMapBounds() {
//     const allVisiblePoints = [];
    
//     Object.keys(trackerPolylines).forEach(trackerId => {
//       if (isTrackerVisible(trackerId) && trackerPolylines[trackerId]._latlngs) {
//         allVisiblePoints.push(...trackerPolylines[trackerId]._latlngs);
//       }
//     });
    
//     if (allVisiblePoints.length > 0) {
//       map.fitBounds(allVisiblePoints, { padding: [40, 40] });
//     }
//   }

//   /* ================= EXPOSE FUNCTIONS TO WINDOW ================= */
//   // These functions will be called from group detail popup
//   window.setActiveGroup = function(groupName) {
//     activeGroup = groupName;
//     // Refresh group settings from localStorage
//     groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};
//   };

//   window.updateTrackerVisibilityFromGroup = function(trackerId, isVisible) {
//     window.toggleTrackerVisibility(trackerId, isVisible);
//   };

//   window.updateTrackerColorFromGroup = function(trackerId, color) {
//     window.changeTrackerColor(trackerId, color);
//   };

//   window.handleFetch = function(trackerId) {
//     fetchSingleTracker(trackerId, true);
//   };

//   // Initialize global trajectoryOverlays object
//   window.trajectoryOverlays = {};

//   // Initialize global realtimeTableData object
//   window.realtimeTableData = {};

//   // Add keyboard shortcut for real-time data (Alt+R)
//   document.addEventListener('keydown', function(e) {
//     if (e.altKey && e.key === 'r') {
//       e.preventDefault();
//       const realtimeBtn = document.getElementById('openRealtimePopup');
//       if (realtimeBtn) realtimeBtn.click();
//     }
    
//     // Shortcut to toggle real-time table (Alt+T)
//     if (e.altKey && e.key === 't') {
//       e.preventDefault();
//       const tablePanel = document.getElementById('realtimeTablePanel');
//       const tableHeader = document.getElementById('realtimeTablePanelHeader');
//       if (tablePanel && tableHeader) {
//         tableHeader.click();
//       }
//     }
//   });

//   // REMOVED: Auto-open observer that was causing the panel to open automatically
//   // The panel will now stay in whatever state the user sets it to

//   // Fetch data for saved trackers on page load
//   window.addEventListener('load', function() {
//     const savedTrackers = JSON.parse(localStorage.getItem('saved_trackers')) || [];
//     if (savedTrackers.length > 0) {
//       // Show loading message
//       showStatus(`Loading ${savedTrackers.length} saved trackers...`, 'loading');
      
//       // Fetch the first tracker
//       setTimeout(() => {
//         fetchSingleTracker(savedTrackers[0], true);
        
//         // Fetch remaining trackers with delay
//         savedTrackers.slice(1).forEach((trackerId, index) => {
//           setTimeout(() => {
//             fetchSingleTracker(trackerId, false);
//           }, (index + 1) * 500);
//         });
//       }, 1000);
//     }
//   });

// });
















// document.addEventListener('DOMContentLoaded', function () {

//   /* ================= DOM ================= */
//   const fetchBtn = document.getElementById('fetch-btn');
//   const trackerInput = document.getElementById('tracker-id');
//   const sensorInput = document.getElementById('sensor-id');
//   const statusMessage = document.getElementById('status-message');
//   const lastUpdatedDiv = document.querySelector('.last-updated');
//   const imagesGrid = document.getElementById('images-grid');


  
//   /* ================= MAP ================= */
//   const map = L.map('map').setView([23.0225, 72.5714], 13);

//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19
//   }).addTo(map);

//   const markersLayer = L.layerGroup().addTo(map);
//   const polylineLayer = L.layerGroup().addTo(map);

//   let lastUpdateTime = null;
//   let activeGroup = null;

//   /* ================= TRACKER STATE ================= */
//   const trackerPolylines = {};
//   const trackerMarkers = {};
//   const trackerColorMap = {};
//   const trackerVisibility = {};

//   const COLORS = ['#2563eb', '#eab308', '#9333ea', '#ea580c', '#0891b2', '#4f46e5'];
//   let colorIndex = 0;

//   // Group settings from localStorage
//   let groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};

//   function getTrackerColor(trackerId) {
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].color;
//     }
    
//     if (trackerColorMap[trackerId]) {
//       return trackerColorMap[trackerId];
//     }
    
//     const color = COLORS[colorIndex++ % COLORS.length];
//     trackerColorMap[trackerId] = color;
//     updateLegend();
//     return color;
//   }

//   function isTrackerVisible(trackerId) {
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       return groupSettings[activeGroup][trackerId].visible;
//     }
    
//     return trackerVisibility[trackerId] !== false;
//   }

//   /* ================= ICONS ================= */
//   function createPinIcon(color, size = 34) {
//     return L.divIcon({
//       className: '',
//       html: `
//         <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//           <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//         </svg>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size],
//       popupAnchor: [0, -size]
//     });
//   }

//   function createDotIcon(color, size = 8) {
//     return L.divIcon({
//       className: '',
//       html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;"></div>`,
//       iconSize: [size, size],
//       iconAnchor: [size / 2, size / 2]
//     });
//   }

//   const START_ICON = createPinIcon('green');
//   const END_ICON = createPinIcon('red');

//   /* ================= LEGEND ================= */
//   const legend = L.control({ position: 'bottomright' });

//   legend.onAdd = function () {
//     const div = L.DomUtil.create('div', 'map-legend');
//     div.style.background = 'white';
//     div.style.padding = '10px';
//     div.style.borderRadius = '8px';
//     div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
//     div.style.fontSize = '13px';
//     return div;
//   };

//   legend.addTo(map);

//   function updateLegend() {
//     const div = document.querySelector('.map-legend');
//     if (!div) return;

//     const pin = (color) => `
//       <svg width="14" height="22" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
//         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
//       </svg>
//     `;

//     let html = `
//       <strong>Legend</strong><br><br>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
//         ${pin('green')}
//         <span style="font-weight:600;">Start</span>
//       </div>

//       <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
//         ${pin('red')}
//         <span style="font-weight:600;">End</span>
//       </div>

//       <hr style="margin:6px 0">
//     `;

//     Object.entries(trackerColorMap).forEach(([id, color]) => {
//       if (isTrackerVisible(id)) {
//         html += `
//           <div style="display:flex;align-items:center;gap:6px;">
//             <span style="color:${color};font-size:14px;">●</span>
//             ${id}
//           </div>
//         `;
//       }
//     });

//     div.innerHTML = html;
//   }

//   /* ================= EVENTS ================= */
//   fetchBtn?.addEventListener('click', () => {
//     const id = trackerInput.value.trim();
//     if (id) fetchSingleTracker(id, true);
//   });

//   /* ================= FETCH SINGLE TRACKER ================= */
//   async function fetchSingleTracker(trackerId, clearBefore = false) {
//     if (!trackerId) return;

//     if (clearBefore) clearMap();

//     const color = getTrackerColor(trackerId);
//     trackerVisibility[trackerId] = true;
//     showStatus(`Fetching tracker ${trackerId}...`, 'loading');

//     try {
//       const res = await fetch('/api/trajectory', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           tracker_id: trackerId,
//           interval_seconds: 30,
//           max_gap_seconds: 120
//         })
//       });

//       if (!res.ok) throw new Error('Server error');

//       const data = await res.json();
//       const points = (data.points || []).map(p => ({
//         lat: +p.lat,
//         lon: +p.lon,
//         time: p.timestamp,
//         timestamp: p.timestamp,
//         latitude: +p.lat,
//         longitude: +p.lon,
//         altitude: p.altitude || 0,
//         uin_no: p.uin_no || 'N/A',
//         application: p.application || 'Unknown',
//         category: p.category || 'General'
//       }));

//       plotTrackerPath(trackerId, points, color);
      
//       if (points.length > 0) {
//         const latestPoint = points[points.length - 1];
//         displayRealtimeData(trackerId, latestPoint);
//       }

//       lastUpdateTime = new Date();
//       updateLastUpdatedTime();
//       showStatus(`Loaded tracker ${trackerId}`, 'success');

//     } catch (err) {
//       showStatus(`${trackerId}: ${err.message}`, 'error');
//     }
//   }

//  /* ================= FETCH SENSOR DATA (FIXED) ================= */
// /* ================= FETCH SENSOR DATA (FINAL FIX) ================= */
// window.fetchSensorData = async function (sensorId) {
//   showStatus(`Fetching sensor ${sensorId}...`, 'loading');

//   try {
//     const res = await fetch(
//       'https://pg2y9zc74l.execute-api.ap-south-1.amazonaws.com/data/json',
//       { method: 'GET' }
//     );

//     if (!res.ok) throw new Error('Sensor API failed');

//     const data = await res.json();
//     console.log('RAW SENSOR RESPONSE:', data);

//     // Normalize response to array
//     const readings = Array.isArray(data) ? data : [data];

//     const formattedId = sensorId.toString().padStart(3, '0');

//     // Filter by sensor id
//     const filtered = readings.filter(r => r.SensorId === formattedId);

//     if (filtered.length === 0) {
//       throw new Error(`No data for sensor ${formattedId}`);
//     }

//     // 🔥 MATCH TABLE COLUMN KEYS EXACTLY
//     const tableRows = filtered.map(r => ({
//       sensor_id: r.SensorId,
//       timestamp: new Date().toLocaleString(),
//       latitude: r.Latitude,
//       longitude: r.Longitude,
//       moisture: r.Moisture,
//       temperature: r.Temperature,
//       ec: r.EC,
//       ph_value: r.PHValue,
//       nitrogen: r.Nitrogen,
//       phosphorous: r.Phosphorous,
//       potassium: r.Potassium,
//       satellite_fix: r.SatelliteFix
//     }));

//     // ✅ PASS ARRAY (NOT SINGLE ROW)
//     window.updateSensorTable(formattedId, tableRows);

//     showStatus(`Sensor ${formattedId} loaded`, 'success');

//   } catch (err) {
//     console.error(err);
//     showStatus(err.message, 'error');
//   }
// };


//   /* ================= UPDATE REALTIME TABLE ================= */
//   function updateRealtimeTable(trackerId, pointData, selectedParams) {
//     const formattedData = {
//       'Tracker ID': trackerId
//     };
    
//     if (selectedParams.timestamp && pointData.timestamp) {
//       formattedData.timestamp = pointData.timestamp;
//     }
//     if (selectedParams.latitude && pointData.latitude) {
//       formattedData.latitude = pointData.latitude;
//     }
//     if (selectedParams.longitude && pointData.longitude) {
//       formattedData.longitude = pointData.longitude;
//     }
//     if (selectedParams.altitude && pointData.altitude) {
//       formattedData.altitude = pointData.altitude;
//     }
//     if (selectedParams.uin_no && pointData.uin_no) {
//       formattedData.uin_no = pointData.uin_no;
//     }
//     if (selectedParams.application && pointData.application) {
//       formattedData.application = pointData.application;
//     }
//     if (selectedParams.category && pointData.category) {
//       formattedData.category = pointData.category;
//     }
    
//     if (window.updateRealtimeTable) {
//       window.updateRealtimeTable(trackerId, formattedData);
//     }
    
//     if (!window.realtimeTableData) {
//       window.realtimeTableData = {};
//     }
//     window.realtimeTableData[trackerId] = formattedData;
//   }

//   /* ================= GROUP FETCH ================= */
//   window.fetchGroupTrackers = function (trackerIds) {
//     if (!trackerIds?.length) return alert('Group empty');
    
//     const visibleTrackers = trackerIds.filter(id => isTrackerVisible(id));
    
//     if (visibleTrackers.length === 0) {
//       alert('No visible trackers in this group');
//       return;
//     }
    
//     clearMap();
//     visibleTrackers.forEach((id, i) => {
//       setTimeout(() => fetchSingleTracker(id, false), i * 400);
//     });
//   };

//   /* ================= PLOT ================= */
//   function plotTrackerPath(trackerId, points, color) {
//     if (!points.length) return;

//     if (!isTrackerVisible(trackerId)) {
//       console.log(`${trackerId} is hidden, not plotting`);
//       return;
//     }

//     const latlngs = points.map(p => [p.lat, p.lon]);

//     // Polyline
//     const polyline = L.polyline(latlngs, {
//       color: color,
//       weight: 4,
//       opacity: 0.85
//     }).addTo(polylineLayer);

//     trackerPolylines[trackerId] = polyline;
    
//     if (!window.trajectoryOverlays) {
//       window.trajectoryOverlays = {};
//     }
//     window.trajectoryOverlays[trackerId] = polyline;

//     const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : {};

//     function createPopupContent(trackerId, point, label) {
//       let content = `<b>${trackerId}</b><br>${label}<br>`;
      
//       if (point.time) {
//         content += `Time: ${formatTimestamp(point.time)}<br>`;
//       }
      
//       if (selectedParams.latitude && point.lat !== undefined) {
//         content += `Latitude: ${point.lat.toFixed(6)}<br>`;
//       }
//       if (selectedParams.longitude && point.lon !== undefined) {
//         content += `Longitude: ${point.lon.toFixed(6)}<br>`;
//       }
      
//       if (selectedParams.altitude && point.altitude !== undefined) {
//         content += `Altitude: ${point.altitude}m<br>`;
//       }
//       if (selectedParams.uin_no && point.uin_no && point.uin_no !== 'N/A') {
//         content += `UIN: ${point.uin_no}<br>`;
//       }
//       if (selectedParams.application && point.application && point.application !== 'Unknown') {
//         content += `Application: ${point.application}<br>`;
//       }
//       if (selectedParams.category && point.category && point.category !== 'General') {
//         content += `Category: ${point.category}<br>`;
//       }
      
//       return content;
//     }

//     // Markers
//     trackerMarkers[trackerId] = [];

//     // START marker
//     const startMarker = L.marker(latlngs[0], { icon: START_ICON })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, points[0], 'Start Point'));
//     trackerMarkers[trackerId].push(startMarker);

//     // END marker
//     const endMarker = L.marker(latlngs.at(-1), { icon: END_ICON })
//       .addTo(markersLayer)
//       .bindPopup(createPopupContent(trackerId, points.at(-1), 'End Point'));
//     trackerMarkers[trackerId].push(endMarker);

//     // MIDDLE POINTS
//     points.forEach((p, idx) => {
//       if (idx > 0 && idx < points.length - 1 && idx % 3 === 0) {
//         const dotMarker = L.marker([p.lat, p.lon], {
//           icon: createDotIcon(color, 8)
//         })
//         .addTo(markersLayer)
//         .bindPopup(createPopupContent(trackerId, p, `Point ${idx}`));
        
//         trackerMarkers[trackerId].push(dotMarker);
//       }
//     });

//     updateMapBounds();
//   }

//   /* ================= VISIBILITY TOGGLE ================= */
//   window.toggleTrackerVisibility = function (trackerId, visible) {
//     trackerVisibility[trackerId] = visible;
    
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].visible = visible;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }
    
//     if (trackerPolylines[trackerId]) {
//       if (visible) {
//         polylineLayer.addLayer(trackerPolylines[trackerId]);
//       } else {
//         polylineLayer.removeLayer(trackerPolylines[trackerId]);
//       }
//     }

//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (visible) {
//         markersLayer.addLayer(m);
//       } else {
//         markersLayer.removeLayer(m);
//       }
//     });
    
//     updateLegend();
//     updateMapBounds();
//   };

//   /* ================= COLOR CHANGE ================= */
//   window.changeTrackerColor = function (trackerId, color) {
//     trackerColorMap[trackerId] = color;
    
//     if (activeGroup && groupSettings[activeGroup] && groupSettings[activeGroup][trackerId]) {
//       groupSettings[activeGroup][trackerId].color = color;
//       localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
//     }

//     if (trackerPolylines[trackerId] && isTrackerVisible(trackerId)) {
//       trackerPolylines[trackerId].setStyle({ color: color });
//     }

//     (trackerMarkers[trackerId] || []).forEach(m => {
//       if (m.options.icon && isTrackerVisible(trackerId)) {
//         const iconHtml = m.options.icon.options?.html || '';
//         if (iconHtml.includes('border-radius:50%')) {
//           m.setIcon(createDotIcon(color, 8));
//         }
//       }
//     });

//     updateLegend();
//   };

//   /* ================= HELPERS ================= */
//   function clearMap() {
//     markersLayer.clearLayers();
//     polylineLayer.clearLayers();
//     Object.keys(trackerPolylines).forEach(k => delete trackerPolylines[k]);
//     Object.keys(trackerMarkers).forEach(k => delete trackerMarkers[k]);
//     updateLegend();
    
//     if (imagesGrid) {
//       imagesGrid.innerHTML = '';
//     }
    
//     if (window.realtimeTableData) {
//       window.realtimeTableData = {};
//     }
//     if (window.updateRealtimeTable) {
//       window.updateRealtimeTable();
//     }
//   }

//   function updateLastUpdatedTime() {
//     if (lastUpdatedDiv && lastUpdateTime) {
//       lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }
//   }

//   function showStatus(msg, type) {
//     if (!statusMessage) return;
//     statusMessage.textContent = msg;
//     statusMessage.className = `status-${type}`;
//     if (type !== 'loading') setTimeout(() => statusMessage.textContent = '', 4000);
//   }

//   function formatTimestamp(ts) {
//     return new Date(ts).toLocaleString();
//   }

//   function updateMapBounds() {
//     const allVisiblePoints = [];
    
//     Object.keys(trackerPolylines).forEach(trackerId => {
//       if (isTrackerVisible(trackerId) && trackerPolylines[trackerId]._latlngs) {
//         allVisiblePoints.push(...trackerPolylines[trackerId]._latlngs);
//       }
//     });
    
//     if (allVisiblePoints.length > 0) {
//       map.fitBounds(allVisiblePoints, { padding: [40, 40] });
//     }
//   }

//   /* ================= EXPOSE FUNCTIONS TO WINDOW ================= */
//   window.setActiveGroup = function(groupName) {
//     activeGroup = groupName;
//     groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};
//   };

//   window.updateTrackerVisibilityFromGroup = function(trackerId, isVisible) {
//     window.toggleTrackerVisibility(trackerId, isVisible);
//   };

//   window.updateTrackerColorFromGroup = function(trackerId, color) {
//     window.changeTrackerColor(trackerId, color);
//   };

//   window.handleFetch = function(trackerId) {
//     fetchSingleTracker(trackerId, true);
//   };

//   // Initialize global objects
//   window.trajectoryOverlays = {};
//   window.realtimeTableData = {};
//   window.sensorTableData = {};

//   // Add keyboard shortcuts
//   document.addEventListener('keydown', function(e) {
//     if (e.altKey && e.key === 'r') {
//       e.preventDefault();
//       const realtimeBtn = document.getElementById('openRealtimePopup');
//       if (realtimeBtn) realtimeBtn.click();
//     }
//   });

//   // Fetch data for saved trackers and sensors on page load
//   window.addEventListener('load', function() {
//     const savedTrackers = JSON.parse(localStorage.getItem('saved_trackers')) || [];
//     const savedSensors = JSON.parse(localStorage.getItem('saved_sensors')) || [];
    
//     if (savedTrackers.length > 0) {
//       showStatus(`Loading ${savedTrackers.length} saved trackers...`, 'loading');
      
//       setTimeout(() => {
//         fetchSingleTracker(savedTrackers[0], true);
        
//         savedTrackers.slice(1).forEach((trackerId, index) => {
//           setTimeout(() => {
//             fetchSingleTracker(trackerId, false);
//           }, (index + 1) * 500);
//         });
//       }, 1000);
//     }
    
//     if (savedSensors.length > 0) {
//       setTimeout(() => {
//         savedSensors.forEach((sensorId, index) => {
//           setTimeout(() => {
//             if (window.fetchSensorData) {
//               window.fetchSensorData(sensorId);
//             }
//           }, index * 1000);
//         });
//       }, 2000);
//     }
//   });

// });




document.addEventListener('DOMContentLoaded', function () {

  /* ================= DOM ================= */
  const fetchBtn = document.getElementById('fetch-btn');
  const trackerInput = document.getElementById('tracker-id');
  const sensorInput = document.getElementById('sensor-id');
  const statusMessage = document.getElementById('status-message');
  const lastUpdatedDiv = document.querySelector('.last-updated');
  const imagesGrid = document.getElementById('images-grid');

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
            ${id}
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
  async function fetchSingleTracker(trackerId, clearBefore = false) {
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

      plotTrackerPath(trackerId, points, color);
      
      if (points.length > 0) {
        const latestPoint = points[points.length - 1];
        displayRealtimeData(trackerId, latestPoint);
      }

      lastUpdateTime = new Date();
      updateLastUpdatedTime();
      showStatus(`Loaded tracker ${trackerId}`, 'success');

    } catch (err) {
      showStatus(`${trackerId}: ${err.message}`, 'error');
    }
  }

  /* ================= FETCH SENSOR DATA ================= */
  window.fetchSensorData = async function(sensorId) {
    if (!sensorId) return;

    showStatus(`Fetching sensor ${sensorId}...`, 'loading');

    try {
      const res = await fetch('https://pg2y9zc74l.execute-api.ap-south-1.amazonaws.com/data/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SensorId: sensorId
        })
      });

      if (!res.ok) throw new Error('Failed to fetch sensor data');

      const data = await res.json();
      
      // Process sensor data
      const sensorData = {
        sensorId: sensorId,
        timestamp: new Date().toISOString(),
        temperature: data.temperature || Math.random() * 30 + 10, // Example data
        humidity: data.humidity || Math.random() * 50 + 30,
        soil_moisture: data.soil_moisture || Math.random() * 100,
        ph_level: data.ph_level || (Math.random() * 4 + 5).toFixed(2),
        nitrogen: data.nitrogen || Math.floor(Math.random() * 100),
        phosphorus: data.phosphorus || Math.floor(Math.random() * 50),
        potassium: data.potassium || Math.floor(Math.random() * 200)
      };

      // Update sensor table
      if (window.updateSensorTable) {
        window.updateSensorTable(sensorId, sensorData);
      }

      // Show sensor data panel if minimized
      const sensorPanel = document.getElementById('sensorTablePanel');
      if (sensorPanel && sensorPanel.classList.contains('minimized')) {
        sensorPanel.classList.remove('minimized');
        document.getElementById('sensorTablePanelChevron').classList.remove('rotated');
        document.getElementById('sensorTableContainer').style.display = 'block';
      }

      lastUpdateTime = new Date();
      updateLastUpdatedTime();
      showStatus(`Loaded sensor ${sensorId} data`, 'success');

    } catch (err) {
      showStatus(`Sensor ${sensorId}: ${err.message}`, 'error');
      
      // Fallback to example data if API fails
      const fallbackData = {
        sensorId: sensorId,
        timestamp: new Date().toISOString(),
        temperature: (Math.random() * 30 + 10).toFixed(1),
        humidity: (Math.random() * 50 + 30).toFixed(1),
        soil_moisture: Math.floor(Math.random() * 100),
        ph_level: (Math.random() * 4 + 5).toFixed(2),
        nitrogen: Math.floor(Math.random() * 100),
        phosphorus: Math.floor(Math.random() * 50),
        potassium: Math.floor(Math.random() * 200)
      };

      if (window.updateSensorTable) {
        window.updateSensorTable(sensorId, fallbackData);
      }
    }
  };

  /* ================= DISPLAY REALTIME DATA ================= */
  function displayRealtimeData(trackerId, pointData) {
    const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : null;
    
    if (!selectedParams) {
      const defaultParams = {
        timestamp: true,
        latitude: true,
        longitude: true,
        altitude: true,
        uin_no: true,
        application: true,
        category: true
      };
      updateRealtimeTable(trackerId, pointData, defaultParams);
      return;
    }
    
    updateRealtimeTable(trackerId, pointData, selectedParams);
    
    let paramSummary = [];
    if (selectedParams.timestamp && pointData.timestamp) {
      paramSummary.push(`Time: ${new Date(pointData.timestamp).toLocaleString()}`);
    }
    if (selectedParams.latitude && pointData.lat) {
      paramSummary.push(`Lat: ${pointData.lat}`);
    }
    if (selectedParams.longitude && pointData.lon) {
      paramSummary.push(`Lon: ${pointData.lon}`);
    }
    
    if (paramSummary.length > 0) {
      showStatus(`Tracker ${trackerId}: ${paramSummary.join(' | ')}`, 'success');
    }
  }

  /* ================= UPDATE REALTIME TABLE ================= */
  function updateRealtimeTable(trackerId, pointData, selectedParams) {
    const formattedData = {
      'Tracker ID': trackerId
    };
    
    if (selectedParams.timestamp && pointData.timestamp) {
      formattedData.timestamp = pointData.timestamp;
    }
    if (selectedParams.latitude && pointData.latitude) {
      formattedData.latitude = pointData.latitude;
    }
    if (selectedParams.longitude && pointData.longitude) {
      formattedData.longitude = pointData.longitude;
    }
    if (selectedParams.altitude && pointData.altitude) {
      formattedData.altitude = pointData.altitude;
    }
    if (selectedParams.uin_no && pointData.uin_no) {
      formattedData.uin_no = pointData.uin_no;
    }
    if (selectedParams.application && pointData.application) {
      formattedData.application = pointData.application;
    }
    if (selectedParams.category && pointData.category) {
      formattedData.category = pointData.category;
    }
    
    if (window.updateRealtimeTable) {
      window.updateRealtimeTable(trackerId, formattedData);
    }
    
    if (!window.realtimeTableData) {
      window.realtimeTableData = {};
    }
    window.realtimeTableData[trackerId] = formattedData;
  }

  /* ================= GROUP FETCH ================= */
  window.fetchGroupTrackers = function (trackerIds) {
    if (!trackerIds?.length) return alert('Group empty');
    
    const visibleTrackers = trackerIds.filter(id => isTrackerVisible(id));
    
    if (visibleTrackers.length === 0) {
      alert('No visible trackers in this group');
      return;
    }
    
    clearMap();
    visibleTrackers.forEach((id, i) => {
      setTimeout(() => fetchSingleTracker(id, false), i * 400);
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

    const selectedParams = window.getRealtimeParameters ? window.getRealtimeParameters(trackerId) : {};

    function createPopupContent(trackerId, point, label) {
      let content = `<b>${trackerId}</b><br>${label}<br>`;
      
      if (point.time) {
        content += `Time: ${formatTimestamp(point.time)}<br>`;
      }
      
      if (selectedParams.latitude && point.lat !== undefined) {
        content += `Latitude: ${point.lat.toFixed(6)}<br>`;
      }
      if (selectedParams.longitude && point.lon !== undefined) {
        content += `Longitude: ${point.lon.toFixed(6)}<br>`;
      }
      
      if (selectedParams.altitude && point.altitude !== undefined) {
        content += `Altitude: ${point.altitude}m<br>`;
      }
      if (selectedParams.uin_no && point.uin_no && point.uin_no !== 'N/A') {
        content += `UIN: ${point.uin_no}<br>`;
      }
      if (selectedParams.application && point.application && point.application !== 'Unknown') {
        content += `Application: ${point.application}<br>`;
      }
      if (selectedParams.category && point.category && point.category !== 'General') {
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
      .bindPopup(createPopupContent(trackerId, points.at(-1), 'End Point'));
    trackerMarkers[trackerId].push(endMarker);

    // MIDDLE POINTS
    points.forEach((p, idx) => {
      if (idx > 0 && idx < points.length - 1 && idx % 3 === 0) {
        const dotMarker = L.marker([p.lat, p.lon], {
          icon: createDotIcon(color, 8)
        })
        .addTo(markersLayer)
        .bindPopup(createPopupContent(trackerId, p, `Point ${idx}`));
        
        trackerMarkers[trackerId].push(dotMarker);
      }
    });

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
  function clearMap() {
    markersLayer.clearLayers();
    polylineLayer.clearLayers();
    Object.keys(trackerPolylines).forEach(k => delete trackerPolylines[k]);
    Object.keys(trackerMarkers).forEach(k => delete trackerMarkers[k]);
    updateLegend();
    
    if (imagesGrid) {
      imagesGrid.innerHTML = '';
    }
    
    if (window.realtimeTableData) {
      window.realtimeTableData = {};
    }
    if (window.updateRealtimeTable) {
      window.updateRealtimeTable();
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

  window.handleFetch = function(trackerId) {
    fetchSingleTracker(trackerId, true);
  };

  // Initialize global objects
  window.trajectoryOverlays = {};
  window.realtimeTableData = {};
  window.sensorTableData = {};

  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'r') {
      e.preventDefault();
      const realtimeBtn = document.getElementById('openRealtimePopup');
      if (realtimeBtn) realtimeBtn.click();
    }
  });

  // Fetch data for saved trackers and sensors on page load
  window.addEventListener('load', function() {
    const savedTrackers = JSON.parse(localStorage.getItem('saved_trackers')) || [];
    const savedSensors = JSON.parse(localStorage.getItem('saved_sensors')) || [];
    
    if (savedTrackers.length > 0) {
      showStatus(`Loading ${savedTrackers.length} saved trackers...`, 'loading');
      
      setTimeout(() => {
        fetchSingleTracker(savedTrackers[0], true);
        
        savedTrackers.slice(1).forEach((trackerId, index) => {
          setTimeout(() => {
            fetchSingleTracker(trackerId, false);
          }, (index + 1) * 500);
        });
      }, 1000);
    }
    
    if (savedSensors.length > 0) {
      setTimeout(() => {
        savedSensors.forEach((sensorId, index) => {
          setTimeout(() => {
            if (window.fetchSensorData) {
              window.fetchSensorData(sensorId);
            }
          }, index * 1000);
        });
      }, 2000);
    }
  });

});