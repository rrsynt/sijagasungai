#!/bin/bash
# SiJaga Sungai — Deploy ke Google Cloud Run
# Jalankan: chmod +x deploy.sh && ./deploy.sh

set -e  # Exit on any error

PROJECT_ID="your-gcp-project-id"  # Ganti ini dengan Project ID GCP Anda
REGION="asia-southeast2"           # Jakarta
SERVICE_NAME="sijaga-sungai"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🐟 SiJaga Sungai — Deployment Script"
echo "======================================"

# Step 1: Enable APIs
echo "📡 Enabling required Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  maps-backend.googleapis.com \
  --project=$PROJECT_ID

# Step 2: Build image
echo "🔨 Building Docker image..."
docker build \
  --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
  -t $IMAGE_NAME .

# Step 3: Push image
echo "📤 Pushing to Container Registry..."
docker push $IMAGE_NAME

# Step 4: Deploy ke Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_NAME \
  --platform=managed \
  --region=$REGION \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60s \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="NEXT_PUBLIC_GEMINI_API_KEY=NEXT_PUBLIC_GEMINI_API_KEY:latest" \
  --project=$PROJECT_ID

# Note: Jika Anda menggunakan Firebase Admin SDK, sertakan FIREBASE_PRIVATE_KEY di dalam set-secrets
# --set-secrets="NEXT_PUBLIC_GEMINI_API_KEY=NEXT_PUBLIC_GEMINI_API_KEY:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest" \


# Step 5: Get URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform=managed --region=$REGION \
  --format="value(status.url)" --project=$PROJECT_ID)

echo ""
echo "✅ Deployment berhasil!"
echo "🌐 URL Aplikasi: $SERVICE_URL"
echo ""
echo "📋 Langkah selanjutnya:"
echo "1. Buka $SERVICE_URL dan test semua fitur"
echo "2. Update ALLOWED_ORIGINS jika ada CORS issue"
echo "3. Simpan URL ini untuk formulir submission lomba"
echo ""
echo "================================================="
echo "💡 INSTRUKSI TAMBAHAN:"
echo ""
echo "🔐 1. Cara setup Google Secret Manager:"
echo "   gcloud secrets create NEXT_PUBLIC_GEMINI_API_KEY --replication-policy=\"automatic\""
echo "   echo -n \"YOUR_GEMINI_API_KEY\" | gcloud secrets versions add NEXT_PUBLIC_GEMINI_API_KEY --data-file=-"
echo "   (Berikan hak akses secret-accessor ke service account Cloud Run Anda)"
echo ""
echo "🔄 2. Cara update environment variable tanpa redeploy penuh:"
echo "   gcloud run services update $SERVICE_NAME \\"
echo "     --update-env-vars=\"NEW_VAR=value,OTHER_VAR=value2\" \\"
echo "     --region=$REGION --project=$PROJECT_ID"
echo ""
echo "⏪ 3. Cara rollback ke versi sebelumnya:"
echo "   # Lihat list revision:"
echo "   gcloud run revisions list --service=$SERVICE_NAME --region=$REGION --project=$PROJECT_ID"
echo "   # Rollback traffic ke revision tertentu:"
echo "   gcloud run services update-traffic $SERVICE_NAME \\"
echo "     --to-revisions=REVISION_NAME=100 \\"
echo "     --region=$REGION --project=$PROJECT_ID"
echo "================================================="
