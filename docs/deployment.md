# Azure Container Apps deployment

The repository includes a production [Dockerfile](../Dockerfile) and two
independent GitHub Actions workflows using **tabulariumregistry** by default:

| Workflow | Trigger | Result |
| --- | --- | --- |
| [Build versioned image](../.github/workflows/build-azure.yml) | Push to `main`, or manual run on `main` | Tests, builds, smoke-checks, and publishes an image; does not deploy |
| [Deploy versioned image](../.github/workflows/deploy-azure.yml) | Manual run on `main` with required `image_version` | Deploys an existing image; does not build or push |

Build tags use `<package-version>-<run-number>.<run-attempt>-<short-commit>`, for
example `1.0.0-42.1-a1b2c3d4e5f6`. The package version comes from `package.json`.
Run and attempt numbers distinguish successive builds, including reruns. The
exact tag appears in the build run summary. Only the image that passed the
startup check is tagged and pushed; no `latest` tag is published.

Deploy verifies that the supplied tag exists, resolves its SHA-256 digest, updates
the Container App using that digest, and waits for revision readiness. It does
not trigger automatically when a build completes. Complete the Azure setup below
before deploying; building only requires the registry and build identity.

## 1. Create the Container App once

Use an Azure account that can create resources and assign roles. Choose the
resource group, region, Container Apps environment, and app name. Examples below
use `ai-agent-core` as the app name; your actual name goes in GitHub variables.

Build the initial image from this repository using Azure Cloud Shell (Bash) or a
machine with Azure CLI. This uses ACR Tasks, so local Docker is not required:

```sh
az login
az account set --subscription '<azure-subscription-id>'
az acr build --registry tabulariumregistry --image ai-agent-core:bootstrap .
az acr show --name tabulariumregistry --query loginServer --output tsv
```

Run from a checkout containing `package-lock.json`. The `.dockerignore` allowlist
excludes `.env`, Git metadata, local output, and tests from the build context.
The initial build requires ACR Tasks permissions; ongoing workflow builds run on
the GitHub runner and only need permission to push images.

In the Azure portal:

1. Create a user-assigned managed identity for **image pulls**. On
   `tabulariumregistry`, assign that identity `AcrPull`. These instructions assume
   the registry uses **RBAC Registry Permissions**. For an ABAC-enabled registry,
   use its repository roles instead (Repository Reader for pulls; Repository
   Writer for the workflow's pushes).
2. Create a Container App and a Container Apps environment in the selected
   resource group. Select your registry, `ai-agent-core:bootstrap`, and the
   user-assigned identity for registry authentication. The registry must allow
   ARM audience tokens for managed identity image pulls.
3. Use Linux, a single application container, **0.5 CPU / 1 GiB** initially,
   **single revision mode**, minimum replicas **1**, maximum replicas **1**.
   Adjust CPU/memory after measuring document sizes and load.
4. Enable HTTP ingress, target port **3000**, HTTPS only. Choose external ingress
   if downstream services call the public URL, or internal ingress if they share
   private connectivity. Configure TCP startup/readiness/liveness probes on port
   **3000**. Do not use HTTP `/` as a probe: this app returns 404 there.
5. Add all runtime settings from the next section before starting the image.
   If the app hostname is not yet available, use `https://example.invalid/callback`
   temporarily for `CALLBACK_URL`, then replace it with the actual URL before
   submitting any work.
6. Configure persistent storage as described below. Check the first revision's
   logs and readiness before enabling automated deployment.

The HTTP API currently does not authenticate ordinary upload/session/batch routes;
`API_KEY` authenticates outgoing requests. Choose ingress/network access suitable
for your callers. Callback routes validate their signed authorization tokens.

## 2. Configure runtime secrets and environment variables

Store these values in **Container App secrets**, then reference them from its
container environment variables. Do not put actual secret values in the workflow:

| Environment variable | Suggested secret name | Value |
| --- | --- | --- |
| `API_KEY` | `api-key` | Downstream API key; batch subscription comes from the portion before `:` |
| `TOKEN_SECRET` | `token-secret` | Strong private callback-signing secret, stable across revisions |
| `BATCH_CONTAINER` | `batch-container` | Azure Blob container URL with a SAS allowing input list/read and output writes |

Configure the other container environment variables:

| Variable | Value |
| --- | --- |
| `CALLBACK_URL` | `https://<app-fqdn>/callback` or the reachable custom-domain equivalent |
| `BATCH_URL` | Batch service base URL |
| `SESSION_URL` | Session service base URL |
| `COMPUTE_URL` | Compute service base URL |
| `INDEX_URL` | Index service base URL |
| `FEEDBACK_URL` | Feedback service base URL; required even though currently unused |
| `RECORD_URL` | Record service base URL |
| `REDACT_URL` | Redact service base URL |
| `REPROCESS_URL` | Reprocess service base URL |
| `BATCH_INDEX_IN` | e.g. `index/in` |
| `BATCH_INDEX_OUT` | e.g. `index/out` |
| `BATCH_REDACT_IN` | e.g. `redact/in` |
| `BATCH_REDACT_OUT` | e.g. `redact/out` |
| `PROCESSING_DIR` | `/app/processing` (already the image default) |
| `RECORD_FORMAT`, `REDACT_FORMAT` | Optional; omit to use the application's empty defaults |

There is no `PORT` setting and no separate application `SUBSCRIPTION` setting.
`AZURE_SUBSCRIPTION_ID` below is an Azure resource subscription, unrelated to the
batch-service subscription derived from `API_KEY`.

The workflow preserves these environment variables, secret references, mounts,
and probes when changing the image. It does not synchronize your local `.env`.
The repository already tracks `.env`; adding it to `.gitignore` does not untrack
it. Remove it from version control before pushing if it contains credentials,
and rotate any credentials previously published. Docker excludes it regardless.

## 3. Preserve files and drain work before releases

The image runs as the `node` user (UID/GID 1000). Attach Azure Files storage to
the Container Apps environment, then mount writable shares into the app:

- `/app/processing`: batch/task status snapshots.
- `/app/mock-data`: ordinary workflow outputs written by the current integration.

Use separate shares, or distinct subdirectories, for these two mounts. For SMB
mounts, set ownership/permissions to permit UID/GID 1000, for example mount options
`uid=1000,gid=1000,dir_mode=0770,file_mode=0660`. Verify write access in the running
container. Container-local storage is otherwise ephemeral.

Persistent files **do not restore the in-memory queue**. Pause submissions and
wait for callbacks/batches to finish before running the deploy workflow. A
restart or replacement revision loses active task correlation. Single revision
mode and replica limits reduce competing workers, but revisions can overlap
during rollout. Automatic restart recovery and uninterrupted batch deployments
require a durable queue design; this workflow does not add that behavior.

## 4. Connect GitHub to Azure using OIDC

Create Entra applications/service principals or user-assigned identities for
GitHub **build** and **deployment**. Configure these federated credentials:

```text
Issuer:   https://token.actions.githubusercontent.com
Build subject:  repo:TabulariumAI/ai_agent_core:environment:build
Deploy subject: repo:TabulariumAI/ai_agent_core:environment:production
Audience: api://AzureADTokenExchange
```

Each subject is a separate federated credential on its respective identity.
The build identity needs `AcrPush` on the registry; the deploy identity needs
Contributor on the app's resource group and `AcrPull` on the registry to resolve
image digests. Both need Reader on the registry to query its login server.
For ABAC registries, use Repository Writer/Reader instead of AcrPush/AcrPull.
You can reuse one identity with both credentials and the combined permissions,
but separate identities keep build permissions independent from deployment.
Registry network rules must allow the GitHub runner; for a private-only registry,
use a runner with access to that network.

In GitHub **Settings > Environments**, create `build` and `production`, restrict
both to `main`, and add these **environment variables**:

| GitHub variable | Environment | Value |
| --- | --- | --- |
| `AZURE_CLIENT_ID` | Both | Respective identity's application/client ID |
| `AZURE_TENANT_ID` | Both | Entra directory/tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Both | Azure subscription containing the app and registry |
| `AZURE_RESOURCE_GROUP` | `production` | Container App resource group |
| `AZURE_CONTAINER_APP` | `production` | Container App name, e.g. `ai-agent-core` |
| `AZURE_ACR_NAME` | Both | Optional override; defaults to `tabulariumregistry` |

No Azure client secret or registry admin password is needed. The build identity
pushes images; the app's separate managed identity pulls them. Set the same
registry in both GitHub environments.

## 5. Deploy and verify

Commit the Dockerfile, `.dockerignore`, both workflows, `.gitignore` changes,
**package-lock.json**, and updated tests along with the application code. The
lockfile was previously ignored; it must be included for `npm ci` to work in a
fresh GitHub checkout.

1. Push to `main`, or select **Build versioned image > Run workflow** on `main`.
2. Copy the `image_version` value from the successful build summary.
3. After draining active work, select **Deploy versioned image > Run workflow**
   on `main` and enter that value in `image_version`.
4. Check the deployment summary for the resolved digest and app URL.

The deploy input accepts an image tag, not a full image URL, and rejects `latest`.
A missing tag fails before the app is changed. To list available tags:

```sh
az acr repository show-tags --name tabulariumregistry --repository ai-agent-core --orderby time_desc --output table
```

Validation uses dummy URLs and never submits a document. The container smoke
check expects HTTP 404 at `/`, proving the compiled process and production
dependencies start without a local `.env`. Deployment readiness uses Azure's
revision readiness status, not a real downstream document-processing test.

After deployment, submit a small document through a documented endpoint and
verify its callback and stored output. For logs:

```sh
az containerapp logs show --name '<app-name>' --resource-group '<resource-group>' --follow
```

For rollback, first drain work, then run **Deploy versioned image** with a prior
successful version tag. No rebuild is needed.

Keep previously deployed image tags in ACR if you need rollback. If you use a
different branch, update the build trigger, both workflow branch conditions,
and both GitHub environment branch restrictions.

## References

- [Azure Container Apps GitHub deployments](https://learn.microsoft.com/en-us/azure/container-apps/github-actions)
- [GitHub OIDC with Azure](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-azure)
- [Managed identity image pulls](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull)
- [Azure Files mounts](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts)
