#!/usr/bin/env python3

import os
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow

# DELETE any existing token file first
token_file = 'data/google-photos-token.pickle'
if os.path.exists(token_file):
    os.remove(token_file)
    print("Deleted old token")

# Explicitly define the scopes you need
SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly']

# Force new authentication
flow = InstalledAppFlow.from_client_secrets_file(
    'data/google-credentials.json', 
    SCOPES
)

# This will open browser for fresh authentication
creds = flow.run_local_server(port=0)

# Save the new token
with open(token_file, 'wb') as token:
    pickle.dump(creds, token)

print("New token created with scopes:", creds.scopes)
print(f"Token saved to: {token_file}")

# Test the token with direct HTTP requests
import requests

headers = {
    'Authorization': f'Bearer {creds.token}',
    'Content-Type': 'application/json'
}

try:
    # Test with albums endpoint
    response = requests.get('https://photoslibrary.googleapis.com/v1/albums', headers=headers)
    print(f"Albums API Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ SUCCESS! Google Photos API is working!")
        print(f"Found {len(data.get('albums', []))} albums")
    else:
        print(f"❌ Albums API failed: {response.text}")
        
    # Test with mediaItems endpoint
    response2 = requests.get('https://photoslibrary.googleapis.com/v1/mediaItems', headers=headers)
    print(f"MediaItems API Status: {response2.status_code}")
    
    if response2.status_code == 200:
        data2 = response2.json()
        print("✅ SUCCESS! MediaItems API is working!")
        print(f"Found {len(data2.get('mediaItems', []))} media items")
    else:
        print(f"❌ MediaItems API failed: {response2.text}")
        
except Exception as e:
    print(f"❌ Error testing API: {e}") 