"""
Configuration management for the Publication Analyzer application.
"""
import os
from pathlib import Path
from typing import Optional

# Load environment variables
try:
    from dotenv import load_dotenv
    _root = Path(__file__).resolve().parent.parent
    load_dotenv(_root / ".env")
except ImportError:
    pass


class Config:
    """Application configuration."""
    
    # API URLs
    OPENALEX_BASE = "https://api.openalex.org"
    SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1"
    ORCID_PUB_BASE = "https://pub.orcid.org/v3.0"
    CROSSREF_BASE = "https://api.crossref.org"
    OPENAIRE_BASE = "https://api.openaire.eu"
    EUROPE_PMC_BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest"
    HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions"
    
    # Hugging Face configuration
    HF_TOKEN: Optional[str] = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
    HF_SUMMARY_MODEL: str = os.environ.get("HF_SUMMARY_MODEL", "HuggingFaceTB/SmolLM3-3B:hf-inference")
    
    # Timeouts (in seconds)
    API_TIMEOUT: float = float(os.environ.get("API_TIMEOUT", "15.0"))
    HF_TIMEOUT: float = float(os.environ.get("HF_TIMEOUT", "90.0"))
    EXTERNAL_API_TIMEOUT: float = float(os.environ.get("EXTERNAL_API_TIMEOUT", "10.0"))
    
    # Rate limiting
    MAX_BATCH_SIZE: int = int(os.environ.get("MAX_BATCH_SIZE", "50"))
    MAX_DASHBOARD_SIZE: int = int(os.environ.get("MAX_DASHBOARD_SIZE", "100"))
    
    # Application settings
    DEBUG: bool = os.environ.get("DEBUG", "").lower() in ("true", "1", "yes")
    
    @classmethod
    def is_ai_enabled(cls) -> bool:
        """Check if AI features are enabled."""
        return bool(cls.HF_TOKEN)
    
    @classmethod
    def validate(cls) -> list[str]:
        """Validate configuration and return list of warnings."""
        warnings = []
        
        if not cls.HF_TOKEN:
            warnings.append(
                "HF_TOKEN not set. AI features (summaries, comparisons, chat) will not work. "
                "Get a free token at https://huggingface.co/settings/tokens"
            )
        
        if cls.API_TIMEOUT < 5:
            warnings.append(f"API_TIMEOUT is very low ({cls.API_TIMEOUT}s). May cause timeouts.")
        
        if cls.MAX_BATCH_SIZE > 100:
            warnings.append(f"MAX_BATCH_SIZE is high ({cls.MAX_BATCH_SIZE}). May cause performance issues.")
        
        return warnings


# Create singleton instance
config = Config()
