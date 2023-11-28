# gcloud auth login
gsutil cp 404-page.html index.html index.js index.css gs://ejecutivoweb
cd backend
gcloud builds submit --tag gcr.io/prime-freedom-402713/ejecutivo .
cd ..