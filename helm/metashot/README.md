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

### Security Hardening

Metashot renders Metabase content (dashboard cards, markdown, custom
visualizations) in a headless Chromium browser. That content is only as
trustworthy as the users of the upstream Metabase instance, so the chart
defaults are chosen to contain a compromised or malicious render:

- `securityContext.readOnlyRootFilesystem: true` — the container filesystem
  is read-only. `tmpVolume.enabled` (default `true`) mounts a size-limited
  `emptyDir` at `/tmp` for Chromium's profile/cache data, which is the only
  directory it needs to write to.
- `podSecurityContext.seccompProfile.type: RuntimeDefault` — restricts the
  container to the container runtime's default allowed syscalls.
- `securityContext.capabilities.drop: [ALL]`, `allowPrivilegeEscalation:
  false`, `runAsNonRoot: true` — already enabled by default.
- The application itself restricts in-browser navigation and subresource
  requests to the configured `METABASE_SITE_URL` origin, so redirects or
  injected content can't pivot the renderer to other hosts.

**On `--no-sandbox`:** the container launches Chromium with
`--no-sandbox`. Chromium's own sandbox needs either the SUID sandbox helper
(which requires the ability to gain privileges, i.e.
`allowPrivilegeEscalation: true`) or unprivileged user namespaces (which
many managed Kubernetes node images/kernels disable and which would require
loosening the seccomp profile). Both trade away container-level hardening
that's enforced above for a second, redundant sandbox boundary. Given that
tradeoff, `--no-sandbox` is combined with the container/pod hardening above
plus the origin allowlist instead. If your cluster reliably supports
unprivileged user namespaces and you want Chromium's own sandbox as
additional defense-in-depth, you can override `podSecurityContext` and
`securityContext` and drop `--no-sandbox` from the Playwright launch args,
but this is not the chart default.

**Egress NetworkPolicy:** the chart does not ship a `NetworkPolicy` by
default since the required egress targets (your Metabase instance, your S3
endpoint, and optionally an OTLP collector) vary per deployment. Add one via
[`extraObjects`](#values), for example:

```yaml
# values.yaml
extraObjects:
  - apiVersion: networking.k8s.io/v1
    kind: NetworkPolicy
    metadata:
      name: metashot-egress
      # namespace omitted: Helm applies extraObjects into the release namespace
    spec:
      podSelector:
        matchLabels:
          app.kubernetes.io/name: metashot
      policyTypes:
        - Egress
      egress:
        # DNS
        - to:
            - namespaceSelector: {}
          ports:
            - protocol: UDP
              port: 53
        # Metabase
        - to:
            - ipBlock:
                cidr: 203.0.113.10/32 # replace with your Metabase instance's address
          ports:
            - protocol: TCP
              port: 443
        # S3 / S3-compatible storage
        - to:
            - ipBlock:
                cidr: 203.0.113.20/32 # replace with your S3 endpoint's address
          ports:
            - protocol: TCP
              port: 443
```

Prefer a `podSelector`/namespace-based rule over `ipBlock` where your CNI
and Metabase/S3 endpoints support it (e.g. Metabase running in the same
cluster), since `ipBlock` rules break if the target's address changes.

## Usage

Once deployed, Metashot provides endpoints for generating screenshots:

- `GET /api/health` - Health check endpoint
- `POST /api/screenshot` - Generate screenshot from Metabase embed URL
- `GET /api/screenshot/:id` - Retrieve generated screenshot

### Authentication

`AUTH_TOKEN` must be set via environment or `envFrom`. API requests must include one of:

- `Authorization: Bearer <AUTH_TOKEN>`
- `Authorization: Basic <base64(any-username:AUTH_TOKEN)>` (only the password is validated)

The server refuses to start without `AUTH_TOKEN` unless `ALLOW_UNAUTHENTICATED=true` is set explicitly (dev-only opt-out; never use in production).

The health (`/api/health`) and metrics (`/metrics`) endpoints are always public.

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
| podSecurityContext | object | `{"fsGroup":1001,"seccompProfile":{"type":"RuntimeDefault"}}` | Security context for the pod |
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
| securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]},"readOnlyRootFilesystem":true,"runAsNonRoot":true,"runAsUser":1001}` | Security context for the container |
| service.port | int | `80` | Kubernetes service port |
| service.targetPort | int | `8080` | Target port for the Metashot application |
| service.type | string | `"ClusterIP"` | Kubernetes service type |
| serviceAccount.annotations | object | `{}` | Annotations to add to the service account |
| serviceAccount.create | bool | `true` | Specifies whether a service account should be created |
| serviceAccount.name | string | `""` | The name of the service account to use. If not set and create is true, a name is generated using the fullname template |
| tmpVolume | object | `{"enabled":true,"sizeLimit":"512Mi"}` | Mounts a writable emptyDir at /tmp for the Chromium browser's profile/cache data. Required when securityContext.readOnlyRootFilesystem is true (the default), since Playwright/Chromium need a writable temp directory even though the rest of the container filesystem is read-only. |
| tmpVolume.enabled | bool | `true` | Enable the /tmp emptyDir mount |
| tmpVolume.sizeLimit | string | `"512Mi"` | Size limit for the /tmp emptyDir volume |
| tolerations | list | `[]` | Tolerations for pod assignment |
| volumeMounts | list | `[]` | Additional volume mounts for the container |
| volumes | list | `[]` | Additional volumes to be mounted |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
