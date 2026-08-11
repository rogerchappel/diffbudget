# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Added

- Initial project setup.

### Fixed

- Decode Git-quoted modification and rename paths so scans, path patterns, and
  reports use the actual filename.
- Reject malformed runtime configuration values instead of silently bypassing
  numeric budgets, and honor workspace redaction settings in generated reports.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/diffbudget/compare/...HEAD`
- Latest release:
  `https://github.com/rogerchappel/diffbudget/releases/latest`

Replace placeholder links once the first release tag exists.
