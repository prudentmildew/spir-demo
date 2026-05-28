# Freshness over snapshots for structured sources

Tool calls to Kartverket, SSB, and MET fetch live on every request, with at most a short TTL cache. Only unstructured text (Wikipedia/arXiv chunks) is indexed or cached aggressively. The cost of stale structured data — e.g. wrong municipality codes after a kommune merge, or outdated weather — is much higher than the cost of an extra HTTP call. Re-evaluate per source if a real latency or rate-limit constraint appears; document the exception there.
