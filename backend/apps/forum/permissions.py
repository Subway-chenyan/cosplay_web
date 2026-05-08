from rest_framework import permissions


MODERATOR_ROLES = {'admin', 'editor'}


def user_role(user):
    return getattr(user, 'role', None)


def is_moderator(user):
    return bool(user and user.is_authenticated and user_role(user) in MODERATOR_ROLES)


def can_contribute(user):
    return bool(user and user.is_authenticated)


class ForumPostPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if view.action in {'moderate', 'hide', 'restore'}:
            return is_moderator(request.user)
        return can_contribute(request.user)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if is_moderator(request.user):
            return True
        return obj.author_id == request.user.id and not obj.is_locked


class ForumCommentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return can_contribute(request.user)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if is_moderator(request.user):
            return True
        return obj.author_id == request.user.id and not obj.post.is_locked


class IsForumModerator(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_moderator(request.user)
