# Contributing to MSN

Thank you for your interest in contributing to Mad Sam Notation!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/msn.git
   cd msn
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build all packages:
   ```bash
   npm run build
   ```
5. Run tests:
   ```bash
   npm test
   ```

## Project Structure

```
msn/
├── packages/
│   ├── parser/       Core parser (lexer, parser, compiler)
│   ├── cli/          Command-line interface
│   ├── validator/    Syntax validation
│   ├── formatter/    Auto-formatting
│   └── vscode-extension/  VS Code support
├── tests/            Test suite (Vitest)
├── docs/             Documentation
├── examples/         Example MSN files
├── spec/             Language specification
├── playground/       Web playground
└── website/          Official website
```

## Development Workflow

1. Create a branch for your feature/fix
2. Make your changes
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Submit a pull request

## Coding Standards

- TypeScript strict mode
- No `any` types without justification
- Write tests for all new features
- Follow the existing code style

## Areas for Contribution

- **Parser**: Improve error messages, edge case handling
- **CLI**: New commands, better output formatting
- **Validator**: Additional validation rules
- **Formatter**: Smarter formatting logic
- **VSCode Extension**: Better IntelliSense, code actions
- **Documentation**: Tutorials, examples, translations
- **Playground**: UI improvements, sharing features
- **Website**: Design, content, accessibility

## Reporting Issues

Please include:

- MSN input that demonstrates the issue
- Expected output
- Actual output
- Node.js version
- OS

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
