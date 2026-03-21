# Dočasný skript: commit + push (spusťte z kořene projektu)
Set-Location $PSScriptRoot
$ErrorActionPreference = 'Stop'
git add -A
git status
git commit -m "SPA: menu, vyhledávání z Filtrování rostlin/output.html, úpravy public"
git push
