"""
Core views for health checks and monitoring.
"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import time


def health_check(request):
    """
    Health check endpoint for load balancer.
    Returns 200 if all services are healthy, 503 otherwise.
    """
    start_time = time.time()
    health_status = {
        'status': 'healthy',
        'timestamp': int(time.time()),
        'checks': {}
    }
    
    # Check Database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            health_status['checks']['database'] = {
                'status': 'ok' if result else 'error',
                'latency_ms': round((time.time() - start_time) * 1000, 2)
            }
    except Exception as e:
        health_status['checks']['database'] = {
            'status': 'error',
            'error': str(e)
        }
        health_status['status'] = 'unhealthy'
    
    # Check Redis Cache
    try:
        cache_start = time.time()
        cache.set('health_check', 'ok', 1)
        cache_value = cache.get('health_check')
        health_status['checks']['cache'] = {
            'status': 'ok' if cache_value == 'ok' else 'error',
            'latency_ms': round((time.time() - cache_start) * 1000, 2)
        }
    except Exception as e:
        health_status['checks']['cache'] = {
            'status': 'error',
            'error': str(e)
        }
        health_status['status'] = 'unhealthy'
    
    # Total response time
    health_status['response_time_ms'] = round((time.time() - start_time) * 1000, 2)
    
    status_code = 200 if health_status['status'] == 'healthy' else 503
    return JsonResponse(health_status, status=status_code)


def readiness_check(request):
    """
    Readiness check for Kubernetes/ECS.
    Returns 200 when service is ready to accept traffic.
    """
    try:
        # Quick database check
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'ready',
            'timestamp': int(time.time())
        })
    except Exception as e:
        return JsonResponse({
            'status': 'not_ready',
            'error': str(e)
        }, status=503)


def liveness_check(request):
    """
    Liveness check for Kubernetes/ECS.
    Returns 200 if application is alive (doesn't check dependencies).
    """
    return JsonResponse({
        'status': 'alive',
        'timestamp': int(time.time())
    })

