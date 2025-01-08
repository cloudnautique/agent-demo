import os
import requests
from zoneinfo import ZoneInfo
from datetime import datetime, timedelta

# Replace with the actual URL of the API
API_URL = os.getenv("LOGIN_URL")
SET_ENV = os.getenv("ENV")
PFX = os.getenv("PREFIX")

# Get credentials from environment variables
credentials = {
    "username": os.getenv("USER"),
    "password": os.getenv("PASSWORD")
}

headers = {
    "accept": "application/json",
    "Content-Type": "application/json"
}

expiration_time = datetime.now(ZoneInfo("UTC")) + timedelta(hours=7)
expires_at = expiration_time.isoformat()

def authenticate(api_url, payload):
    if not payload["username"] or not payload["password"]:
        print("{{'Error': 'USER or PASSWORD environment variables are not set.'}}")
        return None

    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        response.raise_for_status()  # Raise an error for HTTP responses with status codes >= 400
        data = response.json()
        return data.get("access_token")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return None

# Authenticate and get the JWT token
jwt_token = authenticate(API_URL, credentials)

if jwt_token:
    secret = jwt_token
    if PFX != "" and PFX is not None:
      secret = f"{PFX} {secret}"
    print(f"{{\"env\": {{\"{SET_ENV}\":\"{secret}\"}},\"expiresAt\": \"{expires_at}\"}}")
else:
    print("Failed to retrieve token.")

