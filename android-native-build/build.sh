#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_TOOLS="/home/wiseman/.android-build-tools"
ANDROID_JAR="$BUILD_TOOLS/android.jar"
DX_JAR="$BUILD_TOOLS/dx.jar"

echo "🔨 Building SokoLink Android APK..."

cd "$DIR"
rm -rf bin/* gen/*
mkdir -p bin gen

# 1. Generate R.java
echo "1. Compiling resources with aapt..."
aapt package -m -J gen -M AndroidManifest.xml -S res -I "$ANDROID_JAR"

# 2. Compile Java
echo "2. Compiling Java sources..."
javac -source 8 -target 8 -cp "$ANDROID_JAR" -d bin gen/ke/co/sokolink/app/R.java src/ke/co/sokolink/app/MainActivity.java

# 3. Convert to DEX
echo "3. Converting to Dalvik DEX (dx)..."
java -cp "$DX_JAR" com.android.dx.command.Main --dex --output=bin/classes.dex bin

# 4. Package APK
echo "4. Packaging unaligned APK..."
aapt package -f -M AndroidManifest.xml -S res -I "$ANDROID_JAR" -F bin/sokolink.unaligned.apk
(cd bin && aapt add sokolink.unaligned.apk classes.dex)

# 5. ZipAlign
echo "5. 4-byte zipaligning..."
zipalign -f -p 4 bin/sokolink.unaligned.apk bin/sokolink.aligned.apk

# 6. Sign APK
echo "6. Signing APK with apksigner..."
KEYSTORE="$HOME/.android/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
    mkdir -p "$HOME/.android"
    keytool -genkey -v -keystore "$KEYSTORE" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
fi
apksigner sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android --ks-key-alias androiddebugkey --out bin/sokolink.apk bin/sokolink.aligned.apk

# 7. Distribute
echo "7. Copying to downloads..."
cp bin/sokolink.apk /home/wiseman/Desktop/sokolink/frontend/public/downloads/sokolink.apk
cp bin/sokolink.apk /home/wiseman/Desktop/sokolink/sokolink.apk
cp bin/sokolink.apk /home/wiseman/Desktop/sokolink/public/downloads/sokolink.apk 2>/dev/null || true

echo "✅ SokoLink APK built & signed successfully!"
