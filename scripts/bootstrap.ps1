Write-Host "=== NEXORA bootstrap ===" -ForegroundColor Cyan

if (-not (Test-Path ".venv")) {
    py -3.12 -m venv .venv
}

.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
python -m pip install -r backend\django\requirements.txt
python -m pip install -r backend\fastapi\requirements.txt

docker compose up -d postgres redis mongodb

python backend\django\manage.py migrate
python backend\django\manage.py check

Write-Host ""
Write-Host "Bootstrap complete." -ForegroundColor Green
Write-Host "Create an admin with:"
Write-Host "python backend\django\manage.py createsuperuser"
Write-Host ""
Write-Host "Then run Django with:"
Write-Host "python backend\django\manage.py runserver"
