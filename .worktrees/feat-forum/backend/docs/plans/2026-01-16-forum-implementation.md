# Forum Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement a Persona 5-styled forum with dynamic categories, rich text posting, and nested comments.

**Architecture:** Django backend (App: `forum`) + React frontend (TipTap Editor).

**Tech Stack:** Django 4.2, DRF, React 18, Tailwind CSS, TipTap, Redux Toolkit.

---

### Task 1: Backend - Forum Data Models

**Files:**
- Create: `backend/apps/forum/__init__.py`
- Create: `backend/apps/forum/apps.py`
- Create: `backend/apps/forum/models.py`
- Modify: `backend/cosplay_api/settings.py` (Add 'apps.forum')

**Step 1: Create Django App Structure**

Create directory `backend/apps/forum`.
Create `__init__.py` (empty).
Create `apps.forum.apps.py`:
```python
from django.apps import AppConfig

class ForumConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.forum'
```

**Step 2: Define Models**

In `backend/apps/forum/models.py`:
```python
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ForumCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="CSS class or icon name")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()  # Stores HTML or JSON from TipTap
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_posts')
    category = models.ForeignKey(ForumCategory, on_delete=models.CASCADE, related_name='posts')
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_comments')
    content = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.author} on {self.post}'
```

**Step 3: Register App & Migrate**

Add `'apps.forum'` to `INSTALLED_APPS` in `backend/cosplay_api/settings.py`.
Run: `python manage.py makemigrations forum`
Run: `python manage.py migrate forum`

**Step 4: Commit**
```bash
git add backend/apps/forum/ backend/cosplay_api/settings.py
git commit -m "feat(forum): add forum models and initial migration"
```

---

### Task 2: Backend - API Views & Serializers

**Files:**
- Create: `backend/apps/forum/serializers.py`
- Create: `backend/apps/forum/views.py`
- Create: `backend/apps/forum/urls.py`
- Modify: `backend/cosplay_api/urls.py`

**Step 1: Create Serializers**

In `backend/apps/forum/serializers.py`:
```python
from rest_framework import serializers
from .models import ForumCategory, Post, Comment
from apps.users.serializers import UserSerializer # Assuming UserSerializer exists

class ForumCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ForumCategory
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username') # Or nickname
    author_avatar = serializers.ReadOnlyField(source='author.avatar.url', allow_null=True) # Assuming avatar exists
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_name', 'author_avatar', 'content', 'parent', 'created_at', 'replies']
        read_only_fields = ['author']

    def get_replies(self, obj):
        if obj.replies.exists():
             return CommentSerializer(obj.replies.all(), many=True).data
        return []

class PostListSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    category_name = serializers.ReadOnlyField(source='category.name')
    comment_count = serializers.IntegerField(source='comments.count', read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'title', 'author', 'author_name', 'category', 'category_name', 'view_count', 'comment_count', 'created_at']
        read_only_fields = ['author', 'view_count']

class PostDetailSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_avatar = serializers.ReadOnlyField(source='author.avatar.url', allow_null=True)
    category_name = serializers.ReadOnlyField(source='category.name')
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'author_name', 'author_avatar', 'category', 'category_name', 'view_count', 'created_at', 'updated_at', 'comments']
        read_only_fields = ['author', 'view_count']

    def get_comments(self, obj):
        # Only fetch top-level comments
        qs = obj.comments.filter(parent__isnull=True)
        return CommentSerializer(qs, many=True).data
```

**Step 2: Create Views**

In `backend/apps/forum/views.py`:
```python
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import ForumCategory, Post, Comment
from .serializers import ForumCategorySerializer, PostListSerializer, PostDetailSerializer, CommentSerializer

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ForumCategory.objects.all()
    serializer_class = ForumCategorySerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'view_count']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostListSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        return super().retrieve(request, *args, **kwargs)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.filter(is_active=True)
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
```

**Step 3: Setup URLs**

In `backend/apps/forum/urls.py`:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, PostViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

Add `path('api/forum/', include('apps.forum.urls')),` to `backend/cosplay_api/urls.py`.

**Step 4: Commit**
```bash
git add backend/apps/forum/ backend/cosplay_api/urls.py
git commit -m "feat(forum): add api views and serializers"
```

---

### Task 3: Frontend - API Integration (RTK Query)

**Files:**
- Create: `src/services/forumApi.ts`
- Modify: `src/store/index.ts` (Add forumApi reducer)

**Step 1: Create API Service**

In `src/services/forumApi.ts`:
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

// Define TS interfaces for Post, Comment, Category...

export const forumApi = createApi({
  reducerPath: 'forumApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/forum/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Post', 'Category', 'Comment'],
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => 'categories/',
      providesTags: ['Category'],
    }),
    getPosts: builder.query<Post[], { category?: number }>({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg.category) params.append('category', arg.category.toString());
        return `posts/?${params.toString()}`;
      },
      providesTags: ['Post'],
    }),
    getPost: builder.query<PostDetail, string>({
      query: (id) => `posts/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    createPost: builder.mutation<Post, Partial<Post>>({
      query: (body) => ({
        url: 'posts/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Post'],
    }),
    createComment: builder.mutation<Comment, Partial<Comment>>({
      query: (body) => ({
        url: 'comments/',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { post }) => [{ type: 'Post', id: post }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useCreateCommentMutation,
} = forumApi;
```

**Step 2: Register Reducer**

In `src/store/index.ts`:
Import `forumApi`.
Add `[forumApi.reducerPath]: forumApi.reducer` to reducer object.
Add `forumApi.middleware` to middleware array.

**Step 3: Commit**
```bash
git add src/services/forumApi.ts src/store/index.ts
git commit -m "feat(forum): add frontend api integration"
```

---

### Task 4: Frontend - Editor Component (TipTap)

**Files:**
- Create: `src/components/Forum/Editor/P5Editor.tsx`
- Create: `src/components/Forum/Editor/MenuBar.tsx`

**Step 1: Install Dependencies**
`npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image`

**Step 2: Create MenuBar**
Implement a toolbar with P5 styling (red/black buttons).

**Step 3: Create Editor**
Implement `P5Editor` using `useEditor`.
Add `p5-comic-box` class to the editor content area.

**Step 4: Commit**
```bash
git add src/components/Forum/Editor/ package.json
git commit -m "feat(forum): add tiptap editor component"
```

---

### Task 5: Frontend - Pages & Routing

**Files:**
- Create: `src/pages/Forum/ForumHome.tsx`
- Create: `src/pages/Forum/ForumPostDetail.tsx`
- Create: `src/pages/Forum/NewPost.tsx`
- Modify: `src/App.tsx` (Add routes)

**Step 1: Create Pages**
- `ForumHome`: Left sidebar for categories (using `useGetCategoriesQuery`), main area for post list (`useGetPostsQuery`).
- `ForumPostDetail`: Display content using TipTap's `EditorContent` in read-only mode. List comments below.
- `NewPost`: Form with `P5Editor` to submit new post.

**Step 2: Add Routes**
Add `/forum`, `/forum/new`, `/forum/post/:id` to `App.tsx`.

**Step 3: Commit**
```bash
git add src/pages/Forum/ src/App.tsx
git commit -m "feat(forum): add forum pages and routing"
```
