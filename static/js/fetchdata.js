

// document.addEventListener('DOMContentLoaded', function() {
//     // DOM Elements
//     const fetchBtn = document.getElementById('fetch-btn');
//     const exportBtn = document.getElementById('export-btn');
//     const trackerInput = document.getElementById('tracker-id');
//     const droneInfoBody = document.getElementById('drone-info-body');
//     const imagesGrid = document.getElementById('images-grid');
//     const statusMessage = document.getElementById('status-message');
//     const lastUpdatedDiv = document.querySelector('.last-updated');



    
//     // Map Setup with better default view
//     const map = L.map('map').setView([23.0225, 72.5714], 13);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         maxZoom: 19,
//         attribution: '&copy; OpenStreetMap contributors'
//     }).addTo(map);
    
//     const markersLayer = L.layerGroup().addTo(map);
//     const polylineLayer = L.layerGroup().addTo(map);
    
//     let fetchedData = [];
//     let lastUpdateTime = null;

//     // Custom Icon Creation
//     function createCustomIcon(color, pulse = false) {
//         const iconClass = pulse ? 'pulse-icon' : 'static-icon';
//         return L.divIcon({
//             className: `custom-icon ${iconClass} ${color}-icon`,
//             html: '<div></div>',
//             iconSize: [24, 24],
//             iconAnchor: [12, 12]
//         });
//     }

//     // Event Listeners
//     fetchBtn.addEventListener('click', fetchDroneData);
//     exportBtn.addEventListener('click', exportToCSV);

//     // Main Data Fetch Function
//     async function fetchDroneData() {
//         const trackerId = trackerInput.value.trim();
//         if (!trackerId) {
//             showStatus('Please enter a Tracker ID', 'error');
//             return;
//         }
        
//         clearData();
//         showStatus('Fetching latest data...', 'loading');
        
//         try {
//             const response = await fetch('/api/data', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ tracker_id: trackerId })
//             });
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.error || 'Server error occurred');
//             }
            
//             const data = await response.json();
//             console.log('API Response:', data);
//             lastUpdateTime = new Date();
            
//             updateLastUpdatedTime();
            
//             let telemetry = data.Telemetry || [];
//             let images = data.Images || [];
            
//             if (telemetry.length === 0 && images.length === 0) {
//                 handleEmptyDataResponse(data.TrackerId || trackerId);
//                 return;
//             }
            
//             // Sort by timestamp if needed
//             telemetry = telemetry.sort((a, b) => 
//                 new Date(a.Timestamp) - new Date(b.Timestamp)
//             );
            
//             fetchedData = telemetry;
//             displayDroneInfo(data.TrackerId || trackerId, telemetry[0]);
//             MapData(telemetry);
//             displayImages(images);
            
//             showStatus(`Loaded ${telemetry.length} telemetry points and ${images.length} images`, 'success');
//         } catch (error) {
//             console.error('Error:', error);
//             showStatus(error.message, 'error');
//             showErrorOnMap(error.message);
//         }
//     }

//     // Display Drone Information
//     function displayDroneInfo(trackerId, firstRecord = {}) {
//         droneInfoBody.innerHTML = '';
        
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td>${trackerId}</td>
//             <td>${firstRecord.DroneUINNumber || 'UA0'}</td>
//             <td>${firstRecord.DroneCategory || 'Small'}</td>
//             <td>${firstRecord.DroneApplication || 'Surveillance'}</td>
//         `;
//         droneInfoBody.appendChild(row);
//     }

//     // Plot Data on Map with Enhanced Visualization
//     function plotMapData(telemetry) {
//     markersLayer.clearLayers();
//     polylineLayer.clearLayers();

//     if (telemetry.length === 0) return;

//     const pathCoords = [];

//     telemetry.forEach(entry => {
//         const lat = parseFloat(entry.Latitude);
//         const lng = parseFloat(entry.Longitude);

//         if (!isNaN(lat) && !isNaN(lng)) {
//             pathCoords.push([lat, lng]);
//         }
//     });

//     // Draw a single blue polyline
//     if (pathCoords.length > 1) {
//         const polyline = L.polyline(pathCoords, {
//             color: 'blue',
//             weight: 5,
//             opacity: 0.8
//         }).addTo(polylineLayer);

//         map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
//     }

//     // Add start, end, and intermediate markers
//     telemetry.forEach((entry, index) => {
//         const lat = parseFloat(entry.Latitude);
//         const lng = parseFloat(entry.Longitude);
//         const alt = parseFloat(entry.Altitude) || 0;

//         if (isNaN(lat) || isNaN(lng)) return;

//         let color = 'blue';
//         let pulse = false;

//         if (index === 0) {
//             color = 'green';
//             pulse = true;
//         } else if (index === telemetry.length - 1) {
//             color = 'red';
//         }

//         const marker = L.marker([lat, lng], {
//             icon: createCustomIcon(color, pulse)
//         }).addTo(markersLayer).bindPopup(`
//             <div class="map-popup">
//                 <h4>${entry.TrackerId || trackerInput.value}</h4>
//                 <p><strong>Time:</strong> ${formatTimestamp(entry.Timestamp)}</p>
//                 <p><strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
//                 <p><strong>Altitude:</strong> ${alt} m</p>
//             </div>
//         `);
//     });
// }


//     // Display Images with Lazy Loading
//     function displayImages(images) {
//         imagesGrid.innerHTML = '';
        
//         if (!Array.isArray(images) || images.length === 0) {
//             imagesGrid.innerHTML = `
//                 <div class="no-data-message">
//                     <p>No images available for this drone</p>
//                 </div>
//             `;
//             return;
//         }
        
//         images.forEach((imgUrl) => {
//             if (typeof imgUrl !== 'string' || !imgUrl.startsWith('http')) return;
            
//             const imgContainer = document.createElement('div');
//             imgContainer.className = 'image-container';
            
//             const imgLink = document.createElement('a');
//             imgLink.href = imgUrl;
//             imgLink.target = '_blank';
            
//             const img = document.createElement('img');
//             img.src = imgUrl;
//             img.alt = 'Drone image';
//             img.loading = 'lazy';
            
//             const imgInfo = document.createElement('div');
//             imgInfo.className = 'image-info';
            
//             const timestamp = extractTimestampFromUrl(imgUrl);
//             if (timestamp) {
//                 imgInfo.textContent = timestamp;
//             }
            
//             imgLink.appendChild(img);
//             imgContainer.appendChild(imgLink);
//             imgContainer.appendChild(imgInfo);
//             imagesGrid.appendChild(imgContainer);
//         });
//     }

//     // Handle Empty Data Response
//     function handleEmptyDataResponse(trackerId) {
//         showStatus(`No data found for tracker ID: ${trackerId}`, 'warning');
//         displayDroneInfo(trackerId);
//         showMessageOnMap(`No data available for ${trackerId}`, 'info');
//     }

//     // Utility Functions
//     function formatTimestamp(timestamp) {
//         if (!timestamp) return 'Unknown';
//         try {
//             // Handle "dd-mm-yyyy HH:MM:SS" format
//             if (timestamp.match(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/)) {
//                 const [datePart, timePart] = timestamp.split(' ');
//                 const [day, month, year] = datePart.split('-');
//                 return new Date(`${year}-${month}-${day}T${timePart}`).toLocaleString();
//             }
//             return new Date(timestamp).toLocaleString();
//         } catch {
//             return timestamp;
//         }
//     }

//     function extractTimestampFromUrl(url) {
//         try {
//             const match = url.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
//             if (match) {
//                 const [_, year, month, day, hour, minute, second] = match;
//                 return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString();
//             }
//             return null;
//         } catch {
//             return null;
//         }
//     }

//     function updateLastUpdatedTime() {
//         if (!lastUpdateTime) return;
//         lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }

//     function showMessageOnMap(message, type) {
//         const center = map.getCenter();
//         markersLayer.clearLayers();
        
//         const icon = L.divIcon({
//             className: `map-message map-message-${type}`,
//             html: `<div>${message}</div>`,
//             iconSize: [200, 40]
//         });
        
//         L.marker(center, {
//             icon: icon,
//             zIndexOffset: 1000
//         }).addTo(markersLayer);
        
//         map.setView(center, 12);
//     }

//     function showErrorOnMap(error) {
//         showMessageOnMap(`Error: ${error}`, 'error');
//     }

//     function clearData() {
//         droneInfoBody.innerHTML = '';
//         imagesGrid.innerHTML = '';
//         markersLayer.clearLayers();
//         polylineLayer.clearLayers();
//         fetchedData = [];
//     }

//     function showStatus(message, type) {
//         if (!statusMessage) return;
//         statusMessage.textContent = message;
//         statusMessage.className = `status-${type}`;
        
//         if (type !== 'loading') {
//             setTimeout(() => {
//                 statusMessage.textContent = '';
//                 statusMessage.className = '';
//             }, 5000);
//         }
//     }

//     function exportToCSV() {
//         if (fetchedData.length === 0) {
//             showStatus('No data available to export', 'warning');
//             return;
//         }
        
//         try {
//             const headers = Object.keys(fetchedData[0]);
//             const csvContent = [
//                 headers.join(','),
//                 ...fetchedData.map(row => 
//                     headers.map(field => 
//                         `"${String(row[field] || '').replace(/"/g, '""')}"`
//                     ).join(',')
//                 )
//             ].join('\n');
            
//             const blob = new Blob([csvContent], { type: 'text/csv' });
//             const url = URL.createObjectURL(blob);
            
//             const link = document.createElement('a');
//             link.href = url;
//             link.download = `drone_data_${trackerInput.value || 'export'}_${new Date().toISOString().slice(0,10)}.csv`;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
            
//             showStatus('Data exported successfully', 'success');
//         } catch (error) {
//             console.error('Export Error:', error);
//             showStatus('Export failed: ' + error.message, 'error');
//         }
//     }
// });



             //working code for date and time filter but filter is not implemented in backend
// document.addEventListener('DOMContentLoaded', function () {
//     // DOM Elements
//     const fetchBtn = document.getElementById('fetch-btn');
//     const exportBtn = document.getElementById('export-btn');
//     const trackerInput = document.getElementById('tracker-id');
//     const droneInfoBody = document.getElementById('drone-info-body');
//     const imagesGrid = document.getElementById('images-grid');
//     const statusMessage = document.getElementById('status-message');
//     const lastUpdatedDiv = document.querySelector('.last-updated');
//     const startDateInput = document.getElementById('start-date');
//     const endDateInput = document.getElementById('end-date');
    

//     // Map Setup
//     const map = L.map('map').setView([23.0225, 72.5714], 13);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         maxZoom: 19,
//         attribution: '&copy; OpenStreetMap contributors'
//     }).addTo(map);

//     const markersLayer = L.layerGroup().addTo(map);
//     const polylineLayer = L.layerGroup().addTo(map);

//     let fetchedData = [];
//     let lastUpdateTime = null;

//     function createCustomIcon(color, pulse = false) {
//         const iconClass = pulse ? 'pulse-icon' : 'static-icon';
//         return L.divIcon({
//             className: `custom-icon ${iconClass} ${color}-icon`,
//             html: '<div></div>',
//             iconSize: [24, 24],
//             iconAnchor: [12, 12]
//         });
//     }

//     fetchBtn.addEventListener('click', fetchDroneData);
//     exportBtn.addEventListener('click', exportToCSV);

//     async function fetchDroneData() {
//         const trackerId = trackerInput.value.trim();
//         const startDate = startDateInput.value;
//         const endDate = endDateInput.value;

//         if (!trackerId) {
//             showStatus('Please enter a Tracker ID', 'error');
//             return;
//         }

//         clearData();
//         showStatus('Fetching latest data...', 'loading');

//         try {
//             const isFilter = startDate && endDate;
//             const payload = {
//                 tracker_id: trackerId,
//                 ...(isFilter && {
//                     start_time: new Date(startDate).toISOString(),
//                     end_time: new Date(endDate).toISOString()
//                 })
//             };

//             const endpoint = isFilter ? '/api/data/filter' : '/api/data';

//             const response = await fetch(endpoint, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload)
//             });

//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.error || 'Server error occurred');
//             }

//             const data = await response.json();
//             console.log('API Response:', data);
//             lastUpdateTime = new Date();
//             updateLastUpdatedTime();

//             let telemetry = data.Telemetry || [];
//             let images = data.Images || [];

//             if (telemetry.length === 0 && images.length === 0) {
//                 handleEmptyDataResponse(data.TrackerId || trackerId);
//                 return;
//             }

//             telemetry = telemetry.sort((a, b) =>
//                 new Date(a.Timestamp) - new Date(b.Timestamp)
//             );

//             fetchedData = telemetry;
//             displayDroneInfo(data.TrackerId || trackerId, telemetry[0]);
//             plotMapData(telemetry);
//             displayImages(images);

//             showStatus(`Loaded ${telemetry.length} telemetry points and ${images.length} images`, 'success');
//         } catch (error) {
//             console.error('Error:', error);
//             showStatus(error.message, 'error');
//             showErrorOnMap(error.message);
//         }
//     }

//     function displayDroneInfo(trackerId, firstRecord = {}) {
//         droneInfoBody.innerHTML = '';
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td>${trackerId}</td>
//             <td>${firstRecord.DroneUINNumber || 'UA0'}</td>
//             <td>${firstRecord.DroneCategory || 'Small'}</td>
//             <td>${firstRecord.DroneApplication || 'Surveillance'}</td>
//         `;
//         droneInfoBody.appendChild(row);
//     }

//     function plotMapData(telemetry) {
//         markersLayer.clearLayers();
//         polylineLayer.clearLayers();

//         if (telemetry.length === 0) return;

//         const pathCoords = [];

//         telemetry.forEach(entry => {
//             const lat = parseFloat(entry.Latitude);
//             const lng = parseFloat(entry.Longitude);
//             if (!isNaN(lat) && !isNaN(lng)) pathCoords.push([lat, lng]);
//         });

//         if (pathCoords.length > 1) {
//             const polyline = L.polyline(pathCoords, {
//                 color: 'blue',
//                 weight: 5,
//                 opacity: 0.8
//             }).addTo(polylineLayer);
//             map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
//         }

//         telemetry.forEach((entry, index) => {
//             const lat = parseFloat(entry.Latitude);
//             const lng = parseFloat(entry.Longitude);
//             const alt = parseFloat(entry.Altitude) || 0;

//             if (isNaN(lat) || isNaN(lng)) return;

//             let color = 'blue';
//             let pulse = false;

//             if (index === 0) {
//                 color = 'green';
//                 pulse = true;
//             } else if (index === telemetry.length - 1) {
//                 color = 'red';
//             }

//             const marker = L.marker([lat, lng], {
//                 icon: createCustomIcon(color, pulse)
//             }).addTo(markersLayer).bindPopup(`
//                 <div class="map-popup">
//                     <h4>${entry.TrackerId || trackerInput.value}</h4>
//                     <p><strong>Time:</strong> ${formatTimestamp(entry.Timestamp)}</p>
//                     <p><strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
//                     <p><strong>Altitude:</strong> ${alt} m</p>
//                 </div>
//             `);
//         });
//     }

//     function displayImages(images) {
//         imagesGrid.innerHTML = '';
//         if (!Array.isArray(images) || images.length === 0) {
//             imagesGrid.innerHTML = `<div class="no-data-message"><p>No images available for this drone</p></div>`;
//             return;
//         }

//         images.forEach((imgUrl) => {
//             if (typeof imgUrl !== 'string' || !imgUrl.startsWith('http')) return;

//             const imgContainer = document.createElement('div');
//             imgContainer.className = 'image-container';

//             const imgLink = document.createElement('a');
//             imgLink.href = imgUrl;
//             imgLink.target = '_blank';

//             const img = document.createElement('img');
//             img.src = imgUrl;
//             img.alt = 'Drone image';
//             img.loading = 'lazy';

//             const imgInfo = document.createElement('div');
//             imgInfo.className = 'image-info';
//             const timestamp = extractTimestampFromUrl(imgUrl);
//             if (timestamp) imgInfo.textContent = timestamp;

//             imgLink.appendChild(img);
//             imgContainer.appendChild(imgLink);
//             imgContainer.appendChild(imgInfo);
//             imagesGrid.appendChild(imgContainer);
//         });
//     }

//     function handleEmptyDataResponse(trackerId) {
//         showStatus(`No data found for tracker ID: ${trackerId}`, 'warning');
//         displayDroneInfo(trackerId);
//         showMessageOnMap(`No data available for ${trackerId}`, 'info');
//     }

//     function extractTimestampFromUrl(url) {
//         try {
//             const match = url.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
//             if (match) {
//                 const [_, year, month, day, hour, minute, second] = match;
//                 return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString();
//             }
//             return null;
//         } catch {
//             return null;
//         }
//     }

//     function formatTimestamp(timestamp) {
//         if (!timestamp) return 'Unknown';
//         try {
//             if (timestamp.match(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/)) {
//                 const [datePart, timePart] = timestamp.split(' ');
//                 const [day, month, year] = datePart.split('-');
//                 return new Date(`${year}-${month}-${day}T${timePart}`).toLocaleString();
//             }
//             return new Date(timestamp).toLocaleString();
//         } catch {
//             return timestamp;
//         }
//     }

//     function updateLastUpdatedTime() {
//         if (!lastUpdateTime) return;
//         lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }

//     function showMessageOnMap(message, type) {
//         const center = map.getCenter();
//         markersLayer.clearLayers();

//         const icon = L.divIcon({
//             className: `map-message map-message-${type}`,
//             html: `<div>${message}</div>`,
//             iconSize: [200, 40]
//         });

//         L.marker(center, {
//             icon: icon,
//             zIndexOffset: 1000
//         }).addTo(markersLayer);
//         map.setView(center, 12);
//     }

//     function showErrorOnMap(error) {
//         showMessageOnMap(`Error: ${error}`, 'error');
//     }

//     function clearData() {
//         droneInfoBody.innerHTML = '';
//         imagesGrid.innerHTML = '';
//         markersLayer.clearLayers();
//         polylineLayer.clearLayers();
//         fetchedData = [];
//     }

//     function showStatus(message, type) {
//         if (!statusMessage) return;
//         statusMessage.textContent = message;
//         statusMessage.className = `status-${type}`;
//         if (type !== 'loading') {
//             setTimeout(() => {
//                 statusMessage.textContent = '';
//                 statusMessage.className = '';
//             }, 5000);
//         }
//     }

//     function exportToCSV() {
//         if (fetchedData.length === 0) {
//             showStatus('No data available to export', 'warning');
//             return;
//         }

//         try {
//             const headers = Object.keys(fetchedData[0]);
//             const csvContent = [
//                 headers.join(','),
//                 ...fetchedData.map(row =>
//                     headers.map(field =>
//                         `"${String(row[field] || '').replace(/"/g, '""')}"`
//                     ).join(',')
//                 )
//             ].join('\n');

//             const blob = new Blob([csvContent], { type: 'text/csv' });
//             const url = URL.createObjectURL(blob);

//             const link = document.createElement('a');
//             link.href = url;
//             link.download = `drone_data_${trackerInput.value || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);

//             showStatus('Data exported successfully', 'success');
//         } catch (error) {
//             console.error('Export Error:', error);
//             showStatus('Export failed: ' + error.message, 'error');
//         }
//     }
// });









                      //working code for map and data fetch without date filter
// document.addEventListener('DOMContentLoaded', function () {
//     // DOM Elements
//     const fetchBtn = document.getElementById('fetch-btn');
//     const exportBtn = document.getElementById('export-btn');
//     const trackerInput = document.getElementById('tracker-id');
//     const droneInfoBody = document.getElementById('drone-info-body');
//     const imagesGrid = document.getElementById('images-grid');
//     const statusMessage = document.getElementById('status-message');
//     const lastUpdatedDiv = document.querySelector('.last-updated');

//     // Map Setup
//     const map = L.map('map').setView([23.0225, 72.5714], 13);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         maxZoom: 19,
//         attribution: '&copy; OpenStreetMap contributors'
//     }).addTo(map);

//     const markersLayer = L.layerGroup().addTo(map);
//     const polylineLayer = L.layerGroup().addTo(map);

//     let fetchedData = [];
//     let lastUpdateTime = null;

//     function createCustomIcon(color, pulse = false) {
//         const iconClass = pulse ? 'pulse-icon' : 'static-icon';
//         return L.divIcon({
//             className: `custom-icon ${iconClass} ${color}-icon`,
//             html: '<div></div>',
//             iconSize: [24, 24],
//             iconAnchor: [12, 12]
//         });
//     }

//     fetchBtn.addEventListener('click', fetchDroneData);
//     exportBtn.addEventListener('click', exportToCSV);

//     async function fetchDroneData() {
//         const trackerId = trackerInput.value.trim();

//         if (!trackerId) {
//             showStatus('Please enter a Tracker ID', 'error');
//             return;
//         }

//         clearData();
//         showStatus('Fetching latest data...', 'loading');

//         try {
//             const response = await fetch('/api/data', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ tracker_id: trackerId })
//             });

//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.error || 'Server error occurred');
//             }

//             const data = await response.json();
//             console.log('API Response:', data);
//             lastUpdateTime = new Date();
//             updateLastUpdatedTime();

//             let telemetry = data.Telemetry || [];
//             let images = data.Images || [];

//             if (telemetry.length === 0 && images.length === 0) {
//                 handleEmptyDataResponse(data.TrackerId || trackerId);
//                 return;
//             }

//             telemetry = telemetry.sort((a, b) =>
//                 new Date(a.Timestamp) - new Date(b.Timestamp)
//             );

//             fetchedData = telemetry;
//             displayDroneInfo(data.TrackerId || trackerId, telemetry[0]);
//             plotMapData(telemetry);
//             displayImages(images);

//             showStatus(`Loaded ${telemetry.length} telemetry points and ${images.length} images`, 'success');
//         } catch (error) {
//             console.error('Error:', error);
//             showStatus(error.message, 'error');
//             showErrorOnMap(error.message);
//         }
//     }

//     function displayDroneInfo(trackerId, firstRecord = {}) {
//         droneInfoBody.innerHTML = '';
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td>${trackerId}</td>
//             <td>${firstRecord.DroneUINNumber || 'UA0'}</td>
//             <td>${firstRecord.DroneCategory || 'Small'}</td>
//             <td>${firstRecord.DroneApplication || 'Surveillance'}</td>
//         `;
//         droneInfoBody.appendChild(row);
//     }

//     function plotMapData(telemetry) {
//         markersLayer.clearLayers();
//         polylineLayer.clearLayers();

//         if (telemetry.length === 0) return;

//         const pathCoords = [];

//         telemetry.forEach(entry => {
//             const lat = parseFloat(entry.Latitude);
//             const lng = parseFloat(entry.Longitude);
//             if (!isNaN(lat) && !isNaN(lng)) pathCoords.push([lat, lng]);
//         });

//         if (pathCoords.length > 1) {
//             const polyline = L.polyline(pathCoords, {
//                 color: 'blue',
//                 weight: 5,
//                 opacity: 0.8
//             }).addTo(polylineLayer);
//             map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
//         }

//         telemetry.forEach((entry, index) => {
//             const lat = parseFloat(entry.Latitude);
//             const lng = parseFloat(entry.Longitude);
//             const alt = parseFloat(entry.Altitude) || 0;

//             if (isNaN(lat) || isNaN(lng)) return;

//             let color = 'blue';
//             let pulse = false;

//             if (index === 0) {
//                 color = 'green';
//                 pulse = true;
//             } else if (index === telemetry.length - 1) {
//                 color = 'red';
//             }

//             const marker = L.marker([lat, lng], {
//                 icon: createCustomIcon(color, pulse)
//             }).addTo(markersLayer).bindPopup(`
//                 <div class="map-popup">
//                     <h4>${entry.TrackerId || trackerInput.value}</h4>
//                     <p><strong>Time:</strong> ${formatTimestamp(entry.Timestamp)}</p>
//                     <p><strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
//                     <p><strong>Altitude:</strong> ${alt} m</p>
//                 </div>
//             `);
//         });
//     }

//     function displayImages(images) {
//         imagesGrid.innerHTML = '';
//         if (!Array.isArray(images) || images.length === 0) {
//             imagesGrid.innerHTML = `<div class="no-data-message"><p>No images available for this drone</p></div>`;
//             return;
//         }

//         images.forEach((imgUrl) => {
//             if (typeof imgUrl !== 'string' || !imgUrl.startsWith('http')) return;

//             const imgContainer = document.createElement('div');
//             imgContainer.className = 'image-container';

//             const imgLink = document.createElement('a');
//             imgLink.href = imgUrl;
//             imgLink.target = '_blank';

//             const img = document.createElement('img');
//             img.src = imgUrl;
//             img.alt = 'Drone image';
//             img.loading = 'lazy';

//             const imgInfo = document.createElement('div');
//             imgInfo.className = 'image-info';
//             const timestamp = extractTimestampFromUrl(imgUrl);
//             if (timestamp) imgInfo.textContent = timestamp;

//             imgLink.appendChild(img);
//             imgContainer.appendChild(imgLink);
//             imgContainer.appendChild(imgInfo);
//             imagesGrid.appendChild(imgContainer);
//         });
//     }

//     function handleEmptyDataResponse(trackerId) {
//         showStatus(`No data found for tracker ID: ${trackerId}`, 'warning');
//         displayDroneInfo(trackerId);
//         showMessageOnMap(`No data available for ${trackerId}`, 'info');
//     }

//     function extractTimestampFromUrl(url) {
//         try {
//             const match = url.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
//             if (match) {
//                 const [_, year, month, day, hour, minute, second] = match;
//                 return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString();
//             }
//             return null;
//         } catch {
//             return null;
//         }
//     }

//     function formatTimestamp(timestamp) {
//         if (!timestamp) return 'Unknown';
//         try {
//             if (timestamp.match(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/)) {
//                 const [datePart, timePart] = timestamp.split(' ');
//                 const [day, month, year] = datePart.split('-');
//                 return new Date(`${year}-${month}-${day}T${timePart}`).toLocaleString();
//             }
//             return new Date(timestamp).toLocaleString();
//         } catch {
//             return timestamp;
//         }
//     }

//     function updateLastUpdatedTime() {
//         if (!lastUpdateTime) return;
//         lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }

//     function showMessageOnMap(message, type) {
//         const center = map.getCenter();
//         markersLayer.clearLayers();

//         const icon = L.divIcon({
//             className: `map-message map-message-${type}`,
//             html: `<div>${message}</div>`,
//             iconSize: [200, 40]
//         });

//         L.marker(center, {
//             icon: icon,
//             zIndexOffset: 1000
//         }).addTo(markersLayer);
//         map.setView(center, 12);
//     }

//     function showErrorOnMap(error) {
//         showMessageOnMap(`Error: ${error}`, 'error');
//     }

//     function clearData() {
//         droneInfoBody.innerHTML = '';
//         imagesGrid.innerHTML = '';
//         markersLayer.clearLayers();
//         polylineLayer.clearLayers();
//         fetchedData = [];
//     }

//     function showStatus(message, type) {
//         if (!statusMessage) return;
//         statusMessage.textContent = message;
//         statusMessage.className = `status-${type}`;
//         if (type !== 'loading') {
//             setTimeout(() => {
//                 statusMessage.textContent = '';
//                 statusMessage.className = '';
//             }, 5000);
//         }
//     }

//     function exportToCSV() {
//         if (fetchedData.length === 0) {
//             showStatus('No data available to export', 'warning');
//             return;
//         }

//         try {
//             const headers = Object.keys(fetchedData[0]);
//             const csvContent = [
//                 headers.join(','),
//                 ...fetchedData.map(row =>
//                     headers.map(field =>
//                         `"${String(row[field] || '').replace(/"/g, '""')}"`
//                     ).join(',')
//                 )
//             ].join('\n');

//             const blob = new Blob([csvContent], { type: 'text/csv' });
//             const url = URL.createObjectURL(blob);

//             const link = document.createElement('a');
//             link.href = url;
//             link.download = `drone_data_${trackerInput.value || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);

//             showStatus('Data exported successfully', 'success');
//         } catch (error) {
//             console.error('Export Error:', error);
//             showStatus('Export failed: ' + error.message, 'error');
//         }
//     }
// });







// WORKING CODE

// document.addEventListener('DOMContentLoaded', function () {
//     // DOM Elements
//     const fetchBtn = document.getElementById('fetch-btn');
//     const exportBtn = document.getElementById('export-btn');
//     const exportImagesBtn = document.getElementById('export-images-btn');
//     const trackerInput = document.getElementById('tracker-id');
//     const droneInfoBody = document.getElementById('drone-info-body');
//     const imagesGrid = document.getElementById('images-grid');
//     const statusMessage = document.getElementById('status-message');
//     const lastUpdatedDiv = document.querySelector('.last-updated');

//     // Map Setup
//     const map = L.map('map').setView([23.0225, 72.5714], 13);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         maxZoom: 19,
//         attribution: '&copy; OpenStreetMap contributors'
//     }).addTo(map);

//     const markersLayer = L.layerGroup().addTo(map);
//     const polylineLayer = L.layerGroup().addTo(map);

//     let fetchedData = [];
//     let fetchedImages = [];
//     let lastUpdateTime = null;

//     function createCustomIcon(color, pulse = false) {
//         const iconClass = pulse ? 'pulse-icon' : 'static-icon';
//         return L.divIcon({
//             className: `custom-icon ${iconClass} ${color}-icon`,
//             html: '<div></div>',
//             iconSize: [24, 24],
//             iconAnchor: [12, 12]
//         });
//     }

//     fetchBtn.addEventListener('click', fetchDroneData);
//     exportBtn.addEventListener('click', exportToCSV);
//     exportImagesBtn.addEventListener('click', exportImagesAsZip);



//      // ⏱ Auto-fetch every 10 seconds
//     setInterval(() => {
//         const trackerId = trackerInput.value.trim();
//         if (trackerId) { // only fetch if trackerId is provided
//             console.log("⏳ Auto-refresh triggered...");
//             fetchDroneData();
//         } else {
//             console.log("⚠️ Tracker ID not provided. Skipping auto-refresh.");
//         }
//     }, 10000); // 10000ms = 10 seconds



//     async function fetchDroneData() {
//         const trackerId = trackerInput.value.trim();

//         if (!trackerId) {
//             showStatus('Please enter a Tracker ID', 'error');
//             return;
//         }

//         clearData();
//         showStatus('Fetching latest data...', 'loading');

//         try {
//             const response = await fetch('/api/data', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ tracker_id: trackerId })
//             });

//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.error || 'Server error occurred');
//             }

//             const data = await response.json();
//             console.log('API Response:', data);
//             lastUpdateTime = new Date();
//             updateLastUpdatedTime();

//             let telemetry = data.Telemetry || [];
//             let images = data.Images || [];

//             if (telemetry.length === 0 && images.length === 0) {
//                 handleEmptyDataResponse(data.TrackerId || trackerId);
//                 return;
//             }

//             telemetry = telemetry.sort((a, b) =>
//                 new Date(a.Timestamp) - new Date(b.Timestamp)
//             );

//             fetchedData = telemetry;
//             fetchedImages = images;
//             displayDroneInfo(data.TrackerId || trackerId, telemetry[0]);
//             plotMapData(telemetry);
//             displayImages(images);

//             showStatus(`Loaded ${telemetry.length} telemetry points and ${images.length} images`, 'success');
//         } catch (error) {
//             console.error('Error:', error);
//             showStatus(error.message, 'error');
//             showErrorOnMap(error.message);
//         }
//     }

//     function displayDroneInfo(trackerId, firstRecord = {}) {
//         droneInfoBody.innerHTML = '';
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td>${trackerId}</td>
//             <td>${firstRecord.DroneUINNumber || 'UA0'}</td>
//             <td>${firstRecord.DroneCategory || 'Small'}</td>
//             <td>${firstRecord.DroneApplication || 'Surveillance'}</td>
//         `;
//         droneInfoBody.appendChild(row);
//     }


// // Plotting map point

//     function plotMapData(telemetry) {
//         markersLayer.clearLayers();
//         polylineLayer.clearLayers();

//         if (telemetry.length === 0) return;

//         // Sort by timestamp to ensure correct order
//         telemetry = telemetry.sort((a, b) => 
//             new Date(a.Timestamp) - new Date(b.Timestamp)
//         );

//         const pathCoords = [];
//         let previousTime = null;

//         telemetry.forEach(entry => {
//             const lat = parseFloat(entry.Latitude);
//             const lng = parseFloat(entry.Longitude);
            
//             if (!isNaN(lat) && !isNaN(lng)) {
//                 const currentTime = new Date(entry.Timestamp);
                
//                 // Only add to path if it's the first point or if time difference is reasonable
//                 if (previousTime === null || 
//                     (currentTime - previousTime) < 30 * 60 * 1000) { // 30 minutes threshold
//                     pathCoords.push([lat, lng]);
//                 } else {
//                     // If time gap is too large, don't connect these points
//                     // This prevents connecting separate flights
//                     if (pathCoords.length > 1) {
//                         createPathSegment(pathCoords);
//                     }
//                     pathCoords.length = 0; // Reset for new segment
//                     pathCoords.push([lat, lng]);
//                 }
                
//                 previousTime = currentTime;
//             }
//         });

//         // Create the final path segment
//         if (pathCoords.length > 1) {
//             createPathSegment(pathCoords);
//         }

//         // Fit map to show all markers
//         const markerGroup = new L.featureGroup(
//             telemetry
//                 .filter(entry => !isNaN(parseFloat(entry.Latitude)) && !isNaN(parseFloat(entry.Longitude)))
//                 .map(entry => L.marker([parseFloat(entry.Latitude), parseFloat(entry.Longitude)]))
//         );
        
//         if (markerGroup.getLayers().length > 0) {
//             map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
//         }

//         // Add markers
//         telemetry.forEach((entry, index) => {
//             const lat = parseFloat(entry.Latitude);
//             const lng = parseFloat(entry.Longitude);
//             const alt = parseFloat(entry.Altitude) || 0;

//             if (isNaN(lat) || isNaN(lng)) return;

//             let color = 'blue';
//             let pulse = false;

//             if (index === 0) {
//                 color = 'blue';
//                 pulse = true;
//             } else if (index === telemetry.length - 1) {
//                 color = 'red';
//             }

//             const marker = L.marker([lat, lng], {
//                 icon: createCustomIcon(color, pulse)
//             }).addTo(markersLayer).bindPopup(`
//                 <div class="map-popup">
//                     <h4>${entry.TrackerId || trackerInput.value}</h4>
//                     <p><strong>Time:</strong> ${formatTimestamp(entry.Timestamp)}</p>
//                     <p><strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
//                     <p><strong>Altitude:</strong> ${alt} m</p>
//                 </div>
//             `);
//         });
//     }





//     // Helper function to create path segments
//     function createPathSegment(coords) {
//         L.polyline(coords, {
//             color: 'blue',
//             weight: 5,
//             opacity: 0.8,
//             smoothFactor: 1.0 // Makes the line smoother
//         }).addTo(polylineLayer);
//     }

//     // ... rest of the code remains the same (displayImages, exportImagesAsZip, etc.)
//     function displayImages(images) {
//         imagesGrid.innerHTML = '';
//         if (!Array.isArray(images) || images.length === 0) {
//             imagesGrid.innerHTML = `<div class="no-data-message"><p>No images available for this drone</p></div>`;
//             return;
//         }

//         images.forEach((imgUrl) => {
//             if (typeof imgUrl !== 'string' || !imgUrl.startsWith('http')) return;

//             const imgContainer = document.createElement('div');
//             imgContainer.className = 'image-container';

//             const imgLink = document.createElement('a');
//             imgLink.href = imgUrl;
//             imgLink.target = '_blank';

//             const img = document.createElement('img');
//             img.src = imgUrl;
//             img.alt = 'Drone image';
//             img.loading = 'lazy';

//             const imgInfo = document.createElement('div');
//             imgInfo.className = 'image-info';
//             const timestamp = extractTimestampFromUrl(imgUrl);
//             if (timestamp) imgInfo.textContent = timestamp;

//             imgLink.appendChild(img);
//             imgContainer.appendChild(imgLink);
//             imgContainer.appendChild(imgInfo);
//             imagesGrid.appendChild(imgContainer);
//         });
//     }

//     async function exportImagesAsZip() {
//         if (!fetchedImages || fetchedImages.length === 0) {
//             showStatus('No images available to export', 'warning');
//             return;
//         }

//         try {
//             showStatus('Preparing images for download...', 'loading');
//             const zip = new JSZip();
//             const folder = zip.folder("drone_images");

//             for (let i = 0; i < fetchedImages.length; i++) {
//                 const url = fetchedImages[i];
//                 const response = await fetch(url);
//                 const blob = await response.blob();
//                 const extension = url.split('.').pop().split(/\#|\?/)[0];
//                 folder.file(`image_${i + 1}.${extension}`, blob);
//             }

//             const content = await zip.generateAsync({ type: "blob" });
//             saveAs(content, `drone_images_${trackerInput.value || 'export'}_${new Date().toISOString().slice(0, 10)}.zip`);

//             showStatus('Images exported successfully', 'success');
//         } catch (error) {
//             console.error("Image Export Error:", error);
//             showStatus("Image export failed: " + error.message, "error");
//         }
//     }

//     function handleEmptyDataResponse(trackerId) {
//         showStatus(`No data found for tracker ID: ${trackerId}`, 'warning');
//         displayDroneInfo(trackerId);
//         showMessageOnMap(`No data available for ${trackerId}`, 'info');
//     }

//     function extractTimestampFromUrl(url) {
//         try {
//             const match = url.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
//             if (match) {
//                 const [_, year, month, day, hour, minute, second] = match;
//                 return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString();
//             }
//             return null;
//         } catch {
//             return null;
//         }
//     }

//     function formatTimestamp(timestamp) {
//         if (!timestamp) return 'Unknown';
//         try {
//             if (timestamp.match(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/)) {
//                 const [datePart, timePart] = timestamp.split(' ');
//                 const [day, month, year] = datePart.split('-');
//                 return new Date(`${year}-${month}-${day}T${timePart}`).toLocaleString();
//             }
//             return new Date(timestamp).toLocaleString();
//         } catch {
//             return timestamp;
//         }
//     }

//     function updateLastUpdatedTime() {
//         if (!lastUpdateTime) return;
//         lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }

//     function showMessageOnMap(message, type) {
//         const center = map.getCenter();
//         markersLayer.clearLayers();

//         const icon = L.divIcon({
//             className: `map-message map-message-${type}`,
//             html: `<div>${message}</div>`,
//             iconSize: [200, 40]
//         });

//         L.marker(center, {
//             icon: icon,
//             zIndexOffset: 1000
//         }).addTo(markersLayer);
//         map.setView(center, 12);
//     }

//     function showErrorOnMap(error) {
//         showMessageOnMap(`Error: ${error}`, 'error');
//     }

//     function clearData() {
//         droneInfoBody.innerHTML = '';
//         imagesGrid.innerHTML = '';
//         markersLayer.clearLayers();
//         polylineLayer.clearLayers();
//         fetchedData = [];
//         fetchedImages = [];
//     }

//     function showStatus(message, type) {
//         if (!statusMessage) return;
//         statusMessage.textContent = message;
//         statusMessage.className = `status-${type}`;
//         if (type !== 'loading') {
//             setTimeout(() => {
//                 statusMessage.textContent = '';
//                 statusMessage.className = '';
//             }, 5000);
//         }
//     }

//     function exportToCSV() {
//         if (fetchedData.length === 0) {
//             showStatus('No data available to export', 'warning');
//             return;
//         }

//         try {
//             const headers = Object.keys(fetchedData[0]);
//             const csvContent = [
//                 headers.join(','),
//                 ...fetchedData.map(row =>
//                     headers.map(field =>
//                         `"${String(row[field] || '').replace(/"/g, '""')}"`
//                     ).join(',')
//                 )
//             ].join('\n');

//             const blob = new Blob([csvContent], { type: 'text/csv' });
//             const url = URL.createObjectURL(blob);

//             const link = document.createElement('a');
//             link.href = url;
//             link.download = `drone_data_${trackerInput.value || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);

//             showStatus('Data exported successfully', 'success');
//         } catch (error) {
//             console.error('Export Error:', error);
//             showStatus('Export failed: ' + error.message, 'error');
//         }
//     }

//     document.getElementById("exportImages").addEventListener("click", async () => {
//         try {
//             console.log("📤 Starting image export...");

//             let images = Array.from(document.querySelectorAll("#imageContainer img"))
//                             .map(img => img.src);

//             console.log("🖼 Images collected for export:", images);

//             if (images.length === 0) {
//                 alert("No images available to export!");
//                 return;
//             }

//             let response = await fetch("/export_images", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({ images })
//             });

//             console.log("📡 Export API response status:", response.status);

//             if (!response.ok) {
//                 let err = await response.text();
//                 console.error("❌ Export API failed:", err);
//                 alert("Failed to export images!");
//                 return;
//             }

//             let blob = await response.blob();
//             console.log("✅ Blob received, preparing download...");

//             let link = document.createElement("a");
//             link.href = window.URL.createObjectURL(blob);
//             link.download = "exported_images.zip";
//             link.click();

//             console.log("📥 Download triggered successfully.");
//         } catch (error) {
//             console.error("💥 Error in exportImages click handler:", error);
//             alert("Error exporting images. Check console/logs.");
//         }
//     });
// });


// Testing Code

document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const fetchBtn = document.getElementById('fetch-btn');
    const exportBtn = document.getElementById('export-btn');
    const exportImagesBtn = document.getElementById('export-images-btn');
    const trackerInput = document.getElementById('tracker-id');
    const droneInfoBody = document.getElementById('drone-info-body');
    const imagesGrid = document.getElementById('images-grid');
    const statusMessage = document.getElementById('status-message');
    const lastUpdatedDiv = document.querySelector('.last-updated');

    // Map Setup
    const map = L.map('map').setView([23.0225, 72.5714], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const polylineLayer = L.layerGroup().addTo(map);

    let fetchedData = [];   // full telemetry (for CSV)
    let pathPoints = [];    // 30s-sampled points used for path
    let fetchedImages = [];
    let lastUpdateTime = null;

    function createCustomIcon(color, pulse = false) {
        const iconClass = pulse ? 'pulse-icon' : 'static-icon';
        return L.divIcon({
            className: `custom-icon ${iconClass} ${color}-icon`,
            html: '<div></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    fetchBtn.addEventListener('click', fetchDroneData);
    exportBtn.addEventListener('click', exportToCSV);
    exportImagesBtn.addEventListener('click', exportImagesAsZip);

    // ⏱ Auto-fetch every 10 seconds (when tracker is present)
    setInterval(() => {
        const trackerId = trackerInput.value.trim();
        if (trackerId) fetchDroneData();
    }, 60000);

    async function fetchDroneData() {
    const trackerId = trackerInput.value.trim();
    if (!trackerId) {
        showStatus('Please enter a Tracker ID', 'error');
        return;
    }

    clearData();
    showStatus('Fetching latest trajectory...', 'loading');

    try {
        const response = await fetch('/api/trajectory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tracker_id: trackerId,
                interval_seconds: 30,
                max_gap_seconds: 120
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Server error occurred');
        }

        const data = await response.json();
        lastUpdateTime = new Date();
        updateLastUpdatedTime();

        // Map API fields to frontend, with fallbacks
        pathPoints = (data.points || []).map(p => ({
            Latitude: p.lat,
            Longitude: p.lon,
            Timestamp: p.timestamp,
            Altitude: p.altitude || 0,
            DroneUINNumber: p.DroneUINNumber || "N/A",
            DroneCategory: p.DroneCategory || "N/A",
            DroneApplication: p.DroneApplication || "N/A"
        }));

        fetchedImages = data.images || [];
        fetchedData = pathPoints; // for CSV export

        // Display first row info in table
        const firstPoint = pathPoints[0] || {};
        displayDroneInfo(trackerId, firstPoint);

        // Plot map & images
        plotMapData(pathPoints);
        displayImages(fetchedImages);

        showStatus(`Loaded ${pathPoints.length} path points (30s interval) and ${fetchedImages.length} images`, 'success');

    } catch (error) {
        console.error('Error:', error);
        showStatus(error.message, 'error');
        showErrorOnMap(error.message);
    }
}

// Display first row of drone info in table
function displayDroneInfo(trackerId, firstRecord = {}) {
    droneInfoBody.innerHTML = '';
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${trackerId}</td>
        <td>${firstRecord.DroneUINNumber || 'N/A'}</td>
        <td>${firstRecord.DroneCategory || 'N/A'}</td>
        <td>${firstRecord.DroneApplication || 'N/A'}</td>
    `;
    droneInfoBody.appendChild(row);
}

// Update map popup to show the 3 fields
function plotMapData(points) {
    markersLayer.clearLayers();
    polylineLayer.clearLayers();

    if (!points || points.length === 0) return;

    const coords = points.map(p => [parseFloat(p.Latitude), parseFloat(p.Longitude)]);
    const polyline = L.polyline(coords, { color: 'blue', weight: 4, opacity: 0.9 }).addTo(polylineLayer);

    points.forEach((p, i) => {
        const lat = parseFloat(p.Latitude);
        const lng = parseFloat(p.Longitude);
        const iconColor = (i === 0) ? 'green' : (i === points.length - 1) ? 'red' : 'blue';
        L.marker([lat, lng], { icon: createCustomIcon(iconColor, i === 0) })
            .addTo(markersLayer)
            .bindPopup(`
                <div class="map-popup">
                    <h4>Tracker ID: ${trackerInput.value}</h4>
                    <p><strong>Time:</strong> ${formatTimestamp(p.Timestamp)}</p>
                    <p><strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                    <p><strong>Altitude:</strong> ${p.Altitude.toFixed(2)} m</p>
                    <p><strong>UIN:</strong> ${p.DroneUINNumber || 'N/A'}</p>
                    <p><strong>Category:</strong> ${p.DroneCategory || 'N/A'}</p>
                    <p><strong>Application:</strong> ${p.DroneApplication || 'N/A'}</p>
                </div>
            `);
    });

    if (coords.length) map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
}


    // -------- Images ----------
    function displayImages(images) {
        imagesGrid.innerHTML = '';
        if (!Array.isArray(images) || images.length === 0) {
            imagesGrid.innerHTML = `<div class="no-data-message"><p>No images available for this drone</p></div>`;
            return;
        }

        images.forEach((imgUrl) => {
            if (typeof imgUrl !== 'string' || !imgUrl.startsWith('http')) return;

            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-container';

            const imgLink = document.createElement('a');
            imgLink.href = imgUrl;
            imgLink.target = '_blank';

            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = 'Drone image';
            img.loading = 'lazy';

            const imgInfo = document.createElement('div');
            imgInfo.className = 'image-info';
            const timestamp = extractTimestampFromUrl(imgUrl);
            if (timestamp) imgInfo.textContent = timestamp;

            imgLink.appendChild(img);
            imgContainer.appendChild(imgLink);
            imgContainer.appendChild(imgInfo);
            imagesGrid.appendChild(imgContainer);
        });
    }

    async function exportImagesAsZip() {
        if (!fetchedImages || fetchedImages.length === 0) {
            showStatus('No images available to export', 'warning');
            return;
        }

        try {
            showStatus('Preparing images for download...', 'loading');
            const zip = new JSZip();
            const folder = zip.folder("drone_images");

            for (let i = 0; i < fetchedImages.length; i++) {
                const url = fetchedImages[i];
                const response = await fetch(url);
                const blob = await response.blob();
                const extension = url.split('.').pop().split(/\#|\?/)[0];
                folder.file(`image_${i + 1}.${extension}`, blob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `drone_images_${trackerInput.value || 'export'}_${new Date().toISOString().slice(0, 10)}.zip`);

            showStatus('Images exported successfully', 'success');
        } catch (error) {
            console.error("Image Export Error:", error);
            showStatus("Image export failed: " + error.message, "error");
        }
    }

    function handleEmptyDataResponse(trackerId) {
        showStatus(`No data found for tracker ID: ${trackerId}`, 'warning');
        displayDroneInfo(trackerId);
        showMessageOnMap(`No data available for ${trackerId}`, 'info');
    }

    function extractTimestampFromUrl(url) {
        try {
            const match = url.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
            if (match) {
                const [_, year, month, day, hour, minute, second] = match;
                return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString();
            }
            return null;
        } catch {
            return null;
        }
    }

    function formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown';
        try {
            if (typeof timestamp === 'string' && timestamp.match(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/)) {
                const [datePart, timePart] = timestamp.split(' ');
                const [day, month, year] = datePart.split('-');
                return new Date(`${year}-${month}-${day}T${timePart}`).toLocaleString();
            }
            return new Date(timestamp).toLocaleString();
        } catch {
            return String(timestamp);
        }
    }

    function updateLastUpdatedTime() {
        if (!lastUpdateTime) return;
        lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
    }

    function showMessageOnMap(message, type) {
        const center = map.getCenter();
        markersLayer.clearLayers();

        const icon = L.divIcon({
            className: `map-message map-message-${type}`,
            html: `<div>${message}</div>`,
            iconSize: [200, 40]
        });

        L.marker(center, {
            icon: icon,
            zIndexOffset: 1000
        }).addTo(markersLayer);
        map.setView(center, 12);
    }

    function showErrorOnMap(error) {
        showMessageOnMap(`Error: ${error}`, 'error');
    }

    function clearData() {
        droneInfoBody.innerHTML = '';
        imagesGrid.innerHTML = '';
        markersLayer.clearLayers();
        polylineLayer.clearLayers();
        fetchedData = [];
        pathPoints = [];
        fetchedImages = [];
    }

    function showStatus(message, type) {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.className = `status-${type}`;
        if (type !== 'loading') {
            setTimeout(() => {
                statusMessage.textContent = '';
                statusMessage.className = '';
            }, 5000);
        }
    }

    function exportToCSV() {
        const rows = fetchedData;
        if (!rows || rows.length === 0) {
            showStatus('No data available to export', 'warning');
            return;
        }

        try {
            const headers = Object.keys(rows[0]);
            const csvContent = [
                headers.join(','),
                ...rows.map(row =>
                    headers.map(field =>
                        `"${String(row[field] ?? '').replace(/"/g, '""')}"`
                    ).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `drone_data_${trackerInput.value || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showStatus('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export Error:', error);
            showStatus('Export failed: ' + error.message, 'error');
        }
    }

    // (The older /exportImages handler kept for backward compatibility)
    const legacyExportBtn = document.getElementById("exportImages");
    if (legacyExportBtn) {
        legacyExportBtn.addEventListener("click", async () => {
            try {
                let images = Array.from(document.querySelectorAll("#imageContainer img")).map(img => img.src);
                if (images.length === 0) {
                    alert("No images available to export!");
                    return;
                }
                let response = await fetch("/export_images", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images })
                });
                if (!response.ok) {
                    let err = await response.text();
                    console.error("❌ Export API failed:", err);
                    alert("Failed to export images!");
                    return;
                }
                let blob = await response.blob();
                let link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.download = "exported_images.zip";
                link.click();
            } catch (error) {
                console.error("💥 Error in exportImages click handler:", error);
                alert("Error exporting images. Check console/logs.");
            }
        });
    }
});
