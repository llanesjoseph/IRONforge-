# Playbook Scripts

Tools for converting time-based playbook data to the app's slide-based format.

## Workflow

### 1. Build Playbook (Time-based Format)
```bash
npm run playbook:build
```
Generates `playbook.json` with time-based coordinates (t, x, y).

### 2. Convert to Slide Format
```bash
npm run playbook:convert
```
Converts time-based playbook to slide-based format in `playbook-converted.json`.

**Conversion Process:**
- Samples 5 time points to create 5 slides per play
- Converts yards → pixels (6.67 pixels per yard)
- Maps coordinates:
  - Time x (downfield) → App y (inverted: smaller = forward)
  - Time y (lateral) → App x (from center)
  - LOS at y=300px, center at x=340px

### 3. Import to Firestore
```bash
npm run playbook:import <your-user-id> [team-id]
```
Imports converted plays to Firestore (requires authentication).

## Manual Import via Browser

Alternatively, use the browser-based import at `/import` which doesn't require command-line access.

## File Formats

### Time-Based (`playbook.json`)
```json
{
  "name": "Inside Zone Right",
  "qb": {
    "path": [
      {"t": 0, "x": -4, "y": 0},
      {"t": 0.5, "x": -3, "y": 0}
    ]
  },
  "run_paths": {
    "RB": [
      {"t": 0, "x": -6, "y": -3},
      {"t": 0.6, "x": 0, "y": 2}
    ]
  }
}
```

### Slide-Based (`playbook-converted.json`)
```json
{
  "name": "Inside Zone Right",
  "formation": "doubles",
  "slides": [
    {
      "index": 1,
      "positions": [
        {"id": "QB", "label": "QB", "x": 340, "y": 327}
      ],
      "routes": [
        {
          "id": "rb-route",
          "playerId": "RB",
          "points": [
            {"x": 320, "y": 340},
            {"x": 353, "y": 300}
          ]
        }
      ]
    }
  ]
}
```

## Scripts

- `build_playbook.mjs` - Creates time-based playbook data
- `convert-playbook.mjs` - Converts to slide format
- `import-converted-playbook.mjs` - Imports to Firestore
- `import-plays.mjs` - Imports hardcoded template plays

## Coordinate Systems

**Time-Based (Input)**
- x: Yards downfield (negative = behind LOS, positive = forward)
- y: Yards lateral (negative = left, positive = right)
- t: Time in seconds

**App Format (Output)**
- x: Pixels horizontal (340 = center, 0-700 range)
- y: Pixels vertical (300 = LOS, smaller = toward end zone)
- Field: 700x400 pixels (~105 yards × 60 yards)

## Adding New Plays

1. Edit `build_playbook.mjs` to add your play with time-based paths
2. Run `npm run playbook:build`
3. Run `npm run playbook:convert`
4. Import via browser at `/import` or use CLI import script
