# AI Agent Core

TypeScript and Express service that coordinates Tabularium document indexing,
calculation, redaction, and recording through asynchronous callbacks. It also
queues index and redaction batches from Azure Blob Storage.

- [Setup, configuration, and API reference](docs/README.md)
- [Architecture and development](docs/architecture.md)
- [Batch processing and operational limits](docs/batches.md)
- [Callback protocol](docs/callbacks.md)

Run `npm ci`, configure the environment described in the setup guide, and run
`npm start`. The API listens on port 3000. The default dependency container uses
real downstream services and Azure storage; mock implementations are not enabled
automatically.
