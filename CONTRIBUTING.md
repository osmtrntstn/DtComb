# Contributing to DtComb

Thank you for your interest in contributing to DtComb! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/DtComb.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Set up development environment (see README.md)

## Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install pytest black flake8 mypy

# Copy environment file
cp .env.example .env
# Edit .env with your settings
```

## Code Standards

### Python Code Style

- Follow PEP 8 guidelines
- Use type hints where possible
- Maximum line length: 120 characters
- Use meaningful variable and function names

```python
# Good
def calculate_roc_curve(markers: list, status: list) -> dict:
    """Calculate ROC curve coordinates"""
    pass

# Bad
def calc(m, s):
    pass
```

### Code Formatting

Run Black before committing:
```bash
black app/ main.py --line-length=120
```

### Linting

Check code with flake8:
```bash
flake8 app/ --max-line-length=120
```

## Testing

### Writing Tests

- Write tests for new features
- Maintain test coverage above 80%
- Use pytest framework
- Place tests in `tests/` directory

```python
def test_analysis_endpoint():
    """Test analysis endpoint returns valid data"""
    response = client.post("/run-analysis", json=test_data)
    assert response.status_code == 200
    assert "roc_data" in response.json()
```

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test
pytest tests/test_main.py::test_login_page -v
```

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(analysis): add support for multiple ROC curves

Implemented functionality to display multiple ROC curves
on the same plot for easier comparison.

Closes #123
```

```
fix(login): resolve session timeout issue

Fixed bug where sessions were expiring too quickly
due to incorrect timeout configuration.
```

## Pull Request Process

1. **Update your branch** with the latest changes from main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Ensure all tests pass**:
   ```bash
   pytest tests/ -v
   ```

3. **Format your code**:
   ```bash
   black app/ main.py --line-length=120
   ```

4. **Update documentation** if needed

5. **Create Pull Request** with:
   - Clear title and description
   - Link to related issues
   - Screenshots (if UI changes)
   - Test results

6. **Respond to review feedback** promptly

## Project Structure

```
DtComb/
├── app/
│   ├── controllers/     # API endpoints
│   ├── services/        # Business logic
│   ├── engines/         # R integration
│   ├── db/             # Database layer
│   ├── models/         # Data models
│   ├── utils/          # Utilities
│   └── middleware/     # Middleware
├── tests/              # Test files
├── static/             # Frontend assets
└── docs/              # Documentation
```

## Questions?

- Open an issue for bugs or feature requests
- Join discussions in the Issues section
- Contact maintainers for questions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow project guidelines

Thank you for contributing! 🎉

