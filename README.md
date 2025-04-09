# SaveIt - Bookmark Manager Chrome Extension

A simple bookmark manager that overrides the new tab page in Chrome. This extension allows you to organize your bookmarks into categories and access them directly from the new tab page.

## Features

- Create and manage bookmark categories
- Add, view, and delete bookmarks within categories
- View all currently open tabs and add them to your bookmark categories with one click
- Simple and clean UI
- All data is stored locally in your browser (using localStorage)
- No data is sent to any servers

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the folder containing this extension
5. The extension is now installed and will override your new tab page

## Usage

- Open a new tab to see the SaveIt bookmark manager
- Click "+ Add Category" to create a new category
- Select a category and click "+ Add Bookmark" to add a new bookmark manually
- Browse your open tabs on the right side and click "+" to add any open tab to the selected category
- Click on a bookmark to visit the website
- Click the "×" next to a bookmark or category to delete it
- Click "↻ Refresh" to update the list of open tabs

## Customization

If you want to change the appearance or behavior of the extension, you can modify:

- `newtab.css` - for styling
- `newtab.js` - for functionality
- `newtab.html` - for structure
- Replace the icon files in the `icons` folder with your own icons

## Notes

- This extension uses localStorage, which means the data is stored in your browser
- Clearing browser data might delete your bookmarks
- There is no sync functionality between different browsers or devices
- The extension requires "tabs" permission to access your open tabs

## License

This project is open source and available for personal use.
