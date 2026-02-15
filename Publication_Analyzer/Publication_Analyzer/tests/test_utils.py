"""Tests for utility functions."""
import pytest
from backend.utils import (
    sanitize_author_id,
    sanitize_work_id,
    strip_thinking_tags,
    validate_search_query,
    format_institution_names,
    safe_int,
    truncate_text,
)


class TestSanitizeAuthorId:
    """Tests for sanitize_author_id function."""
    
    def test_adds_prefix(self):
        assert sanitize_author_id("123456") == "A123456"
    
    def test_keeps_existing_prefix(self):
        assert sanitize_author_id("A123456") == "A123456"
    
    def test_removes_url_prefix(self):
        assert sanitize_author_id("https://openalex.org/A123456") == "A123456"
    
    def test_raises_on_empty(self):
        with pytest.raises(ValueError):
            sanitize_author_id("")
    
    def test_raises_on_invalid_format(self):
        with pytest.raises(ValueError):
            sanitize_author_id("INVALID")


class TestSanitizeWorkId:
    """Tests for sanitize_work_id function."""
    
    def test_adds_prefix(self):
        assert sanitize_work_id("123456") == "W123456"
    
    def test_keeps_existing_prefix(self):
        assert sanitize_work_id("W123456") == "W123456"
    
    def test_case_insensitive(self):
        assert sanitize_work_id("w123456") == "W123456"
    
    def test_removes_url_prefix(self):
        assert sanitize_work_id("https://openalex.org/W123456") == "W123456"


class TestStripThinkingTags:
    """Tests for strip_thinking_tags function."""
    
    def test_removes_thinking_tags(self):
        text = "Answer <think>reasoning here</think> more text"
        assert strip_thinking_tags(text) == "Answer  more text"
    
    def test_case_insensitive(self):
        text = "Answer <THINK>reasoning</THINK> text"
        assert strip_thinking_tags(text) == "Answer  text"
    
    def test_multiline(self):
        text = "Answer <think>\nreasoning\nhere\n</think> text"
        assert strip_thinking_tags(text) == "Answer  text"
    
    def test_no_tags(self):
        text = "Just normal text"
        assert strip_thinking_tags(text) == text


class TestValidateSearchQuery:
    """Tests for validate_search_query function."""
    
    def test_valid_query(self):
        assert validate_search_query("John Smith") == "John Smith"
    
    def test_strips_whitespace(self):
        assert validate_search_query("  John Smith  ") == "John Smith"
    
    def test_removes_dangerous_chars(self):
        assert validate_search_query("John<script>") == "Johnscript"
    
    def test_raises_on_too_short(self):
        with pytest.raises(ValueError):
            validate_search_query("a")
    
    def test_raises_on_too_long(self):
        with pytest.raises(ValueError):
            validate_search_query("a" * 201)


class TestFormatInstitutionNames:
    """Tests for format_institution_names function."""
    
    def test_formats_single(self):
        insts = [{"display_name": "MIT"}]
        assert format_institution_names(insts) == "MIT"
    
    def test_formats_multiple(self):
        insts = [
            {"display_name": "MIT"},
            {"display_name": "Harvard"}
        ]
        assert format_institution_names(insts) == "MIT, Harvard"
    
    def test_empty_list(self):
        assert format_institution_names([]) == "—"
    
    def test_filters_empty_names(self):
        insts = [
            {"display_name": "MIT"},
            {"display_name": ""},
            {"display_name": "Harvard"}
        ]
        assert format_institution_names(insts) == "MIT, Harvard"


class TestSafeInt:
    """Tests for safe_int function."""
    
    def test_converts_string(self):
        assert safe_int("123") == 123
    
    def test_returns_default_on_invalid(self):
        assert safe_int("invalid", 0) == 0
    
    def test_returns_none_on_none(self):
        assert safe_int(None) is None
    
    def test_returns_default_on_none(self):
        assert safe_int(None, 0) == 0


class TestTruncateText:
    """Tests for truncate_text function."""
    
    def test_no_truncation_needed(self):
        text = "Short text"
        assert truncate_text(text, 100) == text
    
    def test_truncates_long_text(self):
        text = "a" * 200
        result = truncate_text(text, 50)
        assert len(result) == 50
        assert result.endswith("...")
    
    def test_custom_suffix(self):
        text = "a" * 200
        result = truncate_text(text, 50, suffix="…")
        assert result.endswith("…")
