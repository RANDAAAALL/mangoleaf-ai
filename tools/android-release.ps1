param(
    [ValidateSet('check', 'build', 'ota', 'install')]
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
    if ($Action -eq 'install' -and (-not $Apk -or -not $Receipt -or $OutputDirectory)) {
        throw 'Installation requires -Apk and -Receipt from the approved build; it does not accept -OutputDirectory.'
    }
    try {
        $configuration = Get-Content -LiteralPath (Join-Path $SigningDirectory 'signing-config.json') -Raw | ConvertFrom-Json
        if ($configuration.schema -ne 1) { throw 'Unsupported configuration.' }
        Set-ReleaseEnvironment 'MANGOLEAF_ANDROID_CERTIFICATE_SHA256' $configuration.certificateSha256
        if ($Action -ne 'install') {
            $credentials = Get-Content -LiteralPath (Join-Path $SigningDirectory 'credentials.dpapi.json') -Raw | ConvertFrom-Json
            if ($credentials.schema -ne 1) { throw 'Unsupported credentials.' }
        }
        if ($Action -in @('check', 'build')) {
            Set-ReleaseEnvironment 'MANGOLEAF_ANDROID_KEYSTORE' $configuration.keystoreFile
            Set-ReleaseEnvironment 'MANGOLEAF_ANDROID_KEY_ALIAS' $configuration.keyAlias
            Set-ReleaseEnvironment 'MANGOLEAF_ANDROID_STORE_PASSWORD' (Read-ProtectedSigningValue $credentials.storePassword)
            Set-ReleaseEnvironment 'MANGOLEAF_ANDROID_KEY_PASSWORD' (Read-ProtectedSigningValue $credentials.keyPassword)
        }
        if ($Action -ne 'install') {
            Set-ReleaseEnvironment 'MANGOLEAF_OTA_REPOSITORY' $configuration.repository
            Set-ReleaseEnvironment 'MANGOLEAF_OTA_METADATA_URL' $configuration.metadataUrl
            Set-ReleaseEnvironment 'MANGOLEAF_OTA_SIGNATURE_URL' $configuration.signatureUrl
            Set-ReleaseEnvironment 'MANGOLEAF_OTA_PUBLIC_KEY_BASE64' $configuration.otaPublicKeyBase64
        }
        if ($Action -eq 'ota') {
            Set-ReleaseEnvironment 'MANGOLEAF_OTA_PRIVATE_KEY_FILE' $configuration.otaPrivateKeyFile
            Set-ReleaseEnvironment 'MANGOLEAF_OTA_KEY_PASSPHRASE' (Read-ProtectedSigningValue $credentials.otaKeyPassphrase)
        }
    } catch {
        throw 'Cannot load the required external signing configuration or credentials. No keys were replaced.'
    }

    if (-not $env:JAVA_HOME -and (Test-Path -LiteralPath 'C:\Program Files\Android\Android Studio\jbr')) {
        Set-ReleaseEnvironment 'JAVA_HOME' 'C:\Program Files\Android\Android Studio\jbr'
    }
    if ($Action -ne 'install' -and -not $env:GRADLE_USER_HOME) {
        Set-ReleaseEnvironment 'GRADLE_USER_HOME' (Join-Path $projectDirectory '.tools\android-gradle-home')
    }
    if ($Action -ne 'install' -and -not $env:ANDROID_USER_HOME) {
        Set-ReleaseEnvironment 'ANDROID_USER_HOME' (Join-Path $projectDirectory '.tools\android-user-home')
    }

    if ($Action -eq 'ota') {
        if (-not $Apk -or -not $Receipt -or -not $Tag -or $Sequence -lt 2) {
            throw 'OTA preparation requires -Apk, -Receipt, -Tag and a new -Sequence of at least 2.'
        }
        $nodeArguments = @('tools/android-ota-release.mjs', 'prepare', '--apk', $Apk, '--receipt', $Receipt, '--sequence', "$Sequence", '--tag', $Tag)
    } elseif ($Action -eq 'install') {
        # Verification/installation needs only the public signer pin, never private keys/passwords.
        $nodeArguments = @('tools/android-release.mjs', 'install', '--apk', $Apk, '--receipt', $Receipt, '--certificate-sha256', $configuration.certificateSha256)
    } else {
        $nodeArguments = @('tools/android-release.mjs', $Action)
    }
    if ($OutputDirectory) { $nodeArguments += @('--output', $OutputDirectory) }

    # Only child processes receive the credentials; the calling terminal is restored below.
    $nodeCommand = Get-Command node -CommandType Application -ErrorAction Stop
    $ErrorActionPreference = 'Continue'
    $global:LASTEXITCODE = $null
    & $nodeCommand.Source @nodeArguments
    if ($null -ne $LASTEXITCODE) { $commandExit = $LASTEXITCODE }
} finally {
    foreach ($name in $previousEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
    }
    $credentials = $null
    Pop-Location
}
exit $commandExit
