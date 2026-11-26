$env:RUSTUP_HOME = "$PSScriptRoot\.toolchain\rustup"
$env:CARGO_HOME  = "$PSScriptRoot\.toolchain\cargo"
$env:BUN_INSTALL = "$PSScriptRoot\.toolchain\bun"
$env:PATH        = "$env:CARGO_HOME\bin;$env:BUN_INSTALL\bin;$env:PATH"
