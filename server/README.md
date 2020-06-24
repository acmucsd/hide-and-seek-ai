# Updating Container Registry

Build the image

```bash
docker build -t hide-and-seek-ai-docker .
```

Then tag and push the image to the google container registry
```bash
docker tag hide-and-seek-ai-docker gcr.io/proto-code/hide-and-seek-ai-docker:latest
docker push gcr.io/proto-code/hide-and-seek-ai-docker:latest
```