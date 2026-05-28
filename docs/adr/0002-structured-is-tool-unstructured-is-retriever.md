# Structured = tool, unstructured = retriever

Sources with a structured query API (Kartverket, SSB, MET) are wrapped as **tools** the model invokes with typed inputs and which return exact data. Sources without one (Wikipedia, arXiv) are wrapped as **retrievers** that return citable text chunks. We never RAG over data that can be queried. This keeps authoritative facts exact and citable, and forces an honest routing decision in the orchestrator about which kind of source a question actually needs — that decision is the agent's main job.
