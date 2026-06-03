from PIL import Image
import sys

try:
    img = Image.open('src/assets/wpp-desktop-v2.png')
    img = img.convert('RGB')
    width, height = img.size
    # Check a few pixels in the center and corners
    pixels = [
        img.getpixel((0, 0)),
        img.getpixel((width//2, height//2)),
        img.getpixel((width-1, height-1)),
        img.getpixel((10, 10))
    ]
    for p in pixels:
        print(p)
except Exception as e:
    print(e)
