#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Upgrading pip..."
pip install --upgrade pip

echo "==> Installing CPU-optimized PyTorch..."
pip install torch --index-url https://download.pytorch.org/whl/cpu

echo "==> Installing backend dependencies..."
pip install -r requirements.txt

echo "==> Build completed successfully!"
