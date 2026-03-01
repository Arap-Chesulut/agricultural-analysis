"""
Calculate all vegetation and soil indices
"""

import ee

def calculate_all_indices(composite):
    """
    Calculate comprehensive set of indices
    """
    indices = ee.Image.cat([
        # Basic vegetation indices
        composite.normalizedDifference(['B8', 'B4']).rename('NDVI'),
        composite.normalizedDifference(['B8', 'B3']).rename('GNDVI'),
        
        # Advanced vegetation indices
        calculate_evi(composite).rename('EVI'),
        calculate_savi(composite).rename('SAVI'),
        calculate_msavi(composite).rename('MSAVI'),
        calculate_arvi(composite).rename('ARVI'),
        
        # Red edge indices
        composite.normalizedDifference(['B8', 'B5']).rename('NDRE'),
        calculate_ccci(composite).rename('CCCI'),
        calculate_mcari(composite).rename('MCARI'),
        
        # Chlorophyll indices
        calculate_cig(composite).rename('CIG'),
        calculate_cire(composite).rename('CIRE'),
        
        # Stress indices
        calculate_psri(composite).rename('PSRI'),
        
        # Fire indices
        composite.normalizedDifference(['B8', 'B12']).rename('NBR'),
        composite.normalizedDifference(['B11', 'B12']).rename('NBR2'),
        
        # Soil indices
        calculate_bsi(composite).rename('BSI'),
        calculate_ci(composite).rename('CI'),
        
        # Mineral indices
        calculate_clay(composite).rename('Clay'),
        calculate_ferrous(composite).rename('Ferrous'),
        calculate_iron_oxide(composite).rename('IronOxide')
    ])
    
    return indices

def calculate_evi(composite):
    """Enhanced Vegetation Index"""
    return composite.expression(
        '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
            'NIR': composite.select('B8'),
            'RED': composite.select('B4'),
            'BLUE': composite.select('B2')
        })

def calculate_savi(composite):
    """Soil Adjusted Vegetation Index"""
    return composite.expression(
        '((NIR - RED) / (NIR + RED + 0.5)) * 1.5', {
            'NIR': composite.select('B8'),
            'RED': composite.select('B4')
        })

def calculate_msavi(composite):
    """Modified Soil Adjusted Vegetation Index"""
    return composite.expression(
        '(2 * NIR + 1 - sqrt((2 * NIR + 1)**2 - 8 * (NIR - RED))) / 2', {
            'NIR': composite.select('B8'),
            'RED': composite.select('B4')
        })

def calculate_arvi(composite):
    """Atmospherically Resistant Vegetation Index"""
    return composite.expression(
        '(NIR - (2 * RED - BLUE)) / (NIR + (2 * RED - BLUE))', {
            'NIR': composite.select('B8'),
            'RED': composite.select('B4'),
            'BLUE': composite.select('B2')
        })

def calculate_ccci(composite):
    """Canopy Chlorophyll Content Index"""
    return composite.expression(
        '((NIR - RE) / (NIR + RE)) / ((NIR - RED) / (NIR + RED))', {
            'NIR': composite.select('B8'),
            'RE': composite.select('B5'),
            'RED': composite.select('B4')
        })

def calculate_mcari(composite):
    """Modified Chlorophyll Absorption in Reflectance Index"""
    return composite.expression(
        '((RE - RED) - 0.2 * (RE - GREEN)) * (RE / RED)', {
            'RE': composite.select('B5'),
            'RED': composite.select('B4'),
            'GREEN': composite.select('B3')
        })

def calculate_cig(composite):
    """Chlorophyll Index Green"""
    return composite.expression(
        '(NIR / GREEN) - 1', {
            'NIR': composite.select('B8'),
            'GREEN': composite.select('B3')
        })

def calculate_cire(composite):
    """Chlorophyll Index Red Edge"""
    return composite.expression(
        '(NIR / RE) - 1', {
            'NIR': composite.select('B8'),
            'RE': composite.select('B5')
        })

def calculate_psri(composite):
    """Plant Senescence Reflectance Index"""
    return composite.expression(
        '(RED - GREEN) / RE', {
            'RED': composite.select('B4'),
            'GREEN': composite.select('B3'),
            'RE': composite.select('B5')
        })

def calculate_bsi(composite):
    """Bare Soil Index"""
    return composite.expression(
        '((SWIR1 + RED) - (NIR + BLUE)) / ((SWIR1 + RED) + (NIR + BLUE))', {
            'SWIR1': composite.select('B11'),
            'RED': composite.select('B4'),
            'NIR': composite.select('B8'),
            'BLUE': composite.select('B2')
        })

def calculate_ci(composite):
    """Color Index"""
    return composite.expression(
        '(RED - GREEN) / (RED + GREEN)', {
            'RED': composite.select('B4'),
            'GREEN': composite.select('B3')
        })

def calculate_clay(composite):
    """Clay Minerals Index"""
    return composite.expression(
        'SWIR1 / SWIR2', {
            'SWIR1': composite.select('B11'),
            'SWIR2': composite.select('B12')
        })

def calculate_ferrous(composite):
    """Ferrous Minerals Index"""
    return composite.expression(
        'SWIR1 / NIR', {
            'SWIR1': composite.select('B11'),
            'NIR': composite.select('B8')
        })

def calculate_iron_oxide(composite):
    """Iron Oxide Index"""
    return composite.expression(
        'RED / BLUE', {
            'RED': composite.select('B4'),
            'BLUE': composite.select('B2')
        })