"""
Middleware for automatic audit logging.
"""
from .models import AuditLog, AuditAction


class AuditMiddleware:
    """Middleware to automatically log API requests."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Log only authenticated API requests
        if request.user.is_authenticated and request.path.startswith('/api/'):
            # Determine action from HTTP method
            action_map = {
                'GET': AuditAction.READ,
                'POST': AuditAction.CREATE,
                'PUT': AuditAction.UPDATE,
                'PATCH': AuditAction.UPDATE,
                'DELETE': AuditAction.DELETE,
            }
            
            action = action_map.get(request.method, AuditAction.READ)
            
            # Extract resource info from path
            path_parts = request.path.strip('/').split('/')
            resource_type = path_parts[1] if len(path_parts) > 1 else ''
            
            # Log the request
            AuditLog.log(
                action=action,
                user=request.user,
                resource_type=resource_type,
                description=f"{request.method} {request.path}",
                request=request,
                success=200 <= response.status_code < 400
            )
        
        return response

