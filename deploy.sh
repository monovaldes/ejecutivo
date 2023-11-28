# gcloud auth login
gcloud builds submit --tag gcr.io/prime-freedom-402713/ejecutivo .
gsutil cp 404-page.html index.html index.js index.css gs://ejecutivoweb