# HappiMaintenance

Expense tracking & maintenance management app with role-based access control.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI, Python 3.12, Motor (async MongoDB) |
| Database | Azure Cosmos DB for MongoDB API |
| Auth | Custom JWT (access + refresh tokens in httpOnly cookies) |
| Containers | Docker multi-stage builds |
| Orchestration | Azure Kubernetes Service (AKS) + NGINX Ingress |
| Registry | Azure Container Registry (ACR) |
| CI/CD | GitHub Actions |

## Repository Structure

```
HappiMaintain/
├── happi-maintenance-api/    ← FastAPI backend (push as separate GitHub repo)
└── happi-maintenance-web/    ← Next.js 15 frontend (push as separate GitHub repo)
```

## Roles & Permissions

| Feature | Pending | Contributor | Admin |
|---------|---------|-------------|-------|
| Login | Blocked | ✅ | ✅ |
| Dashboard & Charts | — | ✅ | ✅ |
| Create Expense | — | ✅ | ✅ |
| Delete Own Expense | — | Request only | ✅ |
| Delete Any Expense | — | — | ✅ |
| Approve Delete Request | — | — | ✅ |
| Manage Categories | — | — | ✅ |
| Manage Users | — | — | ✅ |
| Approve Signups | — | — | ✅ |
| Assign Roles | — | — | ✅ |
| Export (Excel/PNG) | — | ✅ | ✅ |

---

## Local Development

### Backend

```bash
cd happi-maintenance-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit MONGODB_URL etc.
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

**Or with Docker Compose (includes local MongoDB):**

```bash
cd happi-maintenance-api
docker-compose up
```

### Frontend

```bash
cd happi-maintenance-web
cp .env.example .env.local
npm install
npm run dev
# Open: http://localhost:3000
```

---

## Azure Infrastructure Setup

### 1. Create Resource Group
```bash
az group create --name rg-happimaintenance --location eastus
```

### 2. Create Azure Container Registry
```bash
az acr create --resource-group rg-happimaintenance \
  --name happiregistryXXX --sku Basic
az acr login --name happiregistryXXX
```

### 3. Create Cosmos DB (MongoDB API)
```bash
az cosmosdb create \
  --name happi-cosmos \
  --resource-group rg-happimaintenance \
  --kind MongoDB \
  --server-version 7.0 \
  --capabilities EnableServerless

az cosmosdb mongodb database create \
  --account-name happi-cosmos \
  --resource-group rg-happimaintenance \
  --name happimaintain
```

Get the connection string:
```bash
az cosmosdb keys list \
  --name happi-cosmos \
  --resource-group rg-happimaintenance \
  --type connection-strings
```

### 4. Create AKS Cluster
```bash
az aks create \
  --resource-group rg-happimaintenance \
  --name happi-aks \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --attach-acr happiregistryXXX \
  --enable-addons monitoring \
  --generate-ssh-keys

az aks get-credentials --resource-group rg-happimaintenance --name happi-aks
```

### 5. Install NGINX Ingress + cert-manager
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace

helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true
```

### 6. Create Kubernetes Namespace & Secrets
```bash
kubectl create namespace happimaintenance

kubectl create secret generic happi-api-secrets \
  --namespace happimaintenance \
  --from-literal=MONGODB_URL="<cosmos-connection-string>" \
  --from-literal=JWT_SECRET="<your-long-random-secret>"
```

### 7. Deploy to AKS
```bash
# API
kubectl apply -f happi-maintenance-api/k8s/

# Web
kubectl apply -f happi-maintenance-web/k8s/
```

### 8. GitHub Actions Secrets

Add these secrets to **both** GitHub repositories:

| Secret | Value |
|--------|-------|
| `ACR_USERNAME` | ACR service principal app ID |
| `ACR_PASSWORD` | ACR service principal password |
| `AZURE_CLIENT_ID` | Service principal client ID |
| `AZURE_CLIENT_SECRET` | Service principal secret |
| `AZURE_TENANT_ID` | Azure tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |

---

## First Admin Setup

After deploying, create the first admin user directly in the database:

```js
// MongoDB shell / Compass
db.users.insertOne({
  email: "admin@yourdomain.com",
  name: "Admin",
  hashed_password: "<bcrypt hash>",   // use passlib to generate
  role: "admin",
  is_approved: true,
  created_at: new Date()
})
```

Or update an existing user:
```js
db.users.updateOne(
  { email: "admin@yourdomain.com" },
  { $set: { role: "admin", is_approved: true } }
)
```

---

## API Reference

Interactive docs available at `http://localhost:8000/docs` (Swagger UI).

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/auth/signup` | POST | None | Request account |
| `/api/v1/auth/login` | POST | None | Login, sets cookies |
| `/api/v1/auth/refresh` | POST | Cookie | Refresh access token |
| `/api/v1/auth/logout` | POST | Cookie | Clear cookies |
| `/api/v1/auth/me` | GET | Cookie | Current user |
| `/api/v1/users/` | GET | Admin | List all users |
| `/api/v1/users/{id}/approve` | PATCH | Admin | Approve user |
| `/api/v1/users/{id}/role` | PATCH | Admin | Assign role |
| `/api/v1/users/{id}` | DELETE | Admin | Delete user |
| `/api/v1/categories/` | GET | Approved | List categories |
| `/api/v1/categories/` | POST | Admin | Create category |
| `/api/v1/categories/{id}` | DELETE | Admin | Delete category |
| `/api/v1/expenses/` | GET | Approved | List expenses |
| `/api/v1/expenses/` | POST | Contributor | Create expense |
| `/api/v1/expenses/{id}` | PATCH | Owner/Admin | Update expense |
| `/api/v1/expenses/{id}` | DELETE | Owner/Admin | Delete or request delete |
| `/api/v1/expenses/{id}/approve-delete` | PATCH | Admin | Approve/reject delete |
| `/api/v1/dashboard/summary` | GET | Approved | Summary stats |
| `/api/v1/dashboard/charts` | GET | Approved | Chart data |
