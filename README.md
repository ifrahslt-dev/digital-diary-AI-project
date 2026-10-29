# Little Diary ✿

A cozy, responsive digital diary that runs locally in your browser. It uses plain HTML, CSS and JavaScript, so you don't need to install Node.js or any packages.

## Run it locally

1. Download and unzip `digital-diary.zip`.
2. Open the `digital-diary` folder.
3. Double-click `index.html` to open it in your browser.

That's it! It also works with a local development server if you prefer one, but it's not required.

## Features

- Create, edit and delete diary entries
- Add a date, mood and optional image URL
- Search and filter memories
- Daily mood check-ins and a mood history
- Change your display name and choose a color theme
- Export a JSON backup
- Responsive layout for desktop and mobile
- Saves automatically to your browser's local storage

## Important notes

- Your diary data is stored in the browser on this device, not uploaded to a server.
- Clearing browser site data or switching browsers/devices may remove or hide your entries. Use **Settings → Download backup** to keep a copy.
- Images added by URL need to be accessible online. The app doesn't upload image files.
- Google Fonts are loaded from the internet. The diary still works offline, but may use a fallback font.
- This is a personal local app, not a secure encrypted vault. Avoid storing passwords or sensitive information.

## Files

- `index.html` — page structure
- `style.css` — colors, layout and responsive design
- `app.js` — diary features and local storage
