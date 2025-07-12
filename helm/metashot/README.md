# metashot

![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 1.0.0](https://img.shields.io/badge/AppVersion-1.0.0-informational?style=flat-square)

A Helm chart for Metashot - Generate PNG images from Metabase embed URLs

**Homepage:** <https://github.com/farmdawgnation/metashot>

## Source Code

* <https://github.com/farmdawgnation/metashot>

## Installation

Add the repository and install the chart:

```bash
# Add the repository (if published)
helm repo add metashot https://farmdawgnation.github.io/metashot

# Install the chart
helm install metashot metashot/metashot
```

Or install directly from the source:

```bash
# Clone the repository
git clone https://github.com/farmdawgnation/metashot.git
cd metashot

# Install the chart
helm install metashot ./helm/metashot
```

## Configuration

Metashot requires configuration of several environment variables to work properly:

### Required Configuration

You **must** provide the following values:

- `env.METABASE_SITE_URL`: The URL of your Metabase instance
- `env.S3_BUCKET`: The S3 bucket name for storing generated images
- `env.S3_ACCESS_KEY_ID`: AWS access key for S3 access
- `S3_SECRET_ACCESS_KEY`: AWS secret key (provided via envFrom)
- `METABASE_SECRET_KEY`: Metabase secret key (provided via envFrom)

### Secure Configuration Example

Create a secret for sensitive values:

```yaml
# metashot-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: metashot-secrets
type: Opaque
stringData:
  S3_SECRET_ACCESS_KEY: "your-s3-secret-key"
  METABASE_SECRET_KEY: "your-metabase-secret-key"
  AUTH_TOKEN: "your-auth-token"
```

Then configure the chart to use the secret:

```yaml
# values.yaml
env:
  METABASE_SITE_URL: "https://metabase.example.com"
  S3_BUCKET: "my-metashot-bucket"
  S3_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE"

envFrom:
  - secretRef:
      name: metashot-secrets
```

### Ingress Configuration

To expose Metashot externally:

```yaml
# values.yaml
ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: metashot.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: metashot-tls
      hosts:
        - metashot.example.com
```

## Usage

Once deployed, Metashot provides endpoints for generating screenshots:

- `GET /api/health` - Health check endpoint
- `POST /api/screenshot` - Generate screenshot from Metabase embed URL
- `GET /api/screenshot/:id` - Retrieve generated screenshot

## Upgrading

To upgrade the chart:

```bash
helm upgrade metashot metashot/metashot
```

## Uninstallation

To uninstall the chart:

```bash
helm uninstall metashot
```

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` | Affinity for pod assignment |
| autoscaling.enabled | bool | `false` | Enable horizontal pod autoscaling |
| autoscaling.maxReplicas | int | `100` | Maximum number of replicas |
| autoscaling.minReplicas | int | `1` | Minimum number of replicas |
| autoscaling.targetCPUUtilizationPercentage | int | `80` | Target CPU utilization percentage for autoscaling |
| env | object | `{"METABASE_SITE_URL":"","NODE_ENV":"production","PORT":"8080","PRESIGNED_URL_EXPIRY":"3600","S3_ACCESS_KEY_ID":"","S3_BUCKET":"","S3_REGION":"us-east-1"}` | Environment variables for Metashot configuration |
| env.METABASE_SITE_URL | string | Must be provided by user | Metabase site URL for authentication and API access |
| env.NODE_ENV | string | `"production"` | Node.js environment mode |
| env.PORT | string | `"8080"` | Port for the Metashot server |
| env.PRESIGNED_URL_EXPIRY | string | `"3600"` | Expiry time in seconds for presigned URLs |
| env.S3_ACCESS_KEY_ID | string | Must be provided by user (recommend using envFrom with secrets) | AWS access key ID for S3 access |
| env.S3_BUCKET | string | Must be provided by user | S3 bucket name for storing generated images |
| env.S3_REGION | string | `"us-east-1"` | AWS region for S3 bucket |
| envFrom | list | `[]` | Environment variables from external sources (secrets, configmaps, etc.) This allows injecting environment variables from different sources. Use this to provide sensitive values like AUTH_TOKEN, METABASE_SECRET_KEY, S3_SECRET_ACCESS_KEY |
| extraObjects | list | `[]` | Extra Kubernetes objects to deploy alongside the application This allows deploying arbitrary Kubernetes objects like secrets, configmaps, jobs, etc. |
| fullnameOverride | string | `""` | Override the full name of the chart |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy |
| image.repository | string | `"ghcr.io/farmdawgnation/metashot"` | Docker image repository for Metashot |
| image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion |
| imagePullSecrets | list | `[]` | Secrets for pulling images from private registries |
| ingress.annotations | object | `{}` | Additional annotations for the Ingress resource |
| ingress.className | string | `""` | IngressClass that will be used to implement the Ingress |
| ingress.enabled | bool | `false` | Enable ingress controller resource |
| ingress.hosts | list | `[{"host":"chart-example.local","paths":[{"path":"/","pathType":"Prefix"}]}]` | An array with the hostname(s) to be covered by the ingress record |
| ingress.tls | list | `[]` | TLS configuration for the ingress |
| livenessProbe | object | `{"enabled":true,"failureThreshold":3,"httpGet":{"path":"/api/health","port":"http"},"initialDelaySeconds":30,"periodSeconds":10,"timeoutSeconds":5}` | Liveness probe configuration |
| livenessProbe.enabled | bool | `true` | Enable liveness probe |
| livenessProbe.failureThreshold | int | `3` | Failure threshold for liveness probe |
| livenessProbe.httpGet.path | string | `"/api/health"` | Path for liveness probe |
| livenessProbe.httpGet.port | string | `"http"` | Port for liveness probe |
| livenessProbe.initialDelaySeconds | int | `30` | Initial delay seconds for liveness probe |
| livenessProbe.periodSeconds | int | `10` | Period seconds for liveness probe |
| livenessProbe.timeoutSeconds | int | `5` | Timeout seconds for liveness probe |
| nameOverride | string | `""` | Override the name of the chart |
| nodeSelector | object | `{}` | Node labels for pod assignment |
| podAnnotations | object | `{}` | Annotations to add to the pod |
| podSecurityContext | object | `{"fsGroup":1001}` | Security context for the pod |
| readinessProbe | object | `{"enabled":true,"failureThreshold":3,"httpGet":{"path":"/api/health","port":"http"},"initialDelaySeconds":5,"periodSeconds":5,"timeoutSeconds":3}` | Readiness probe configuration |
| readinessProbe.enabled | bool | `true` | Enable readiness probe |
| readinessProbe.failureThreshold | int | `3` | Failure threshold for readiness probe |
| readinessProbe.httpGet.path | string | `"/api/health"` | Path for readiness probe |
| readinessProbe.httpGet.port | string | `"http"` | Port for readiness probe |
| readinessProbe.initialDelaySeconds | int | `5` | Initial delay seconds for readiness probe |
| readinessProbe.periodSeconds | int | `5` | Period seconds for readiness probe |
| readinessProbe.timeoutSeconds | int | `3` | Timeout seconds for readiness probe |
| replicaCount | int | `1` | Number of replicas for the Metashot deployment |
| resources | object | `{"limits":{"cpu":"500m","memory":"512Mi"},"requests":{"cpu":"100m","memory":"128Mi"}}` | Resource limits and requests for the Metashot container |
| securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]},"readOnlyRootFilesystem":false,"runAsNonRoot":true,"runAsUser":1001}` | Security context for the container |
| service.port | int | `80` | Kubernetes service port |
| service.targetPort | int | `8080` | Target port for the Metashot application |
| service.type | string | `"ClusterIP"` | Kubernetes service type |
| serviceAccount.annotations | object | `{}` | Annotations to add to the service account |
| serviceAccount.create | bool | `true` | Specifies whether a service account should be created |
| serviceAccount.name | string | `""` | The name of the service account to use. If not set and create is true, a name is generated using the fullname template |
| tolerations | list | `[]` | Tolerations for pod assignment |
| volumeMounts | list | `[]` | Additional volume mounts for the container |
| volumes | list | `[]` | Additional volumes to be mounted |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
