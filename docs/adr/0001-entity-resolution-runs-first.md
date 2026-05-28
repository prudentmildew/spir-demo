# Entity resolution runs first, always

Kartverket address resolution must complete with a single confident match before any statistics lookup or retrieval runs. Ambiguous or zero matches return a clarification request to the caller; the orchestrator never proceeds on a guess. A confidently-wrong match would produce an authoritative-sounding answer about the wrong property — the highest-cost failure mode in this system — so this gate is non-negotiable and lives in the deterministic shell, not in a prompt.
