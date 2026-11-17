import os
from PIL import Image

RES_DIR = "/home/wiseman/Desktop/sokolink/android-native-build/res"
SOURCE_ICON = os.path.join(RES_DIR, "drawable", "sokolink_icon_512.png")

DENSITIES = {
    "drawable": 192,
    "drawable-mdpi": 48,
    "drawable-hdpi": 72,
    "drawable-xhdpi": 96,
    "drawable-xxhdpi": 144,
    "drawable-xxxhdpi": 192,
}

def process_icons():
    if not os.path.exists(SOURCE_ICON):
        print(f"Source icon not found: {SOURCE_ICON}")
        return False
    
    img = Image.open(SOURCE_ICON).convert("RGBA")
    print(f"Loaded source icon: {img.size}")

    for folder, size in DENSITIES.items():
        out_dir = os.path.join(RES_DIR, folder)
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, "ic_launcher.png")
        
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(out_path, format="PNG", optimize=True)
        print(f"Saved {out_path} ({size}x{size})")
    
    # Also save a 512x512 play store / web icon in public/
    web_icon_path = "/home/wiseman/Desktop/sokolink/frontend/public/sokolink-icon-512.png"
    img.save(web_icon_path, format="PNG", optimize=True)
    root_web_icon_path = "/home/wiseman/Desktop/sokolink/public/sokolink-icon-512.png"
    img.save(root_web_icon_path, format="PNG", optimize=True)
    print("All Android launcher icon densities processed successfully!")
    return True

if __name__ == "__main__":
    process_icons()
