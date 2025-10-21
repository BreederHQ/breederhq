$ErrorActionPreference = "Stop"

# Files to normalize (add more if needed)
$targets = @(
  "apps/contacts/src/App-Contacts.tsx",
  "apps/animals/src/App-Animals.tsx"
) | ForEach-Object { $_ -replace '/', '\' } | Where-Object { Test-Path $_ }

if (-not $targets.Count) {
  Write-Host "[WARN] No target files found to normalize." -ForegroundColor Yellow
  exit 0
}

foreach ($file in $targets) {
  $full = Resolve-Path $file
  $orig = Get-Content $full -Raw

  # 1) Ensure shared CSS import exists (once)
  $importLine = 'import "@bhq/ui/styles/table.css";'
  $hasImport = $orig -match [regex]::Escape($importLine)
  if (-not $hasImport) {
    # add after the last existing import
    $orig = $orig -replace "(\bimport\s.+?;)(?!.*\bimport\s)", "`$0`r`n$importLine"
  }

  # 2) Remove module-only row divider (caused extra lines in Contacts)
  #    Removes classNames that include both 'divide-y' and 'divide-hairline' on <tbody ...>
  $step = $orig -replace '(?<open><tbody\b[^>]*\bclassName\s*=\s*")([^"]*\bdivide-y\b[^"]*\bdivide-hairline\b[^"]*)(?="[^>]*>)', {
    # strip both tokens from the class list
    $classes = $matches[2] -split '\s+' | Where-Object { $_ -ne 'divide-y' -and $_ -ne 'divide-hairline' }
    $clean = ($classes -join ' ').Trim()
    if ($clean) { "$($matches['open'])$clean" } else { $matches['open'].ToString().TrimEnd('"') + '"' }
  }

  # 3) Remove per-module sticky/right classes on the utility col; replace with 'util'
  #    Targets td/th className that contain 'sticky' AND 'right-0'
  $step = $step -replace '(className\s*=\s*")([^"]*?\bsticky\b[^"]*?\bright-0\b[^"]*?)(")', {
    $classes = $matches[2] -split '\s+' |
      Where-Object { $_ -notin @('sticky','right-0','bg-surface','bg-surface-strong','bg-white','bg-[hsl(var(--glass))]') }
    # ensure util is present
    if ($classes -notcontains 'util') { $classes += 'util' }
    'className="' + (($classes | Where-Object { $_ }) -join ' ').Trim() + '"'
  }

  # 4) Optional: normalize any hard-coded width on the utility header cell
  $step = $step -replace '(className\s*=\s*")([^"]*?\bw-1[0-9]\b[^"]*?)(")([^>]*>\s*</th>)', {
    # keep other classes, but let CSS control width; util will handle sizing
    'className="' + ($matches[2] -split '\s+' | Where-Object { $_ -notmatch '^w-\d+$' } -join ' ') + '"' + $matches[4]
  }

  # Only write if changed
  if ($step -ne $orig) {
    Copy-Item -LiteralPath $full -Destination ($full.Path + ".bak") -Force
    [System.IO.File]::WriteAllText($full, $step, [System.Text.UTF8Encoding]::new($false))
    Write-Host "[OK] Normalized $full (backup at $($full.Path).bak)" -ForegroundColor Green
  } else {
    Write-Host "[SKIP] Already clean: $full" -ForegroundColor DarkGray
  }
}

Write-Host "`nDone. Rebuild your app (pnpm dev / npm run dev)." -ForegroundColor Cyan
