"""
LLM-based Quality Evaluation
Uses SmolLM3 to evaluate paper quality, credibility, and relevance.
"""
import os
import json
import httpx
from typing import Dict, Optional, List


HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions"
HF_SUMMARY_MODEL = os.environ.get("HF_SUMMARY_MODEL") or "HuggingFaceTB/SmolLM3-3B:hf-inference"


def _get_hf_token() -> Optional[str]:
    """Get Hugging Face token from environment."""
    return os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")


def _build_evaluation_prompt(paper: Dict, query: Optional[str] = None) -> str:
    """
    Build prompt for LLM evaluation.
    """
    title = paper.get("title", "Unknown")
    abstract = paper.get("abstract", "No abstract available")
    venue = paper.get("venue") or paper.get("journal") or "Unknown"
    year = paper.get("year") or paper.get("publication_year") or "Unknown"
    citations = paper.get("cited_by_count") or paper.get("citationCount") or 0
    
    prompt = f"""You are an academic reviewer. Evaluate this research paper objectively.

TITLE: {title}
ABSTRACT: {abstract[:500]}...
VENUE: {venue}
YEAR: {year}
CITATIONS: {citations}"""
    
    if query:
        prompt += f"\nSEARCH QUERY: {query}"
    
    prompt += """

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "quality_score": <0-10>,
  "credibility_score": <0-10>,
  "relevance_score": <0-10>,
  "suspicious": <true or false>,
  "reason": "<brief explanation>"
}

Scoring guidelines:
- quality_score: Research methodology, clarity, contribution (0=poor, 10=excellent)
- credibility_score: Venue reputation, citation patterns, author credibility (0=low, 10=high)
- relevance_score: Relevance to search query if provided, otherwise general relevance (0=irrelevant, 10=highly relevant)
- suspicious: true if paper shows signs of predatory publishing or academic misconduct
- reason: One sentence explaining the overall assessment"""
    
    return prompt


def _parse_llm_response(response_text: str) -> Dict:
    """
    Parse LLM response, handling various formats.
    Returns structured dict with safe defaults on error.
    """
    default_response = {
        "quality_score": 5,
        "credibility_score": 5,
        "relevance_score": 5,
        "suspicious": False,
        "reason": "Unable to evaluate",
    }
    
    if not response_text:
        return default_response
    
    try:
        # Try to find JSON in response
        text = response_text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        
        # Find JSON object
        start = text.find("{")
        end = text.rfind("}") + 1
        
        if start >= 0 and end > start:
            json_str = text[start:end]
            data = json.loads(json_str)
            
            # Validate and normalize scores
            result = {
                "quality_score": max(0, min(10, float(data.get("quality_score", 5)))),
                "credibility_score": max(0, min(10, float(data.get("credibility_score", 5)))),
                "relevance_score": max(0, min(10, float(data.get("relevance_score", 5)))),
                "suspicious": bool(data.get("suspicious", False)),
                "reason": str(data.get("reason", "No reason provided"))[:200],
            }
            return result
    except (json.JSONDecodeError, ValueError, KeyError):
        pass
    
    return default_response


async def evaluate_paper_llm(
    paper: Dict,
    query: Optional[str] = None,
    timeout: float = 30.0
) -> Dict:
    """
    Evaluate paper quality using LLM.
    
    Args:
        paper: Paper dictionary with title, abstract, venue, year, citations
        query: Optional search query for relevance scoring
        timeout: Request timeout in seconds
    
    Returns:
        Dictionary with:
            - quality_score (float): 0-10
            - credibility_score (float): 0-10
            - relevance_score (float): 0-10
            - suspicious (bool): True if paper appears suspicious
            - reason (str): Brief explanation
    """
    token = _get_hf_token()
    
    # Return safe defaults if no token
    if not token:
        return {
            "quality_score": 5,
            "credibility_score": 5,
            "relevance_score": 5,
            "suspicious": False,
            "reason": "LLM evaluation unavailable (no API token)",
        }
    
    try:
        prompt = _build_evaluation_prompt(paper, query)
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                HF_ROUTER_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": HF_SUMMARY_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an academic reviewer. Return only valid JSON, no markdown."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 500,
                    "temperature": 0.3,  # Lower temperature for more consistent output
                }
            )
            
            # Check for credit depletion or quota errors
            if response.status_code == 402 or response.status_code == 429:
                return {
                    "quality_score": 5,
                    "credibility_score": 5,
                    "relevance_score": 5,
                    "suspicious": False,
                    "reason": "HuggingFace API credits depleted - purchase credits or subscribe to PRO",
                }
            
            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices", [])
                
                if choices and isinstance(choices[0].get("message"), dict):
                    content = choices[0]["message"].get("content", "")
                    return _parse_llm_response(content)
    
    except (httpx.TimeoutException, httpx.HTTPError) as e:
        # Check if error message mentions credits
        error_msg = str(e).lower()
        if "credit" in error_msg or "quota" in error_msg or "balance" in error_msg:
            return {
                "quality_score": 5,
                "credibility_score": 5,
                "relevance_score": 5,
                "suspicious": False,
                "reason": "HuggingFace API credits depleted",
            }
    except Exception:
        pass  # Catch any other errors
    
    # Return safe defaults on any error
    return {
        "quality_score": 5,
        "credibility_score": 5,
        "relevance_score": 5,
        "suspicious": False,
        "reason": "LLM evaluation failed",
    }


async def batch_evaluate_llm(
    papers: List[Dict],
    query: Optional[str] = None,
    max_concurrent: int = 5
) -> List[Dict]:
    """
    Evaluate multiple papers with LLM, with concurrency control.
    
    Args:
        papers: List of paper dictionaries
        query: Optional search query
        max_concurrent: Maximum concurrent LLM requests
    
    Returns:
        List of evaluation results in same order as input
    """
    import asyncio
    from typing import List
    
    # Create semaphore to limit concurrent requests
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def evaluate_with_semaphore(paper: Dict) -> Dict:
        async with semaphore:
            return await evaluate_paper_llm(paper, query)
    
    tasks = [evaluate_with_semaphore(paper) for paper in papers]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Handle exceptions
    processed_results = []
    for result in results:
        if isinstance(result, Exception):
            processed_results.append({
                "quality_score": 5,
                "credibility_score": 5,
                "relevance_score": 5,
                "suspicious": False,
                "reason": "Evaluation failed",
            })
        else:
            processed_results.append(result)
    
    return processed_results
