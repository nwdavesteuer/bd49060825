#!/usr/bin/env python3

import json

# Print your credentials with quotes to see hidden spaces
with open('data/google-credentials.json', 'r') as f:
    creds_data = json.load(f)
    print(f"Client ID: '{creds_data['installed']['client_id']}'")
    print(f"Client Secret: '{creds_data['installed']['client_secret']}'")
    
    # Also check the length to see if there are any extra characters
    print(f"Client ID length: {len(creds_data['installed']['client_id'])}")
    print(f"Client Secret length: {len(creds_data['installed']['client_secret'])}")
    
    # Check for any non-printable characters
    print(f"Client ID bytes: {creds_data['installed']['client_id'].encode()}")
    print(f"Client Secret bytes: {creds_data['installed']['client_secret'].encode()}")
    
    # Check if the values match what we expect
    expected_client_id = "933077384416-g3s7pdah6bkvjutk6oup5490ffq19qku.apps.googleusercontent.com"
    expected_client_secret = "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"
    
    print(f"Client ID matches expected: {creds_data['installed']['client_id'] == expected_client_id}")
    print(f"Client Secret matches expected: {creds_data['installed']['client_secret'] == expected_client_secret}") 