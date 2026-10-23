param(
    [ValidateSet('check', 'build', 'ota')]
    [string]$Action = 'build',
    [string]$SigningDirectory = (Join-Path $env:USERPROFILE '.mangoleaf-ai\signing'),
    [string]$OutputDirectory,
    [string]$Apk,
    [string]$Receipt,
    [long]$Sequence = 0,
    [string]$Tag
)

$ErrorActionPreference = 'Stop'
$projectDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$previousEnvironment = @{}
$commandExit = 1

function Read-ProtectedSigningValue([string]$ProtectedValue) {
    # DPAPI allows only the Windows account that saved these credentials to read them.
    $secureValue = ConvertTo-SecureString $ProtectedValue
    $pointer = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
    try { return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        $secureValue.Dispose()
    }
}

function Set-ReleaseEnvironment([string]$Name, [string]$Value) {
    $previousEnvironment[$Name] = [Environment]::GetEnvironmentVariable($Name, 'Process')
    [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
}

Push-Location -LiteralPath $projectDirectory
try {
    try {
        $configuration = Get-Content -LiteralPath (Join-Path $SigningDirectory 'signing-config.json') -Raw | ConvertFrom-Json
        $credentials = Get-Content -LiteralPath (Join-Path $SigningDirectory 'credentials.dpapi.json') -Raw | ConvertFrom-Json
        if ($configuration.schema -ne 1 -or $credentials.schema -ne 1) { throw 'Unsupported configuration.' }
        Set-ReleaseEnvironment 'MANGOLEAF_ANDROID_CERTIFICATE_SHA256' $configuration.certificateSha256
        if ($Action -ne 'ota') {
            Set-ReleaseEnvironment 'MANGOLEAF_ANDROID_KEYSTORE' $configuration.keystoreFile
            Set-ReleaseEnvironment 'MANGOLEAF_ANDROID_KEY_ALIAS' $configuration.keyAlias
            Set-ReleaseEnvironment 'MANGOLEAF_ANDROID_STORE_PASSWORD' (Read-ProtectedSigningValue $credentials.storePassword)
            Set-ReleaseEnvironment 'MANGOLEAF_ANDROID_KEY_PASSWORD' (Read-ProtectedSigningValue $credentials.keyPassword)
        }
        Set-ReleaseEnvironment 'MANGOLEAF_OTA_REPOSITORY' $configuration.repository
        Set-ReleaseEnvironment 'MANGOLEAF_OTA_METADATA_URL' $configuration.metadataUrl
        Set-ReleaseEnvironment 'MANGOLEAF_OTA_SIGNATURE_URL' $configuration.signatureUrl
        Set-ReleaseEnvironment 'MANGOLEAF_OTA_PUBLIC_KEY_BASE64' $configuration.otaPublicKeyBase64
        if ($Action -eq 'ota') {
            Set-ReleaseEnvironment 'MANGOLEAF_OTA_PRIVATE_KEY_FILE' $configuration.otaPrivateKeyFile
            Set-ReleaseEnvironment 'MANGOLEAF_OTA_KEY_PASSPHRASE' (Read-ProtectedSigningValue $credentials.otaKeyPassphrase)
        }
    } catch {
        throw 'Cannot load signing credentials. Use the original Windows account and the external signing folder. No keys were replaced.'
    }

    if (-not $env:JAVA_HOME -and (Test-Path -LiteralPath 'C:\Program Files\Android\Android Studio\jbr')) {
        Set-ReleaseEnvironment 'JAVA_HOME' 'C:\Program Files\Android\Android Studio\jbr'
    }
    if (-not $env:GRADLE_USER_HOME) {
        Set-ReleaseEnvironment 'GRADLE_USER_HOME' (Join-Path $projectDirectory '.tools\android-gradle-home')
    }
    if (-not $env:ANDROID_USER_HOME) {
        Set-ReleaseEnvironment 'ANDROID_USER_HOME' (Join-Path $projectDirectory '.tools\android-user-home')
    }

    if ($Action -eq 'ota') {
        if (-not $Apk -or -not $Receipt -or -not $Tag -or $Sequence -lt 2) {
            throw 'OTA preparation requires -Apk, -Receipt, -Tag and a new -Sequence of at least 2.'
        }
        $nodeArguments = @('tools/android-ota-release.mjs', 'prepare', '--apk', $Apk, '--receipt', $Receipt, '--sequence', "$Sequence", '--tag', $Tag)
    } else {
        $nodeArguments = @('tools/android-release.mjs', $Action)
    }
    if ($OutputDirectory) { $nodeArguments += @('--output', $OutputDirectory) }

    # Only child processes receive the credentials; the calling terminal is restored below.
    & node @nodeArguments
    $commandExit = $LASTEXITCODE
} finally {
    foreach ($name in $previousEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
    }
    $credentials = $null
    Pop-Location
}
exit $commandExit
