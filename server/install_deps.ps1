$ErrorActionPreference = 'Continue'

# 1. 检查Python是否安装
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host '[!] Python NOT found. Installing via Winget...' -ForegroundColor Red
    winget install -e --id Python.Python.3.10 --scope user --accept-package-agreements
    pause
    exit
}

# 2. 清理并重新创建虚拟环境
if (Test-Path 'venv') {
    Write-Host '[+] Found existing venv. Deleting for a clean start...' -ForegroundColor Cyan
    Remove-Item -Path 'venv' -Force -Recurse -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host '[+] Creating Virtual Environment...' -ForegroundColor Yellow
python -m venv venv

# 3. 安装依赖
$pythonExe = '.\venv\Scripts\python.exe'
$pipExe = '.\venv\Scripts\pip.exe'

Write-Host '[+] Upgrading Pip...' -ForegroundColor Yellow
& $pythonExe -m pip install --upgrade pip

Write-Host '[+] Installing Depends...' -ForegroundColor Yellow
$pkgs = @(
    'numpy<2',
    'opencv-python<4.9',
    'onnxruntime',
    'insightface',
    'fastapi',
    'python-multipart',
    'uvicorn'
)
& $pipExe install $pkgs

Write-Host '------------------------------------------' -ForegroundColor Green
Write-Host 'DONE! Environment is ready.' -ForegroundColor Green
Write-Host '------------------------------------------' -ForegroundColor Green

pause
