/**
 * Analysis JavaScript for Agricultural Analysis System
 * Handles detailed analysis page interactions, chart updates, and data visualization
 */

// Global variables
let analysisData = null;
let currentDateRange = {
    start: '2024-01-01',
    end: '2024-12-31'
};
let selectedPoint = null;
let charts = {};

// Kenya agricultural regions data
const kenyaRegions = {
    "Rift Valley": { lat: 0.5, lon: 35.5, crops: ["Maize", "Wheat", "Tea"] },
    "Central Highlands": { lat: -0.5, lon: 37.0, crops: ["Coffee", "Tea", "Vegetables"] },
    "Western Kenya": { lat: 0.5, lon: 34.5, crops: ["Sugarcane", "Maize", "Cassava"] },
    "Eastern Kenya": { lat: -1.5, lon: 38.0, crops: ["Mangoes", "Oranges", "Vegetables"] },
    "Coastal Region": { lat: -3.5, lon: 39.5, crops: ["Coconuts", "Cashews", "Mangoes"] },
    "Lake Victoria Basin": { lat: -0.5, lon: 34.5, crops: ["Rice", "Fishing", "Vegetables"] }
};

// Kenyan crops data
const kenyaCrops = {
    'Maize': { area: 45, yield: 3.2, color: '#28a745' },
    'Tea': { area: 18, yield: 2.5, color: '#17a2b8' },
    'Coffee': { area: 12, yield: 1.8, color: '#6c757d' },
    'Wheat': { area: 10, yield: 2.8, color: '#ffc107' },
    'Sugarcane': { area: 8, yield: 85.0, color: '#fd7e14' },
    'Other': { area: 7, yield: 2.0, color: '#dc3545' }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initAnalysisPage();
    loadAnalysisData();
    initEventListeners();
    initTooltips();
    initDownloadButtons();
});

/**
 * Initialize analysis page
 */
function initAnalysisPage() {
    console.log('Initializing analysis page for Kenya...');
    
    // Set default date
    const today = new Date();
    const analysisDate = document.getElementById('analysis-date');
    if (analysisDate) {
        analysisDate.value = today.toISOString().split('T')[0];
    }
    
    // Initialize all maps with Kenya focus
    initOverviewMap();
    initIndexMap();
    initCropMap();
    initSoilMap();
    initYieldMap();
    initZoneMap();
    
    // Initialize all charts with Kenya data
    initIndexDistributionChart();
    initCropPieChart();
    initSoilBarChart();
    initMineralChart();
    initYieldByCropChart();
    initTimeseriesMainChart();
    initSeasonalProfileChart();
    initYoYChart();
    initStressChart();
    
    // Add animation classes
    document.querySelectorAll('.analysis-section').forEach((section, index) => {
        section.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s forwards`;
        section.style.opacity = '0';
    });
    
    // Add CSS animations if not present
    addAnimationStyles();
}

/**
 * Add animation styles
 */
function addAnimationStyles() {
    if (!document.querySelector('#analysis-styles')) {
        const style = document.createElement('style');
        style.id = 'analysis-styles';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .metric-card {
                transition: all 0.3s ease;
            }
            
            .metric-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 12px rgba(40, 167, 69, 0.2);
            }
            
            .nav-pills .nav-link {
                transition: all 0.3s ease;
            }
            
            .nav-pills .nav-link:hover {
                transform: translateX(5px);
            }
            
            .status-good {
                color: #28a745;
                animation: pulse 2s infinite;
            }
            
            .status-warning {
                color: #ffc107;
            }
            
            .status-bad {
                color: #dc3545;
            }
            
            .chart-container {
                position: relative;
                margin: 20px 0;
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .data-table {
                font-size: 14px;
            }
            
            .data-table th {
                background-color: #28a745;
                color: white;
                font-weight: 500;
            }
            
            .data-table tr:hover {
                background-color: #f8f9fa;
            }
            
            .export-btn {
                transition: all 0.3s ease;
            }
            
            .export-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
            }
            
            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255,255,255,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                border-radius: 8px;
            }
            
            .index-description {
                font-size: 11px;
                color: #6c757d;
                margin-top: 5px;
            }
            
            .comparison-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .trend-up {
                color: #28a745;
            }
            
            .trend-down {
                color: #dc3545;
            }
            
            .info-tooltip {
                cursor: help;
                border-bottom: 1px dotted #28a745;
            }
            
            .kenya-badge {
                background-color: #28a745;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                margin-left: 8px;
            }
            
            .crop-icon {
                width: 24px;
                height: 24px;
                margin-right: 8px;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Load analysis data from API
 */
async function loadAnalysisData() {
    showLoading(true);
    
    try {
        // Get parameters from URL or session
        const params = new URLSearchParams(window.location.search);
        const aoi = params.get('aoi') || sessionStorage.getItem('aoi');
        const startDate = params.get('start') || document.getElementById('analysis-date').value;
        const endDate = params.get('end') || new Date().toISOString().split('T')[0];
        
        if (!aoi) {
            console.warn('No AOI specified, using Kenya sample data');
            loadKenyaSampleData();
            return;
        }
        
        // Call API
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                aoi: JSON.parse(aoi),
                start_date: startDate,
                end_date: endDate,
                analysis_type: 'all'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            analysisData = data.results;
            updateAnalysisDisplay(data);
            showNotification('Analysis data loaded successfully', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error loading analysis data:', error);
        showNotification('Error loading analysis data. Using Kenya sample data.', 'warning');
        loadKenyaSampleData();
    } finally {
        showLoading(false);
    }
}

/**
 * Load Kenya-specific sample data for demonstration
 */
function loadKenyaSampleData() {
    analysisData = {
        overview: {
            area: 582.6,
            agricultural_area: 423.8,
            avg_ndvi: 0.68,
            avg_moisture: 0.32,
            avg_temperature: 24.8,
            precipitation: 185,
            climate_zone: 'Tropical Highlands',
            region: 'Rift Valley, Kenya'
        },
        vegetation: {
            ndvi: { min: -0.12, max: 0.85, mean: 0.68, std: 0.16 },
            evi: { min: -0.06, max: 0.88, mean: 0.65, std: 0.18 },
            savi: { min: -0.10, max: 0.82, mean: 0.62, std: 0.15 },
            msavi: { min: -0.08, max: 0.84, mean: 0.67, std: 0.16 },
            ndre: { min: -0.04, max: 0.58, mean: 0.42, std: 0.11 },
            gndvi: { min: -0.06, max: 0.72, mean: 0.54, std: 0.13 },
            arvi: { min: -0.10, max: 0.82, mean: 0.65, std: 0.15 },
            psri: { min: -0.08, max: 0.38, mean: 0.15, std: 0.07 },
            cig: { min: 0.4, max: 4.8, mean: 2.9, std: 0.8 },
            cire: { min: 0.2, max: 4.2, mean: 2.5, std: 0.7 }
        },
        crop: {
            distribution: {
                'Maize': 45,
                'Tea': 18,
                'Coffee': 12,
                'Wheat': 10,
                'Sugarcane': 8,
                'Other': 7
            },
            health: {
                'Maize': { ndvi: 0.75, lai: 3.8, chlorophyll: 40, stage: 'Tasseling' },
                'Tea': { ndvi: 0.82, lai: 4.5, chlorophyll: 48, stage: 'Harvesting' },
                'Coffee': { ndvi: 0.71, lai: 3.5, chlorophyll: 38, stage: 'Berry Development' },
                'Wheat': { ndvi: 0.58, lai: 2.5, chlorophyll: 32, stage: 'Senescence' },
                'Sugarcane': { ndvi: 0.79, lai: 4.2, chlorophyll: 44, stage: 'Grand Growth' }
            },
            stress: {
                'No Stress': 58,
                'Mild Stress': 25,
                'Moderate Stress': 12,
                'Severe Stress': 5
            },
            stress_causes: {
                'Water Stress': 22,
                'Nutrient Stress': 18,
                'Pest/Disease': 12,
                'Temperature': 8
            }
        },
        soil: {
            types: {
                'Nitisols': 35,
                'Andosols': 25,
                'Ferralsols': 20,
                'Cambisols': 12,
                'Other': 8
            },
            properties: {
                moisture: 32,
                ph: 5.8,
                organic_matter: 3.2,
                bulk_density: 1.28
            },
            minerals: {
                'Nitrogen': 75,
                'Phosphorus': 52,
                'Potassium': 88,
                'Calcium': 72,
                'Magnesium': 68,
                'Sulfur': 58
            },
            indices: {
                bsi: 0.22,
                clay: 1.45,
                iron: 1.72,
                ferrous: 0.92
            }
        },
        yield: {
            total: 1450.5,
            average: 3.4,
            min: 1.8,
            max: 85.0,
            by_crop: {
                'Maize': { area: 190.7, yield: 3.2, total: 610.2 },
                'Tea': { area: 76.3, yield: 2.5, total: 190.8 },
                'Coffee': { area: 50.9, yield: 1.8, total: 91.6 },
                'Wheat': { area: 42.4, yield: 2.8, total: 118.7 },
                'Sugarcane': { area: 33.9, yield: 85.0, total: 2881.5 },
                'Other': { area: 29.7, yield: 2.0, total: 59.4 }
            },
            factors: {
                vegetation: 82,
                fertility: 68,
                weather: -5,
                historical: 8
            }
        },
        timeseries: {
            ndvi_2024: [0.18, 0.22, 0.32, 0.48, 0.62, 0.71, 0.68, 0.65, 0.58, 0.48, 0.32, 0.22],
            ndvi_2023: [0.19, 0.24, 0.35, 0.52, 0.65, 0.73, 0.70, 0.67, 0.60, 0.50, 0.35, 0.24],
            evi_2024: [0.14, 0.18, 0.28, 0.44, 0.58, 0.68, 0.65, 0.62, 0.55, 0.45, 0.28, 0.18],
            ndre_2024: [0.09, 0.12, 0.19, 0.32, 0.45, 0.52, 0.48, 0.45, 0.38, 0.28, 0.16, 0.10],
            ndmi_2024: [0.28, 0.32, 0.38, 0.42, 0.45, 0.42, 0.38, 0.35, 0.32, 0.38, 0.42, 0.35],
            phenology: {
                'Maize': { sos: 'Mar 20', peak: '0.75 (Jun 15)', eos: 'Aug 30', length: 163, rate: 0.014 },
                'Tea': { sos: 'Feb 10', peak: '0.82 (May 20)', eos: 'Dec 15', length: 308, rate: 0.009 },
                'Coffee': { sos: 'Mar 05', peak: '0.71 (Jul 10)', eos: 'Nov 20', length: 260, rate: 0.011 },
                'Wheat': { sos: 'Apr 01', peak: '0.58 (Jun 30)', eos: 'Aug 15', length: 136, rate: 0.013 }
            }
        },
        recommendations: {
            high: [
                { action: 'Apply nitrogen fertilizer in maize fields', area: '45 ha', timeline: '7 days', impact: '+15% yield' },
                { action: 'Irrigation in Eastern region', amount: '20mm', timeline: '3 days', impact: 'Prevent water stress' },
                { action: 'Tea pest monitoring', location: 'Kericho', timeline: 'Immediate', impact: 'Early detection' }
            ],
            medium: [
                { action: 'Coffee berry borer control', crop: 'Coffee', timeline: '14 days', impact: 'Protect harvest' },
                { action: 'Soil sampling in low-yield zones', samples: '30 cores', timeline: '2 weeks', impact: 'Diagnose issues' },
                { action: 'Sugarcane nutrient management', areas: 'Western Kenya', timeline: '10 days', impact: 'Improve yield' }
            ],
            low: [
                { action: 'Harvest planning for wheat', date: 'August 15-30', impact: 'Optimize timing' },
                { action: 'Equipment maintenance', equipment: 'Sprayer calibration', timeline: 'Next month', impact: 'Ready for use' },
                { action: 'Update field records', data: 'Yield estimates', impact: 'Better planning' }
            ],
            zones: [
                { zone: 'Rift Valley', area: '210 ha', issue: 'Moderate drought stress', recommendation: 'Supplemental irrigation', timeline: '7 days' },
                { zone: 'Central Highlands', area: '156 ha', issue: 'Coffee berry borer', recommendation: 'Integrated pest management', timeline: '14 days' },
                { zone: 'Western Kenya', area: '98 ha', issue: 'Nutrient deficiency', recommendation: 'Apply NPK fertilizer', timeline: '10 days' },
                { zone: 'Eastern Kenya', area: '76 ha', issue: 'Soil erosion', recommendation: 'Terracing and cover crops', timeline: '30 days' }
            ],
            impact: {
                yield_increase: 10,
                additional_revenue: 850000,
                roi: 78,
                water_savings: 12
            }
        }
    };
    
    updateAnalysisDisplay({ results: analysisData });
    console.log('Kenya sample data loaded');
}

/**
 * Update analysis display with data
 */
function updateAnalysisDisplay(data) {
    if (!data || !data.results) return;
    
    const results = data.results;
    
    // Update overview stats
    updateOverviewStats(results);
    
    // Update vegetation indices table
    updateVegetationTable(results);
    
    // Update crop analysis
    updateCropAnalysis(results);
    
    // Update soil analysis
    updateSoilAnalysis(results);
    
    // Update yield estimation
    updateYieldEstimation(results);
    
    // Update time series
    updateTimeSeries(results);
    
    // Update recommendations
    updateRecommendations(results);
    
    // Update quick stats in sidebar
    updateQuickStats(results);
}

/**
 * Update overview statistics
 */
function updateOverviewStats(results) {
    const overview = results.overview || analysisData.overview;
    
    const elements = {
        'area-size': overview.area + ' hectares',
        'avg-ndvi': overview.avg_ndvi.toFixed(2),
        'dominant-crop': 'Maize (45%)',
        'soil-type': 'Nitisols',
        'est-yield': overview.avg_ndvi ? '3.4 tons/ha' : 'N/A'
    };
    
    for (let [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
    
    // Update overview metrics
    document.getElementById('overview-ndvi').textContent = overview.avg_ndvi.toFixed(2);
    document.getElementById('overview-moisture').textContent = overview.avg_moisture.toFixed(2);
    document.getElementById('overview-temp').textContent = overview.avg_temperature + '°C';
    document.getElementById('overview-rain').textContent = overview.precipitation + 'mm';
}

/**
 * Update vegetation indices table
 */
function updateVegetationTable(results) {
    const veg = results.vegetation || analysisData.vegetation;
    
    const tableBody = document.querySelector('#vegetation .table tbody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    if (rows.length) {
        const indices = ['ndvi', 'evi', 'savi', 'msavi', 'ndre', 'gndvi', 'arvi', 'psri', 'cig', 'cire'];
        
        rows.forEach((row, index) => {
            if (index < indices.length) {
                const indexName = indices[index];
                const data = veg[indexName];
                if (data) {
                    const valueCell = row.cells[2];
                    if (valueCell) {
                        const value = typeof data === 'object' ? data.mean : data;
                        valueCell.textContent = value.toFixed(2);
                        
                        // Add color class based on value
                        valueCell.className = '';
                        if (indexName === 'psri') {
                            valueCell.classList.add(value > 0.2 ? 'status-warning' : 'status-good');
                        } else {
                            valueCell.classList.add(value > 0.5 ? 'status-good' : value > 0.3 ? 'status-warning' : 'status-bad');
                        }
                    }
                }
            }
        });
    }
}

/**
 * Update crop analysis
 */
function updateCropAnalysis(results) {
    const crop = results.crop || analysisData.crop;
    
    // Update crop distribution chart
    if (crop.distribution && charts.cropPie) {
        charts.cropPie.data.labels = Object.keys(crop.distribution);
        charts.cropPie.data.datasets[0].data = Object.values(crop.distribution);
        charts.cropPie.update();
    }
    
    // Update crop health cards
    if (crop.health) {
        const cropNames = Object.keys(crop.health);
        const cards = document.querySelectorAll('.card-header.bg-success, .card-header.bg-warning');
        
        cropNames.forEach((cropName, index) => {
            const health = crop.health[cropName];
            if (cards[index]) {
                const card = cards[index].closest('.card');
                if (card) {
                    const progressBars = card.querySelectorAll('.progress-bar');
                    if (progressBars.length >= 3) {
                        progressBars[0].style.width = health.ndvi * 100 + '%';
                        progressBars[0].textContent = (health.ndvi * 100).toFixed(0) + '%';
                        
                        progressBars[1].style.width = (health.lai / 6) * 100 + '%';
                        progressBars[1].textContent = health.lai.toFixed(1) + ' m²/m²';
                        
                        progressBars[2].style.width = (health.chlorophyll / 50) * 100 + '%';
                        progressBars[2].textContent = health.chlorophyll + ' µg/cm²';
                    }
                    
                    const stageEl = card.querySelector('.text-muted');
                    if (stageEl) {
                        stageEl.textContent = 'Growth Stage: ' + health.stage;
                    }
                }
            }
        });
    }
    
    // Update stress chart
    if (crop.stress && charts.stress) {
        charts.stress.data.labels = Object.keys(crop.stress);
        charts.stress.data.datasets[0].data = Object.values(crop.stress);
        charts.stress.update();
    }
}

/**
 * Update soil analysis
 */
function updateSoilAnalysis(results) {
    const soil = results.soil || analysisData.soil;
    
    // Update soil properties
    if (soil.properties) {
        const properties = soil.properties;
        const propertyElements = document.querySelectorAll('.metric-card .metric-value');
        if (propertyElements.length >= 4) {
            propertyElements[0].textContent = properties.moisture + '%';
            propertyElements[1].textContent = properties.ph + ' pH';
            propertyElements[2].textContent = properties.organic_matter + '%';
            propertyElements[3].textContent = properties.bulk_density + ' g/cm³';
        }
    }
    
    // Update soil indices table
    if (soil.indices) {
        const table = document.querySelector('#soil .table');
        if (table) {
            const rows = table.querySelectorAll('tbody tr');
            if (rows.length >= 4) {
                rows[0].cells[2].textContent = soil.indices.bsi.toFixed(2);
                rows[1].cells[2].textContent = soil.indices.clay.toFixed(2);
                rows[2].cells[2].textContent = soil.indices.iron.toFixed(2);
                rows[3].cells[2].textContent = soil.indices.ferrous.toFixed(2);
            }
        }
    }
    
    // Update mineral chart
    if (soil.minerals && charts.mineral) {
        charts.mineral.data.datasets[0].data = Object.values(soil.minerals);
        charts.mineral.update();
    }
}

/**
 * Update yield estimation
 */
function updateYieldEstimation(results) {
    const yield_data = results.yield || analysisData.yield;
    
    // Update yield summary
    const totalYield = document.querySelector('#yield h2.text-success');
    if (totalYield) {
        totalYield.textContent = yield_data.total.toFixed(1) + ' tons';
    }
    
    const avgYield = document.querySelector('#yield .col-6 h6');
    if (avgYield) {
        avgYield.textContent = yield_data.average.toFixed(1) + ' t/ha';
    }
    
    // Update yield by crop chart
    if (yield_data.by_crop && charts.yieldByCrop) {
        const crops = Object.keys(yield_data.by_crop);
        const yields = crops.map(c => yield_data.by_crop[c].yield);
        
        charts.yieldByCrop.data.labels = crops;
        charts.yieldByCrop.data.datasets[0].data = yields;
        charts.yieldByCrop.update();
    }
    
    // Update yield factors
    if (yield_data.factors) {
        const factors = yield_data.factors;
        const factorElements = document.querySelectorAll('#yield .col-md-3');
        if (factorElements.length >= 4) {
            const vegFactor = factorElements[0].querySelector('h3');
            const fertFactor = factorElements[1].querySelector('h3');
            const weatherFactor = factorElements[2].querySelector('h3');
            const histFactor = factorElements[3].querySelector('h3');
            
            if (vegFactor) {
                vegFactor.textContent = factors.vegetation + '%';
                vegFactor.className = factors.vegetation > 70 ? 'text-success' : 'text-warning';
            }
            if (fertFactor) {
                fertFactor.textContent = factors.fertility + '%';
                fertFactor.className = factors.fertility > 70 ? 'text-success' : 'text-warning';
            }
            if (weatherFactor) {
                weatherFactor.textContent = (factors.weather > 0 ? '+' : '') + factors.weather + '%';
                weatherFactor.className = factors.weather > 0 ? 'text-success' : 'text-danger';
            }
            if (histFactor) {
                histFactor.textContent = (factors.historical > 0 ? '+' : '') + factors.historical + '%';
                histFactor.className = factors.historical > 0 ? 'text-success' : 'text-danger';
            }
        }
    }
}

/**
 * Update time series
 */
function updateTimeSeries(results) {
    const ts = results.timeseries || analysisData.timeseries;
    
    // Update main time series chart
    if (ts.ndvi_2024 && charts.timeseriesMain) {
        charts.timeseriesMain.data.datasets[0].data = ts.ndvi_2024;
        charts.timeseriesMain.data.datasets[1].data = ts.ndvi_2023;
        charts.timeseriesMain.update();
    }
    
    // Update phenology table
    if (ts.phenology) {
        const table = document.querySelector('#timeseries .table tbody');
        if (table) {
            const rows = table.querySelectorAll('tr');
            if (rows.length >= 5) {
                const crops = ['Maize', 'Tea', 'Coffee', 'Wheat'];
                crops.forEach((crop, index) => {
                    const pheno = ts.phenology[crop];
                    if (pheno && rows[index]) {
                        const cells = rows[index].querySelectorAll('td');
                        if (cells.length >= 5) {
                            cells[0].textContent = crop;
                            cells[1].textContent = pheno.sos;
                            cells[2].textContent = pheno.peak;
                            cells[3].textContent = pheno.eos;
                            cells[4].textContent = pheno.length + ' days';
                        }
                    }
                });
            }
        }
    }
}

/**
 * Update recommendations
 */
function updateRecommendations(results) {
    const rec = results.recommendations || analysisData.recommendations;
    
    // Update high priority
    if (rec.high) {
        const highList = document.querySelector('.border-danger .list-unstyled');
        if (highList) {
            highList.innerHTML = rec.high.map(item => `
                <li class="mb-3">
                    <i class="fas fa-exclamation-circle text-danger me-2"></i>
                    <strong>${item.action}</strong>
                    <p class="small text-muted mt-1">${item.area || item.amount || item.location || ''} - Timeline: ${item.timeline}</p>
                </li>
            `).join('');
        }
    }
    
    // Update medium priority
    if (rec.medium) {
        const mediumList = document.querySelector('.border-warning .list-unstyled');
        if (mediumList) {
            mediumList.innerHTML = rec.medium.map(item => `
                <li class="mb-3">
                    <i class="fas fa-clock text-warning me-2"></i>
                    <strong>${item.action}</strong>
                    <p class="small text-muted mt-1">${item.crop || item.samples || item.areas || ''} - Timeline: ${item.timeline}</p>
                </li>
            `).join('');
        }
    }
    
    // Update low priority
    if (rec.low) {
        const lowList = document.querySelector('.border-success .list-unstyled');
        if (lowList) {
            lowList.innerHTML = rec.low.map(item => `
                <li class="mb-3">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <strong>${item.action}</strong>
                    <p class="small text-muted mt-1">${item.date || item.equipment || item.data || ''} - Impact: ${item.impact}</p>
                </li>
            `).join('');
        }
    }
    
    // Update zone table
    if (rec.zones) {
        const zoneTable = document.querySelector('#recommendations .table tbody');
        if (zoneTable) {
            zoneTable.innerHTML = rec.zones.map(zone => `
                <tr>
                    <td>${zone.zone}</td>
                    <td>${zone.area}</td>
                    <td>${zone.issue}</td>
                    <td>${zone.recommendation}</td>
                    <td>${zone.timeline}</td>
                </tr>
            `).join('');
        }
    }
    
    // Update impact stats
    if (rec.impact) {
        const impact = rec.impact;
        const impactElements = document.querySelectorAll('.bg-light .col-md-3');
        if (impactElements.length >= 4) {
            impactElements[0].querySelector('h5').textContent = '+' + impact.yield_increase + '%';
            impactElements[1].querySelector('h5').textContent = 'KSh ' + (impact.additional_revenue * 130).toLocaleString();
            impactElements[2].querySelector('h5').textContent = impact.roi + '%';
            impactElements[3].querySelector('h5').textContent = impact.water_savings + '%';
        }
    }
}

/**
 * Update quick stats in sidebar
 */
function updateQuickStats(results) {
    const overview = results.overview || analysisData.overview;
    const crop = results.crop || analysisData.crop;
    const soil = results.soil || analysisData.soil;
    const yield_data = results.yield || analysisData.yield;
    
    document.getElementById('area-size').textContent = overview.area.toFixed(1) + ' hectares';
    document.getElementById('avg-ndvi').textContent = overview.avg_ndvi.toFixed(2);
    document.getElementById('dominant-crop').textContent = 'Maize (' + crop.distribution.Maize + '%)';
    document.getElementById('soil-type').textContent = Object.keys(soil.types)[0];
    document.getElementById('est-yield').textContent = yield_data.average.toFixed(1) + ' t/ha';
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Index selector change
    document.getElementById('primary-index')?.addEventListener('change', updateIndexMap);
    document.getElementById('secondary-index')?.addEventListener('change', updateIndexMap);
    document.getElementById('color-palette')?.addEventListener('change', updateIndexMap);
    
    // Time series controls
    document.getElementById('ts-index')?.addEventListener('change', updateTimeSeriesChart);
    document.getElementById('ts-crop')?.addEventListener('change', updateTimeSeriesChart);
    document.getElementById('ts-year')?.addEventListener('change', updateTimeSeriesChart);
    document.getElementById('ts-smooth')?.addEventListener('change', updateTimeSeriesChart);
    
    // Compare indices button
    document.getElementById('compare-indices')?.addEventListener('click', openComparisonTool);
    
    // Export buttons
    document.getElementById('export-indices')?.addEventListener('click', () => exportData('indices'));
    document.getElementById('export-full-report')?.addEventListener('click', exportFullReport);
    document.getElementById('download-pdf')?.addEventListener('click', () => downloadReport('pdf'));
    document.getElementById('download-csv')?.addEventListener('click', () => downloadReport('csv'));
    
    // Refresh button
    document.getElementById('refresh-analysis')?.addEventListener('click', refreshAnalysis);
    
    // Tab change events
    document.querySelectorAll('[data-bs-toggle="pill"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
            // Refresh charts in active tab
            const target = e.target.getAttribute('data-bs-target');
            if (target === '#timeseries' && charts.timeseriesMain) {
                charts.timeseriesMain.update();
            }
            if (target === '#crop' && charts.cropPie) {
                charts.cropPie.update();
            }
        });
    });
}

/**
 * Update index map based on selections
 */
function updateIndexMap() {
    const primary = document.getElementById('primary-index').value;
    const secondary = document.getElementById('secondary-index').value;
    const palette = document.getElementById('color-palette').value;
    
    console.log('Updating index map for Kenya:', { primary, secondary, palette });
    
    // In production, this would update the map layer
    showNotification(`Displaying ${primary.toUpperCase()} index for Kenyan region`, 'info');
}

/**
 * Update time series chart
 */
function updateTimeSeriesChart() {
    const index = document.getElementById('ts-index').value;
    const crop = document.getElementById('ts-crop').value;
    const year = document.getElementById('ts-year').value;
    const smooth = document.getElementById('ts-smooth').value;
    
    console.log('Updating time series:', { index, crop, year, smooth });
    
    if (charts.timeseriesMain) {
        // In production, this would fetch new data
        if (year === 'compare') {
            charts.timeseriesMain.data.datasets = [
                { label: 'NDVI 2024', data: analysisData.timeseries.ndvi_2024, borderColor: '#28a745' },
                { label: 'NDVI 2023', data: analysisData.timeseries.ndvi_2023, borderColor: '#ffc107' }
            ];
        } else {
            const yearData = analysisData.timeseries[`${index}_${year}`] || analysisData.timeseries.ndvi_2024;
            charts.timeseriesMain.data.datasets = [{
                label: `${index.toUpperCase()} ${year}`,
                data: yearData,
                borderColor: '#28a745'
            }];
        }
        charts.timeseriesMain.update();
    }
}

/**
 * Open comparison tool
 */
function openComparisonTool() {
    // Create modal for index comparison
    const modalHtml = `
        <div class="modal fade" id="comparisonModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">Index Comparison Tool - Kenya</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <canvas id="comparison-chart-1"></canvas>
                            </div>
                            <div class="col-md-6">
                                <canvas id="comparison-chart-2"></canvas>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-12">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Index</th>
                                            <th>Correlation</th>
                                            <th>Best Use in Kenya</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>NDVI vs EVI</td>
                                            <td>0.92</td>
                                            <td>NDVI for general, EVI for high biomass (tea/forest)</td>
                                        </tr>
                                        <tr>
                                            <td>NDVI vs NDRE</td>
                                            <td>0.85</td>
                                            <td>NDRE for tea plantations and coffee stress</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('comparisonModal'));
    modal.show();
    
    // Clean up on hide
    document.getElementById('comparisonModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * Export data
 */
function exportData(type) {
    let data, filename;
    
    switch(type) {
        case 'indices':
            data = analysisData.vegetation;
            filename = 'kenya_vegetation_indices.json';
            break;
        default:
            data = analysisData;
            filename = 'kenya_analysis_data.json';
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${filename}`, 'success');
}

/**
 * Export full report
 */
function exportFullReport() {
    showNotification('Generating full Kenya analysis report...', 'info');
    
    setTimeout(() => {
        const report = {
            generated: new Date().toISOString(),
            country: 'Kenya',
            data: analysisData,
            summary: {
                area: analysisData.overview.area,
                dominant_crop: 'Maize',
                avg_yield: analysisData.yield.average,
                recommendations: analysisData.recommendations.high.length
            }
        };
        
        exportData('full');
        showNotification('Kenya analysis report generated successfully', 'success');
    }, 2000);
}

/**
 * Download report in specific format
 */
function downloadReport(format) {
    showNotification(`Downloading ${format.toUpperCase()} Kenya report...`, 'info');
    
    setTimeout(() => {
        if (format === 'csv') {
            // Convert data to CSV
            const csv = convertToCSV(analysisData);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'kenya_analysis_report.csv';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // Simulate PDF download
            showNotification('PDF generation coming soon for Kenya reports', 'warning');
        }
    }, 1500);
}

/**
 * Convert data to CSV
 */
function convertToCSV(data) {
    let csv = 'Section,Parameter,Value,Unit\n';
    
    // Add overview data
    if (data.overview) {
        Object.entries(data.overview).forEach(([key, value]) => {
            csv += `Overview,${key},${value},\n`;
        });
    }
    
    // Add vegetation data
    if (data.vegetation) {
        Object.entries(data.vegetation).forEach(([key, value]) => {
            if (typeof value === 'object') {
                csv += `Vegetation,${key}_mean,${value.mean},\n`;
                csv += `Vegetation,${key}_min,${value.min},\n`;
                csv += `Vegetation,${key}_max,${value.max},\n`;
            } else {
                csv += `Vegetation,${key},${value},\n`;
            }
        });
    }
    
    // Add crop data
    if (data.crop && data.crop.distribution) {
        Object.entries(data.crop.distribution).forEach(([crop, percentage]) => {
            csv += `Crops,${crop}_distribution,${percentage},%\n`;
        });
    }
    
    return csv;
}

/**
 * Refresh analysis
 */
function refreshAnalysis() {
    const date = document.getElementById('analysis-date').value;
    showLoading(true);
    
    setTimeout(() => {
        showLoading(false);
        showNotification(`Kenya analysis refreshed for ${date}`, 'success');
    }, 2000);
}

/**
 * Initialize tooltips
 */
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Add info tooltips to indices
    document.querySelectorAll('.index-description').forEach(el => {
        el.setAttribute('data-bs-toggle', 'tooltip');
        el.setAttribute('data-bs-placement', 'top');
        new bootstrap.Tooltip(el);
    });
}

/**
 * Initialize download buttons
 */
function initDownloadButtons() {
    // Add download handlers to all export buttons
    document.querySelectorAll('[id^="download-"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const format = this.id.replace('download-', '');
            downloadReport(format);
        });
    });
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    let overlay = document.querySelector('.loading-overlay');
    
    if (show) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-success mb-3" style="width: 3rem; height: 3rem;" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h5 class="text-success">Loading Kenya Analysis Data...</h5>
                    <p class="text-muted">Processing satellite imagery for Kenyan region</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    } else {
        if (overlay) {
            overlay.remove();
        }
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.innerHTML = `
        <strong>${type.toUpperCase()}:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Store map instances
const maps = {};

// Map initialization functions (Kenya-focused with satellite and OSM layers)
function initOverviewMap() {
    const container = document.getElementById('overview-map');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create map
    maps.overview = L.map('overview-map').setView([0.5, 37.5], 6);
    
    // Define tile layers
    const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Satellite'
    });
    
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });
    
    // Add default layer (satellite)
    satelliteLayer.addTo(maps.overview);
    
    // Add layer control
    const baseMaps = {
        "Satellite": satelliteLayer,
        "OpenStreetMap": osmLayer
    };
    L.control.layers(baseMaps).addTo(maps.overview);
    
    // Add Kenya outline
    L.polygon([
        [5.0, 33.5], [5.0, 41.5], [-5.0, 41.5], [-5.0, 33.5]
    ], { color: '#28a745', weight: 2, fillOpacity: 0.1 }).addTo(maps.overview).bindPopup('Kenya');
    
    // Add major cities
    const cityIcon = L.divIcon({
        className: 'city-marker',
        html: '<i class="fas fa-map-marker-alt" style="color: #dc3545; font-size: 20px;"></i>',
        iconSize: [20, 20]
    });
    
    L.marker([-1.2864, 36.8172], {icon: cityIcon}).addTo(maps.overview).bindPopup('<b>Nairobi</b><br>Capital City');
    L.marker([-4.0435, 39.6682], {icon: cityIcon}).addTo(maps.overview).bindPopup('<b>Mombasa</b><br>Coastal City');
    L.marker([0.5143, 35.2698], {icon: cityIcon}).addTo(maps.overview).bindPopup('<b>Eldoret</b><br>Agricultural Hub');
    L.marker([-0.2833, 36.0667], {icon: cityIcon}).addTo(maps.overview).bindPopup('<b>Nakuru</b><br>Rift Valley');
    L.marker([-0.1000, 34.7500], {icon: cityIcon}).addTo(maps.overview).bindPopup('<b>Kisumu</b><br>Lake Victoria');
}

function initIndexMap() {
    const container = document.getElementById('index-map');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    maps.index = L.map('index-map').setView([0.5, 37.5], 6);
    
    // Define tile layers
    const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Satellite'
    });
    
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });
    
    satelliteLayer.addTo(maps.index);
    
    const baseMaps = {
        "Satellite": satelliteLayer,
        "OpenStreetMap": osmLayer
    };
    L.control.layers(baseMaps).addTo(maps.index);
    
    // Add NDVI zones
    L.rectangle([[1.0, 35.0], [0.0, 36.0]], { 
        color: '#28a745', weight: 2, fillColor: '#28a745', fillOpacity: 0.3 
    }).addTo(maps.index).bindPopup('<b>High NDVI</b><br>Value: 0.75-0.85<br>Tea Region - Kericho');
    
    L.rectangle([[0.0, 36.5], [-1.0, 37.5]], { 
        color: '#ffc107', weight: 2, fillColor: '#ffc107', fillOpacity: 0.3 
    }).addTo(maps.index).bindPopup('<b>Medium NDVI</b><br>Value: 0.55-0.70<br>Mixed Farming - Central Highlands');
    
    L.rectangle([[0.5, 34.0], [-0.5, 35.0]], { 
        color: '#fd7e14', weight: 2, fillColor: '#fd7e14', fillOpacity: 0.3 
    }).addTo(maps.index).bindPopup('<b>Moderate NDVI</b><br>Value: 0.45-0.60<br>Sugarcane Zone');
}

function initCropMap() {
    const container = document.getElementById('crop-map');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    maps.crop = L.map('crop-map').setView([0.5, 37.5], 6);
    
    // Define tile layers
    const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Satellite'
    });
    
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });
    
    satelliteLayer.addTo(maps.crop);
    
    const baseMaps = {
        "Satellite": satelliteLayer,
        "OpenStreetMap": osmLayer
    };
    L.control.layers(baseMaps).addTo(maps.crop);
    
    // Add crop zones
    const cropZones = [
        { coords: [[1.5, 35.0], [1.5, 36.0], [0.5, 36.0], [0.5, 35.0]], color: '#28a745', crop: 'Maize', icon: '🌽', desc: 'Rift Valley' },
        { coords: [[-0.5, 36.5], [-0.5, 37.5], [-1.5, 37.5], [-1.5, 36.5]], color: '#17a2b8', crop: 'Coffee', icon: '🫘', desc: 'Central Highlands' },
        { coords: [[0.0, 34.5], [0.0, 35.5], [-1.0, 35.5], [-1.0, 34.5]], color: '#ffc107', crop: 'Tea', icon: '🍃', desc: 'Kericho Region' },
        { coords: [[0.5, 34.0], [0.5, 34.8], [-0.3, 34.8], [-0.3, 34.0]], color: '#fd7e14', crop: 'Sugarcane', icon: '🌿', desc: 'Western Kenya' }
    ];
    
    cropZones.forEach(zone => {
        L.polygon(zone.coords, { color: zone.color, weight: 2, fillColor: zone.color, fillOpacity: 0.2 })
            .addTo(maps.crop).bindPopup(`<b>${zone.icon} ${zone.crop}</b><br>${zone.desc}`);
    });
}

function initSoilMap() {
    const container = document.getElementById('soil-map');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    maps.soil = L.map('soil-map').setView([0.5, 37.5], 6);
    
    // Define tile layers
    const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Satellite'
    });
    
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });
    
    satelliteLayer.addTo(maps.soil);
    
    const baseMaps = {
        "Satellite": satelliteLayer,
        "OpenStreetMap": osmLayer
    };
    L.control.layers(baseMaps).addTo(maps.soil);
    
    // Add soil zones
    const soilZones = [
        { coords: [[1.0, 35.0], [1.0, 37.0], [-1.0, 37.0], [-1.0, 35.0]], color: '#8B4513', soil: 'Nitisols', desc: 'High fertility' },
        { coords: [[0.0, 37.0], [0.0, 39.0], [-2.0, 39.0], [-2.0, 37.0]], color: '#A0522D', soil: 'Ferralsols', desc: 'Deep weathered' },
        { coords: [[1.0, 34.0], [1.0, 35.0], [-1.0, 35.0], [-1.0, 34.0]], color: '#D2B48C', soil: 'Andosols', desc: 'Volcanic soils' }
    ];
    
    soilZones.forEach(zone => {
        L.polygon(zone.coords, { color: zone.color, weight: 2, fillColor: zone.color, fillOpacity: 0.3 })
            .addTo(maps.soil).bindPopup(`<b>${zone.soil}</b><br>${zone.desc}`);
    });
}

function initYieldMap() {
    const container = document.getElementById('yield-map');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    maps.yield = L.map('yield-map').setView([0.5, 37.5], 6);
    
    // Define tile layers
    const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Satellite'
    });
    
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });
    
    satelliteLayer.addTo(maps.yield);
    
    const baseMaps = {
        "Satellite": satelliteLayer,
        "OpenStreetMap": osmLayer
    };
    L.control.layers(baseMaps).addTo(maps.yield);
    
    // Add yield zones
    const yieldZones = [
        { center: [0.5, 35.5], radius: 80000, color: '#28a745', yield: '3.5-4.0', crop: 'Maize' },
        { center: [-0.8, 37.0], radius: 60000, color: '#ffc107', yield: '1.8-2.2', crop: 'Coffee' },
        { center: [-0.2, 35.2], radius: 70000, color: '#17a2b8', yield: '2.2-2.8', crop: 'Tea' },
        { center: [0.2, 34.8], radius: 50000, color: '#fd7e14', yield: '80-95', crop: 'Sugarcane' }
    ];
    
    yieldZones.forEach(zone => {
        L.circle(zone.center, { radius: zone.radius, color: zone.color, fillColor: zone.color, fillOpacity: 0.3, weight: 2 })
            .addTo(maps.yield).bindPopup(`<b>${zone.crop} Zone</b><br>Yield: ${zone.yield} t/ha`);
    });
}

function initZoneMap() {
    const container = document.getElementById('zone-map');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    maps.zone = L.map('zone-map').setView([0.5, 37.5], 6);
    
    // Define tile layers
    const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Satellite'
    });
    
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });
    
    satelliteLayer.addTo(maps.zone);
    
    const baseMaps = {
        "Satellite": satelliteLayer,
        "OpenStreetMap": osmLayer
    };
    L.control.layers(baseMaps).addTo(maps.zone);
    
    // Add management zones
    const zones = [
        { coords: [[1.5, 35.0], [1.5, 36.0], [0.5, 36.0], [0.5, 35.0]], color: '#dc3545', name: 'Zone A', desc: 'Rift Valley' },
        { coords: [[0.0, 36.5], [0.0, 37.5], [-1.0, 37.5], [-1.0, 36.5]], color: '#28a745', name: 'Zone B', desc: 'Central Highlands' },
        { coords: [[0.5, 34.5], [0.5, 35.5], [-0.5, 35.5], [-0.5, 34.5]], color: '#ffc107', name: 'Zone C', desc: 'Western Kenya' }
    ];
    
    zones.forEach(zone => {
        L.polygon(zone.coords, { color: zone.color, weight: 2, fillColor: zone.color, fillOpacity: 0.2 })
            .addTo(maps.zone).bindPopup(`<b>${zone.name}</b><br>${zone.desc}`);
    });
}

// Initialize maps only when their tab is shown
function initMapOnTabShow() {
    const tabs = document.querySelectorAll('[data-bs-toggle="pill"]');
    
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
            const targetId = e.target.getAttribute('data-bs-target');
            
            // Small delay to ensure tab is visible
            setTimeout(() => {
                switch(targetId) {
                    case '#overview':
                        if (!maps.overview) initOverviewMap();
                        else maps.overview.invalidateSize();
                        break;
                    case '#vegetation':
                        if (!maps.index) initIndexMap();
                        else maps.index.invalidateSize();
                        break;
                    case '#crop':
                        if (!maps.crop) initCropMap();
                        else maps.crop.invalidateSize();
                        break;
                    case '#soil':
                        if (!maps.soil) initSoilMap();
                        else maps.soil.invalidateSize();
                        break;
                    case '#yield':
                        if (!maps.yield) initYieldMap();
                        else maps.yield.invalidateSize();
                        break;
                    case '#recommendations':
                        if (!maps.zone) initZoneMap();
                        else maps.zone.invalidateSize();
                        break;
                }
            }, 200);
        });
    });
    
    // Initialize the first visible tab (overview)
    setTimeout(() => {
        initOverviewMap();
    }, 500);
}

// Update initAnalysisPage to use the new approach
function initAnalysisPage() {
    console.log('Initializing analysis page for Kenya...');
    
    // Set default date
    const today = new Date();
    const analysisDate = document.getElementById('analysis-date');
    if (analysisDate) {
        analysisDate.value = today.toISOString().split('T')[0];
    }
    
    // Initialize charts (these can be initialized immediately)
    initIndexDistributionChart();
    initCropPieChart();
    initSoilBarChart();
    initMineralChart();
    initYieldByCropChart();
    initTimeseriesMainChart();
    initSeasonalProfileChart();
    initYoYChart();
    initStressChart();
    
    // Initialize maps on tab show
    initMapOnTabShow();
    
    // Add animation classes
    document.querySelectorAll('.analysis-section').forEach((section, index) => {
        section.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s forwards`;
        section.style.opacity = '0';
    });
    
    // Add CSS animations if not present
    addAnimationStyles();
}

// Chart initialization functions
function initIndexDistributionChart() {
    const ctx = document.getElementById('index-distribution-chart')?.getContext('2d');
    if (!ctx) return;
    
    charts.indexDist = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 20 }, (_, i) => (i/20).toFixed(2)),
            datasets: [{
                label: 'NDVI Distribution - Kenya',
                data: [3, 6, 10, 18, 25, 32, 38, 40, 35, 28, 22, 16, 12, 8, 5, 3, 2, 1, 1, 0],
                backgroundColor: '#28a745'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'NDVI Distribution - Kenyan Region' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function initCropPieChart() {
    const ctx = document.getElementById('crop-pie-chart')?.getContext('2d');
    if (!ctx) return;
    
    charts.cropPie = new Chart(ctx, {
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
                legend: { position: 'bottom' },
                title: { display: true, text: 'Crop Distribution - Kenya' }
            }
        }
    });
}

function initSoilBarChart() {
    const ctx = document.getElementById('soil-bar-chart')?.getContext('2d');
    if (!ctx) return;
    
    charts.soilBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Nitisols', 'Andosols', 'Ferralsols', 'Cambisols', 'Other'],
            datasets: [{
                label: 'Percentage (%)',
                data: [35, 25, 20, 12, 8],
                backgroundColor: ['#8B4513', '#A0522D', '#D2B48C', '#DEB887', '#CD853F']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Soil Type Distribution - Kenya' }
            },
            scales: {
                y: { beginAtZero: true, max: 40 }
            }
        }
    });
}

function initMineralChart() {
    const ctx = document.getElementById('mineral-chart')?.getContext('2d');
    if (!ctx) return;
    
    charts.mineral = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Nitrogen', 'Phosphorus', 'Potassium', 'Calcium', 'Magnesium', 'Sulfur'],
            datasets: [{
                label: 'Mineral Content (Relative)',
                data: [75, 52, 88, 72, 68, 58],
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                borderColor: '#28a745',
                pointBackgroundColor: '#28a745'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Soil Mineral Content - Kenya' }
            },
            scales: {
                r: { beginAtZero: true, max: 100 }
            }
        }
    });
}

function initYieldByCropChart() {
    const ctx = document.getElementById('yield-by-crop-chart')?.getContext('2d');
    if (!ctx) return;
    
    charts.yieldByCrop = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Maize', 'Tea', 'Coffee', 'Wheat', 'Sugarcane'],
            datasets: [{
                label: 'Yield (t/ha)',
                data: [3.2, 2.5, 1.8, 2.8, 85.0],
                backgroundColor: '#28a745'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Estimated Yield by Crop - Kenya' }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    type: 'logarithmic',
                    title: { display: true, text: 'Tons per hectare (log scale)' }
                }
            }
        }
    });
}

function initTimeseriesMainChart() {
    const ctx = document.getElementById('timeseries-main-chart')?.getContext('2d');
    if (!ctx) return;
    
    charts.timeseriesMain = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'NDVI 2024 - Kenya',
                    data: [0.18, 0.22, 0.32, 0.48, 0.62, 0.71, 0.68, 0.65, 0.58, 0.48, 0.32, 0.22],
                    borderColor: '#28a745',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'NDVI 2023 - Kenya',
                    data: [0.19, 0.24, 0.35, 0.52, 0.65, 0.73, 0.70, 0.67, 0.60, 0.50, 0.35, 0.24],
                    borderColor: '#ffc107',
                    tension: 0.4,
                    fill: false,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Vegetation Index Time Series - Kenya (2023-2024)' }
            },
            scales: {
                y: { beginAtZero: true, max: 1 }
            }
        }
    });
}

function initSeasonalProfileChart() {
    const ctx = document.getElementById('seasonal-profile-chart')?.getContext('2d');
    if (!ctx) return;
    
    charts.seasonal = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                { label: 'Maize', data: [0.2, 0.25, 0.4, 0.6, 0.75, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2], borderColor: '#28a745' },
                { label: 'Tea', data: [0.7, 0.75, 0.8, 0.82, 0.8, 0.78, 0.75, 0.77, 0.8, 0.82, 0.8, 0.75], borderColor: '#17a2b8' },
                { label: 'Coffee', data: [0.5, 0.55, 0.6, 0.65, 0.7, 0.71, 0.7, 0.68, 0.65, 0.6, 0.55, 0.5], borderColor: '#ffc107' }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Seasonal NDVI Profiles - Kenyan Crops' }
            },
            scales: {
                y: { beginAtZero: true, max: 1 }
            }
        }
    });
}

function initYoYChart() {
    const ctx = document.getElementById('yoy-chart')?.getContext('2d');
    if (!ctx) return;
    
    charts.yoy = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['2020', '2021', '2022', '2023', '2024'],
            datasets: [{
                label: 'Peak NDVI - Kenya',
                data: [0.68, 0.71, 0.69, 0.73, 0.71],
                backgroundColor: '#28a745'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Year-over-Year Peak NDVI - Kenya' }
            },
            scales: {
                y: { beginAtZero: true, max: 1 }
            }
        }
    });
}

function initStressChart() {
    const ctx = document.getElementById('stress-chart')?.getContext('2d');
    if (!ctx) return;
    
    charts.stress = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['No Stress', 'Mild Stress', 'Moderate Stress', 'Severe Stress'],
            datasets: [{
                data: [58, 25, 12, 5],
                backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Crop Stress Distribution - Kenya' }
            }
        }
    });
}

// Export for use in other scripts
window.AgriAnalyzerAnalysis = {
    loadAnalysisData,
    refreshAnalysis,
    exportData,
    downloadReport,
    showNotification,
    updateIndexMap,
    updateTimeSeriesChart
};