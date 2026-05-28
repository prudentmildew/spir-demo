# Every claim carries a citation, or `grounded: false`

Synthesis may only use content returned by a tool or retriever in the current turn. If the agent cannot back a claim with a source, the response sets `grounded: false` and says so honestly rather than answering from model priors. This is the rule that makes the demo safe over open data and that makes the same pattern transferable to the real Infoland case, where confidently-wrong is the failure mode that matters most. The check is enforced in the grounding layer, not relied on as a prompt instruction.
