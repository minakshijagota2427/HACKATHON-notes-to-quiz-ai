#!/bin/bash
# Render build script to install Tesseract OCR
set -e
apt-get update && apt-get install -y tesseract-ocr
