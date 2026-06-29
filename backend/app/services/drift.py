import json
from typing import Any, Dict, Set


def extract_schema_signature(data: Any) -> Any:
    """
    Recursively extract the keys and data types from a JSON-like object/list.
    Returns a normalized dictionary representing the structure.
    """
    if isinstance(data, dict):
        return {k: extract_schema_signature(v) for k, v in data.items()}
    elif isinstance(data, list):
        if len(data) > 0:
            # Return type of first element to represent list items
            return [extract_schema_signature(data[0])]
        return []
    else:
        return type(data).__name__


def compare_signatures(baseline: Any, incoming: Any, path: str = "") -> Set[str]:
    """
    Compare baseline schema against incoming schema.
    Returns a set of descriptive drift warning strings.
    """
    warnings = set()

    if isinstance(baseline, dict) and isinstance(incoming, dict):
        # Check for missing keys in incoming
        for k in baseline:
            current_path = f"{path}.{k}" if path else k
            if k not in incoming:
                warnings.add(f"Missing expected field: '{current_path}'")
            else:
                warnings.update(compare_signatures(baseline[k], incoming[k], current_path))
        
        # Check for unexpected new keys (schema expansion)
        for k in incoming:
            current_path = f"{path}.{k}" if path else k
            if k not in baseline:
                warnings.add(f"New unexpected field added: '{current_path}'")

    elif isinstance(baseline, list) and isinstance(incoming, list):
        if len(baseline) > 0 and len(incoming) > 0:
            warnings.update(compare_signatures(baseline[0], incoming[0], f"{path}[]"))
        elif len(baseline) > 0 and len(incoming) == 0:
            warnings.add(f"List at '{path}' is empty, expected elements matching baseline schema")

    else:
        # Type comparison
        if baseline != incoming:
            warnings.add(f"Type mismatch at '{path}': expected '{baseline}', got '{incoming}'")

    return warnings


def detect_schema_drift(historical_payloads: list[dict], new_payload_body: dict) -> tuple[bool, str]:
    """
    Analyze if new_payload_body drifts from historical payloads.
    Returns (is_drifted, alert_message).
    """
    if not historical_payloads or not new_payload_body:
        return False, ""

    # Build baseline signature from the first payload
    try:
        baseline_sig = extract_schema_signature(historical_payloads[0])
        incoming_sig = extract_schema_signature(new_payload_body)
        
        warnings = compare_signatures(baseline_sig, incoming_sig)
        if warnings:
            return True, "; ".join(sorted(warnings))
    except Exception as e:
        return False, f"Failed to perform schema drift check: {str(e)}"

    return False, ""
