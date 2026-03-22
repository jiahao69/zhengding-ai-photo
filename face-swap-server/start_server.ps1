$ErrorActionPreference = 'Continue'

# 1. 检查虚拟环境是否存在
if (!(Test-Path 'venv')) {
    Write-Host '[!] Error: venv folder NOT found.' -ForegroundColor Red
    Write-Host '[!] Please run install_deps.ps1 first to setup the environment.' -ForegroundColor Red
    pause
    exit
}

# 2. 定义路径
$pythonExe = ".\venv\Scripts\python.exe"

# 3. 启动服务
& $pythonExe server.py
