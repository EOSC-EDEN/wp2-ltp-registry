```txt
# registry-frontend/README.md
```

# Setup instructions

## Prerequisites

```bash
# Install pnpm 
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm env use --global lts
```

## Quick Start

This Proof of Concept now runs entirely without external database dependencies (Docker/Fuseki), using a local JSON-LD dataset to simulate a Document Store.

```bash
# 1. Install Dependencies
pnpm install

# 2. Start Development Server
npm run dev

# 3. View the catalog
# Visit: http://localhost:5173
```

## Overview

A web-based catalog interface for the EDEN Registry of Long-Term Preservation Services.

This application demonstrates a modern approach to building a registry catalog that:

1. Uses JSON-LD 1.1: Leverages Framed JSON-LD as the data interchange format, compliant with Web Standards and optimized for Document Stores (like ElasticSearch).
2. Simulates Search Engine Logic: The backend logic performs filtering and faceting on structured documents, mimicking the behavior of an ElasticSearch index.
3. Type-Safe Architecture: Uses strict TypeScript interfaces derived from the domain model (Services, Organizations, Contacts).
4. Decoupled UI: The UI remains generic, receiving data through an Adapter layer, allowing the backend data structure to evolve without breaking the frontend.

## Architecture

This PoC represents a shift from a Graph-Native approach (SPARQL) to a Document-Native approach (JSON-LD/ElasticSearch), which is often more suitable for performant search and discovery interfaces in EOSC contexts.

### 1. Data Layer (JSON-LD)
* Source: `static/registry-data.json`
* Format: JSON-LD 1.1 (Framed).
* Structure: Hierarchical documents. Unlike flat RDF triples, entities like `Publisher` and `ContactPoint` are nested *inside* the `DataService` object. This creates self-contained documents perfect for indexing.

### 2. Service Layer (The "Search Engine")
* Location: `src/lib/server/registry-service.ts`
* Role: Simulates ElasticSearch.
* Functionality: 
 * Loads the JSON-LD data.
 * Performs multi-faceted filtering (e.g., "Find services where `publisher.countryName` is Finland").
 * Aggregates counts for facets (e.g., "How many services have `theme: Tech`?").

### 3. Adapter Layer
* Location: `src/lib/utils/adapter.ts`
* Role: Transforms the strict, typed Domain objects (from `registry.ts`) into the generic Property Lists used by the UI components. This ensures the visualization layer doesn't need to know the specific shape of the backend data.

## Data Flow

```
User opens page
 ↓
Server Loader (+page.server.ts) calls Registry Service
 ↓
Registry Service loads JSON-LD → Filters Data → Calculates Facets
 ↓
Server passes data to Adapter
 ↓
Adapter converts Typed Objects to UI Property Lists
 ↓
UI renders Service Cards + Filter Sidebar
```

## Project Structure

```bash
src/
├── lib/
│ ├── components/  # UI components (Visual Layer)
│ │ ├── card/  # Service card rendering
│ │ └── shell/  # Layout and filters
│ ├── context/   # Svelte context for state management
│ ├── server/   # Backend Logic
│ │ └── registry-service.ts # Mocks ElasticSearch query logic
│ ├── types/   # Domain Model
│ │ └── registry.ts # TypeScript interfaces (Service, Org, etc.)
│ └── utils/
│  └── adapter.ts # Maps Domain Types to UI Components
├── routes/
│ ├── +page.svelte  # Main catalog page
│ └── +page.server.ts # Server load function
└── static/
 └── registry-data.json # The Database (JSON-LD)
```

## Extending the Registry

### Adding New Data

```json
# Open json data
static/registry-data.json

# Add a new object to the @graph array
# Ensure it follows the structure defined in @context and `src/lib/types/registry.ts`

# Example json:
{
 "id": "https://example.com/my-service",
 "type": "dcat:DataService",
 "title": "My New Service",
 "publisher": {
 "id": "https://example.com/org/my-org",
 "type": "org:Organization",
 "name": "My Organization",
 "countryName": "Germany"
 }
}
```

The application will automatically pick up the change on the next refresh (or Hot Module Reload).

### Adding New Properties

1. Update Data: Add the property to `static/registry-data.json`.
2. Update Type: Add the field to the `DataService` interface in `src/lib/types/registry.ts`.
3. Update Adapter: Add a line in `src/lib/utils/adapter.ts` to map this new field to a UI label.
 ```typescript
 if (service.myNewField) {
  addProp('My New Label', service.myNewField);
 }
 ```
4. Update Search: If you want to filter by it, add logic to `searchRegistry` in `src/lib/server/registry-service.ts`.

## Technical Implementation Details

### JSON-LD Compliance

The data file is fully compliant with JSON-LD 1.1. It uses a `@context` to map short keys (like `title`) to full semantic URIs (like `http://purl.org/dc/terms/title`). This ensures that while we are using "simple JSON" for development ease and performance, the data remains semantically interoperable.

### Why this architecture?

This architecture was chosen to align with EOSC (European Open Science Cloud) integration patterns, where ElasticSearch is the standard for discovery. By structuring data as framed JSON-LD documents now, the transition to a production ElasticSearch cluster is trivial: one simply pushes the JSON documents to the index, and replaces the in-memory `registry-service.ts` with an ElasticSearch Client.

## Development Commands

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run check

# Build for production
npm run build

# Preview production build
npm run preview
```