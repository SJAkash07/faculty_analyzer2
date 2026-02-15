# Contributing to Publication Analyzer

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and clone the repository**

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # If available
   ```

4. **Set up pre-commit hooks (optional):**
   ```bash
   pip install pre-commit
   pre-commit install
   ```

## Code Style

- Follow PEP 8 for Python code
- Use type hints for function parameters and return values
- Write docstrings for all public functions and classes
- Keep functions focused and under 50 lines when possible
- Use meaningful variable names

### Python Formatting

```bash
# Format code
black backend/

# Sort imports
isort backend/

# Lint
flake8 backend/

# Type checking
mypy backend/
```

### JavaScript Formatting

- Use 2 spaces for indentation
- Use semicolons
- Use const/let instead of var
- Add comments for complex logic

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html

# Run specific test file
pytest tests/test_api.py
```

## Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Write tests for new features
   - Update documentation
   - Follow code style guidelines

3. **Test your changes:**
   ```bash
   pytest
   python setup.py  # Run setup checks
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `chore:` for maintenance

5. **Push and create a pull request:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed
- Keep PRs focused on a single feature/fix

## Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python version, etc.)
- Error messages and stack traces
- Screenshots if applicable

## Feature Requests

Feature requests are welcome! Please:

- Check if the feature already exists or is planned
- Provide a clear use case
- Explain why it would be useful
- Consider implementation complexity

## Code Review Process

1. All PRs require at least one review
2. Address review comments promptly
3. Keep discussions professional and constructive
4. Be open to feedback and suggestions

## Areas for Contribution

- **Bug fixes:** Check open issues
- **New features:** See feature requests
- **Documentation:** Improve README, add examples
- **Tests:** Increase test coverage
- **Performance:** Optimize slow operations
- **UI/UX:** Improve frontend design
- **Accessibility:** Make the app more accessible

## Questions?

Feel free to open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
