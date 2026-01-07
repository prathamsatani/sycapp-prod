# Box Cricket Tournament Management System - Design Guidelines

## Design Approach: IPL/Cricbuzz-Inspired Sports Platform

**Primary References**: IPL Official, Cricbuzz, ESPN Cricinfo
**Design Philosophy**: High-energy sports platform with premium feel, data-rich yet visually exciting

---

## Typography System

**Font Families** (via Google Fonts):
- Primary: 'Inter' (400, 500, 600, 700) - UI, body text, data tables
- Accent: 'Bebas Neue' (400) - Large numbers, team names, dramatic headings

**Type Scale**:
- Hero headings: text-6xl to text-8xl (Bebas Neue)
- Section headings: text-3xl to text-4xl (Inter, font-bold)
- Card titles: text-xl (Inter, font-semibold)
- Stats/numbers: text-4xl to text-6xl (Bebas Neue)
- Body text: text-base (Inter, font-normal)
- Labels/captions: text-sm (Inter, font-medium)

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Consistent padding: p-4, p-6, p-8
- Section gaps: space-y-8, space-y-12
- Card spacing: gap-6, gap-8

**Grid Patterns**:
- Player cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Team displays: grid-cols-1 lg:grid-cols-2
- Leaderboard tables: Single column, full-width on mobile
- Live scoring: Two-column split (scorecard + commentary) on desktop

**Container Strategy**:
- Max-width: max-w-7xl for main content
- Full-width sections for hero and live match displays
- Sticky navigation: fixed top-0 w-full z-50

---

## Core Components

### Player Cards (Auction & Display)
- Large format: min-h-96
- Photo: Full-width top section (aspect-ratio: 3/4)
- Gradient overlay on photo bottom for text readability
- Content section: p-6
- Stats display: Grid layout with icon + number pairs
- Base points: Large prominent number (Bebas Neue, text-5xl)

### Auction Screen
- Full-screen layout (min-h-screen)
- Center stage: Single player card (max-w-md mx-auto)
- Bidding controls: Bottom fixed bar with team buttons
- Current bid: Animated number display (text-7xl, Bebas Neue)
- Team budgets: Horizontal scrolling ticker at top
- "Sold/Unsold" banner: Slide-in from top

### Live Scoring Interface
- Split layout: 60% scorecard, 40% ball-by-ball commentary
- Scorecard sections:
  - Current partnership bar (horizontal progress)
  - Batting table: Striped rows, sticky header
  - Bowling figures: Compact grid
  - Fall of wickets: Timeline visualization
- Ball-by-ball: Reverse chronological, runs highlighted with larger typography
- Mobile: Tabs to switch between views

### Points Table
- Responsive table: Horizontal scroll on mobile
- Sticky first column (team names)
- Alternating row treatment
- Highlighted row for user's favorite team
- NRR displayed with +/- indicators

### Registration Form (QR Landing)
- Single column, max-w-2xl centered
- Photo upload: Large dropzone (min-h-64)
- Rating sliders: Custom styled range inputs with real-time number display
- Role selection: Large radio cards with icons
- Submit button: Full-width, prominent (py-4)

### Navigation
- Top bar: Logo left, main nav center, admin login right
- Mobile: Hamburger menu with slide-out drawer
- Active state: Underline indicator
- Sticky on scroll with slight shadow

### Team Dashboard (Admin)
- Card-based grid showing all 12 teams
- Each card: Team name, player count, budget remaining
- Click to expand: Player list accordion
- Action buttons: Edit, View Details (top-right of card)

### Leaderboards (Orange/Purple Cap)
- Top 3: Podium-style display with large photos
- Remaining: List format with rank badges
- Stats: Right-aligned numbers in monospace
- Avatar + name on left

---

## Images

**Hero Section**: Use dynamic cricket action photo (batsman mid-swing or celebration moment). Full-width, min-h-screen with center-aligned content overlay. Buttons with backdrop-blur-md for readability.

**Player Photos**: 
- Auction cards: Portrait orientation, 3:4 ratio
- Leaderboard avatars: Circular crops
- Team rosters: Square thumbnails in grid

**Placeholder Strategy**: Use cricket-themed stock photos from Unsplash (search: "cricket player", "cricket stadium")

---

## Animations (Minimal & Purposeful)

- Auction bid increment: Number count-up animation (0.5s)
- Sold/Unsold reveal: Slide-down banner (0.3s)
- Live score update: Pulse effect on runs (0.2s)
- Card hover: Subtle lift (scale-105, 0.2s transition)
- NO scroll-triggered animations
- NO page transitions beyond basic fades

---

## Accessibility

- All interactive elements: min-h-12 touch targets
- Form inputs: Consistent height (h-12), visible focus rings
- Tables: Proper thead/tbody structure
- Live updates: aria-live regions for score changes
- Image alt text: Player names, descriptive labels

---

## Mobile-First Considerations

- Navigation collapses to hamburger below 768px
- Tables switch to card view on mobile
- Auction controls: Full-width stacked buttons
- Live scoring: Tab-based switching instead of split view
- Touch-friendly spacing: Minimum 12px between interactive elements