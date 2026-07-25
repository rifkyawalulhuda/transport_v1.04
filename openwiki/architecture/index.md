---
type: Documentation Index
title: "Architecture"
description: "Files and subdirectories in Architecture."
---

# Files

- [Data Models](data-models.md) - MySQL schema evolution via dbmate migrations and schemaSyncService for transport_v1.04. Documents key tables, MongoDB collections, the dual-DB boundary, and soft-delete patterns for trucks and drivers.
- [System Architecture](overview.md) - Express + Vue 3 SPA architecture for transport_v1.04. Covers the two-process design, dual-database split (MySQL + MongoDB), API surface, startup sequence, background GPS services, and CORS/static-serving setup.
