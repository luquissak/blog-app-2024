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
genkit config set analyticsOptOut true
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

# Run

- Input JSON (classification) [classificationFlow](http://localhost:4000/run/%252Fflow%252FclassificationFlow):

```bash
genkit flow:run classificationFlow '{"url": "all/pdf2/2016-02-18_Projeto_Capitalismo_e_Esquizofrenia_.pdf","content": ""}' -s 
```

# Eval

```bash
genkit eval:flow classificationFlow --input testInputs.json
```

# GCP Console

- [blog-files-2024](https://console.cloud.google.com/storage/browser/blog-files-2024)

# References

- [Build Generative AI Apps with Firebase Genkit](https://www.cloudskillsboost.google/course_templates/1189/)
- [Firebase Genkit](https://firebase.google.com/docs/genkit)
