# Development Workflow

This document outlines the development workflow for the Elder Care Navigator project.

## Branch Strategy

- **main**: Production-ready code
- **feature branches**: Feature development (prefix: `feature/`)
- **bugfix branches**: Bug fixes (prefix: `bugfix/`)

## Development Process

1. **Create a feature branch** from `main`
2. **Develop and test** your changes locally
3. **Commit frequently** with clear, descriptive messages
4. **Push to remote** and create a pull request
5. **Code review** by team members
6. **Merge** after approval and passing CI/CD checks

## Commit Message Convention

Follow the conventional commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```
feat(auth): add social login support

Implemented OAuth integration for Google and GitHub authentication.

Closes #123
```

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Write a clear PR description explaining the changes
3. Link related issues
4. Request reviews from relevant team members
5. Address review comments
6. Squash and merge after approval

## Testing

- Write unit tests for new features
- Run the full test suite before pushing
- Ensure all tests pass in CI/CD

## Code Quality

- Follow the project's ESLint configuration
- Use TypeScript strict mode
- Write clear, self-documenting code
- Add comments for complex logic
