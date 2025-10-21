# Football Play Designer MVP

A React + TypeScript + Firebase application for high school football teams to design, save, and share plays with a slide-based format (Setup → Mid → Final).

## Features

### Core Functionality
- **Firebase Authentication**: Email/password and Google sign-in
- **Role-based Access**: Coach and Player roles (coaches can edit, players view-only)
- **Play Designer**: Canvas-based drag-and-drop interface for positioning players
- **3-Slide System**: Each play has Setup, Mid, and Final positions
- **Formation Templates**: Pre-built formations (Trips Right, Doubles, Empty)
- **Play Management**: Create, edit, delete, and organize plays

### Interactive Features
- **Drag & Drop**: Move players on the field with real-time saving
- **Player Renaming**: Double-click tokens to rename positions
- **Mirror/Flip**: Quick field transformations for play variations
- **Animated Preview**: Auto-play through slides with frame-by-frame controls
- **Export Options**: Download plays as PNG or SVG files

### Team Features
- **Schedule Management**: Coaches can add events, all users can view
- **Play Library**: Centralized dashboard for all team plays
- **Secure Storage**: Firestore database with security rules

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI/Styling**: Tailwind CSS
- **Canvas Drawing**: React Konva
- **Routing**: React Router v6
- **Backend**: Firebase (Auth, Firestore)
- **Build Tool**: Vite

## Prerequisites

- Node.js 16+ and npm
- Firebase project with Authentication and Firestore enabled
- Firebase configuration credentials

## Setup Instructions

### 1. Clone and Install

```bash
# Clone the repository
git clone [your-repo-url]
cd football-play-mvp

# Install dependencies
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google (optional)

3. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Choose your preferred region

4. Get your configuration:
   - Go to Project Settings → General
   - Scroll to "Your apps" and click "Add app" → Web
   - Copy the configuration values

### 3. Environment Configuration

```bash
# Copy the environment template
cp .env.example .env.local

# Edit .env.local with your Firebase configuration
```

Add your Firebase configuration to `.env.local`:

```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. Firestore Security Rules

Add these security rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Plays: authenticated users can read, owners can write
    match /plays/{playId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (resource.data.createdBy == request.auth.uid);
    }

    // Users: users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId;
    }

    // Schedule: public read, authenticated write
    match /schedule/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. Run the Application

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage Guide

### Getting Started

1. **Sign Up/Login**: Create an account or sign in with Google
2. **Default Role**: New users start as "Players" (view-only)
3. **Coach Access**: Manually update user role in Firestore console:
   - Go to Firestore → users → [user-id]
   - Change `role: "player"` to `role: "coach"`

### Creating a Play

1. Click "New Play" from the dashboard
2. Choose a formation template (Trips Right, Doubles, or Empty)
3. Name your play (optional)
4. Click "Create Play"

### Editing Plays (Coaches Only)

1. Open a play from the dashboard
2. Use the slide controls to switch between Setup/Mid/Final
3. Drag players to new positions
4. Double-click player tokens to rename
5. Use Mirror L/R or Flip Field for variations
6. Changes save automatically

### Exporting Plays

1. Open any play
2. Navigate to desired slide
3. Click "Export PNG" for images or "Export SVG" for vectors
4. Files download automatically

### Managing Schedule

1. Navigate to Schedule from dashboard
2. Coaches see "Add Event" form
3. Fill in event details (title, date, time, location, notes)
4. All users can view upcoming events

## Project Structure

```
football-play-mvp/
├── src/
│   ├── components/         # React components
│   │   ├── CanvasField.tsx    # Main field canvas
│   │   ├── PlayerToken.tsx    # Draggable player markers
│   │   ├── SlideControls.tsx  # Slide navigation
│   │   ├── PlayPreview.tsx    # Animated preview
│   │   ├── ExportButtons.tsx  # Export functionality
│   │   └── ProtectedRoute.tsx # Auth protection
│   ├── lib/                # Utilities
│   │   ├── firebase.ts        # Firebase config
│   │   ├── auth.ts           # Auth helpers
│   │   ├── user.ts           # User profile management
│   │   ├── formations.ts     # Formation templates
│   │   └── download.ts       # File download helpers
│   ├── pages/              # Page components
│   │   ├── login.tsx         # Authentication
│   │   ├── dashboard.tsx     # Play list
│   │   ├── schedule.tsx      # Team schedule
│   │   ├── new-play.tsx      # Play creation
│   │   └── play/
│   │       └── [id].tsx      # Play editor
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── .env.example           # Environment template
├── .env.local             # Your Firebase config (create this)
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
├── tailwind.config.js     # Tailwind config
└── postcss.config.js      # PostCSS config
```

## Common Issues & Solutions

### Issue: "No authenticated user" error
**Solution**: Make sure you're logged in. Check Firebase Authentication console.

### Issue: Can't edit plays
**Solution**: Verify your user role is "coach" in Firestore users collection.

### Issue: Canvas not rendering
**Solution**: Check browser console for Konva errors. Try refreshing the page.

### Issue: Exports not working
**Solution**: Check browser permissions for downloads. Try a different browser.

## Development Tips

- Use Chrome DevTools for debugging
- Monitor Firestore usage in Firebase Console
- Test on different screen sizes for responsive design
- Keep Firebase security rules updated

## Deployment

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Hosting)
firebase init

# Build the app
npm run build

# Deploy
firebase deploy
```

### Deploy to Other Platforms

The built app in `dist/` can be deployed to:
- Netlify (drag & drop dist folder)
- Vercel (connect GitHub repo)
- AWS S3 + CloudFront
- Any static hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use for your team!

## Support

For issues or questions:
1. Check the Issues tab on GitHub
2. Review Firebase documentation
3. Check React Konva documentation for canvas issues

## Roadmap

Future enhancements to consider:
- [ ] Route drawing on plays
- [ ] Play categories/tags
- [ ] Team management features
- [ ] Video upload/sync
- [ ] Mobile app version
- [ ] Playbook PDF generation
- [ ] Practice planning tools
- [ ] Player assignment features

---

Built with ❤️ for high school football teams