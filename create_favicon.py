from PIL import Image, ImageDraw
import os

# Create images directory if it doesn't exist
os.makedirs('static/images', exist_ok=True)

print("Creating favicon images...")

# Create favicon (multiple sizes)
sizes = [16, 32, 48, 64, 128, 256]

for size in sizes:
    img = Image.new('RGB', (size, size), color=(40, 167, 69))
    d = ImageDraw.Draw(img)
    
    # Draw a simple leaf shape
    if size >= 32:
        # Draw a circle for larger icons
        d.ellipse([size//4, size//4, size*3//4, size*3//4], fill=(255, 255, 255))
        d.ellipse([size*3//8, size*3//8, size*5//8, size*5//8], fill=(40, 167, 69))
    
    # Save as PNG
    img.save(f'static/images/favicon-{size}.png')
    print(f"  Created favicon-{size}.png")

# Create .ico file (requires multiple sizes)
print("\nCreating favicon.ico...")
icons = []
for size in [16, 32, 48, 64]:
    img = Image.open(f'static/images/favicon-{size}.png')
    icons.append(img)

# Save as .ico
icons[0].save('static/favicon.ico', append_images=icons[1:], 
              format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64)])

print("✅ Favicon created successfully!")
print("📍 Location: static/favicon.ico")
