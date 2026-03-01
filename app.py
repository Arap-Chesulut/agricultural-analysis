"""
Agricultural Analysis Web Application
Deployable on Render
"""
import os
import json
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
import ee
import geemap
import joblib
from datetime import datetime
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import custom modules
from utils.ee_initializer import initialize_earth_engine
from utils.indices import calculate_all_indices
from utils.crop_analysis import CropAnalyzer
from utils.soil_analysis import SoilAnalyzer


# Add this helper function after imports
def convert_ee_objects(obj):
    """Convert Earth Engine objects to JSON-serializable format"""
    if obj is None:
        return None
    elif isinstance(obj, (str, int, float, bool)):
        return obj
    elif isinstance(obj, (list, tuple)):
        return [convert_ee_objects(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_ee_objects(value) for key, value in obj.items()}
    elif hasattr(obj, 'getInfo'):  # Earth Engine objects have getInfo method
        try:
            return obj.getInfo()
        except:
            return str(obj)
    else:
        try:
            # Try to convert to dict if possible
            if hasattr(obj, '__dict__'):
                return convert_ee_objects(obj.__dict__)
            else:
                return str(obj)
        except:
            return str(obj)
        


        
app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'geojson', 'json', 'zip', 'shp', 'dbf', 'shx'}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Earth Engine
try:
    initialize_earth_engine()
    print("Earth Engine initialized successfully")
except Exception as e:
    print(f"Error initializing Earth Engine: {e}")

# Global analyzers
crop_analyzer = CropAnalyzer()
soil_analyzer = SoilAnalyzer()

# ==================== ROUTES ====================

@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Main dashboard"""
    return render_template('dashboard.html')

@app.route('/analysis')
def analysis_page():
    """Analysis page"""
    return render_template('analysis.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'earth_engine': 'initialized' if ee.data.getAssetRoots() else 'not initialized'
    })

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Main analysis endpoint
    Expects: JSON with aoi coordinates, date range, analysis type
    """
    try:
        data = request.json
        
        # Extract parameters
        aoi_coords = data.get('aoi')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        analysis_type = data.get('analysis_type', 'all')
        
        if not aoi_coords or not start_date or not end_date:
            return jsonify({
                'error': 'Missing required parameters: aoi, start_date, end_date'
            }), 400
        
        # Create Earth Engine geometry
        aoi = ee.Geometry.Polygon(aoi_coords)
        
        # Load and process Sentinel-2 data
        composite = load_sentinel2_data(aoi, start_date, end_date)
        
        # Calculate indices
        indices = calculate_all_indices(composite)
        
        results = {}
        
        # Perform requested analysis
        if analysis_type in ['crop', 'all']:
            results['crop'] = crop_analyzer.analyze(indices, aoi)
        
        if analysis_type in ['soil', 'all']:
            results['soil'] = soil_analyzer.analyze(indices, aoi)
        
        if analysis_type in ['yield', 'all']:
            results['yield'] = estimate_yield(indices, aoi)
        
        # Generate visualization URLs
        visualization_urls = generate_visualizations(indices, results, aoi)
        
        return jsonify({
            'success': True,
            'results': results,
            'visualizations': visualization_urls,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/api/upload-training-data', methods=['POST'])
def upload_training_data():
    """Upload training data for ML models"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        data_type = request.form.get('type', 'crop')  # crop, soil, yield
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process training data
        if data_type == 'crop':
            result = crop_analyzer.load_training_data(filepath)
        elif data_type == 'soil':
            result = soil_analyzer.load_training_data(filepath)
        else:
            result = load_yield_training_data(filepath)
        
        return jsonify({
            'success': True,
            'message': f'Training data loaded successfully',
            'samples': result.get('samples', 0)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/time-series', methods=['POST'])
def get_time_series():
    """Get time series data for a point"""
    try:
        data = request.json
        lat = data.get('lat')
        lon = data.get('lon')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        point = ee.Geometry.Point([lon, lat])
        
        # Get Sentinel-2 time series
        collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterBounds(point) \
            .filterDate(start_date, end_date) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
        
        # Calculate NDVI for each image
        def add_ndvi(image):
            ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            return image.addBands(ndvi) \
                .set('date', image.date().format('YYYY-MM-dd'))
        
        collection = collection.map(add_ndvi)
        
        # Extract time series
        def extract_ts(image):
            value = image.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=point,
                scale=10
            )
            return ee.Feature(None, {
                'date': image.get('date'),
                'NDVI': value.get('NDVI'),
                'EVI': calculate_evi(image).reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=point,
                    scale=10
                ).get('EVI')
            })
        
        features = collection.map(extract_ts)
        
        # Convert to list
        ts_data = features.aggregate_array('NDVI').getInfo()
        dates = features.aggregate_array('date').getInfo()
        
        return jsonify({
            'success': True,
            'dates': dates,
            'values': ts_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export', methods=['POST'])
def export_results():
    """Export analysis results"""
    try:
        data = request.json
        results = data.get('results')
        format_type = data.get('format', 'geotiff')
        
        # Generate export URL or file
        if format_type == 'geotiff':
            export_url = generate_geotiff_export(results)
        elif format_type == 'shapefile':
            export_url = generate_shapefile_export(results)
        else:
            export_url = generate_json_export(results)
        
        return jsonify({
            'success': True,
            'url': export_url
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== HELPER FUNCTIONS ====================

def load_sentinel2_data(aoi, start_date, end_date):
    """Load and preprocess Sentinel-2 data"""
    collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
        .filterBounds(aoi) \
        .filterDate(start_date, end_date) \
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
        .map(mask_clouds)
    
    # Create median composite
    composite = collection.median().clip(aoi)
    
    return composite

def mask_clouds(image):
    """Cloud masking function"""
    qa = image.select('QA60')
    cloudBitMask = 1 << 10
    cirrusBitMask = 1 << 11
    mask = qa.bitwiseAnd(cloudBitMask).eq(0) \
        .And(qa.bitwiseAnd(cirrusBitMask).eq(0))
    return image.updateMask(mask)

def calculate_evi(image):
    """Calculate EVI for an image"""
    evi = image.expression(
        '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
            'NIR': image.select('B8'),
            'RED': image.select('B4'),
            'BLUE': image.select('B2')
        }).rename('EVI')
    return evi

def estimate_yield(indices, aoi):
    """Estimate crop yield"""
    # Load pre-trained model if available
    model_path = 'models/yield_model.pkl'
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        
        # Extract features
        features = extract_yield_features(indices)
        
        # Predict yield
        yield_prediction = model.predict(features)
        
        return {
            'estimated_yield': float(np.mean(yield_prediction)),
            'min_yield': float(np.min(yield_prediction)),
            'max_yield': float(np.max(yield_prediction)),
            'unit': 'tons/ha'
        }
    else:
        # Return simulated values for demo
        return {
            'estimated_yield': 5.2,
            'min_yield': 3.1,
            'max_yield': 7.8,
            'unit': 'tons/ha',
            'note': 'Using simulated values. Train model for accurate predictions.'
        }

def extract_yield_features(indices):
    """Extract features for yield prediction"""
    # In production, extract actual features from indices
    return np.random.rand(100, 10)  # Placeholder

def generate_visualizations(indices, results, aoi):
    """Generate visualization URLs"""
    # Create map visualization
    Map = geemap.Map()
    
    # Add layers
    vis_params = {
        'min': -1,
        'max': 1,
        'palette': ['blue', 'white', 'green']
    }
    
    Map.addLayer(indices.select('NDVI'), vis_params, 'NDVI')
    Map.addLayer(indices.select('EVI'), vis_params, 'EVI')
    
    # Add analysis results
    if 'crop' in results and 'classification' in results['crop']:
        crop_map = results['crop']['classification']
        Map.addLayer(crop_map, {'min': 1, 'max': 5, 'palette': ['red', 'yellow', 'green', 'blue', 'purple']}, 'Crop Types')
    
    # Generate HTML
    map_html = Map.to_html()
    
    # Save to static folder
    map_path = f"static/maps/map_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    os.makedirs('static/maps', exist_ok=True)
    
    with open(map_path, 'w') as f:
        f.write(map_html)
    
    return {
        'map_url': '/' + map_path,
        'charts': generate_charts(results)
    }

def generate_charts(results):
    """Generate chart URLs"""
    # In production, create actual charts
    return {
        'ndvi_timeseries': '/static/charts/ndvi_ts.html',
        'crop_distribution': '/static/charts/crop_dist.html'
    }

def generate_geotiff_export(results):
    """Generate GeoTIFF export URL"""
    # In production, create actual GeoTIFF
    return '/static/exports/analysis.tif'

def generate_shapefile_export(results):
    """Generate shapefile export URL"""
    return '/static/exports/analysis.zip'

def generate_json_export(results):
    """Generate JSON export URL"""
    return '/static/exports/analysis.json'

def load_yield_training_data(filepath):
    """Load yield training data"""
    df = pd.read_csv(filepath) if filepath.endswith('.csv') else pd.read_excel(filepath)
    return {'samples': len(df)}

# ==================== MAIN ====================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)