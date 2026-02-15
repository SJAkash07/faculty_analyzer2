"""
Utility functions for the Publication Analyzer application.
"""
import re
from typing import Optional


def sanitize_author_id(author_id: str) -> str:
    """
    Sanitize and normalize author ID.
    
    Args:
        author_id: Raw author ID from user input
        
    Returns:
        Normalized author ID with 'A' prefix
    """
    if not author_id:
        raise ValueError("Author ID cannot be empty")
    
    # Remove any URL prefix
    author_id = author_id.replace("https://openalex.org/", "")
    
    # Ensure it starts with 'A'
    if not author_id.startswith("A"):
        author_id = f"A{author_id}"
    
    # Validate format (A followed by digits)
    if not re.match(r"^A\d+$", author_id):
        raise ValueError(f"Invalid author ID format: {author_id}")
    
    return author_id


def sanitize_work_id(work_id: str) -> str:
    """
    Sanitize and normalize work ID.
    
    Args:
        work_id: Raw work ID from user input
        
    Returns:
        Normalized work ID with 'W' prefix
    """
    if not work_id:
        raise ValueError("Work ID cannot be empty")
    
    # Remove any URL prefix
    work_id = work_id.replace("https://openalex.org/", "")
    
    # Ensure it starts with 'W'
    if not work_id.upper().startswith("W"):
        work_id = f"W{work_id}"
    
    # Validate format (W followed by digits)
    if not re.match(r"^W\d+$", work_id, re.IGNORECASE):
        raise ValueError(f"Invalid work ID format: {work_id}")
    
    return work_id.upper()


def strip_thinking_tags(text: str) -> str:
    """
    Remove <think>...</think> blocks from AI model output.
    
    Some models output reasoning in <think> tags which should be hidden from users.
    
    Args:
        text: Raw text from AI model
        
    Returns:
        Text with thinking tags removed
    """
    if not text:
        return text
    
    # Remove <think>...</think> blocks (case-insensitive, multiline)
    pattern = r"<think>.*?</think>"
    return re.sub(pattern, "", text, flags=re.DOTALL | re.IGNORECASE).strip()


def abstract_from_inverted_index(inverted: dict) -> str:
    """
    Reconstruct abstract text from OpenAlex inverted index format.
    
    OpenAlex stores abstracts as inverted indexes for efficiency.
    This function reconstructs the original text.
    
    Args:
        inverted: Dictionary mapping words to position lists
        
    Returns:
        Reconstructed abstract text
    """
    if not inverted or not isinstance(inverted, dict):
        return ""
    
    # Create list of (position, word) pairs
    pairs = []
    for word, positions in inverted.items():
        if not isinstance(positions, list):
            continue
        for pos in positions:
            if isinstance(pos, int):
                pairs.append((pos, word))
    
    # Sort by position and join
    pairs.sort(key=lambda x: x[0])
    return " ".join(word for _, word in pairs)


def validate_search_query(query: str, min_length: int = 2, max_length: int = 200) -> str:
    """
    Validate and sanitize search query.
    
    Args:
        query: User search query
        min_length: Minimum query length
        max_length: Maximum query length
        
    Returns:
        Sanitized query
        
    Raises:
        ValueError: If query is invalid
    """
    if not query:
        raise ValueError("Search query cannot be empty")
    
    query = query.strip()
    
    if len(query) < min_length:
        raise ValueError(f"Search query must be at least {min_length} characters")
    
    if len(query) > max_length:
        raise ValueError(f"Search query must be at most {max_length} characters")
    
    # Remove potentially dangerous characters
    query = re.sub(r'[<>{}]', '', query)
    
    return query


def format_institution_names(institutions: list[dict]) -> str:
    """
    Format list of institution dictionaries into a readable string.
    
    Args:
        institutions: List of institution dicts from OpenAlex
        
    Returns:
        Comma-separated institution names
    """
    if not institutions:
        return "—"
    
    names = [
        inst.get("display_name", "")
        for inst in institutions
        if inst and inst.get("display_name")
    ]
    
    return ", ".join(names) if names else "—"


def safe_int(value, default: Optional[int] = None) -> Optional[int]:
    """
    Safely convert value to int, returning default if conversion fails.
    
    Args:
        value: Value to convert
        default: Default value if conversion fails
        
    Returns:
        Integer value or default
    """
    if value is None:
        return default
    
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to maximum length, adding suffix if truncated.
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated
        
    Returns:
        Truncated text
    """
    if not text or len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix
