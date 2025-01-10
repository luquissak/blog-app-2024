# Install

```bash
npm install -g genkit@0.5.17
echo "genkit version $(genkit --version)"
gcloud auth application-default login
mkdir genkit-flows-app && cd genkit-flows-app
npm init -y
genkit init
gcloud services enable aiplatform.googleapis.com
get-content genkit-flows-app/src/index.ts | %{$_ -replace "us-central1","southamerica-east1"}
```

# Run

```bash
get-content .env | foreach {
    $name, $value = $_.split('=')
    set-content env:\$name $value
    echo $name $value
}

cd genkit-flows-app && genkit start
```
