"""
Academic Integrity Analyzer
Evaluates papers for credibility, citation anomalies, and suspicious patterns.
"""
import httpx
from datetime import datetime
from typing import Dict, List, Optional


# Suspicious journal patterns (more specific to predatory journals)
SUSPICIOUS_VENUES = [
    "international journal of advanced research",
    "international journal of scientific research",
    "international journal of innovative research",
    "global journal of research",
    "world journal of research",
    "ijar",  # International Journal of Advanced Research
    "ijcrt", # International Journal of Creative Research Thoughts
    "ijser", # International Journal of Scientific & Engineering Research
    "ijraset", # International Journal for Research in Applied Science
    "ijariit", # International Journal of Advance Research, Ideas and Innovations
]

# Buzzwords that may indicate low-quality papers
BUZZWORDS = [
    "novel",
    "efficient",
    "hybrid",
    "smart",
    "advanced",
    "innovative",
    "revolutionary",
    "cutting-edge",
    "state-of-the-art",
    "breakthrough",
]


async def verify_crossref(title: str, timeout: float = 5.0) -> bool:
    """
    Verify paper exists in CrossRef database.
    Returns True if found, False otherwise.
    """
    if not title or len(title.strip()) < 3:
        return False
    
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(
                "https://api.crossref.org/works",
                params={"query.title": title, "rows": 1}
            )
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("message", {}).get("items", [])
                return len(items) > 0
    except Exception:
        pass  # Network errors shouldn't crash the analysis
    
    return False


def detect_citation_anomaly(year: Optional[int], citations: int) -> tuple[bool, Optional[str]]:
    """
    Detect suspicious citation patterns.
    Returns (is_anomaly, reason).
    """
    if year is None:
        return False, None
    
    current_year = datetime.now().year
    age = current_year - year
    
    # Very recent paper with extremely high citations (adjusted threshold)
    if age <= 1 and citations > 500:
        return True, f"Suspiciously high citations ({citations}) for {age}-year-old paper"
    
    # Old paper with zero citations (more lenient)
    if age >= 8 and citations == 0:
        return True, f"No citations after {age} years"
    
    return False, None


def check_suspicious_venue(venue: Optional[str]) -> tuple[bool, Optional[str]]:
    """
    Check if venue matches suspicious patterns.
    Returns (is_suspicious, reason).
    """
    if not venue:
        return False, None
    
    venue_lower = venue.lower()
    
    # Check for exact matches or specific patterns
    for pattern in SUSPICIOUS_VENUES:
        if pattern in venue_lower:
            return True, f"Suspicious venue pattern: '{pattern}'"
    
    # Additional checks for predatory patterns
    predatory_indicators = [
        ("journal of advanced", "research"),
        ("journal of innovative", "research"),
        ("journal of scientific", "research"),
        ("international research", "journal"),
    ]
    
    for indicator1, indicator2 in predatory_indicators:
        if indicator1 in venue_lower and indicator2 in venue_lower:
            return True, f"Predatory journal pattern detected"
    
    # Check for suspicious acronyms (all caps, 4-6 letters)
    import re
    acronym_match = re.search(r'\b[A-Z]{4,6}\b', venue)
    if acronym_match:
        acronym = acronym_match.group()
        if acronym in ["IJAR", "IJCRT", "IJSER", "IJRASET", "IJARIIT"]:
            return True, f"Known predatory journal acronym: {acronym}"
    
    return False, None


def analyze_title_quality(title: str) -> tuple[int, List[str]]:
    """
    Analyze title for quality issues.
    Returns (penalty_points, list_of_issues).
    """
    if not title:
        return 20, ["Missing title"]
    
    issues = []
    penalty = 0
    
    # Check word count
    words = title.split()
    if len(words) < 3:
        issues.append("Title too short (< 3 words)")
        penalty += 15
    
    # Check for excessive buzzwords (more lenient - allow up to 4)
    title_lower = title.lower()
    buzzword_count = sum(1 for word in BUZZWORDS if word in title_lower)
    if buzzword_count > 4:
        issues.append(f"Excessive buzzwords ({buzzword_count})")
        penalty += 10
    
    # Check for repeated words (ignore common words)
    word_list = [w.lower() for w in words if len(w) > 4]  # Only check words > 4 chars
    unique_words = set(word_list)
    if len(word_list) > 0 and len(unique_words) < len(word_list) * 0.7:  # More than 30% repetition
        issues.append("Excessive word repetition in title")
        penalty += 10
    
    return penalty, issues


async def analyze_paper_integrity(paper: Dict) -> Dict:
    """
    Comprehensive integrity analysis for a research paper.
    
    Args:
        paper: Dictionary with fields:
            - title (str)
            - abstract (str, optional)
            - year (int, optional)
            - cited_by_count or citationCount (int)
            - venue (str, optional)
            - doi (str, optional)
            - authors (list, optional)
    
    Returns:
        Dictionary with:
            - integrity_score (int): 0-100
            - risk_level (str): "LOW", "MEDIUM", or "HIGH"
            - flags (list): List of triggered issues
    """
    flags = []
    score = 100  # Start with perfect score
    
    # Extract fields (handle both OpenAlex and Semantic Scholar formats)
    title = paper.get("title", "")
    year = paper.get("year") or paper.get("publication_year")
    citations = paper.get("cited_by_count") or paper.get("citationCount") or 0
    venue = paper.get("venue") or paper.get("journal")
    doi = paper.get("doi")
    
    # 1. CrossRef verification
    crossref_verified = await verify_crossref(title)
    if not crossref_verified and title:
        flags.append("Not found in CrossRef database")
        score -= 15
    
    # 2. Citation anomaly detection
    is_anomaly, anomaly_reason = detect_citation_anomaly(year, citations)
    if is_anomaly:
        flags.append(anomaly_reason)
        score -= 20
    
    # 3. Suspicious journal pattern
    is_suspicious_venue, venue_reason = check_suspicious_venue(venue)
    if is_suspicious_venue:
        flags.append(venue_reason)
        score -= 25
    
    # 4. Title quality check
    title_penalty, title_issues = analyze_title_quality(title)
    if title_issues:
        flags.extend(title_issues)
        score -= title_penalty
    
    # 5. Missing DOI (minor penalty)
    if not doi:
        flags.append("Missing DOI")
        score -= 5
    
    # Ensure score stays in valid range
    score = max(0, min(100, score))
    
    # Determine risk level
    if score >= 75:
        risk_level = "LOW"
    elif score >= 50:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"
    
    return {
        "integrity_score": score,
        "risk_level": risk_level,
        "flags": flags,
        "crossref_verified": crossref_verified,
    }


async def batch_analyze_integrity(papers: List[Dict]) -> List[Dict]:
    """
    Analyze integrity for multiple papers efficiently.
    Returns list of integrity results in same order as input.
    """
    import asyncio
    
    tasks = [analyze_paper_integrity(paper) for paper in papers]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Handle any exceptions
    processed_results = []
    for result in results:
        if isinstance(result, Exception):
            # Return safe default on error
            processed_results.append({
                "integrity_score": 50,
                "risk_level": "MEDIUM",
                "flags": ["Analysis failed"],
                "crossref_verified": False,
            })
        else:
            processed_results.append(result)
    
    return processed_results
