#!/usr/bin/env python3
"""
Satori Demo: Build, Copy and Serve

Usage:
  python demo.py          # Build, copy assets, and serve
  python demo.py build    # Build only
  python demo.py serve    # Serve only (assumes already built)
  python demo.py --port 8080  # Use different port
"""

import http.server
import socketserver
import os
import shutil
import subprocess
import sys
import argparse
from pathlib import Path

# Configuration
DEFAULT_PORT = 5173
DEMO_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = DEMO_DIR.parent
BUILD_DIR = PROJECT_ROOT / "Build"
ASSETS_DIR = PROJECT_ROOT / "assets"


def log(msg: str, level: str = "info"):
    """Print a formatted log message."""
    symbols = {"info": "->", "success": "✓", "error": "✗", "header": "═"}
    symbol = symbols.get(level, "->")
    if level == "header":
        print(f"\n{'═' * 50}")
        print(f"  {msg}")
        print(f"{'═' * 50}\n")
    elif level == "success":
        print(f"  {symbol} {msg}")
    elif level == "error":
        print(f"  {symbol} {msg}")
    else:
        print(f"{symbol} {msg}...")


def run_command(cmd: list[str], cwd: Path, description: str) -> bool:
    """Run a command and return success status."""
    log(description)
    try:
        subprocess.run(
            cmd,
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True
        )
        log(f"{description} complete", "success")
        return True
    except subprocess.CalledProcessError as e:
        log(f"{description} failed: {e.stderr}", "error")
        return False
    except FileNotFoundError:
        log(f"Command not found: {cmd[0]}", "error")
        return False


def install_deps() -> bool:
    """Install npm dependencies if needed."""
    if not (BUILD_DIR / "node_modules").exists():
        return run_command(["npm", "install"], BUILD_DIR, "Installing dependencies")
    return True


def build() -> bool:
    """Build the Satori library."""
    if shutil.which("npm") is None:
        log("npm not found. Please install Node.js.", "error")
        return False
    
    if not install_deps():
        return False
    
    return run_command(["npm", "run", "build"], BUILD_DIR, "Building Satori")


def copy_dist() -> bool:
    """Copy Build/dist to Demo/dist."""
    src = BUILD_DIR / "dist"
    dst = DEMO_DIR / "dist"
    
    if not src.exists():
        log(f"Build output not found at {src}", "error")
        return False
    
    log("Copying dist to Demo/dist")
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    log("Copied dist", "success")
    return True


def copy_assets() -> bool:
    """Copy assets to Demo/assets."""
    src = ASSETS_DIR
    dst = DEMO_DIR / "assets"
    
    if not src.exists():
        log(f"Assets not found at {src}", "error")
        return False
    
    log("Copying assets to Demo/assets")
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    log("Copied assets", "success")
    return True


class DemoHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler for serving the demo."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DEMO_DIR), **kwargs)
    
    def log_message(self, format, *args):
        status = args[1] if len(args) > 1 else ""
        if status.startswith("4") or status.startswith("5"):
            print(f"  {args[0]} -> {status}")
    
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def serve(port: int = DEFAULT_PORT):
    """Start the HTTP server."""
    os.chdir(DEMO_DIR)
    
    try:
        with socketserver.TCPServer(("", port), DemoHandler) as httpd:
            print(f"\n🚀 Demo running at http://localhost:{port}/")
            print(f"   Press Ctrl+C to stop\n")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98:
            log(f"Port {port} is already in use. Try a different port with --port", "error")
        else:
            raise
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")


def main():
    parser = argparse.ArgumentParser(description="Satori Demo - Build and Serve")
    parser.add_argument("command", nargs="?", default="all", 
                       choices=["all", "build", "serve"],
                       help="Command to run (default: all)")
    parser.add_argument("--port", "-p", type=int, default=DEFAULT_PORT,
                       help=f"Port to serve on (default: {DEFAULT_PORT})")
    args = parser.parse_args()
    
    log("Satori Demo", "header")
    
    if args.command in ("all", "build"):
        if not build():
            sys.exit(1)
        if not copy_dist():
            sys.exit(1)
        if not copy_assets():
            sys.exit(1)
    
    if args.command in ("all", "serve"):
        serve(args.port)


if __name__ == "__main__":
    main()
