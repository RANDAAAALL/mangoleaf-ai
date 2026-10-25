param(
    [ValidateSet('devices', 'install', 'build-install')]
    [string]$Action = 'build-install'
)

$ErrorActionPreference = 'Stop'
$projectDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$apk = Join-Path $projectDirectory 'android\app\build\outputs\apk\debug\app-debug.apk'
$previousJavaHome = $env:JAVA_HOME
$previousGradleHome = $env:GRADLE_USER_HOME

function Invoke-DebugStep([string]$File, [string[]]$CommandArguments, [string]$FailureMessage) {
    # Native tools can write progress to stderr even when they succeed.
    $ErrorActionPreference = 'Continue'
    $command = Get-Command -Name $File -CommandType Application -ErrorAction Stop
    $global:LASTEXITCODE = $null
    & $command.Source @CommandArguments
    if ($LASTEXITCODE -ne 0) { throw $FailureMessage }
}

function Find-DebugAdb {
    $sdkDirectories = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT)
    if ($env:LOCALAPPDATA) { $sdkDirectories += (Join-Path $env:LOCALAPPDATA 'Android\Sdk') }
    foreach ($sdkDirectory in $sdkDirectories) {
        if (-not $sdkDirectory) { continue }
        $candidate = Join-Path $sdkDirectory 'platform-tools\adb.exe'
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    $command = Get-Command adb.exe -CommandType Application -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    throw 'ADB was not found. Install Android SDK Platform-Tools and set ANDROID_HOME or add adb.exe to PATH.'
}

Push-Location -LiteralPath $projectDirectory
try {
    $adb = Find-DebugAdb
    if ($Action -eq 'devices') {
        Invoke-DebugStep -File $adb -CommandArguments @('devices', '-l') -FailureMessage 'Could not list Android devices.'
        return
    }

    if ($Action -eq 'install' -and -not (Test-Path -LiteralPath $apk -PathType Leaf)) {
        throw 'The Debug APK is missing. Connect your USB phone and run bun run android:debug to build and install it.'
    }
    # Refuse missing, unauthorized, offline or ambiguous USB targets before building.
    Invoke-DebugStep -File $adb -CommandArguments @('-d', 'get-state') -FailureMessage 'Connect one USB phone, unlock it and allow USB debugging. Check bun run android:devices; emulators are not selected.'

    if ($Action -eq 'build-install') {
        Invoke-DebugStep -File 'bun' -CommandArguments @('run', 'security:runtime') -FailureMessage 'Node runtime check failed. Update Node before rebuilding.'
        if (-not $env:JAVA_HOME -and (Test-Path -LiteralPath 'C:\Program Files\Android\Android Studio\jbr')) {
            $env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
        }
        if (-not $env:GRADLE_USER_HOME) {
            $env:GRADLE_USER_HOME = Join-Path $projectDirectory '.tools\android-gradle-home'
        }
        # Keep ANDROID_USER_HOME unchanged so the existing Debug signing identity is reused.
        Invoke-DebugStep -File 'bun' -CommandArguments @('run', 'android:bundle') -FailureMessage 'Android app preparation failed. No APK was installed.'
        Push-Location -LiteralPath (Join-Path $projectDirectory 'android')
        try {
            Invoke-DebugStep -File '.\gradlew.bat' -CommandArguments @('assembleDebug', 'verifyDebugBundle', '--no-daemon', '--max-workers=2') -FailureMessage 'Debug build or packaged-file verification failed. No APK was installed.'
        } finally {
            Pop-Location
        }
    }

    if (-not (Test-Path -LiteralPath $apk -PathType Leaf)) { throw 'The Debug build did not produce app-debug.apk. No APK was installed.' }
    Invoke-DebugStep -File $adb -CommandArguments @('-d', 'install', '-r', $apk) -FailureMessage 'Debug APK installation failed. Check the USB connection and error above. Do not uninstall or clear app data.'
    Write-Host 'Debug APK installed. Close and reopen the Debug app to test it.'
} finally {
    $env:JAVA_HOME = $previousJavaHome
    $env:GRADLE_USER_HOME = $previousGradleHome
    Pop-Location
}
