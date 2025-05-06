# World Clock Buddy Chrome Extension

A modern Chrome extension that displays the current time in multiple timezones with accurate time conversion and DST handling.

## Features

- Shows time in UTC, your local timezone, and any city you add
- Accurate timezone handling with proper DST (Daylight Saving Time) adjustments
- Search and add cities from a comprehensive timezone database
- Save custom locations that persist across browser sessions
- Hover over time blocks to highlight the same time across all timezones
- Modern, responsive UI with smooth animations
- Clean visualization of time differences with 5-hour view for each location

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select this extension's directory
5. The extension will appear in your toolbar

## Usage

- Click on the extension icon in your Chrome toolbar to open the World Clock Buddy dashboard
- Click the search icon to find and add new cities
- Hover over any time block to see the equivalent times across all timezones
- Remove custom locations by clicking the X that appears when you hover over them
- Use the settings icon to restore any previously hidden timezones

## Project Structure

```
world-clock-buddy/
├── assets/             # Images and icons
├── lib/                # External libraries
├── .github/            # GitHub Actions workflows
├── popup.html          # Main extension UI
├── popup.js            # Extension functionality
├── manifest.json       # Extension configuration
└── README.md           # Documentation
```

## CI/CD Pipeline

This project uses a hybrid CI/CD approach with both GitHub Actions and CircleCI:

### GitHub Actions
- **Lint & Format Check**: ESLint for JavaScript files
- **HTML Validation**: Validates HTML structure and CSS

### CircleCI
- **SonarQube Analysis**: Code quality and code smell detection
- **Security Scan**: NJSScan and npm audit for security vulnerabilities

This split approach allows us to leverage the strengths of both platforms for more comprehensive quality checks.

## Dependencies

This extension uses:
- [Luxon](https://moment.github.io/luxon/) - For accurate timezone handling and time conversion
- Google Material Icons - For UI icons
- Google Fonts (Roboto) - For typography
- Chrome Storage API - For saving user preferences

## Development

To modify or enhance the extension:

1. Clone the repository
2. Install dependencies: `npm install`
3. Make your changes to the HTML, CSS, and JavaScript files
4. Run linting: `npm run lint`
5. Test your changes by loading the extension in developer mode
6. Create a build package: `npm run build`

## Linting Instructions

To ensure code quality and consistency, we use ESLint for JavaScript linting. Here's how to run it locally:

1. Make sure you have all dependencies installed:
   ```
   npm install
   ```

2. Run ESLint on a specific file:
   ```
   npx eslint filename.js
   ```

3. Run ESLint on all JavaScript files:
   ```
   npx eslint .
   ```

4. Automatically fix some common issues:
   ```
   npx eslint --fix .
   ```

5. Common linting rules enforced:
   - Single quotes for strings
   - No unused variables
   - Proper spacing and formatting
   - No undefined functions

If you're getting errors about missing plugins when running ESLint, you may need to install them:
```
npm install eslint-plugin-html eslint-plugin-json --save-dev
```

## Future Enhancements

- World map visualization showing day/night across the globe
- Meeting scheduler to find optimal meeting times
- 12/24 hour time format toggle
- Light/dark theme support
- Additional city metadata (country, flag, etc.)

## License

MIT License

## Credits

Inspired by [World Time Buddy](https://www.worldtimebuddy.com/) 
