"""
Smart Ranking Engine
Combines multiple signals to rank papers by quality and relevance.
"""
import math
from datetime import datetime
from typing import Dict, List, Optional


def calculate_citation_score(paper: Dict) -> float:
    """
    Calculate normalized citation score based on paper age.
    Returns citations per year, normalized.
    """
    year = paper.get("year") or paper.get("publication_year")
    citations = paper.get("cited_by_count") or paper.get("citationCount") or 0
    
    if not year:
        return citations * 0.1  # Penalty for missing year
    
    current_year = datetime.now().year
    age = max(1, current_year - year)  # At least 1 year
    
    # Citations per year
    citation_rate = citations / age
    
    # Normalize to 0-100 scale (log scale for better distribution)
    # Assume 50 citations/year is excellent (score ~100)
    normalized = min(100, (math.log(citation_rate + 1) / math.log(51)) * 100)
    
    return normalized


def calculate_recency_bonus(paper: Dict) -> float:
    """
    Calculate bonus for recent papers.
    Returns 0-20 points.
    """
    year = paper.get("year") or paper.get("publication_year")
    
    if not year:
        return 0
    
    current_year = datetime.now().year
    age = current_year - year
    
    if age <= 2:
        return 20
    elif age <= 5:
        return 10
    else:
        return 0


def calculate_author_reputation(author: Optional[Dict]) -> float:
    """
    Calculate author reputation score.
    Returns 0-100 points.
    """
    if not author:
        return 50  # Neutral score if no author info
    
    citations = author.get("cited_by_count") or author.get("citationCount") or 0
    h_index = author.get("h_index") or author.get("hIndex") or 0
    
    # Combine log of citations with h-index
    # log(citations+1) gives 0-10 range for 0-20k citations
    # h-index * 2 gives 0-100+ range
    citation_component = math.log(citations + 1) * 5
    h_index_component = h_index * 2
    
    score = citation_component + h_index_component
    
    # Normalize to 0-100
    return min(100, score)


def calculate_integrity_weight(integrity: Dict) -> float:
    """
    Weight integrity score (already 0-100).
    """
    return integrity.get("integrity_score", 50)


def calculate_llm_weight(llm: Dict) -> float:
    """
    Combine LLM scores into weighted total.
    Returns 0-100 points.
    """
    quality = llm.get("quality_score", 5)  # 0-10
    credibility = llm.get("credibility_score", 5)  # 0-10
    relevance = llm.get("relevance_score", 5)  # 0-10
    suspicious = llm.get("suspicious", False)
    
    # Weighted combination (quality and credibility more important)
    score = (quality * 2 + credibility * 2 + relevance * 1.5) / 5.5
    
    # Convert to 0-100 scale
    score = score * 10
    
    # Penalty for suspicious papers
    if suspicious:
        score *= 0.5
    
    return min(100, score)


def generate_rank_explanation(
    paper: Dict,
    components: Dict[str, float],
    final_score: float
) -> str:
    """
    Generate human-readable explanation for ranking.
    """
    explanations = []
    
    # Citation score
    citations = paper.get("cited_by_count") or paper.get("citationCount") or 0
    if components["citation"] > 70:
        explanations.append(f"High citation rate ({citations} citations)")
    elif components["citation"] < 30:
        explanations.append(f"Low citation count ({citations})")
    
    # Recency
    if components["recency"] >= 20:
        explanations.append("Very recent publication")
    elif components["recency"] >= 10:
        explanations.append("Recent publication")
    
    # Integrity
    integrity_score = components["integrity"]
    risk_level = paper.get("integrity", {}).get("risk_level", "MEDIUM")
    if integrity_score >= 75:
        explanations.append("High integrity score")
    elif integrity_score < 50:
        explanations.append(f"Integrity concerns ({risk_level} risk)")
    
    # LLM quality
    llm_score = components["llm"]
    if llm_score >= 70:
        explanations.append("High quality assessment")
    elif llm_score < 40:
        explanations.append("Quality concerns")
    
    # Author reputation
    if components["author"] >= 70:
        explanations.append("Reputable author")
    
    if not explanations:
        explanations.append("Average across all metrics")
    
    return " • ".join(explanations[:3])  # Limit to top 3 reasons


def rank_papers(
    papers: List[Dict],
    author: Optional[Dict] = None,
    query: Optional[str] = None
) -> List[Dict]:
    """
    Rank papers using multi-factor scoring.
    
    Args:
        papers: List of papers with integrity and llm fields attached
        author: Optional author info for reputation scoring
        query: Optional search query (used in LLM evaluation)
    
    Returns:
        Sorted list of papers with final_score and rank_explanation attached
    """
    scored_papers = []
    
    for paper in papers:
        # Get analysis results (should already be attached)
        integrity = paper.get("integrity", {
            "integrity_score": 50,
            "risk_level": "MEDIUM",
            "flags": []
        })
        llm = paper.get("llm", {
            "quality_score": 5,
            "credibility_score": 5,
            "relevance_score": 5,
            "suspicious": False,
            "reason": "Not evaluated"
        })
        
        # Calculate component scores
        citation_score = calculate_citation_score(paper)
        recency_bonus = calculate_recency_bonus(paper)
        author_score = calculate_author_reputation(author)
        integrity_score = calculate_integrity_weight(integrity)
        llm_score = calculate_llm_weight(llm)
        
        # Weighted final score
        final_score = (
            citation_score * 0.20 +
            recency_bonus * 0.10 +
            author_score * 0.15 +
            integrity_score * 0.25 +
            llm_score * 0.30
        )
        
        # Store component scores for explanation
        components = {
            "citation": citation_score,
            "recency": recency_bonus,
            "author": author_score,
            "integrity": integrity_score,
            "llm": llm_score,
        }
        
        # Generate explanation
        explanation = generate_rank_explanation(paper, components, final_score)
        
        # Attach scores to paper
        paper["final_score"] = round(final_score, 2)
        paper["rank_explanation"] = explanation
        paper["score_components"] = components
        
        scored_papers.append(paper)
    
    # Sort by final score (descending)
    scored_papers.sort(key=lambda p: p["final_score"], reverse=True)
    
    # Add rank position
    for i, paper in enumerate(scored_papers, 1):
        paper["rank"] = i
    
    return scored_papers


def get_top_papers(
    papers: List[Dict],
    n: int = 10,
    min_score: Optional[float] = None
) -> List[Dict]:
    """
    Get top N papers, optionally filtered by minimum score.
    
    Args:
        papers: Ranked papers (should already have final_score)
        n: Number of papers to return
        min_score: Optional minimum score threshold
    
    Returns:
        Top N papers
    """
    filtered = papers
    
    if min_score is not None:
        filtered = [p for p in papers if p.get("final_score", 0) >= min_score]
    
    return filtered[:n]


def get_papers_by_risk(papers: List[Dict], risk_level: str) -> List[Dict]:
    """
    Filter papers by integrity risk level.
    
    Args:
        papers: Papers with integrity analysis
        risk_level: "LOW", "MEDIUM", or "HIGH"
    
    Returns:
        Filtered papers
    """
    return [
        p for p in papers
        if p.get("integrity", {}).get("risk_level") == risk_level
    ]
