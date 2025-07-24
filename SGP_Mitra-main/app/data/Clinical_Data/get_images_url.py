import pandas as pd
import requests
import time
from dotenv import load_dotenv
import os
import random

load_dotenv()

# === Configuration ===
PEXELS_API_KEY = os.getenv('PEXELS_API_KEY') # Replace this with your actual API key
INPUT_FILE = "Final_DS.xlsx"
OUTPUT_FILE = "Custom_Clinical_DS.xlsx"
DELAY_BETWEEN_REQUESTS = 1  # seconds to avoid rate limit

# === Load Excel File ===
df = pd.read_excel(INPUT_FILE)

# Ensure there's an ImageURL column
if 'ImageURL' not in df.columns:
    df['ImageURL'] = ''

# === Fetch Image URL from Pexels ===
def fetch_image_url(query):
    headers = {
        "Authorization": PEXELS_API_KEY
    }
    params = {
        "query": query,
        "per_page": 1
    }
    response = requests.get("https://api.pexels.com/v1/search", headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        photos = data.get("photos", [])
        if data["photos"]:
            random_index = random.randint(0, len(photos) - 1)
            return data["photos"][random_index]["src"]["original"]
    return None

# === Update DataFrame with Image URLs ===
for idx, row in df.iterrows():
    query = str(row['SearchItem'])
    image_url = fetch_image_url(query)
    if image_url:
        df.at[idx, 'ImageURL'] = str(image_url)
        print(f"✅ Fetched for: {query}")
    else:
        print(f"❌ No image found for: {query}")
    time.sleep(DELAY_BETWEEN_REQUESTS)

# === Save to New Excel File ===
df.to_excel(OUTPUT_FILE, index=False)
print(f"\n🎉 Done! Image URLs saved to '{OUTPUT_FILE}'")
