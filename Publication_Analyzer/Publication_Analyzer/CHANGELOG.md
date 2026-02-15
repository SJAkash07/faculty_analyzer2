# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive README with setup instructions and troubleshooting
- Configuration management system (config.py)
- Utility functions module with input validation and sanitization
- Setup validation script (setup.py)
- Contributing guidelines (CONTRIBUTING.md)
- Development dependencies (requirements-dev.txt)
- Unit tests for utility functions
- Enhanced .gitignore with comprehensive exclusions
- Better .env.example with all configuration options

### Changed
- Improved error handling throughout the application
- Better input validation for all API endpoints
- Enhanced documentation and code comments
- Standardized error messages

### Fixed
- Security improvements with input sanitization
- Better handling of edge cases in API responses
- Improved error messages for missing configuration

## [1.0.0] - Initial Release

### Added
- Faculty search by name using OpenAlex API
- Detailed faculty profiles with publications and metrics
- AI-powered assessment summaries using Hugging Face
- Faculty comparison with AI-generated assessments
- Batch processing for multiple faculty members
- Research fingerprint visualization
- PDF report generation for accreditation
- Integration with 6 academic data sources
- Light/dark theme support
- Saved items functionality
- Interactive API documentation
- Chat functionality for papers and comparisons

### Features
- Search researchers from OpenAlex database
- View publications, citations, h-index, i10-index
- Filter and sort publications
- Generate AI summaries for papers
- Compare two faculty members side-by-side
- Batch analyze up to 50 faculty
- Export data to CSV
- Generate PDF accreditation reports
- Visualize publication type distribution
- Save authors and papers for quick access
- Multi-source data aggregation

### Technical
- FastAPI backend with async support
- Vanilla JavaScript frontend
- Chart.js for visualizations
- ReportLab for PDF generation
- Responsive design
- RESTful API with OpenAPI documentation
