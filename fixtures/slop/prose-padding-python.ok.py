def summarize_findings(findings):
    # Joins findings with newlines because the report renderer splits on
    # them to produce one bullet per line (see RENDERER.md).
    return "\n".join(findings)
