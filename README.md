# YouTube Timestamp Creator

A modern web application that allows users to create, manage, and share timestamps for YouTube videos with an intuitive interface.

## Features

- 🎥 Embedded YouTube video player
- ⌚ Easy timestamp creation with multiple input methods:
  - Direct time input
  - Slider scrubbing
  - Keyboard shortcuts
  - Quick jump buttons
- 📝 Add descriptions to timestamps
- 📋 Copy formatted timestamps to clipboard
- 🎮 Playback controls with keyboard shortcuts
- 🎯 Real-time time tracking
- 🔍 Video URL validation
- 📱 Responsive design

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- YouTube IFrame API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd youtube-timestamp-creator
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

## Usage

1. Paste a YouTube video URL in the input field
2. Wait for the video to load
3. Use any of these methods to create timestamps:
   - Type the time directly (mm:ss or hh:mm:ss format)
   - Use the slider to scrub to desired position
   - Use keyboard shortcuts (Arrow keys, Space for play/pause)
   - Click the quick jump buttons
4. Add a description for your timestamp
5. Click "Add Timestamp" or press Enter
6. Copy all timestamps to clipboard when done

## Keyboard Shortcuts

- `Space`: Play/Pause video
- `←`: Go back 5 seconds
- `→`: Go forward 5 seconds
- `Enter`: Add timestamp (when description is filled)

## Contributing

Feel free to open issues and pull requests for any improvements you'd like to add.

## License

MIT License - feel free to use this project for any purpose.
