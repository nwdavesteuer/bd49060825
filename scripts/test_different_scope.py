#!/usr/bin/env python3

import os
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
import requests

# Test with different scopes
SCOPES_TO_TEST = [
    ['https://www.googleapis.com/auth/photoslibrary'],
    ['https://www.googleapis.com/auth/photoslibrary.readonly'],
    ['https://www.googleapis.com/auth/photoslibrary', 'https://www.googleapis.com/auth/photoslibrary.readonly'],
    ['https://www.googleapis.com/auth/userinfo.profile']  # Test with a basic scope
]

for i, scopes in enumerate(SCOPES_TO_TEST):
    print(f"\n🔍 Test {i+1}: Scopes {scopes}")
    
    # Force new authentication with these scopes
    flow = InstalledAppFlow.from_client_secrets_file(
        'data/google-credentials.json', 
        scopes
    )
    
    # This will open browser for fresh authentication
    creds = flow.run_local_server(port=0)
    
    print(f"Token created with scopes: {creds.scopes}")
    
    # Test the token
    headers = {
        'Authorization': f'Bearer {creds.token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Test with albums endpoint
        response = requests.get('https://photoslibrary.googleapis.com/v1/albums', headers=headers)
        print(f"Albums API Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS! Albums API works!")
            break
        else:
            print(f"❌ Albums API failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("-" * 50) 