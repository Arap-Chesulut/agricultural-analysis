"""
Earth Engine initialization utility
"""

import ee
import os
import json
import time

def initialize_earth_engine():
    """
    Initialize Earth Engine with service account or authentication
    """
    try:
        # Check if using service account (for Render deployment)
        service_account = os.getenv('EE_SERVICE_ACCOUNT')
        private_key = os.getenv('EE_PRIVATE_KEY')
        
        if service_account and private_key:
            # Use service account
            credentials = ee.ServiceAccountCredentials(service_account, key_data=private_key)
            ee.Initialize(credentials)
        else:
            # Try to initialize with high-volume endpoint
            ee.Initialize(opt_url='https://earthengine-highvolume.googleapis.com')
            
    except Exception as e:
        print(f"Error initializing Earth Engine: {e}")
        
        # Fallback: authenticate if needed
        try:
            ee.Authenticate()
            ee.Initialize()
        except:
            raise Exception("Could not initialize Earth Engine. Please check credentials.")
    
    # Verify initialization
    for i in range(5):  # Retry up to 5 times
        try:
            ee.Number(1).getInfo()
            print("Earth Engine initialized successfully")
            return
        except:
            time.sleep(2)
    
    raise Exception("Earth Engine initialization failed after retries")