#!/bin/bash

# Android アプリ開発環境チェックスクリプト
# 使い方: ./check-requirements.sh
# 初回実行時: chmod +x check-requirements.sh でスクリプトに実行権限を付与してください

echo "===== Android アプリ開発環境のチェック ====="
echo ""

# Node.js のチェック
echo "1. Node.js のチェック..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✓ Node.js がインストールされています: $NODE_VERSION"
else
    echo "   ✗ Node.js がインストールされていません"
    echo "   インストール方法: https://nodejs.org/"
fi
echo ""

# npm のチェック
echo "2. npm のチェック..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "   ✓ npm がインストールされています: v$NPM_VERSION"
else
    echo "   ✗ npm がインストールされていません"
fi
echo ""

# Java のチェック
echo "3. Java のチェック..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo "   ✓ Java がインストールされています: $JAVA_VERSION"
else
    echo "   ✗ Java がインストールされていません"
    echo "   Android Studio には JDK が含まれています"
fi
echo ""

# Android SDK のチェック
echo "4. Android SDK のチェック..."
if [ -n "$ANDROID_HOME" ]; then
    echo "   ✓ ANDROID_HOME が設定されています: $ANDROID_HOME"
elif [ -n "$ANDROID_SDK_ROOT" ]; then
    echo "   ✓ ANDROID_SDK_ROOT が設定されています: $ANDROID_SDK_ROOT"
else
    echo "   ✗ ANDROID_HOME または ANDROID_SDK_ROOT が設定されていません"
    echo "   Android Studio をインストールし、環境変数を設定してください"
fi
echo ""

# adb のチェック
echo "5. adb (Android Debug Bridge) のチェック..."
if command -v adb &> /dev/null; then
    ADB_VERSION=$(adb version | head -n 1)
    echo "   ✓ adb が利用可能です: $ADB_VERSION"
else
    echo "   ✗ adb が見つかりません"
    echo "   Android SDK の platform-tools をインストールし、PATH に追加してください"
fi
echo ""

# Gradle のチェック (オプション)
echo "6. Gradle のチェック (オプション)..."
if command -v gradle &> /dev/null; then
    GRADLE_VERSION=$(gradle -v | grep "Gradle" | head -n 1)
    echo "   ✓ Gradle がインストールされています: $GRADLE_VERSION"
else
    echo "   ℹ Gradle がシステムにインストールされていません"
    echo "   （gradlew を使用するため、必須ではありません）"
fi
echo ""

# 依存関係のチェック
echo "7. npm パッケージのチェック..."
if [ -d "node_modules" ]; then
    echo "   ✓ node_modules が存在します"
else
    echo "   ✗ node_modules が存在しません"
    echo "   'npm install --legacy-peer-deps' を実行してください"
fi
echo ""

# dist ディレクトリのチェック
echo "8. ビルドファイルのチェック..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "   ✓ dist ディレクトリとビルドファイルが存在します"
else
    echo "   ✗ dist ディレクトリまたはビルドファイルが存在しません"
    echo "   'npm run build' を実行してください"
fi
echo ""

# Android プロジェクトのチェック
echo "9. Android ネイティブプロジェクトのチェック..."
if [ -d "android" ] && [ -f "android/build.gradle" ]; then
    echo "   ✓ Android プロジェクトが存在します"
else
    echo "   ✗ Android プロジェクトが存在しません"
    echo "   'npx cap add android' を実行してください"
fi
echo ""

echo "===== チェック完了 ====="
echo ""
echo "すべて ✓ の場合、Android アプリの開発を始められます！"
echo "✗ がある場合は、それぞれの指示に従って環境をセットアップしてください。"
