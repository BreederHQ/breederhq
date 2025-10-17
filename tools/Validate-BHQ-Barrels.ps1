#Requires -Version 5.1
<#
BHQ barrel/exports validator (read-only).

Run:
  powershell -ExecutionPolicy Bypass -File .\tools\Validate-BHQ-Barrels.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-UISrcRoot {
  param([string]$StartDir)
  $dir = (Resolve-Path $StartDir).Path
  while ($true) {
    $candidate = Join-Path $dir "packages\ui\src"
    if (Test-Path $candidate) { return (Resolve-Path $candidate).Path }
    $parent = Split-Path $dir -Parent
    if ([string]::IsNullOrEmpty($parent) -or $parent -eq $dir) { break }
    $dir = $parent
  }
  throw "Could not find 'packages\ui\src' from '$StartDir'."
}

function AsArray { param($x) if ($null -eq $x) { @() } elseif ($x -is [System.Array]) { ,$x } else { @($x) } }

$ScriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$UiSrc = Resolve-UISrcRoot -StartDir $ScriptRoot
Write-Host "UI src: $UiSrc" -ForegroundColor Cyan

$Namespaces = @("components","hooks","overlay","storage","styles","utils")

$Issues = New-Object System.Collections.Generic.List[object]
function Add-Issue { param([ValidateSet("ERROR","WARN","INFO")][string]$Kind,[string]$Where,[string]$Detail)
  $Issues.Add([pscustomobject]@{ Kind=$Kind; Where=$Where; Detail=$Detail })
}

function Read-File { param([string]$Path) if (Test-Path $Path) { return [System.IO.File]::ReadAllText($Path) } else { $null } }
function TrimExt($name) { [System.IO.Path]::GetFileNameWithoutExtension($name) }

function Get-MainFile {
  param([string]$FolderPath)
  $folderName = Split-Path $FolderPath -Leaf

  $preferred = @(
    Join-Path $FolderPath "$folderName.tsx"
    Join-Path $FolderPath "$folderName.ts"
  ) | Where-Object { Test-Path $_ }
  $preferred = @($preferred)
  if ($preferred.Count -gt 0) { return (Resolve-Path $preferred[0]).Path }

  $candidates = @(Get-ChildItem -Path $FolderPath -File -Include *.ts,*.tsx | Where-Object { $_.Name -notmatch '^index\.ts$' })
  $count = @($candidates).Count
  if ($count -eq 1) { return $candidates[0].FullName }
  if ($count -eq 0) { return $null }
  return $null
}

function Validate-Subfolder {
  param([string]$NamespacePath,[string]$Subfolder)

  $folderPath = Join-Path $NamespacePath $Subfolder
  $indexPath  = Join-Path $folderPath "index.ts"

  if (-not (Test-Path $folderPath)) {
    Add-Issue ERROR "$folderPath" "Subfolder missing."
    return
  }

  $main = Get-MainFile -FolderPath $folderPath
  if (-not $main) {
    Add-Issue WARN "$folderPath" "Cannot determine main .ts/.tsx file (expects '$Subfolder.ts(x)' or a single non-index file)."
    return
  }

  $mainBase = TrimExt (Split-Path $main -Leaf)

  if (-not (Test-Path $indexPath)) {
    Add-Issue ERROR "$indexPath" "Missing. Expected to export from './$mainBase'."
    return
  }

  $barrel = Read-File $indexPath
  if (-not $barrel) {
    Add-Issue ERROR "$indexPath" "Unreadable."
    return
  }

  if ($barrel -notmatch [regex]::Escape("export * from ""./$mainBase""")) {
    Add-Issue ERROR "$indexPath" "Does not contain: export * from ""./$mainBase"";"
  }

  if ($barrel -match "export\s*\{\s*default\s+as\s+$([regex]::Escape($Subfolder))\s*\}\s*from\s*[""']\.\/") {
    Add-Issue WARN "$indexPath" "Uses default alias style; prefer 'export * from ""./$mainBase""'."
  }
}

function Validate-NamespaceBarrel {
  param([string]$NamespacePath)

  $nsName = Split-Path $NamespacePath -Leaf
  $barrelPath = Join-Path $NamespacePath "index.ts"
  if (-not (Test-Path $barrelPath)) {
    Add-Issue ERROR "$barrelPath" "Missing namespace barrel."
    return
  }

  $barrel = Read-File $barrelPath
  if (-not $barrel) {
    Add-Issue ERROR "$barrelPath" "Unreadable namespace barrel."
    return
  }

  $dirs = @(Get-ChildItem -Path $NamespacePath -Directory | Where-Object { $_.Name -ne "node_modules" })
  foreach ($d in $dirs) {
    if ($barrel -notmatch [regex]::Escape("export * from ""./$($d.Name)""")) {
      Add-Issue ERROR "$barrelPath" "Missing line: export * from `"./$($d.Name)`";"
    }
  }

  $exportMatchesObj = Select-String -Path $barrelPath -Pattern 'export\s+\*\s+from\s+["''][.]/([^"'']+)["'']' -AllMatches -ErrorAction SilentlyContinue
  $exportMatches = @()
  if ($exportMatchesObj) { $exportMatches = AsArray $exportMatchesObj.Matches }
  $seen = @{}
  foreach ($m in $exportMatches) {
    $rel = $m.Groups[1].Value
    if (-not $seen.ContainsKey($rel)) { $seen[$rel] = @() }
    $seen[$rel] = $seen[$rel] + @($rel)
  }

  foreach ($k in $seen.Keys) {
    $list = @($seen[$k])
    if ($list.Count -gt 1) {
      Add-Issue WARN "$barrelPath" "Duplicate export for ./$k"
    }
    $target = Join-Path $NamespacePath $k
    $parent = Split-Path $target -Parent
    $leaf   = Split-Path $target -Leaf
    if (Test-Path $parent) {
      $dirHit = @(Get-ChildItem -Path $parent -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -ieq $leaf })
      if (@($dirHit).Count -gt 0) {
        $actualName = $dirHit[0].Name
        if ($actualName -cne $leaf) {
          Add-Issue WARN "$barrelPath" "Case mismatch: exports './$k' but folder is './$actualName'."
        }
      }
    }
  }
}

function Validate-TopIndex {
  param([string]$UiSrcPath)
  $topIndex = Join-Path $UiSrcPath "index.ts"
  if (-not (Test-Path $topIndex)) {
    Add-Issue ERROR "$topIndex" "Missing top-level index.ts"
    return
  }
  $txt = Read-File $topIndex
  foreach ($ns in $Namespaces) {
    $nsPath = Join-Path $UiSrcPath $ns
    if (Test-Path $nsPath) {
      if ($txt -notmatch [regex]::Escape("export * as $ns from ""./$ns""")) {
        Add-Issue WARN "$topIndex" "Missing line: export * as $ns from `"./$ns`";"
      }
    }
  }
}

function Scan-BadImports {
  param([string]$UiSrcPath)
  $allTs = @(Get-ChildItem -Path $UiSrcPath -Recurse -File -Include *.ts,*.tsx)
  $bad = @(
    @{ Pat = "@bhq/hooks/";  Suggest = "Use '@bhq/ui/hooks/...'" }
    @{ Pat = "@bhq/overlay"; Suggest = "Use '@bhq/ui/overlay'" }
    @{ Pat = "@bhq/utils/";  Suggest = "Use '@bhq/ui/utils/...'" }
  )

  foreach ($f in $allTs) {
    $txt = Read-File $f.FullName
    if (-not $txt) { continue }

    foreach ($b in $bad) {
      if ($txt -match [regex]::Escape($b.Pat)) {
        Add-Issue WARN $f.FullName "Import uses '$($b.Pat)'. $($b.Suggest)"
      }
    }

    $mmObj = Select-String -InputObject $txt -Pattern 'from\s+["''](\.\/|\.\.\/)([^"'']+)["'']' -AllMatches -ErrorAction SilentlyContinue
    $matches = @()
    if ($mmObj) { $matches = AsArray $mmObj.Matches }
    foreach ($m in $matches) {
      $rel = $m.Groups[2].Value
      $dir = Split-Path $f.FullName -Parent
      $abs = Join-Path $dir $rel
      $pDir = Split-Path $abs -Parent
      $pLeaf = Split-Path $abs -Leaf
      if (Test-Path $pDir) {
        $hit = @(Get-ChildItem -Path $pDir -ErrorAction SilentlyContinue | Where-Object { $_.Name -ieq $pLeaf })
        if (@($hit).Count -gt 0) {
          if ($hit[0].Name -cne $pLeaf) {
            Add-Issue WARN $f.FullName "Import path casing differs: '$rel' vs actual '$($hit[0].Name)'."
          }
        }
      }
    }
  }
}

foreach ($ns in $Namespaces) {
  $nsPath = Join-Path $UiSrc $ns
  if (-not (Test-Path $nsPath)) {
    Add-Issue INFO $nsPath "Namespace folder missing; skipping."
    continue
  }
  $subfolders = @(Get-ChildItem -Path $nsPath -Directory)
  foreach ($sf in $subfolders) { Validate-Subfolder -NamespacePath $nsPath -Subfolder $sf.Name }
  Validate-NamespaceBarrel -NamespacePath $nsPath
}

Validate-TopIndex -UiSrcPath $UiSrc
Scan-BadImports -UiSrcPath $UiSrc

$errors = @($Issues | Where-Object { $_.Kind -eq "ERROR" })
$warns  = @($Issues | Where-Object { $_.Kind -eq "WARN" })
$infos  = @($Issues | Where-Object { $_.Kind -eq "INFO" })

Write-Host ""
Write-Host "==== BHQ Barrel Validation Report ====" -ForegroundColor Yellow
Write-Host ("Errors : {0}" -f $errors.Count) -ForegroundColor Red
Write-Host ("Warnings: {0}" -f $warns.Count)  -ForegroundColor DarkYellow
Write-Host ("Info    : {0}" -f $infos.Count)  -ForegroundColor DarkCyan
Write-Host ""

foreach ($k in @("ERROR","WARN","INFO")) {
  $color = if ($k -eq "ERROR") { "Red" } elseif ($k -eq "WARN") { "DarkYellow" } else { "DarkCyan" }
  $group = @($Issues | Where-Object { $_.Kind -eq $k })
  if ($group.Count -gt 0) {
    Write-Host "---- $k ----" -ForegroundColor $color
    foreach ($i in $group) {
      Write-Host ("[{0}] {1}`n       {2}" -f $i.Kind, $i.Where, $i.Detail)
    }
    Write-Host ""
  }
}

if ($errors.Count -gt 0) { exit 1 } else { exit 0 }
