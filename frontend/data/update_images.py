import json
import urllib.parse
import os

data_path = 'products.json'
with open(data_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    title = p['title']
    cat = p['category']
    # Create an AI prompt
    prompt = f"{cat} - {title}, high quality product photography, isolated on light background, professional lighting, ecommerce"
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=500&height=500&nologo=true"
    p['image'] = url

with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2)

print("Images updated successfully.")
