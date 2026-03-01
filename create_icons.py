from PIL import Image, ImageDraw
import os

# Create images directory
os.makedirs('static/images', exist_ok=True)

print("Creating placeholder images...")

# Create logo
img = Image.new('RGB', (200, 50), color=(40, 167, 69))
d = ImageDraw.Draw(img)
d.text((10, 15), "AgriAnalyzer", fill=(255, 255, 255))
img.save('static/images/logo.png')
print("✅ Created logo.png")

# Create crop icon
img = Image.new('RGB', (64, 64), color=(40, 167, 69))
d = ImageDraw.Draw(img)
d.ellipse([10, 10, 54, 54], fill=(255, 255, 255))
d.rectangle([20, 25, 44, 45], fill=(40, 167, 69))
img.save('static/images/crop-icon.png')
print("✅ Created crop-icon.png")

# Create yield icon
img = Image.new('RGB', (64, 64), color=(255, 193, 7))
d = ImageDraw.Draw(img)
d.rectangle([10, 30, 54, 50], fill=(255, 255, 255))
d.polygon([(20, 30), (32, 10), (44, 30)], fill=(255, 255, 255))
img.save('static/images/yield-icon.png')
print("✅ Created yield-icon.png")

# Create soil icon
img = Image.new('RGB', (64, 64), color=(139, 69, 19))
d = ImageDraw.Draw(img)
d.rectangle([10, 10, 54, 54], fill=(160, 82, 45))
d.ellipse([20, 20, 44, 44], fill=(139, 69, 19))
img.save('static/images/soil-icon.png')
print("✅ Created soil-icon.png")

print("\n🎉 All images created successfully!")
print("📍 Location: static/images/")
print("\n👉 Now refresh your browser at http://127.0.0.1:5000")
