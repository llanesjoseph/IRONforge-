# Football Play Designer - Feature Documentation

## Overview
This document describes the three major features implemented in the Football Play Designer application.

---

## Feature 1: Snap to Line of Scrimmage (LOS)

### Description
The "Snap to LOS" feature automatically aligns offensive players to their proper positions relative to the Line of Scrimmage with a single click.

### How It Works
- **Button Location**: Located in the toolbar next to "Mirror L/R" and "Flip Field" buttons
- **Functionality**:
  - Automatically positions offensive linemen (LT, LG, C, RG, RT) at y=300 (the LOS)
  - Positions the QB 40 pixels behind the line (y=340)
  - Maintains all x-positions (horizontal spacing)
  - Applies snap-to-grid for clean alignment
  - Works across all slides simultaneously

### Usage
1. Click the "Snap to LOS" button in the play editor
2. All offensive line players will align to the LOS
3. The QB will be positioned appropriately behind the center
4. Changes are automatically saved to Firestore

### Technical Implementation
- Function: `snapToLOS()` in `src/lib/formations.ts`
- Integration: Play editor at `src/pages/play/[id].tsx`

---

## Feature 2: Dynamic Slides (Add/Remove)

### Description
Removes the fixed 3-slide limitation and allows users to dynamically add or remove slides for more complex play progressions.

### Key Features
- **Add Slides**: Create up to 10 slides per play
- **Delete Slides**: Remove unnecessary slides (minimum 1 slide required)
- **Smart Copying**: New slides copy positions from the previous slide
- **Dynamic Numbering**: Slides automatically renumber when deleted

### How to Use

#### Adding a Slide:
1. Click the green "+ Add Slide" button
2. A new slide is created with positions copied from the last slide
3. The new slide becomes active automatically

#### Deleting a Slide:
1. Navigate to the slide you want to delete
2. Click the red "Delete Slide" button
3. Confirm the deletion in the popup
4. The slides will renumber automatically

### Limitations
- Minimum: 1 slide (cannot delete the last slide)
- Maximum: 10 slides per play

### Technical Details
- Updated `Slide` type to use `index: number` instead of fixed `1|2|3`
- Enhanced `SlideControls` component with add/delete functionality
- Updated Firestore schema to support variable slide counts

---

## Feature 3: AI Integration for Play Design

### Description
Powerful AI assistant that helps coaches design better plays using Claude AI's football expertise.

### AI Capabilities

#### 1. Suggest Formation
- **Purpose**: Get AI-recommended formations based on game situation
- **Input**: Down, distance, field position, score
- **Output**: Complete formation with player positions and strategic reasoning
- **Example**: "3rd and long at midfield" → Suggests spread formation for passing

#### 2. Generate Routes
- **Purpose**: Create effective route combinations for receivers
- **Input**: Available receivers and defensive scheme
- **Output**: Route paths for each eligible receiver
- **Features**:
  - Creates spacing and leverage
  - Attacks different levels of defense
  - Includes checkdown options

#### 3. Analyze Play
- **Purpose**: Get expert feedback on your play design
- **Output**:
  - Overall rating (1-10 scale)
  - Strengths of the play
  - Potential weaknesses
  - Improvement suggestions
- **Analysis Covers**:
  - Formation balance and spacing
  - Route combinations and timing
  - Strategic effectiveness

#### 4. Name This Play
- **Purpose**: Generate creative, memorable play names
- **Output**: 5 suggested names
- **Naming Criteria**:
  - Easy to call in huddle
  - 1-3 words maximum
  - Can reference formation or key concept
  - May include colors, animals, cities, or action words

#### 5. Create Variation
- **Purpose**: Generate alternative versions of current play
- **Types**:
  - **Motion**: Add pre-snap movement
  - **Formation**: Adjust player alignment
  - **Personnel**: Change player groupings
- **Output**: Complete new slide with adjusted positions

### How to Use the AI Assistant

1. **Access**: Click the purple "🤖 AI Assistant" button (bottom-right corner)
2. **Configure Game Context** (for formations):
   - Set down and distance
   - Enter field position
   - Update score if relevant
3. **Select AI Feature**:
   - Click the desired AI capability button
   - Wait for AI processing (loading spinner)
   - Review the suggestion
4. **Apply Suggestions**:
   - Click "Apply" buttons to accept AI recommendations
   - Changes are automatically saved

### Setup Requirements

#### API Key Configuration:
1. Get an Anthropic API key from https://console.anthropic.com/
2. Add to `.env.local`:
```
VITE_ANTHROPIC_API_KEY=your_key_here
```

### AI Service Architecture
- **Service**: `src/lib/ai.ts`
- **UI Component**: `src/components/AIAssistant.tsx`
- **Model**: Claude 3 Haiku (fast, cost-effective)
- **Integration**: Floating panel in play editor

### Error Handling
- Displays user-friendly error messages
- Falls back gracefully if API is unavailable
- Shows loading states during processing

### Limitations
- Requires valid Anthropic API key
- Internet connection required
- API rate limits apply
- Suggestions should be reviewed by coaches

---

## Integration Notes

### All Features Work Together
- **Snap to LOS** works across all dynamic slides
- **AI Assistant** can analyze plays with any number of slides
- **Dynamic Slides** enhance AI variations and progressions

### Performance Considerations
- All operations include auto-save to Firestore
- Optimistic UI updates for responsive feel
- Loading states prevent duplicate operations

### Security
- AI API key stored in environment variables
- Firebase security rules protect play data
- Only play creators can edit their plays

---

## Testing Checklist

### Feature 1: Snap to LOS
- [ ] Button appears for users with edit permissions
- [ ] Offensive line aligns to y=300
- [ ] QB positions at y=340
- [ ] X-positions remain unchanged
- [ ] Changes save to Firestore
- [ ] Works on all slides

### Feature 2: Dynamic Slides
- [ ] Can add slides up to 10
- [ ] Cannot add beyond 10 slides
- [ ] Can delete slides down to 1
- [ ] Cannot delete last slide
- [ ] New slides copy previous positions
- [ ] Slides renumber after deletion
- [ ] Navigation works with dynamic count

### Feature 3: AI Integration
- [ ] AI Assistant button appears for editors
- [ ] Panel opens/closes properly
- [ ] Formation suggestions work with game context
- [ ] Route generation creates valid paths
- [ ] Play analysis provides meaningful feedback
- [ ] Name suggestions are creative and appropriate
- [ ] Variations maintain field boundaries
- [ ] Error messages display for API issues
- [ ] Loading states show during processing

---

## Next Steps & Enhancements

### Potential Improvements:
1. **AI Enhancements**:
   - Add defensive formation recognition
   - Suggest blocking schemes
   - Generate full play sequences
   - Export AI analysis as PDF report

2. **Slide Features**:
   - Slide templates/presets
   - Copy/paste slides
   - Reorder slides via drag-and-drop
   - Slide transition animations

3. **Formation Features**:
   - Save custom formations as templates
   - Formation library with categories
   - Auto-spacing algorithms
   - Formation comparison tools

4. **Advanced AI**:
   - Voice commands for play creation
   - Real-time play suggestions during games
   - Historical play analysis
   - Team-specific play recommendations