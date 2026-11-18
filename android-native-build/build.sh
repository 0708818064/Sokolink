#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_ROOT="/home/wiseman/Downloads/IoTFlex/IoTFlex/android/sdk"
BUILD_TOOLS="$SDK_ROOT/build-tools/34.0.0"
ANDROID_JAR="$SDK_ROOT/platforms/android-34/android.jar"
AAPT="$BUILD_TOOLS/aapt"
D8="$BUILD_TOOLS/d8"
ZIPALIGN="$BUILD_TOOLS/zipalign"
APKSIGNER="$BUILD_TOOLS/apksigner"

echo "🔨 Building SokoLink Android APK (Targeting Android 14 / API 34)..."

cd "$DIR"
rm -rf bin/* gen/*
mkdir -p bin gen

# 1. Generate R.java with modern Android 14 SDK
echo "1. Compiling resources with aapt (API 34)..."
"$AAPT" package -m -J gen -M AndroidManifest.xml -S res -I "$ANDROID_JAR"

# 2. Compile Java
echo "2. Compiling Java sources with javac..."
javac -source 8 -target 8 -cp "$ANDROID_JAR" -d bin gen/ke/co/sokolink/app/R.java src/ke/co/sokolink/app/*.java

# 3. Convert to Dalvik/ART DEX with modern Android D8 compiler
echo "3. Compiling bytecode to DEX with Android D8..."
CLASS_FILES=$(find bin -name "*.class")
"$D8" --release --min-api 24 --lib "$ANDROID_JAR" --output bin $CLASS_FILES

# 4. Package APK
echo "4. Packaging unaligned APK..."
"$AAPT" package -f -M AndroidManifest.xml -S res -I "$ANDROID_JAR" -F bin/sokolink.unaligned.apk
(cd bin && "$AAPT" add sokolink.unaligned.apk classes.dex)

# 5. ZipAlign
echo "5. 4-byte zipaligning..."
"$ZIPALIGN" -f -p 4 bin/sokolink.unaligned.apk bin/sokolink.aligned.apk

# 6. Sign APK with modern v1, v2, v3 schemes
echo "6. Signing APK with apksigner..."
KEYSTORE="$HOME/.android/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
    mkdir -p "$HOME/.android"
    keytool -genkey -v -keystore "$KEYSTORE" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
fi
"$APKSIGNER" sign --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android --ks-key-alias androiddebugkey --out bin/sokolink.apk bin/sokolink.aligned.apk

# 7. Distribute
echo "7. Copying to downloads..."
cp bin/sokolink.apk /home/wiseman/Desktop/sokolink/frontend/public/downloads/sokolink.apk
cp bin/sokolink.apk /home/wiseman/Desktop/sokolink/sokolink.apk
cp bin/sokolink.apk /home/wiseman/Desktop/sokolink/public/downloads/sokolink.apk 2>/dev/null || true

echo "✅ SokoLink Android APK (API 34 / Android 14+) built & signed successfully!"
