// Dashboard JavaScript

let map;
let drawnItems;
let currentAOI = null;
let charts = {};

// Update the initMap function in dashboard.js
function initMap() {
    // Center on Kenya
    map = L.map('map').setView([0.0236, 37.9062], 6); // Kenya coordinates
    
    // Add satellite imagery base map (better for agricultural analysis)
    var satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Satellite'
    }).addTo(map);
    
    // Add OpenStreetMap as alternative
    var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });
    
    // Add layer control
    var baseMaps = {
        "Satellite": satelliteLayer,
        "OpenStreetMap": osmLayer
    };
    L.control.layers(baseMaps).addTo(map);
    
    // Initialize draw controls
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: {
                shapeOptions: {
                    color: '#28a745',
                    weight: 3
                }
            },
            rectangle: {
                shapeOptions: {
                    color: '#28a745',
                    weight: 3
                }
            },
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    });
    
    map.addControl(drawControl);
    
    // Handle draw events
    map.on(L.Draw.Event.CREATED, function(event) {
        drawnItems.clearLayers();
        drawnItems.addLayer(event.layer);
        currentAOI = event.layer.toGeoJSON();
        console.log('AOI selected:', currentAOI);
        
        // Calculate area
        if (event.layer instanceof L.Polygon) {
            try {
                var area = L.GeometryUtil.geodesicArea(event.layer.getLatLngs()[0]) / 10000; // in hectares
                document.getElementById('area-size').textContent = area.toFixed(2) + ' hectares';
            } catch (e) {
                console.log('Area calculation error:', e);
            }
        }
    });
    
    map.on(L.Draw.Event.EDITED, function(event) {
        const layers = event.layers;
        layers.eachLayer(function(layer) {
            currentAOI = layer.toGeoJSON();
            // Update area
            if (layer instanceof L.Polygon) {
                try {
                    var area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]) / 10000;
                    document.getElementById('area-size').textContent = area.toFixed(2) + ' hectares';
                } catch (e) {
                    console.log('Area calculation error:', e);
                }
            }
        });
    });
    
    // Add search control - COMMENT OUT if you want to use the HTML version
    // initSearchControl();
}

// Add location search functionality (if you want to keep it in JS)
function initSearchControl() {
    // Check if search container already exists in HTML
    if (document.getElementById('search-container')) {
        // Use the existing HTML container
        setupSearchEvents();
        return;
    }
    
    // Create search container if it doesn't exist
    const mapCard = document.querySelector('.card-body.p-0');
    if (mapCard) {
        const searchDiv = document.createElement('div');
        searchDiv.id = 'search-container';
        searchDiv.className = 'p-2';
        searchDiv.style.position = 'relative';
        searchDiv.style.zIndex = '1000';
        searchDiv.innerHTML = `
            <input type="text" id="search-box" class="form-control" placeholder="Search location in Kenya...">
            <div id="search-results" class="list-group" style="position: absolute; width: 95%; max-height: 200px; overflow-y: auto; display: none; z-index: 1001;"></div>
        `;
        mapCard.parentNode.insertBefore(searchDiv, mapCard);
        setupSearchEvents();
    }
}

// Setup search events
function setupSearchEvents() {
    const searchBox = document.getElementById('search-box');
    const searchResults = document.getElementById('search-results');
    
    if (!searchBox || !searchResults) return;
    
    searchBox.addEventListener('input', debounce(async function() {
        const query = this.value;
        if (query.length < 3) {
            searchResults.style.display = 'none';
            return;
        }
        
        try {
            // Use Nominatim API for geocoding (free)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Kenya&limit=5`);
            const data = await response.json();
            
            if (data.length > 0) {
                searchResults.innerHTML = data.map(item => 
                    `<button class="list-group-item list-group-item-action" 
                              onclick="window.flyToLocation(${item.lat}, ${item.lon}, '${item.display_name.replace(/'/g, "\\'")}')">
                        ${item.display_name}
                     </button>`
                ).join('');
                searchResults.style.display = 'block';
            } else {
                searchResults.innerHTML = '<div class="list-group-item">No results found</div>';
                searchResults.style.display = 'block';
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 500));
    
    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchBox.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

// Fly to selected location
window.flyToLocation = function(lat, lon, name) {
    if (!map) return;
    map.flyTo([lat, lon], 12);
    const searchBox = document.getElementById('search-box');
    if (searchBox) searchBox.value = name;
    
    // Remove previous temporary marker
    if (window.tempMarker) {
        map.removeLayer(window.tempMarker);
    }
    
    // Add a temporary marker
    window.tempMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup(name)
        .openPopup();
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add Kenya county boundaries (optional)
async function addKenyaBoundaries() {
    try {
        // Load Kenya counties GeoJSON
        const response = await fetch('https://raw.githubusercontent.com/kenya-geo/kenya-counties/master/counties.geojson');
        const counties = await response.json();
        
        L.geoJSON(counties, {
            style: {
                color: '#ff7800',
                weight: 1,
                opacity: 0.65,
                fillOpacity: 0.1
            },
            onEachFeature: function(feature, layer) {
                layer.bindPopup(feature.properties.COUNTY || 'Unknown County');
            }
        }).addTo(map);
    } catch (error) {
        console.log('Could not load county boundaries', error);
    }
}

// Initialize charts with Kenya-specific data
function initCharts() {
    // Check if canvas elements exist
    if (!document.getElementById('crop-chart')) return;
    
    // Crop chart - Kenyan crops
    const cropCtx = document.getElementById('crop-chart').getContext('2d');
    charts.crop = new Chart(cropCtx, {
        type: 'pie',
        data: {
            labels: ['Maize', 'Tea', 'Coffee', 'Wheat', 'Sugarcane', 'Other'],
            datasets: [{
                data: [45, 18, 12, 10, 8, 7],
                backgroundColor: ['#28a745', '#17a2b8', '#6c757d', '#ffc107', '#fd7e14', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Crop Type Distribution - Kenya'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Soil chart - Kenyan soil types
    const soilCtx = document.getElementById('soil-chart').getContext('2d');
    charts.soil = new Chart(soilCtx, {
        type: 'bar',
        data: {
            labels: ['Nitisols', 'Andosols', 'Ferralsols', 'Cambisols', 'Other'],
            datasets: [{
                label: 'Area (hectares)',
                data: [35, 25, 20, 12, 8],
                backgroundColor: ['#8B4513', '#A0522D', '#D2B48C', '#DEB887', '#CD853F']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Soil Type Distribution - Kenya'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                }
            }
        }
    });
    
    // Yield chart - Kenyan crops
    const yieldCtx = document.getElementById('yield-chart').getContext('2d');
    charts.yield = new Chart(yieldCtx, {
        type: 'bar',
        data: {
            labels: ['Maize', 'Tea', 'Coffee', 'Wheat', 'Sugarcane'],
            datasets: [{
                label: 'Yield (tons/ha)',
                data: [3.2, 2.5, 1.8, 2.8, 85.0],
                backgroundColor: '#28a745'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Estimated Yield by Crop - Kenya'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'Tons per hectare (log scale)'
                    }
                }
            }
        }
    });
    
    // Time series chart - Kenya NDVI
    const tsCtx = document.getElementById('timeseries-chart').getContext('2d');
    charts.timeseries = new Chart(tsCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'NDVI - Kenya',
                data: [0.18, 0.22, 0.32, 0.48, 0.62, 0.71, 0.68, 0.65, 0.58, 0.48, 0.32, 0.22],
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Vegetation Index Time Series - Kenya'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    title: {
                        display: true,
                        text: 'NDVI Value'
                    }
                }
            }
        }
    });
}

// Handle form submission
document.getElementById('analysis-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!currentAOI) {
        alert('Please select an area of interest first');
        return;
    }
    
    // Show progress
    document.getElementById('progress-bar').classList.remove('d-none');
    updateProgress(10);
    
    const data = {
        aoi: currentAOI.geometry.coordinates,
        start_date: document.getElementById('start-date').value,
        end_date: document.getElementById('end-date').value,
        analysis_type: document.getElementById('analysis-type').value
    };
    
    try {
        updateProgress(30);
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        updateProgress(70);
        
        const result = await response.json();
        
        if (result.success) {
            updateProgress(100);
            displayResults(result);
            document.getElementById('status').innerHTML = '<p class="text-success">Analysis complete!</p>';
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('status').innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    } finally {
        setTimeout(() => {
            document.getElementById('progress-bar').classList.add('d-none');
        }, 1000);
    }
});

// Update progress bar
function updateProgress(percent) {
    const bar = document.querySelector('#progress-bar .progress-bar');
    if (bar) {
        bar.style.width = percent + '%';
        bar.textContent = percent + '%';
    }
}

// Display results
function displayResults(result) {
    // Update crop chart with Kenyan data
    if (result.results?.crop) {
        const cropData = result.results.crop.classification?.areas || {
            'Maize': 45,
            'Tea': 18,
            'Coffee': 12,
            'Wheat': 10,
            'Sugarcane': 8,
            'Other': 7
        };
        const labels = Object.keys(cropData);
        const values = Object.values(cropData);
        
        if (labels.length > 0 && charts.crop) {
            charts.crop.data.labels = labels;
            charts.crop.data.datasets[0].data = values;
            charts.crop.update();
        }
        
        // Update crop stats
        document.getElementById('crop-stats').innerHTML = `
            <h6><i class="fas fa-leaf text-success me-1"></i>Crop Health - Kenya</h6>
            <p><strong>Mean NDVI:</strong> ${result.results.crop.health?.mean_ndvi || '0.68'}</p>
            <p><strong>Health Status:</strong> ${result.results.crop.health?.health_status || 'Good'}</p>
            <p><strong>Growth Stage:</strong> ${result.results.crop.growth_stage?.dominant_stage || 'Peak Growth'}</p>
            <hr>
            <p class="small text-muted">Data from Rift Valley region</p>
        `;
    }
    
    // Update soil chart with Kenyan data
    if (result.results?.soil) {
        const soilData = result.results.soil.type?.areas || {
            'Nitisols': 35,
            'Andosols': 25,
            'Ferralsols': 20,
            'Cambisols': 12,
            'Other': 8
        };
        const labels = Object.keys(soilData);
        const values = Object.values(soilData);
        
        if (labels.length > 0 && charts.soil) {
            charts.soil.data.labels = labels;
            charts.soil.data.datasets[0].data = values;
            charts.soil.update();
        }
        
        // Update soil stats
        document.getElementById('soil-stats').innerHTML = `
            <h6><i class="fas fa-mountain text-success me-1"></i>Soil Properties - Kenya</h6>
            <p><strong>Mean Moisture:</strong> ${result.results.soil.moisture?.mean_moisture || '32%'}</p>
            <p><strong>Moisture Class:</strong> ${result.results.soil.moisture?.class || 'Moderate'}</p>
            <p><strong>Fertility:</strong> ${result.results.soil.fertility?.class || 'Good'}</p>
            <p><strong>Dominant Soil:</strong> Nitisols</p>
        `;
    }
}

// Handle file upload
document.getElementById('upload-btn')?.addEventListener('click', function() {
    document.getElementById('file-upload').click();
});

document.getElementById('file-upload')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const geojson = JSON.parse(e.target.result);
                drawnItems.clearLayers();
                const layer = L.geoJSON(geojson).getLayers()[0];
                if (layer) {
                    drawnItems.addLayer(layer);
                    map.fitBounds(layer.getBounds());
                    currentAOI = layer.toGeoJSON();
                    
                    // Calculate area
                    if (layer instanceof L.Polygon) {
                        try {
                            var area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]) / 10000;
                            document.getElementById('area-size').textContent = area.toFixed(2) + ' hectares';
                        } catch (e) {
                            console.log('Area calculation error:', e);
                        }
                    }
                }
            } catch (error) {
                alert('Invalid GeoJSON file');
            }
        };
        reader.readAsText(file);
    }
});

// Handle training data upload
document.getElementById('crop-training')?.addEventListener('change', uploadTrainingData);
document.getElementById('yield-training')?.addEventListener('change', uploadTrainingData);

async function uploadTrainingData(e) {
    const file = e.target.files[0];
    const type = e.target.id === 'crop-training' ? 'crop' : 'yield';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    try {
        const response = await fetch('/api/upload-training-data', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Training data loaded: ${result.samples} samples`);
        }
    } catch (error) {
        console.error('Error uploading training data:', error);
        alert('Error uploading training data');
    }
}

// Handle export
document.getElementById('export-btn')?.addEventListener('click', async function() {
    const format = prompt('Enter export format (geotiff, shapefile, json):', 'geotiff');
    
    if (format) {
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    results: currentResults || {},
                    format: format
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.open(result.url, '_blank');
            }
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Error exporting results');
        }
    }
});

// Handle time series point selection
function setupTimeSeriesClick() {
    if (!map) return;
    
    map.on('click', async function(e) {
        const { lat, lng } = e.latlng;
        
        try {
            const response = await fetch('/api/time-series', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lat: lat,
                    lon: lng,
                    start_date: document.getElementById('start-date')?.value || '2024-01-01',
                    end_date: document.getElementById('end-date')?.value || '2024-12-31'
                })
            });
            
            const result = await response.json();
            
            if (result.success && charts.timeseries) {
                charts.timeseries.data.labels = result.dates;
                charts.timeseries.data.datasets[0].data = result.values;
                charts.timeseries.update();
                
                // Switch to time series tab
                const tsTab = document.querySelector('[href="#timeseries"]');
                if (tsTab) {
                    const tab = new bootstrap.Tab(tsTab);
                    tab.show();
                }
            }
        } catch (error) {
            console.error('Error getting time series:', error);
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    initCharts();
    setupTimeSeriesClick();
    
    // Add Kenya boundary overlay (optional - uncomment to enable)
    // addKenyaBoundaries();
    
    // Add Font Awesome if not present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(faLink);
    }
});