```txt
README.md
```

# wp2-ltp-registry

## Goal

* The goal for this repository is to create and test and scalable instances of the core components for a Registry for Long-Term Preservation Services (EOSC EDEN WP2), and the fundamental interaction patterns between them.
* The architecture implements a Document-Native (JSON-LD) approach to align with ElasticSearch integration patterns used in EOSC

## Requirements

The PoC has verified the following requirements:

### MUST

* It Must have a simple data model, based on [DCAT-AP](https://semiceu.github.io/DCAT-AP/releases/3.0.0/), focused on the classes:
 * `dcat:DataService` for the services.
 * `org:Organization` for the service publishing organization.
 * `vcard:Kind` class for contacts points of services and organizations.
* It Must have data for at least 5 to 10 Services from 2 or more organizations.
* It Must have a web UI that lists the services present in the data, and a few filtering facets (i.e., country, publisher).
* The web UI Must treat data as hierarchical documents (JSON-LD) rather than flat triples, ensuring readiness for ElasticSearch integration.

### SHOULD

* The web UI facets Should allow for the selection of multiple facets and multiple values per facet.
* It Should use strictly typed entities (TypeScript) derived from the semantic model.
* It Should have a stand-alone data model/schema, preferably in [LinkML](https://linkml.io/) format, as it allows for easy data-format conversions, visual representations, and data validation.

## Core Components

1. Web UI (`registry-frontend/`) : A SvelteKit application that loads, filters, and visualizes the registry data. It simulates an ElasticSearch document store using in-memory JSON-LD processing.
2. Data (`registry-frontend/static/registry-data.json`) : The database is a Framed JSON-LD 1.1 file. This format is semantically valid (Linked Data) but structured hierarchically for easy indexing by document stores.
3. Data Model (`registry-schema.yaml`) : A LinkML definition representing the core classes of the Registry (based on DCAT-AP).

## Quick Start

```bash
cd registry-frontend

# Install dependencies
pnpm install

# Run the application
npm run dev

# Visit in browser
http://localhost:5173
```

## Data Model (LinkML)

We use [LinkML](https://linkml.io/) to define the data model/schema.

```bash
# Setup Python environment for LinkML
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Generate diagrams
gen-erdiagram --format mermaid registry-schema.yaml -c DataService
```
