"""
Setup script for Publication Analyzer.
Checks dependencies and configuration before running the application.
"""
import sys
import subprocess
from pathlib import Path


def check_python_version():
    """Check if Python version is 3.10 or higher."""
    if sys.version_info < (3, 10):
        print(f"❌ Python 3.10 or higher is required. You have {sys.version}")
        return False
    print(f"✓ Python version: {sys.version.split()[0]}")
    return True


def check_dependencies():
    """Check if required packages are installed."""
    required = [
        "fastapi",
        "uvicorn",
        "httpx",
        "pydantic",
        "reportlab",
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package)
            print(f"✓ {package} installed")
        except ImportError:
            missing.append(package)
            print(f"❌ {package} not installed")
    
    if missing:
        print("\nTo install missing packages, run:")
        print("  pip install -r requirements.txt")
        return False
    
    return True


def check_env_file():
    """Check if .env file exists and has required variables."""
    env_path = Path(__file__).parent / ".env"
    env_example = Path(__file__).parent / ".env.example"
    
    if not env_path.exists():
        print("⚠ .env file not found")
        if env_example.exists():
            print(f"  Copy {env_example.name} to .env and add your Hugging Face token")
            print("  Get a free token at: https://huggingface.co/settings/tokens")
        return False
    
    # Check if HF_TOKEN is set
    with open(env_path) as f:
        content = f.read()
        if "HF_TOKEN=" in content and not content.split("HF_TOKEN=")[1].split("\n")[0].strip():
            print("⚠ HF_TOKEN is empty in .env file")
            print("  AI features will not work without a Hugging Face token")
            print("  Get one at: https://huggingface.co/settings/tokens")
            return False
    
    print("✓ .env file configured")
    return True


def check_frontend_files():
    """Check if frontend files exist."""
    frontend_dir = Path(__file__).parent / "frontend"
    required_files = ["index.html", "app.js", "styles.css"]
    
    for file in required_files:
        file_path = frontend_dir / file
        if not file_path.exists():
            print(f"❌ Missing frontend file: {file}")
            return False
        print(f"✓ {file} found")
    
    return True


def main():
    """Run all checks."""
    print("=" * 60)
    print("Publication Analyzer - Setup Check")
    print("=" * 60)
    print()
    
    checks = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        ("Environment Configuration", check_env_file),
        ("Frontend Files", check_frontend_files),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n{name}:")
        print("-" * 40)
        results.append(check_func())
    
    print("\n" + "=" * 60)
    if all(results):
        print("✓ All checks passed! You're ready to run the application.")
        print("\nTo start the server, run:")
        print("  uvicorn backend.main:app --reload")
        print("\nOr from the workspace root:")
        print("  .\\run.ps1")
        return 0
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
