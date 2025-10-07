"""
Gunicorn configuration for Sportello Notai.
Optimized for production deployment.
"""
import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '8001')}"
backlog = 2048

# Worker processes
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'gevent'  # Async workers for better concurrency
worker_connections = 1000
max_requests = 10000  # Restart worker after N requests (prevent memory leaks)
max_requests_jitter = 1000  # Add randomness to prevent all workers restarting at once
timeout = 30
keepalive = 5

# Worker processes management
preload_app = True  # Load application before forking workers (faster startup)
daemon = False
pidfile = '/tmp/gunicorn.pid'

# Logging
accesslog = '-'  # stdout
errorlog = '-'  # stderr
loglevel = os.getenv('LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'sportello-notai'

# Server mechanics
forwarded_allow_ips = '*'  # Trust all proxies (ALB/CloudFront)
proxy_allow_from = '*'

# SSL (if terminating SSL at application level)
# keyfile = '/path/to/key.pem'
# certfile = '/path/to/cert.pem'


def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info("Sportello Notai backend starting...")


def on_reload(server):
    """Called when configuration changes."""
    server.log.info("Reloading configuration...")


def when_ready(server):
    """Called when server is ready to accept connections."""
    server.log.info(f"Server ready. Workers: {workers}, Connections: {worker_connections}")


def worker_int(worker):
    """Called when worker receives INT/QUIT signal."""
    worker.log.info("Worker shutting down...")


def worker_exit(server, worker):
    """Called when worker exits."""
    server.log.info(f"Worker {worker.pid} exited")

