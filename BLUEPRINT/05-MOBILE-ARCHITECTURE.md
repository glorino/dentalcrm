# SupportFlow AI — Mobile Application Architecture

> React Native Expo with Expo Router, Zustand, and Pusher Realtime

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                 REACT NATIVE EXPO APPLICATION                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    LAYER ARCHITECTURE                     │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │  PRESENTATION LAYER                               │   │    │
│  │  │  ├── Screens (Expo Router)                       │   │    │
│  │  │  ├── Components (React Native Paper + Custom)    │   │    │
│  │  │  └── Navigation (Expo Router tabs + stacks)      │   │    │
│  │  └──────────────────────────────────────────────────┘   │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │  STATE LAYER                                      │   │    │
│  │  │  ├── Zustand Stores (client state)               │   │    │
│  │  │  ├── React Query (server state caching)          │   │    │
│  │  │  └── AsyncStorage (persistence)                  │   │    │
│  │  └──────────────────────────────────────────────────┘   │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │  SERVICE LAYER                                    │   │    │
│  │  │  ├── API Client (fetch + auth interceptor)       │   │    │
│  │  │  ├── Pusher Service (realtime)                   │   │    │
│  │  │  ├── Notification Service (push notifications)   │   │    │
│  │  │  └── Storage Service (AsyncStorage + SecureStore)│   │    │
│  │  └──────────────────────────────────────────────────┘   │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │  PLATFORM LAYER                                   │   │    │
│  │  │  ├── Expo Router (navigation)                    │   │    │
│  │  │  ├── Expo Notifications (push)                   │   │    │
│  │  │  ├── Expo SecureStore (secrets)                  │   │    │
│  │  │  ├── Expo Image Picker (attachments)            │   │    │
│  │  │  └── Expo Camera (barcode scanning)             │   │    │
│  │  └──────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Navigation Architecture

```
Expo Router File-Based Routing:
├── _layout.tsx                    # Root layout (providers, splash)
├── (auth)/
│   ├── _layout.tsx                # Auth stack (no tabs)
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── (tabs)/
│   ├── _layout.tsx                # Tab bar layout
│   ├── dashboard/index.tsx        # Tab 1: Dashboard
│   ├── tickets/
│   │   ├── index.tsx              # Tab 2: Ticket list
│   │   └── [id].tsx               # Ticket detail (push stack)
│   ├── customers/
│   │   ├── index.tsx              # Tab 3: Customer list
│   │   └── [id].tsx               # Customer detail (push stack)
│   ├── messages/index.tsx         # Tab 4: Unified inbox
│   └── more/index.tsx             # Tab 5: More menu
└── (+)/
    ├── create-ticket.tsx          # Modal: Create ticket
    ├── settings.tsx               # Modal: Settings
    └── scan-barcode.tsx           # Modal: Barcode scan
```

---

## 3. Screen Architecture

### 3.1 Dashboard Screen

```
Dashboard Screen (tabs/dashboard/index.tsx)
├── ScrollView (pull-to-refresh)
│   ├── WelcomeHeader
│   │   ├── "Good morning, {name}"
│   │   └── Date
│   │
│   ├── StatCards (horizontal scroll)
│   │   ├── Open Tickets
│   │   ├── My Assigned
│   │   ├── Avg Response
│   │   └── CSAT Score
│   │
│   ├── QuickActions
│   │   ├── Create Ticket
│   │   ├── View Escalations
│   │   └── Knowledge Search
│   │
│   ├── MyTicketsSection
│   │   ├── "Assigned to Me" header
│   │   └── TicketList (top 5)
│   │
│   ├── SLAAlertsSection
│   │   ├── "SLA at Risk" header
│   │   └── AlertList (breaching soon)
│   │
│   └── RecentActivity
│       └── ActivityFeed (last 10 events)
```

### 3.2 Ticket List Screen

```
Ticket List Screen (tabs/tickets/index.tsx)
├── Header
│   ├── "Tickets" title
│   ├── Filter button (opens filter sheet)
│   └── Search toggle
│
├── FilterBar (horizontal scroll chips)
│   ├── All
│   ├── Open
│   ├── My Assigned
│   ├── Escalated
│   └── Priority filters
│
├── TicketList (FlatList, virtualized)
│   ├── TicketListItem
│   │   ├── Ticket number (#1234)
│   │   ├── Subject (truncated)
│   │   ├── Customer name + avatar
│   │   ├── Status badge (color-coded)
│   │   ├── Priority indicator
│   │   ├── Channel icon
│   │   ├── SLA countdown
│   │   └── Time ago
│   │
│   └── Pull-to-refresh + Infinite scroll
│
└── FilterSheet (BottomSheet)
    ├── Status multi-select
    ├── Priority multi-select
    ├── Channel multi-select
    ├── Team/Agent select
    ├── Date range
    └── Apply/Reset buttons
```

### 3.3 Ticket Detail Screen

```
Ticket Detail Screen (tabs/tickets/[id].tsx)
├── Header
│   ├── Back button
│   ├── Ticket number
│   ├── Status badge
│   └── More menu (assign, close, merge)
│
├── ConversationView (SectionList)
│   ├── MessageGroup (by date)
│   │   └── MessageBubble
│   │       ├── Avatar
│   │       ├── Sender name
│   │       ├── Message content
│   │       ├── Attachments (if any)
│   │       ├── Timestamp
│   │       └── AI badge (if AI-generated)
│   │
│   └── TypingIndicator (realtime)
│
├── ContextPanel (BottomSheet or swipeable)
│   ├── CustomerInfo
│   │   ├── Name + avatar
│   │   ├── Email/phone
│   │   └── Ticket history count
│   │
│   ├── TicketProperties
│   │   ├── Status (dropdown)
│   │   ├── Priority (dropdown)
│   │   ├── Assignee (search)
│   │   └── Tags
│   │
│   ├── SLAStatus
│   │   ├── First response timer
│   │   └── Resolution timer
│   │
│   └── AICopilot
│       ├── Suggested replies
│       └── Related articles
│
└── MessageInput (fixed bottom)
    ├── TextInput (multiline, auto-grow)
    ├── Attach button (image/file)
    ├── AI assist button
    ├── Internal note toggle
    └── Send button
```

### 3.4 Customer Detail Screen

```
Customer Detail Screen (tabs/customers/[id].tsx)
├── Header
│   ├── Back button
│   ├── Customer name
│   └── More menu
│
├── CustomerProfile
│   ├── Avatar (large)
│   ├── Name
│   ├── Email (tap to email)
│   ├── Phone (tap to call)
│   ├── Company
│   ├── Segment badge
│   └── Lifecycle stage
│
├── StatsRow
│   ├── Total tickets
│   ├── Avg satisfaction
│   ├── Lifetime value
│   └── Last contact
│
├── Tabs
│   ├── Tickets tab (customer's tickets)
│   ├── Activity tab (timeline)
│   ├── Notes tab (internal notes)
│   └── Custom fields tab
│
└── Actions
    ├── Create ticket
    ├── Send email
    └── Edit customer
```

### 3.5 Unified Inbox Screen

```
Unified Inbox Screen (tabs/messages/index.tsx)
├── Header
│   ├── "Messages" title
│   └── Filter by channel
│
├── ChannelFilter (horizontal chips)
│   ├── All
│   ├── WhatsApp
│   ├── Email
│   ├── SMS
│   ├── Messenger
│   └── Instagram
│
├── ConversationList (FlatList)
│   ├── ConversationItem
│   │   ├── Channel icon
│   │   ├── Customer avatar
│   │   ├── Customer name
│   │   ├── Last message preview
│   │   ├── Timestamp
│   │   ├── Unread badge
│   │   └── SLA indicator
│   │
│   └── Pull-to-refresh
│
└── Tap → Navigate to ticket detail
```

---

## 4. Realtime Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE REALTIME                               │
│                                                                  │
│  Pusher Connection:                                            │
│  ├── Auto-connect on app launch                                │
│  ├── Reconnect on network change                               │
│  ├── Background: disconnect (save battery)                     │
│  └── Foreground: reconnect                                     │
│                                                                  │
│  Subscriptions:                                                │
│  ├── private-user.{userId}         (personal events)          │
│  ├── private-ticket.{ticketId}     (per-ticket updates)       │
│  └── presence-team.{teamId}        (team availability)        │
│                                                                  │
│  Event Handling:                                               │
│  ├── message.new → Update conversation, show local notification│
│  ├── ticket.updated → Refresh ticket in list                   │
│  ├── ticket.assigned → Update assigned count badge             │
│  ├── sla.warning → Show push notification                      │
│  └── notification.new → Update notification badge              │
│                                                                  │
│  Offline Strategy:                                             │
│  ├── Cache last 50 tickets in AsyncStorage                    │
│  ├── Queue outbound messages when offline                      │
│  ├── Sync on reconnect                                         │
│  └── Show "offline" banner                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Push Notifications

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUSH NOTIFICATION FLOW                        │
│                                                                  │
│  Registration:                                                 │
│  ├── App launch → Check permission                            │
│  ├── Request permission (if not granted)                       │
│  ├── Get Expo Push Token                                       │
│  ├── Register token with backend (Server Action)              │
│  └── Store token in user_devices table                        │
│                                                                  │
│  Notification Types:                                           │
│  ├── ticket_assigned     → "New ticket #1234 assigned to you" │
│  ├── sla_warning         → "Ticket #1234 SLA breaching in 15m"│
│  ├── message_received    → "New message from John Doe"         │
│  ├── escalation          → "Ticket #1234 escalated to you"    │
│  └── mention             → "Sarah mentioned you in #1234"     │
│                                                                  │
│  Deep Linking:                                                  │
│  ├── Tap notification → Open relevant screen                   │
│  ├── ticket_assigned → /tickets/[id]                          │
│  ├── message_received → /tickets/[id]                         │
│  └── escalation → /tickets/[id]                               │
│                                                                  │
│  Quiet Hours:                                                   │
│  ├── Respect user's quiet hours setting                       │
│  ├── Override for urgent/escalated tickets                     │
│  └── Channel-specific settings                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Offline Support

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE STRATEGY                              │
│                                                                  │
│  Data Caching (AsyncStorage):                                  │
│  ├── Ticket list (last viewed, 50 items)                      │
│  ├── Ticket detail (last viewed, 10 tickets)                  │
│  ├── Customer list (last viewed, 50 items)                    │
│  ├── User profile                                             │
│  └── App settings                                             │
│                                                                  │
│  Offline Queue:                                                │
│  ├── Message sends (queued, synced on reconnect)              │
│  ├── Status changes (queued, synced on reconnect)             │
│  └── Note additions (queued, synced on reconnect)             │
│                                                                  │
│  Conflict Resolution:                                          │
│  ├── Last-write-wars for simple fields                        │
│  ├── Server-authoritative for critical data                   │
│  └── Merge strategy for concurrent edits                      │
│                                                                  │
│  UI Indicators:                                                │
│  ├── "Offline" banner (top of screen)                         │
│  ├── "Queued" badge on pending messages                       │
│  ├── "Syncing..." indicator on reconnect                      │
│  └── "Sync failed" retry prompt                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE PERFORMANCE                            │
│                                                                  │
│  Rendering:                                                    │
│  ├── FlatList with getItemLayout (fixed height items)          │
│  ├── WindowSize={5} for virtualization                         │
│  ├── React.memo for expensive components                       │
│  ├── useMemo/useCallback for stable references                 │
│  └── Avoid inline functions in lists                           │
│                                                                  │
│  Data:                                                         │
│  ├── React Query for server state caching                      │
│  ├── Stale-while-revalidate pattern                            │
│  ├── Prefetch next page on scroll                              │
│  └── Optimistic updates for mutations                          │
│                                                                  │
│  Images:                                                       │
│  ├── expo-image (fast image loading)                           │
│  ├── Progressive loading with placeholders                     │
│  ├── Thumbnail generation                                      │
│  └── Lazy loading for offscreen images                         │
│                                                                  │
│  Network:                                                      │
│  ├── Request deduplication                                     │
│  ├── Batch API calls                                           │
│  ├── Compress payloads                                         │
│  └── Use ETags for cache validation                           │
│                                                                  │
│  Target Metrics:                                               │
│  ├── Time to Interactive: < 2s                                │
│  ├── Frame rate: 60fps                                         │
│  ├── Memory usage: < 150MB                                     │
│  └── App size: < 30MB                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Build & Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                    EAS BUILD CONFIGURATION                       │
│                                                                  │
│  Development Build:                                            │
│  ├── eas build --profile development --platform ios            │
│  ├── eas build --profile development --platform android        │
│  └── Expo Dev Client for development                          │
│                                                                  │
│  Preview Build:                                                │
│  ├── eas build --profile preview --platform ios               │
│  ├── Internal distribution (TestFlight, Play Console)          │
│  └── OTA updates for JS bundle                                │
│                                                                  │
│  Production Build:                                             │
│  ├── eas build --profile production --platform ios            │
│  ├── eas build --profile production --platform android        │
│  ├── App Store submission                                     │
│  └── Play Store submission                                    │
│                                                                  │
│  OTA Updates:                                                   │
│  ├── eas update --branch production                           │
│  ├── JS bundle updates without app store review               │
│  └── Rollback capability                                       │
│                                                                  │
│  Environment Config:                                           │
│  ├── Development → API: dev.supportflow.ai                    │
│  ├── Preview → API: preview.supportflow.ai                    │
│  └── Production → API: api.supportflow.ai                     │
└─────────────────────────────────────────────────────────────────┘
```
