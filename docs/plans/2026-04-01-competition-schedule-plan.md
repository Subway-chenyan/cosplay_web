# Competition Schedule Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a schedule tab to the competitions page showing active events organized by region and stage, with admin video linking and real-time sync to competition detail pages.

**Architecture:** Backend adds `region`, `stage`, `videos` fields to the existing Event model. New API endpoints expose active events and schedule data. Frontend converts CompetitionsPage into a tabbed layout and adds schedule components with accordion-style region grouping.

**Tech Stack:** Django 4.2 + DRF (backend), React 18 + TypeScript + Tailwind CSS (frontend), Persona 5 UI style.

---

### Task 1: Backend — Add Event model fields and migration

**Files:**
- Modify: `backend/apps/competitions/models.py:61-90`
- Create: `backend/apps/competitions/migrations/0009_event_region_stage_videos.py`

**Step 1: Add fields to Event model**

In `backend/apps/competitions/models.py`, add three new fields to the `Event` class after `promotional_image` (line 74):

```python
region = models.CharField(max_length=100, blank=True, default='', verbose_name='赛区')
stage = models.CharField(
    max_length=20,
    choices=[('preliminary', '初赛'), ('advancing', '复赛'), ('final', '决赛')],
    blank=True,
    default='',
    verbose_name='赛事阶段'
)
videos = models.ManyToManyField(
    'videos.Video',
    blank=True,
    related_name='events',
    verbose_name='关联视频'
)
```

Also add a new index on `region` and `stage` to the `Meta.indexes` list.

**Step 2: Generate migration**

Run: `cd backend && python manage.py makemigrations competitions`
Expected: Creates migration `0009_event_region_stage_videos.py`

**Step 3: Run migration**

Run: `cd backend && python manage.py migrate competitions`
Expected: Migration applied successfully, new columns and M2M table created.

**Step 4: Commit**

```bash
git add backend/apps/competitions/models.py backend/apps/competitions/migrations/
git commit -m "feat: add region, stage, videos fields to Event model"
```

---

### Task 2: Backend — Update serializers

**Files:**
- Modify: `backend/apps/competitions/serializers.py`

**Step 1: Create a minimal video serializer for event embedding**

In `backend/apps/competitions/serializers.py`, add at the top after imports:

```python
class EventVideoSerializer(serializers.ModelSerializer):
    """精简的视频序列化器，用于嵌套在赛事中"""
    class Meta:
        model = Video
        fields = ['id', 'bv_number', 'title', 'url', 'thumbnail']
```

Add import: `from apps.videos.models import Video`

**Step 2: Update EventSerializer**

Update the `EventSerializer.Meta.fields` to include `'region'`, `'stage'`, `'videos'` and add:

```python
videos = EventVideoSerializer(many=True, read_only=True)
stage_display = serializers.CharField(source='get_stage_display', read_only=True)
```

The updated `EventSerializer`:

```python
class EventSerializer(serializers.ModelSerializer):
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    videos = EventVideoSerializer(many=True, read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'start_date', 'end_date', 'competition', 'competition_name',
            'title', 'description', 'contact', 'website', 'promotional_image',
            'region', 'stage', 'stage_display', 'videos',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
```

**Step 3: Verify no syntax errors**

Run: `cd backend && python -c "from apps.competitions.serializers import EventSerializer; print('OK')"`
Expected: `OK`

**Step 4: Commit**

```bash
git add backend/apps/competitions/serializers.py
git commit -m "feat: update EventSerializer with region, stage, videos fields"
```

---

### Task 3: Backend — Add new API endpoints

**Files:**
- Modify: `backend/apps/competitions/views.py`

**Step 1: Add `active` action to EventViewSet**

In `backend/apps/competitions/views.py`, inside `EventViewSet`, add after the `by_date_range` action:

```python
@action(detail=False, methods=['get'])
def active(self, request):
    """获取当前进行中或即将开始的赛事"""
    import datetime as dt
    today = dt.date.today()
    threshold = today - dt.timedelta(days=30)

    events = Event.objects.filter(
        end_date__gte=threshold
    ).select_related('competition').prefetch_related('videos').order_by(
        'competition__name', 'region', 'stage', 'start_date'
    )

    serializer = self.get_serializer(events, many=True)
    return Response(serializer.data)
```

**Step 2: Add `schedule` action to CompetitionViewSet**

Inside `CompetitionViewSet`, add after the `config` action:

```python
@action(detail=True, methods=['get'])
def schedule(self, request, pk=None):
    """获取比赛的完整赛程"""
    competition = self.get_object()
    events = Event.objects.filter(
        competition=competition
    ).select_related('competition').prefetch_related('videos').order_by(
        'region', 'stage', 'start_date'
    )
    serializer = EventSerializer(events, many=True)
    return Response(serializer.data)
```

**Step 3: Add `link_video` action to EventViewSet**

```python
@action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
def link_video(self, request, pk=None):
    """关联视频到赛事"""
    event = self.get_object()
    video_id = request.data.get('video_id')

    if not video_id:
        return Response({'error': '需要提供video_id'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        video = Video.objects.get(id=video_id)
    except Video.DoesNotExist:
        return Response({'error': '视频不存在'}, status=status.HTTP_404_NOT_FOUND)

    event.videos.add(video)
    serializer = self.get_serializer(event)
    return Response(serializer.data)
```

**Step 4: Add `unlink_video` action to EventViewSet**

```python
@action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
def unlink_video(self, request, pk=None):
    """取消关联视频"""
    event = self.get_object()
    video_id = request.data.get('video_id')

    if not video_id:
        return Response({'error': '需要提供video_id'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        video = Video.objects.get(id=video_id)
    except Video.DoesNotExist:
        return Response({'error': '视频不存在'}, status=status.HTTP_404_NOT_FOUND)

    event.videos.remove(video)
    serializer = self.get_serializer(event)
    return Response(serializer.data)
```

**Step 5: Verify endpoints**

Run: `cd backend && python -c "from apps.competitions.views import EventViewSet, CompetitionViewSet; print('OK')"`
Expected: `OK`

**Step 6: Commit**

```bash
git add backend/apps/competitions/views.py
git commit -m "feat: add active, schedule, link_video, unlink_video API endpoints"
```

---

### Task 4: Backend — Update admin

**Files:**
- Modify: `backend/apps/competitions/admin.py`

**Step 1: Update EventAdmin**

Replace the existing `EventAdmin` with:

```python
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """
    赛事信息管理后台
    """
    list_display = ['title', 'competition', 'region', 'stage', 'start_date', 'end_date', 'contact', 'created_at']
    list_filter = ['start_date', 'end_date', 'competition', 'region', 'stage', 'created_at']
    search_fields = ['title', 'description', 'contact', 'region']
    ordering = ['-start_date']
    date_hierarchy = 'start_date'
    filter_horizontal = ['videos']
```

**Step 2: Commit**

```bash
git add backend/apps/competitions/admin.py
git commit -m "feat: add region, stage filters and videos to EventAdmin"
```

---

### Task 5: Frontend — Update TypeScript types

**Files:**
- Modify: `src/types/index.ts:137-151`

**Step 1: Update Event interface**

Replace the `Event` interface in `src/types/index.ts` with:

```typescript
export interface EventVideo {
  id: string
  bv_number: string
  title: string
  url: string
  thumbnail: string
}

export interface Event {
  id: string
  start_date: string
  end_date: string
  competition: string
  competition_name: string
  title: string
  description: string
  contact: string
  website: string
  promotional_image: string
  region: string
  stage: 'preliminary' | 'advancing' | 'final' | ''
  stage_display: string
  videos: EventVideo[]
  created_at: string
  updated_at: string
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add region, stage, videos to Event type"
```

---

### Task 6: Frontend — Update eventService with new API calls

**Files:**
- Modify: `src/services/eventService.ts`

**Step 1: Add new methods**

Add these methods to the `eventService` object:

```typescript
// 获取当前活跃赛事
getActiveEvents: async (): Promise<Event[]> => {
  return await api.get<Event[]>('/competitions/events/active/')
},

// 获取比赛赛程
getCompetitionSchedule: async (competitionId: string): Promise<Event[]> => {
  return await api.get<Event[]>(`/competitions/competitions/${competitionId}/schedule/`)
},

// 关联视频到赛事
linkVideo: async (eventId: string, videoId: string): Promise<Event> => {
  return await api.post<Event>(`/competitions/events/${eventId}/link_video/`, { video_id: videoId })
},

// 取消关联视频
unlinkVideo: async (eventId: string, videoId: string): Promise<Event> => {
  return await api.post<Event>(`/competitions/events/${eventId}/unlink_video/`, { video_id: videoId })
},
```

**Step 2: Commit**

```bash
git add src/services/eventService.ts
git commit -m "feat: add getActiveEvents, schedule, linkVideo, unlinkVideo to eventService"
```

---

### Task 7: Frontend — Create ScheduleTab component

**Files:**
- Create: `src/components/schedule/ScheduleTab.tsx`
- Create: `src/components/schedule/CompetitionSchedule.tsx`
- Create: `src/components/schedule/RegionAccordion.tsx`
- Create: `src/components/schedule/StageGroup.tsx`
- Create: `src/components/schedule/EventCard.tsx`
- Create: `src/components/schedule/VideoLinkModal.tsx`

**Step 1: Create EventCard component**

`src/components/schedule/EventCard.tsx`:

This is the atomic unit — displays a single event with date, location, contact, and linked videos. Persona 5 styled card with black borders and red accents. Shows the event date range, location from description, contact info, and any linked videos (Bilibili embeds or links). Has an optional admin "link video" button.

Key props: `event: Event`, `isAdmin: boolean`, `onLinkVideo?: (eventId: string) => void`, `onUnlinkVideo?: (eventId: string, videoId: string) => void`

**Step 2: Create StageGroup component**

`src/components/schedule/StageGroup.tsx`:

Groups events by stage (初赛/复赛/决赛). Renders a stage header with icon (初赛=swords icon, 复赛=target icon, 决赛=trophy icon) and lists EventCards below.

Key props: `stage: string`, `stageDisplay: string`, `events: Event[]`, `isAdmin: boolean`, `onLinkVideo`, `onUnlinkVideo`

**Step 3: Create RegionAccordion component**

`src/components/schedule/RegionAccordion.tsx`:

An accordion/collapsible panel for a region. Header shows region name and event count. When expanded, groups events by stage using StageGroup.

Key props: `region: string`, `events: Event[]`, `isAdmin: boolean`, `onLinkVideo`, `onUnlinkVideo`, `defaultOpen?: boolean`

Uses Persona 5 style with skewed borders, black/red theme.

**Step 4: Create CompetitionSchedule component**

`src/components/schedule/CompetitionSchedule.tsx`:

Receives an array of events for one competition. Groups events by region, then renders RegionAccordion for each region. If no regions exist, renders events in a flat timeline grouped by stage.

Key props: `competitionName: string`, `events: Event[]`, `isAdmin: boolean`, `onLinkVideo`, `onUnlinkVideo`

**Step 5: Create VideoLinkModal component**

`src/components/schedule/VideoLinkModal.tsx`:

A modal dialog for admins to search and link videos. Has a search input that searches videos by title/BV number. Shows search results as a selectable list. On select, calls `onLink(eventId, videoId)`.

Props: `eventId: string`, `isOpen: boolean`, `onClose: () => void`, `onLink: (eventId: string, videoId: string) => void`

**Step 6: Create ScheduleTab main component**

`src/components/schedule/ScheduleTab.tsx`:

The top-level component for the schedule tab. Fetches active events on mount using `eventService.getActiveEvents()`. Groups events by competition. Renders a competition selector dropdown and CompetitionSchedule for the selected (or all) competition.

Uses Persona 5 styled loading spinner and error handling.

**Step 7: Commit**

```bash
git add src/components/schedule/
git commit -m "feat: create schedule components (ScheduleTab, CompetitionSchedule, RegionAccordion, StageGroup, EventCard, VideoLinkModal)"
```

---

### Task 8: Frontend — Convert CompetitionsPage to tabbed layout

**Files:**
- Modify: `src/pages/CompetitionsPage.tsx`

**Step 1: Add state and imports**

Add imports for `useState` and the new `ScheduleTab` component.

Add state: `const [activeTab, setActiveTab] = useState<'list' | 'schedule'>('list')`

**Step 2: Add tab navigation**

Replace the page title section with a version that includes two tab buttons. Keep the existing Persona 5 styled header but add tab buttons below it:

```tsx
<div className="flex space-x-4 mb-8 transform skew-x-1">
  <button
    onClick={() => setActiveTab('list')}
    className={`px-6 py-2 transform -skew-x-12 font-black uppercase italic transition-all ${activeTab === 'list'
      ? 'bg-p5-red text-white shadow-[4px_4px_0_0_black]'
      : 'bg-gray-100 text-black border-2 border-black hover:bg-black hover:text-white'
    }`}
  >
    <span className="transform skew-x-12 inline-block">比赛列表 / ARCHIVE</span>
  </button>
  <button
    onClick={() => setActiveTab('schedule')}
    className={`px-6 py-2 transform -skew-x-12 font-black uppercase italic transition-all ${activeTab === 'schedule'
      ? 'bg-p5-red text-white shadow-[4px_4px_0_0_black]'
      : 'bg-gray-100 text-black border-2 border-black hover:bg-black hover:text-white'
    }`}
  >
    <span className="transform skew-x-12 inline-block">当前赛程 / LIVE SCHEDULE</span>
  </button>
</div>
```

**Step 3: Conditional rendering**

Wrap the existing content (competition grid + pagination + event calendar) in `{activeTab === 'list' && (...)}`. Add the schedule tab: `{activeTab === 'schedule' && <ScheduleTab />}`.

Move the EventCalendar inside the 'list' tab content.

**Step 4: Commit**

```bash
git add src/pages/CompetitionsPage.tsx
git commit -m "feat: add schedule tab to CompetitionsPage"
```

---

### Task 9: Frontend — Add schedule section to CompetitionDetailPage

**Files:**
- Modify: `src/pages/CompetitionDetailPage.tsx`

**Step 1: Add imports and state**

Import `eventService`, `Event` type, and `CompetitionSchedule` component.

Add state:
```typescript
const [scheduleEvents, setScheduleEvents] = useState<Event[]>([])
const [scheduleLoading, setScheduleLoading] = useState(true)
```

**Step 2: Fetch schedule data**

Add a useEffect that fetches the schedule when `id` is available:

```typescript
useEffect(() => {
  if (id) {
    setScheduleLoading(true)
    eventService.getCompetitionSchedule(id)
      .then(events => setScheduleEvents(events))
      .catch(console.error)
      .finally(() => setScheduleLoading(false))
  }
}, [id])
```

**Step 3: Render schedule section**

Add a schedule section between the header and the filter section. Only show if there are events:

```tsx
{scheduleEvents.length > 0 && (
  <div className="space-y-8">
    <div className="flex items-center space-x-4 transform skew-x-1">
      <div className="bg-p5-red p-3 transform rotate-12 border-2 border-black">
        <Calendar className="w-8 h-8 text-white transform -rotate-12" />
      </div>
      <h2 className="text-xl md:text-3xl font-black text-black uppercase italic border-b-8 border-p5-red">
        SCHEDULE / 赛程时间线
      </h2>
    </div>
    <CompetitionSchedule
      competitionName={competition.name}
      events={scheduleEvents}
      isAdmin={false}
      onLinkVideo={() => {}}
      onUnlinkVideo={() => {}}
    />
  </div>
)}
```

**Step 4: Commit**

```bash
git add src/pages/CompetitionDetailPage.tsx
git commit -m "feat: add schedule section to CompetitionDetailPage"
```

---

### Task 10: Integration — Verify end-to-end

**Step 1: Run Django dev server**

Run: `cd backend && python manage.py runserver`

**Step 2: Test API endpoints with curl**

```bash
# Active events
curl http://localhost:8000/api/competitions/events/active/

# Competition schedule
curl http://localhost:8000/api/competitions/competitions/{competition_id}/schedule/
```

Expected: JSON responses with `region`, `stage`, `stage_display`, and `videos` fields.

**Step 3: Run frontend dev server**

Run: `cd /c/Users/Subway/cosplay_web && npm run dev`

**Step 4: Verify in browser**

1. Navigate to `/competitions` — should see two tabs
2. Click "当前赛程" tab — should show schedule
3. Navigate to a competition detail page — should see schedule section
4. Check EventCalendar still works in the "比赛列表" tab

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete competition schedule module with tabbed UI and video linking"
```
