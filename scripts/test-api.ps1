<#
.SYNOPSIS
    Smoke-test de bout en bout pour l'API supermarket-backend.
    Exerce tous les endpoints actuellement implémentés, avec des cas
    valides ET des cas d'erreur attendus (401/400/404/409).

.DESCRIPTION
    Prérequis :
      - docker compose up -d (Postgres sur le port 5433)
      - npm run dev (ou tsx src/main.ts) — serveur sur http://localhost:3000

    Usage :
      cd supermarket-backend
      .\scripts\test-api.ps1

    Chaque section s'affiche en cyan, chaque résultat en vert (succès) ou
    jaune (erreur — souvent le comportement ATTENDU, lisez le libellé du
    test). Le script ne s'arrête jamais sur une erreur : il continue et
    affiche tout, pour donner une vue complète en un seul passage.
#>

$ErrorActionPreference = 'Continue'
$baseUrl = "http://localhost:3000"

function Invoke-ApiTest {
    param(
        [Parameter(Mandatory)] [string]$Name,
        [Parameter(Mandatory)] [scriptblock]$Action
    )
    Write-Host "`n--- $Name ---" -ForegroundColor Cyan
    try {
        $result = & $Action
        if ($null -ne $result) {
            Write-Host ($result | ConvertTo-Json -Depth 8 -Compress) -ForegroundColor Green
        } else {
            Write-Host "(réponse vide — normal pour un DELETE ou un 204)" -ForegroundColor Green
        }
        return $result
    } catch {
        $status = $null
        try { $status = $_.Exception.Response.StatusCode.value__ } catch {}
        $body = $null
        try { $body = $_.ErrorDetails.Message } catch {}
        Write-Host "STATUS: $status" -ForegroundColor Yellow
        if ($body) { Write-Host $body -ForegroundColor Yellow }
        else { Write-Host $_.Exception.Message -ForegroundColor Yellow }
        return $null
    }
}

Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 0. HEALTH CHECK (public, hors préfixe /api)" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

Invoke-ApiTest "GET /" { Invoke-RestMethod "$baseUrl/" }


Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 1. AUTHENTIFICATION" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

Invoke-ApiTest "POST /api/auth/login — mauvais mot de passe (401 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/login" -ContentType "application/json" `
        -Body (@{ email = "admin@superette.local"; password = "mauvais-mdp" } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/auth/login — password manquant (400 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/login" -ContentType "application/json" `
        -Body (@{ email = "admin@superette.local" } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/auth/login — email invalide (400 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/login" -ContentType "application/json" `
        -Body (@{ email = "pas-un-email"; password = "quelconque123" } | ConvertTo-Json)
}

$login = Invoke-ApiTest "POST /api/auth/login — identifiants corrects (200 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/login" -ContentType "application/json" `
        -Body (@{ email = "admin@superette.local"; password = "Admin@123456" } | ConvertTo-Json)
}
$headers = @{ Authorization = "Bearer $($login.accessToken)" }

Invoke-ApiTest "GET /api/auth/me (200 attendu)" {
    Invoke-RestMethod "$baseUrl/api/auth/me" -Headers $headers
}

$refresh = Invoke-ApiTest "POST /api/auth/refresh (200 attendu, nouveaux tokens)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/refresh" -ContentType "application/json" `
        -Body (@{ refreshToken = $login.refreshToken } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/auth/refresh — token invalide (401 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/refresh" -ContentType "application/json" `
        -Body (@{ refreshToken = "faux.token.ici" } | ConvertTo-Json)
}


Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 2. UTILISATEURS" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

Invoke-ApiTest "GET /api/users — sans token (401 attendu)" {
    Invoke-RestMethod "$baseUrl/api/users"
}

Invoke-ApiTest "GET /api/users — avec token (200 attendu, admin@superette.local)" {
    Invoke-RestMethod "$baseUrl/api/users" -Headers $headers
}


Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 3. CATALOGUE — Catégories" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

Invoke-ApiTest "GET /api/categories" {
    Invoke-RestMethod "$baseUrl/api/categories" -Headers $headers
}

# "Epicerie" existe déjà depuis les tests précédents (id réel de la base) :
$epicerieId = "e3a80ba2-941d-44cd-8b5a-accad0961935"
Invoke-ApiTest "GET /api/categories/:id (Epicerie)" {
    Invoke-RestMethod "$baseUrl/api/categories/$epicerieId" -Headers $headers
}

$newCategory = Invoke-ApiTest "POST /api/categories — créer 'Boissons' (201 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/categories" -Headers $headers -ContentType "application/json" `
        -Body (@{ name = "Boissons"; slug = "boissons-test" } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/categories — slug dupliqué (409 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/categories" -Headers $headers -ContentType "application/json" `
        -Body (@{ name = "Boissons bis"; slug = "boissons-test" } | ConvertTo-Json)
}

if ($newCategory) {
    Invoke-ApiTest "PUT /api/categories/:id — modifier la description" {
        Invoke-RestMethod -Method Put -Uri "$baseUrl/api/categories/$($newCategory.id)" -Headers $headers -ContentType "application/json" `
            -Body (@{ description = "Sodas, jus, eaux" } | ConvertTo-Json)
    }

    Invoke-ApiTest "DELETE /api/categories/:id (204 attendu)" {
        Invoke-RestMethod -Method Delete -Uri "$baseUrl/api/categories/$($newCategory.id)" -Headers $headers
    }
}


Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 4. CATALOGUE — Marques" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

Invoke-ApiTest "GET /api/brands" {
    Invoke-RestMethod "$baseUrl/api/brands" -Headers $headers
}

$brand = Invoke-ApiTest "POST /api/brands — créer 'Coca-Cola' (201 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/brands" -Headers $headers -ContentType "application/json" `
        -Body (@{ name = "Coca-Cola"; slug = "coca-cola" } | ConvertTo-Json)
}

if ($brand) {
    Invoke-ApiTest "PUT /api/brands/:id" {
        Invoke-RestMethod -Method Put -Uri "$baseUrl/api/brands/$($brand.id)" -Headers $headers -ContentType "application/json" `
            -Body (@{ description = "Boissons gazeuses" } | ConvertTo-Json)
    }
}


Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 5. CATALOGUE — Produits" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

Invoke-ApiTest "GET /api/products" {
    Invoke-RestMethod "$baseUrl/api/products" -Headers $headers
}

Invoke-ApiTest "GET /api/products?search=riz" {
    Invoke-RestMethod "$baseUrl/api/products?search=riz" -Headers $headers
}

# "Riz 5kg" existe déjà (produit réel de la base) :
$rizId = "7d385073-d075-40b6-8d83-d704d735649f"
Invoke-ApiTest "GET /api/products/:id (Riz 5kg)" {
    Invoke-RestMethod "$baseUrl/api/products/$rizId" -Headers $headers
}

Invoke-ApiTest "GET /api/products/code/RIZ-5KG — lookup par SKU (200 attendu)" {
    Invoke-RestMethod "$baseUrl/api/products/code/RIZ-5KG" -Headers $headers
}

Invoke-ApiTest "GET /api/products/code/INCONNU (404 attendu)" {
    Invoke-RestMethod "$baseUrl/api/products/code/INCONNU" -Headers $headers
}

$newProduct = $null
if ($brand) {
    $newProduct = Invoke-ApiTest "POST /api/products — créer 'Coca-Cola 33cl' (201 attendu)" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/products" -Headers $headers -ContentType "application/json" -Body (@{
            sku = "COCA-33CL-TEST"; name = "Coca-Cola 33cl"; slug = "coca-cola-33cl-test"
            brandId = $brand.id; categoryId = $epicerieId
            costPrice = 300; taxRate = 18; reorderLevel = 20; minimumStock = 10
        } | ConvertTo-Json)
    }
}

Invoke-ApiTest "POST /api/products — SKU dupliqué (409 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/products" -Headers $headers -ContentType "application/json" -Body (@{
        sku = "RIZ-5KG"; name = "Doublon"; slug = "doublon-test"
        costPrice = 100; taxRate = 0; reorderLevel = 1; minimumStock = 1
    } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/products — champs requis manquants (400 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/products" -Headers $headers -ContentType "application/json" `
        -Body (@{ sku = "X"; name = "X" } | ConvertTo-Json)
}

if ($newProduct) {
    Invoke-ApiTest "PUT /api/products/:id" {
        Invoke-RestMethod -Method Put -Uri "$baseUrl/api/products/$($newProduct.id)" -Headers $headers -ContentType "application/json" `
            -Body (@{ costPrice = 320 } | ConvertTo-Json)
    }
}


Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 6. STOCK" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

# Magasin par défaut du seed (id réel) :
$storeId = "190bac03-3b45-4ffc-be9a-fb0924d66e9e"

Invoke-ApiTest "GET /api/stock" {
    Invoke-RestMethod "$baseUrl/api/stock" -Headers $headers
}

Invoke-ApiTest "GET /api/stock/:storeId/:productId (Riz 5kg)" {
    Invoke-RestMethod "$baseUrl/api/stock/$storeId/$rizId" -Headers $headers
}

Invoke-ApiTest "POST /api/stock/movements — réception fournisseur +20 Riz (201 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/stock/movements" -Headers $headers -ContentType "application/json" -Body (@{
        storeId = $storeId; productId = $rizId; type = "PURCHASE_RECEIPT"; quantity = 20; unitCost = 3500
    } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/stock/movements — quantité négative sur SALE (400 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/stock/movements" -Headers $headers -ContentType "application/json" -Body (@{
        storeId = $storeId; productId = $rizId; type = "SALE"; quantity = -5
    } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/stock/movements — sortie dépassant le stock disponible (400 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/stock/movements" -Headers $headers -ContentType "application/json" -Body (@{
        storeId = $storeId; productId = $rizId; type = "SALE"; quantity = 999999
    } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/stock/movements — correction d'inventaire signée -3 (201 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/stock/movements" -Headers $headers -ContentType "application/json" -Body (@{
        storeId = $storeId; productId = $rizId; type = "INVENTORY_CORRECTION"; quantity = -3; notes = "Casse test"
    } | ConvertTo-Json)
}

Invoke-ApiTest "GET /api/stock/movements?productId=... — historique" {
    Invoke-RestMethod "$baseUrl/api/stock/movements?productId=$rizId" -Headers $headers
}


Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 7. CAISSE" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

Invoke-ApiTest "GET /api/cash-registers" {
    Invoke-RestMethod "$baseUrl/api/cash-registers" -Headers $headers
}

# "CAISSE-1" existe déjà (id réel de la base) :
$registerId = "c564869f-31b4-43a7-983f-434692fc7df5"

Invoke-ApiTest "POST /api/cash-registers — code dupliqué sur le même magasin (409 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/cash-registers" -Headers $headers -ContentType "application/json" `
        -Body (@{ storeId = $storeId; code = "CAISSE-1"; name = "Doublon" } | ConvertTo-Json)
}

# Nettoyage : ferme toute session restée ouverte sur cette caisse (run précédent
# interrompu) pour que le script reste rejouable sans intervention manuelle.
$staleSessions = Invoke-ApiTest "GET /api/cash-sessions?status=OPEN — vérification avant ouverture" {
    Invoke-RestMethod "$baseUrl/api/cash-sessions?status=OPEN" -Headers $headers
}
foreach ($stale in @($staleSessions) | Where-Object { $_ -and $_.cashRegisterId -eq $registerId }) {
    Invoke-ApiTest "Nettoyage : fermeture d'une session restée ouverte ($($stale.id))" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/cash-sessions/$($stale.id)/close" -Headers $headers -ContentType "application/json" `
            -Body (@{ actualAmount = [double]$stale.expectedAmount; notes = "Nettoyage auto avant test-api.ps1" } | ConvertTo-Json)
    }
}

$session = Invoke-ApiTest "POST /api/cash-sessions/open — ouvrir une session (fond 5000) (201 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/cash-sessions/open" -Headers $headers -ContentType "application/json" `
        -Body (@{ cashRegisterId = $registerId; openingAmount = 5000 } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/cash-sessions/open — 2e session sur la même caisse (409 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/cash-sessions/open" -Headers $headers -ContentType "application/json" `
        -Body (@{ cashRegisterId = $registerId; openingAmount = 1000 } | ConvertTo-Json)
}

if ($session) {
    Invoke-ApiTest "GET /api/cash-sessions/:id" {
        Invoke-RestMethod "$baseUrl/api/cash-sessions/$($session.id)" -Headers $headers
    }

    Invoke-ApiTest "GET /api/cash-sessions?status=OPEN" {
        Invoke-RestMethod "$baseUrl/api/cash-sessions?status=OPEN" -Headers $headers
    }
}


Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 8. VENTES (utilise la session ouverte ci-dessus)" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

$sale = $null
if ($session) {
    $sale = Invoke-ApiTest "POST /api/sales — 3 x Riz 5kg à 4000 CFA, paiement CASH (201 attendu)" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/sales" -Headers $headers -ContentType "application/json" -Body (@{
            storeId  = $storeId
            sessionId = $session.id
            items    = @(@{ productId = $rizId; quantity = 3; unitPrice = 4000 })
            payments = @(@{ method = "CASH"; amount = 12000 })
        } | ConvertTo-Json -Depth 5)
    }

    Invoke-ApiTest "POST /api/sales — paiement ne correspondant pas au total (400 attendu)" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/sales" -Headers $headers -ContentType "application/json" -Body (@{
            storeId  = $storeId
            sessionId = $session.id
            items    = @(@{ productId = $rizId; quantity = 1; unitPrice = 4000 })
            payments = @(@{ method = "CASH"; amount = 100 })
        } | ConvertTo-Json -Depth 5)
    }

    Invoke-ApiTest "POST /api/sales — paiement MTN_MOMO simulé, succès (201 attendu, providerRef FAKE-...)" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/sales" -Headers $headers -ContentType "application/json" -Body (@{
            storeId  = $storeId
            sessionId = $session.id
            items    = @(@{ productId = $rizId; quantity = 1; unitPrice = 4000 })
            payments = @(@{ method = "MTN_MOMO"; amount = 4000; transactionRef = "MTN-CLIENT-REF-001" })
        } | ConvertTo-Json -Depth 5)
    }

    Invoke-ApiTest "POST /api/sales — paiement AIRTEL_MONEY forceFailure (422 attendu, zéro trace en base)" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/sales" -Headers $headers -ContentType "application/json" -Body (@{
            storeId  = $storeId
            sessionId = $session.id
            items    = @(@{ productId = $rizId; quantity = 1; unitPrice = 4000 })
            payments = @(@{ method = "AIRTEL_MONEY"; amount = 4000; forceFailure = $true })
        } | ConvertTo-Json -Depth 5)
    }

    Invoke-ApiTest "POST /api/sales — méthode de paiement inconnue (400 attendu, message clair)" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/sales" -Headers $headers -ContentType "application/json" -Body (@{
            storeId  = $storeId
            sessionId = $session.id
            items    = @(@{ productId = $rizId; quantity = 1; unitPrice = 4000 })
            payments = @(@{ method = "BITCOIN"; amount = 4000 })
        } | ConvertTo-Json -Depth 5)
    }
}

Invoke-ApiTest "GET /api/sales" {
    Invoke-RestMethod "$baseUrl/api/sales" -Headers $headers
}

if ($sale) {
    Invoke-ApiTest "GET /api/sales/:id — détail avec items + payments imbriqués" {
        Invoke-RestMethod "$baseUrl/api/sales/$($sale.id)" -Headers $headers
    }
}

if ($session) {
    Invoke-ApiTest "POST /api/cash-sessions/:id/movements — sortie EXPENSE -500" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/cash-sessions/$($session.id)/movements" -Headers $headers -ContentType "application/json" `
            -Body (@{ type = "EXPENSE"; amount = 500; reason = "Test script" } | ConvertTo-Json)
    }

    $expectedClose = 5000 + 12000 - 500
    Write-Host "`n(clôture attendue : 5000 ouverture + 12000 vente - 500 dépense = $expectedClose)" -ForegroundColor DarkGray
    Invoke-ApiTest "POST /api/cash-sessions/:id/close — montant compté = $expectedClose" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/cash-sessions/$($session.id)/close" -Headers $headers -ContentType "application/json" `
            -Body (@{ actualAmount = $expectedClose; notes = "Test script" } | ConvertTo-Json)
    }

    Invoke-ApiTest "POST /api/sales — vente sur session désormais fermée (400 attendu)" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/sales" -Headers $headers -ContentType "application/json" -Body (@{
            storeId  = $storeId
            sessionId = $session.id
            items    = @(@{ productId = $rizId; quantity = 1; unitPrice = 4000 })
            payments = @(@{ method = "CASH"; amount = 4000 })
        } | ConvertTo-Json -Depth 5)
    }
}

Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 9. REÇUS (généré automatiquement par la vente ci-dessus)" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

$receipt = $null
if ($sale) {
    $receipt = Invoke-ApiTest "GET /api/receipts/by-order/:orderId" {
        Invoke-RestMethod "$baseUrl/api/receipts/by-order/$($sale.orderId)" -Headers $headers
    }
}

if ($receipt) {
    Invoke-ApiTest "GET /api/receipts/:id" {
        Invoke-RestMethod "$baseUrl/api/receipts/$($receipt.id)" -Headers $headers
    }
}


Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# 10. UTILISATEURS & RÔLES" -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta

Invoke-ApiTest "GET /api/roles — catalogue des 11 rôles système" {
    Invoke-RestMethod "$baseUrl/api/roles" -Headers $headers
}

Invoke-ApiTest "GET /api/users" {
    Invoke-RestMethod "$baseUrl/api/users" -Headers $headers
}

# Email unique à chaque exécution pour que le script reste rejouable sans 409.
$testEmail = "test.cashier.$(Get-Date -Format 'yyyyMMddHHmmss')@superette.local"

$newUser = Invoke-ApiTest "POST /api/users — créer un caissier avec rôle CASHIER (201 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/users" -Headers $headers -ContentType "application/json" -Body (@{
        email = $testEmail; password = "Cashier@123"; firstName = "Test"; lastName = "Caissier"; roles = @("CASHIER")
    } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/users — email dupliqué (409 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/users" -Headers $headers -ContentType "application/json" -Body (@{
        email = $testEmail; password = "Autre@1234"; firstName = "X"; lastName = "Y"
    } | ConvertTo-Json)
}

Invoke-ApiTest "POST /api/users — champs requis manquants (400 attendu)" {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/api/users" -Headers $headers -ContentType "application/json" `
        -Body (@{ email = "incomplet@test.local" } | ConvertTo-Json)
}

if ($newUser) {
    # Vérifie que le RBAC s'applique bien à un compte fraîchement créé, pas seulement au seed.
    $cashierLogin = Invoke-ApiTest "POST /api/auth/login — connexion avec le nouveau compte (200 attendu)" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/login" -ContentType "application/json" `
            -Body (@{ email = $testEmail; password = "Cashier@123" } | ConvertTo-Json)
    }
    if ($cashierLogin) {
        $cashierHeaders = @{ Authorization = "Bearer $($cashierLogin.accessToken)" }

        Invoke-ApiTest "Nouveau compte : POST /api/categories (403 attendu — CASHIER n'a pas CATEGORIES:CREATE)" {
            Invoke-RestMethod -Method Post -Uri "$baseUrl/api/categories" -Headers $cashierHeaders -ContentType "application/json" `
                -Body (@{ name = "Test RBAC"; slug = "test-rbac-$(Get-Random)" } | ConvertTo-Json)
        }

        Invoke-ApiTest "Nouveau compte : GET /api/products (200 attendu — CASHIER a PRODUCTS:READ)" {
            Invoke-RestMethod "$baseUrl/api/products" -Headers $cashierHeaders
        }
    }

    # Téléphone unique à chaque exécution, même raison que $testEmail plus haut.
    $testPhone = "+2420" + (Get-Date -Format "HHmmssff")
    Invoke-ApiTest "PUT /api/users/:id — mise à jour du téléphone" {
        Invoke-RestMethod -Method Put -Uri "$baseUrl/api/users/$($newUser.id)" -Headers $headers -ContentType "application/json" `
            -Body (@{ phone = $testPhone } | ConvertTo-Json)
    }

    Invoke-ApiTest "PUT /api/users/:id — téléphone déjà utilisé par un autre compte (409 attendu)" {
        Invoke-RestMethod -Method Put -Uri "$baseUrl/api/users/$($newUser.id)" -Headers $headers -ContentType "application/json" `
            -Body (@{ phone = "+242060000000" } | ConvertTo-Json)  # téléphone de l'admin du seed
    }

    Invoke-ApiTest "POST /api/users/:id/roles — assigner STOCK_MANAGER en plus" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/users/$($newUser.id)/roles" -Headers $headers -ContentType "application/json" `
            -Body (@{ roleCode = "STOCK_MANAGER" } | ConvertTo-Json)
    }

    Invoke-ApiTest "DELETE /api/users/:id/roles/STOCK_MANAGER — révoquer" {
        Invoke-RestMethod -Method Delete -Uri "$baseUrl/api/users/$($newUser.id)/roles/STOCK_MANAGER" -Headers $headers
    }

    Invoke-ApiTest "POST /api/users/:id/reset-password" {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/api/users/$($newUser.id)/reset-password" -Headers $headers -ContentType "application/json" `
            -Body (@{ newPassword = "NouveauMdp@123" } | ConvertTo-Json)
    }
}


Write-Host "`n################################################################" -ForegroundColor Magenta
Write-Host "# Terminé." -ForegroundColor Magenta
Write-Host "################################################################" -ForegroundColor Magenta
