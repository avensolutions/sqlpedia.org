# Contributing to SQLpedia

Thank you for your interest in contributing to SQLpedia! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Content Guidelines](#content-guidelines)
- [Style Guide](#style-guide)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Give and receive constructive feedback gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct that could reasonably be considered inappropriate

## Ways to Contribute

### 1. Content Contributions

#### Add New Content
- Write guides for SQL concepts
- Create database-specific documentation
- Add real-world patterns and examples
- Write migration guides between databases

#### Improve Existing Content
- Fix typos and grammatical errors
- Clarify explanations
- Add missing information
- Update outdated content
- Improve code examples

### 2. Code Contributions

#### Vue Components
- Enhance existing components (SQLAssistant, SQLComparison)
- Create new interactive components
- Improve component accessibility
- Add component tests

#### Backend/Functions
- Improve Netlify functions
- Add new AI providers
- Optimize caching strategies
- Enhance error handling

#### Theme/Design
- Improve visual design
- Enhance responsiveness
- Improve dark mode
- Add animations/transitions

### 3. Other Contributions

- Report bugs
- Suggest features
- Improve documentation
- Answer questions in Discussions
- Help review pull requests

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Git
- A GitHub account
- Basic knowledge of Markdown
- (Optional) SQL knowledge for content contributions

### Setup Development Environment

1. **Fork the repository**
   - Go to https://github.com/stackql/sqlpedia.org
   - Click "Fork" button in the top right

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/sqlpedia.org.git
   cd sqlpedia.org
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/stackql/sqlpedia.org.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The site will be available at http://localhost:5173

6. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Content Guidelines

### File Organization

```
docs/
├── databases/           # Database-specific documentation
│   └── [database-name]/
│       └── index.md
├── concepts/            # SQL concepts and fundamentals
│   └── [concept-name]/
│       └── index.md
├── patterns/            # Common SQL patterns
│   └── [pattern-name]/
│       └── index.md
├── comparisons/         # Dialect comparisons and migration guides
│   └── [comparison-name].md
└── stackql/            # StackQL specific content
    └── [topic-name].md
```

### Page Template

All content pages should follow this structure:

```markdown
---
title: [Clear, Descriptive Title]
description: [Brief description for SEO and previews]
databases: [List of applicable databases]
difficulty: beginner|intermediate|advanced
tags: [relevant, tags, for, search]
---

# [Page Title]

<div class="difficulty-badge difficulty-[beginner|intermediate|advanced]">[Difficulty Level]</div>

## Quick Reference

\`\`\`sql
-- Quick code example showing the concept
SELECT example FROM table;
\`\`\`

## Overview

[1-2 paragraphs explaining the concept, why it's important, and when to use it]

## Syntax

[Detailed explanation of syntax]

\`\`\`sql
-- Full syntax example with comments
\`\`\`

## Examples

### Basic Example

[Simple example with explanation]

\`\`\`sql
-- Code
\`\`\`

### Advanced Example

[Complex real-world example]

\`\`\`sql
-- Code
\`\`\`

## Platform-Specific Notes

::: details [Database Name]
[Database-specific information, quirks, or features]

\`\`\`sql
-- Database-specific code example
\`\`\`
:::

## Performance Considerations

[Tips for optimizing queries, indexing strategies, etc.]

## Common Pitfalls

[Common mistakes and how to avoid them]

\`\`\`sql
-- ❌ Wrong way
-- Code example

-- ✅ Correct way
-- Code example
\`\`\`

## See Also

- [Related Topic 1](/path/to/topic)
- [Related Topic 2](/path/to/topic)
```

### Writing Style

#### Be Clear and Concise
- Use simple, direct language
- Avoid jargon unless necessary
- Define technical terms when first used
- Break complex topics into digestible sections

#### Use Active Voice
- ✅ "Use indexes to improve query performance"
- ❌ "Query performance can be improved by using indexes"

#### Provide Context
- Explain WHY, not just HOW
- Include real-world use cases
- Show practical applications

#### Code Examples
- Use realistic table and column names
- Add comments to explain complex logic
- Show both good and bad examples
- Test all code examples before submitting

#### Be Database-Agnostic (When Possible)
- Use standard SQL when applicable
- Clearly mark database-specific features
- Provide alternatives for different databases

### SQL Code Style

```sql
-- Use uppercase for SQL keywords
SELECT column1, column2
FROM table_name
WHERE condition = 'value';

-- Indent for readability
SELECT
  customer_id,
  customer_name,
  email,
  COUNT(order_id) as total_orders
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.status = 'active'
GROUP BY
  customer_id,
  customer_name,
  email
HAVING COUNT(order_id) > 5
ORDER BY total_orders DESC;

-- Use meaningful names
-- ✅ Good
SELECT customer_name, order_total FROM orders;

-- ❌ Bad
SELECT c, o FROM t;

-- Add comments for complex logic
SELECT
  employee_id,
  -- Calculate tenure in years
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) as years_employed,
  -- Bonus is 5% of salary per year of service
  salary * 0.05 * EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) as bonus
FROM employees;
```

## Style Guide

### Markdown

- Use ATX-style headers (`#` syntax)
- Use fenced code blocks with language identifiers
- Use relative links for internal navigation
- Add alt text for images

### Frontmatter

All pages must include frontmatter:

```yaml
---
title: String (required)
description: String (required, 150 chars max)
databases: Array of strings (optional)
difficulty: beginner|intermediate|advanced (optional)
tags: Array of strings (optional)
---
```

### Links

- Use relative links for internal pages: `[Text](/path/to/page)`
- Use full URLs for external links: `[Text](https://example.com)`
- Add `target="_blank"` for external links if needed

### Code Blocks

Always specify the language:

```markdown
\`\`\`sql
SELECT * FROM users;
\`\`\`

\`\`\`bash
npm install
\`\`\`

\`\`\`typescript
const example: string = 'Hello';
\`\`\`
```

### Tables

Use Markdown tables for comparisons:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |
```

### Custom Components

#### SQLAssistant

```markdown
<SQLAssistant
  mode="generate"
  default-dialect="postgresql"
  :show-model-selector="false"
/>
```

#### SQLComparison

```markdown
<SQLComparison
  :dialects="['postgresql', 'mysql', 'sqlserver']"
/>
```

## Pull Request Process

### Before Submitting

1. **Test your changes locally**
   ```bash
   npm run dev     # Check in development
   npm run build   # Ensure it builds
   npm run preview # Test production build
   ```

2. **Lint and format**
   ```bash
   npm run lint
   npm run format
   ```

3. **Update documentation** if needed

4. **Keep commits atomic** - one logical change per commit

5. **Write clear commit messages**
   ```
   Add: new PostgreSQL window functions guide
   Fix: typo in SQL basics page
   Update: improve performance optimization section
   ```

### Submitting

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template

3. **PR Description Should Include**
   - What changes were made
   - Why the changes were needed
   - Any relevant issue numbers
   - Screenshots (if UI changes)
   - Testing performed

### PR Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Content addition/update
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Related Issues
Closes #[issue number]

## Changes Made
- [List of changes]
- [List of changes]

## Testing Performed
- [ ] Tested locally in development mode
- [ ] Tested production build
- [ ] All code examples tested
- [ ] Verified links work

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] PR title is clear and descriptive
```

### Review Process

1. **Automated checks** will run on your PR
2. **Maintainers will review** your changes
3. **Address feedback** if requested
4. **PR will be merged** once approved

### After Merge

1. **Delete your feature branch**
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Sync your fork**
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

## Content Quality Standards

### Accuracy
- All SQL examples must be tested
- Information must be current and correct
- References should be cited when appropriate

### Completeness
- Cover all important aspects of the topic
- Include examples for different scenarios
- Provide troubleshooting guidance

### Clarity
- Use clear, unambiguous language
- Define technical terms
- Provide context and explanations

### Consistency
- Follow the page template
- Use consistent terminology
- Maintain uniform code style

## Community

### Getting Help

- **Documentation**: Check README.md and existing docs
- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Search existing issues before creating new ones

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions, ideas, and general discussion
- **Pull Requests**: Code and content contributions

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- GitHub contributors page
- Release notes (for significant contributions)

## Questions?

If you have questions about contributing:

1. Check this guide thoroughly
2. Search GitHub Discussions
3. Ask in GitHub Discussions
4. Contact maintainers via GitHub

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to SQLpedia!** 🎉

Your contributions help make SQL knowledge more accessible to everyone.
