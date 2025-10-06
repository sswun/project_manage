# project_manager项目管理系统 - PowerShell服务管理脚本
# 支持 Windows PowerShell 5.0+ 和 PowerShell Core

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "monitor", "install", "startup", "help")]
    [string]$Command = "help",

    [Parameter(Mandatory=$false)]
    [int]$Port = 8001,

    [Parameter(Mandatory=$false)]
    [int]$Lines = 50,

    [Parameter(Mandatory=$false)]
    [int]$Interval = 5
)

# 配置
$Script:ServiceName = "project_manager-project-manager"
$Script:DefaultPort = $Port
$Script:PidFile = "$ServiceName.pid"
$Script:LogFile = "$ServiceName.log"
$Script:ConfigFile = "$ServiceName.json"
$Script:ServerScript = "server.py"

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [ConsoleColor]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 检查管理员权限
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 检查Python环境
function Test-Python {
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch {
        return $false
    }

    # 尝试py命令
    try {
        $pythonVersion = py --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch {
        return $false
    }

    return $false
}

# 获取Python命令
function Get-PythonCommand {
    try {
        python --version | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return "python"
        }
    } catch {
        # 继续尝试py命令
    }

    try {
        py --version | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return "py"
        }
    } catch {
        throw "未找到Python环境"
    }
}

# 检查服务状态
function Get-ServiceStatus {
    if (Test-Path $PidFile) {
        try {
            $pid = Get-Content $PidFile -Raw
            $pid = $pid.Trim()
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue

            if ($process) {
                return @{
                    Status = "running"
                    Pid = $pid
                    Port = $DefaultPort
                    Process = $process
                }
            } else {
                # 进程不存在，清理PID文件
                Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
            }
        } catch {
            # PID文件无效，清理
            Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        }
    }

    return @{
        Status = "stopped"
        Pid = $null
        Port = $DefaultPort
        Process = $null
    }
}

# 检查端口是否被占用
function Test-PortOccupied {
    param([int]$Port)

    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# 启动服务
function Start-ServiceManager {
    $status = Get-ServiceStatus
    if ($status.Status -eq "running") {
        Write-ColorOutput "⚠️  服务已在运行中 (PID: $($status.Pid))" Yellow
        return $false
    }

    Write-ColorOutput "🚀 正在启动project_manager项目管理系统..." Blue
    Write-ColorOutput "📡 端口: $DefaultPort" Blue

    # 检查端口是否被占用
    if (Test-PortOccupied -Port $DefaultPort) {
        Write-ColorOutput "❌ 端口 $DefaultPort 已被占用" Red
        return $false
    }

    try {
        $pythonCmd = Get-PythonCommand

        # 启动服务进程（隐藏窗口）
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = $pythonCmd
        $startInfo.Arguments = "$ServerScript $DefaultPort"
        $startInfo.UseShellExecute = $false
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true
        $startInfo.CreateNoWindow = $true
        $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden

        $process = [System.Diagnostics.Process]::Start($startInfo)

        # 保存PID
        $process.Id | Out-File -FilePath $PidFile -Encoding UTF8

        # 等待服务启动
        Start-Sleep -Seconds 3

        # 验证服务是否启动成功
        $newStatus = Get-ServiceStatus
        if ($newStatus.Status -eq "running") {
            Write-ColorOutput "✅ 服务启动成功！" Green
            Write-ColorOutput "📍 PID: $($process.Id)" Blue
            Write-ColorOutput "🌐 访问地址: http://localhost:$DefaultPort" Blue
            Write-ColorOutput "📋 日志文件: $LogFile" Blue
            return $true
        } else {
            Write-ColorOutput "❌ 服务启动失败" Red
            Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
            return $false
        }

    } catch {
        Write-ColorOutput "❌ 启动失败: $($_.Exception.Message)" Red
        return $false
    }
}

# 停止服务
function Stop-ServiceManager {
    $status = Get-ServiceStatus
    if ($status.Status -ne "running") {
        Write-ColorOutput "⚠️  服务未运行" Yellow
        return $false
    }

    Write-ColorOutput "🛑 正在停止服务 (PID: $($status.Pid))..." Blue

    try {
        $process = Get-Process -Id $status.Pid -ErrorAction SilentlyContinue
        if ($process) {
            # 尝试优雅停止
            $process.Kill()

            # 等待进程结束
            $timeout = 10
            $elapsed = 0
            while ($process.HasExited -eq $false -and $elapsed -lt $timeout) {
                Start-Sleep -Seconds 1
                $elapsed++
            }

            if ($process.HasExited) {
                Write-ColorOutput "✅ 服务已停止" Green
            } else {
                Write-ColorOutput "❌ 无法停止服务" Red
                return $false
            }
        }

        # 清理PID文件
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        return $true

    } catch {
        Write-ColorOutput "❌ 停止失败: $($_.Exception.Message)" Red
        return $false
    }
}

# 重启服务
function Restart-ServiceManager {
    Write-ColorOutput "🔄 正在重启服务..." Blue
    Stop-ServiceManager | Out-Null
    Start-Sleep -Seconds 2
    return Start-ServiceManager
}

# 显示详细状态
function Show-DetailedStatus {
    $status = Get-ServiceStatus

    if ($status.Status -eq "running") {
        Write-ColorOutput "✅ $ServiceName 正在运行" Green
        Write-ColorOutput "📍 PID: $($status.Pid)" Blue
        Write-ColorOutput "📡 端口: $($status.Port)" Blue

        $process = $status.Process
        if ($process) {
            $cpuTime = $process.TotalProcessorTime
            $memoryMB = [math]::Round($process.WorkingSet64 / 1MB, 1)
            $startTime = $process.StartTime
            $uptime = (Get-Date) - $startTime

            Write-ColorOutput "💻 CPU时间: $($cpuTime.ToString('hh\:mm\:ss'))" Blue
            Write-ColorOutput "🧠 内存使用: ${memoryMB}MB" Blue
            Write-ColorOutput "🧵 线程数: $($process.Threads.Count)" Blue
            Write-ColorOutput "⏰ 运行时间: $($uptime.ToString('hh\:mm\:ss'))" Blue
            Write-ColorOutput "🚀 启动时间: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" Blue
        }

        Write-ColorOutput "🌐 访问地址: http://localhost:$($status.Port)" Blue
    } else {
        Write-ColorOutput "⏸️  $ServiceName 未运行" Yellow
        Write-ColorOutput "📡 端口: $($status.Port)" Blue
    }
}

# 显示日志
function Show-Logs {
    param([int]$Lines = 50)

    if (Test-Path $LogFile) {
        Write-ColorOutput "📋 最近 $Lines 行日志:" Blue
        Write-Host ("-" * 60)

        try {
            Get-Content $LogFile -Tail $Lines -Encoding UTF8 | ForEach-Object {
                Write-Host $_
            }
        } catch {
            Write-ColorOutput "❌ 读取日志失败: $($_.Exception.Message)" Red
        }

        Write-Host ("-" * 60)
    } else {
        Write-ColorOutput "⚠️  日志文件不存在" Yellow
    }
}

# 监控服务
function Monitor-Service {
    param([int]$Interval = 5)

    Write-ColorOutput "🔍 开始监控 $ServiceName 服务 (按Ctrl+C停止)" Cyan
    Write-Host ("=" * 80)

    try {
        while ($true) {
            $status = Get-ServiceStatus
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

            if ($status.Status -eq "running") {
                $process = $status.Process
                if ($process) {
                    $memoryMB = [math]::Round($process.WorkingSet64 / 1MB, 1)
                    $cpuPercent = 0 # PowerShell简化版本

                    Write-Host "[$timestamp] ✅ 运行中 | PID: $($status.Pid) | 内存: ${memoryMB}MB | 线程: $($process.Threads.Count)" -ForegroundColor Green
                } else {
                    Write-Host "[$timestamp] ✅ 运行中 | PID: $($status.Pid)" -ForegroundColor Green
                }
            } else {
                Write-Host "[$timestamp] ❌ 服务停止" -ForegroundColor Red
            }

            Start-Sleep -Seconds $Interval
        }
    } catch [System.Management.Automation.HaltCommandException] {
        Write-Host "`n🔍 监控已停止" -ForegroundColor Cyan
    }
}

# 安装Windows服务
function Install-WindowsService {
    if (-not (Test-Administrator)) {
        Write-ColorOutput "❌ 需要管理员权限安装Windows服务" Red
        Write-ColorOutput "💡 请以管理员身份运行PowerShell" Yellow
        return $false
    }

    Write-ColorOutput "🔧 配置Windows服务..." Blue

    # 检查是否有NSSM
    try {
        nssm version | Out-Null
        Write-ColorOutput "✅ 检测到NSSM，正在安装服务..." Green

        $serviceDisplayName = "project_manager项目管理系统"
        $serviceDescription = "project_manager项目管理系统Web服务，端口: $DefaultPort"

        # 创建服务包装器
        $wrapperContent = @"
@echo off
cd /d "%~dp0"
start_service.bat
"@

        $wrapperPath = "service_wrapper.bat"
        $wrapperContent | Out-File -FilePath $wrapperPath -Encoding UTF8

        # 使用NSSM安装服务
        nssm install $ServiceName $wrapperPath
        nssm set $ServiceName DisplayName $serviceDisplayName
        nssm set $ServiceName Description $serviceDescription
        nssm set $ServiceName Start SERVICE_AUTO_START

        Write-ColorOutput "✅ Windows服务 '$ServiceName' 安装成功！" Green
        Write-ColorOutput "💡 服务管理命令:" Yellow
        Write-ColorOutput "   Start-Service -Name '$ServiceName'" Cyan
        Write-ColorOutput "   Stop-Service -Name '$ServiceName'" Cyan
        Write-ColorOutput "   Get-Service -Name '$ServiceName'" Cyan

        return $true

    } catch {
        Write-ColorOutput "❌ NSSM未找到或安装失败" Red
        Write-ColorOutput "💡 请下载NSSM: https://nssm.cc/download" Yellow
        return $false
    }
}

# 创建开机启动快捷方式
function Add-ToStartup {
    Write-ColorOutput "🔧 添加到开机启动..." Blue

    try {
        $startupPath = [Environment]::GetFolderPath('Startup')
        $shortcutPath = Join-Path $startupPath "$ServiceName.lnk"

        # 创建PowerShell快捷方式
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($shortcutPath)

        $currentDir = Get-Location
        $scriptPath = Join-Path $currentDir "start_service.bat"

        $shortcut.TargetPath = $scriptPath
        $shortcut.WorkingDirectory = $currentDir
        $shortcut.IconLocation = "powershell.exe"
        $shortcut.Save()

        Write-ColorOutput "✅ 已添加到开机启动" Green
        Write-ColorOutput "💡 启动脚本位置: $shortcutPath" Yellow
        Write-ColorOutput "💡 如需移除，请删除该文件" Yellow

        return $true

    } catch {
        Write-ColorOutput "❌ 创建开机启动失败: $($_.Exception.Message)" Red
        return $false
    }
}

# 显示帮助信息
function Show-Help {
    Write-Host ""
    Write-ColorOutput "project_manager项目管理系统 - PowerShell服务管理脚本" Cyan
    Write-Host ""
    Write-ColorOutput "用法:" Yellow
    Write-Host "  .\service.ps1 [命令] [参数]"
    Write-Host ""
    Write-ColorOutput "命令:" Yellow
    Write-Host "  start     启动服务"
    Write-Host "  stop      停止服务"
    Write-Host "  restart   重启服务"
    Write-Host "  status    查看服务状态"
    Write-Host "  logs      查看最近日志"
    Write-Host "  monitor   实时监控服务状态"
    Write-Host "  install   安装Windows服务（需要管理员权限）"
    Write-Host "  startup   添加到开机启动"
    Write-Host "  help      显示帮助信息"
    Write-Host ""
    Write-ColorOutput "参数:" Yellow
    Write-Host "  -Port     指定端口号 (默认: 8001)"
    Write-Host "  -Lines    显示日志行数 (默认: 50)"
    Write-Host "  -Interval 监控间隔秒数 (默认: 5)"
    Write-Host ""
    Write-ColorOutput "示例:" Yellow
    Write-Host "  .\service.ps1 start                    # 启动服务"
    Write-Host "  .\service.ps1 status                   # 查看状态"
    Write-Host "  .\service.ps1 logs -Lines 100         # 查看100行日志"
    Write-Host "  .\service.ps1 monitor -Interval 3     # 每3秒监控一次"
    Write-Host "  .\service.ps1 start -Port 8080        # 在8080端口启动"
    Write-Host ""
}

# 主程序逻辑
function Main {
    # 检查Python环境
    if (-not (Test-Python)) {
        Write-ColorOutput "❌ 未找到Python环境" Red
        Write-ColorOutput "💡 请确保Python已安装并添加到PATH" Yellow
        exit 1
    }

    # 切换到脚本所在目录
    Set-Location $PSScriptRoot

    switch ($Command.ToLower()) {
        "start" {
            Start-ServiceManager
        }
        "stop" {
            Stop-ServiceManager
        }
        "restart" {
            Restart-ServiceManager
        }
        "status" {
            Show-DetailedStatus
        }
        "logs" {
            Show-Logs -Lines $Lines
        }
        "monitor" {
            Monitor-Service -Interval $Interval
        }
        "install" {
            Install-WindowsService
        }
        "startup" {
            Add-ToStartup
        }
        "help" {
            Show-Help
        }
        default {
            Write-ColorOutput "❌ 未知命令: $Command" Red
            Write-Host ""
            Show-Help
            exit 1
        }
    }
}

# 执行主程序
Main