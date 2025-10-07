"""
Locust load testing script for Sportello Notai API.

Run with:
    locust -f locustfile.py --host http://localhost:8001
    
Then open http://localhost:8089 in browser.
"""
from locust import HttpUser, task, between
import random


class SportelloNotaiUser(HttpUser):
    """Simulates a user of the Sportello Notai platform."""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Called when a simulated user starts."""
        # Login to get auth token
        response = self.client.post("/api/auth/login/", json={
            "email": "test@example.com",
            "password": "testpassword123456"
        }, name="/api/auth/login")
        
        if response.status_code == 200:
            self.token = response.json().get("access")
        else:
            # If login fails, use mock token for load testing
            self.token = "mock-token-for-testing"
    
    @task(5)
    def list_notaries(self):
        """List notaries (most frequent action)."""
        self.client.get("/api/notaries/", headers={
            "Authorization": f"Bearer {self.token}"
        }, name="/api/notaries/")
    
    @task(3)
    def list_notaries_with_filters(self):
        """List notaries with filters."""
        cities = ["Milano", "Roma", "Napoli", "Torino"]
        city = random.choice(cities)
        
        self.client.get(f"/api/notaries/?city={city}", headers={
            "Authorization": f"Bearer {self.token}"
        }, name="/api/notaries/?city=*")
    
    @task(4)
    def list_acts(self):
        """List acts."""
        self.client.get("/api/acts/", headers={
            "Authorization": f"Bearer {self.token}"
        }, name="/api/acts/")
    
    @task(2)
    def get_notary_detail(self):
        """Get notary detail (less frequent)."""
        # Simulate getting a random notary ID
        notary_id = "123e4567-e89b-12d3-a456-426614174000"
        
        self.client.get(f"/api/notaries/{notary_id}/", headers={
            "Authorization": f"Bearer {self.token}"
        }, name="/api/notaries/{id}/")
    
    @task(2)
    def list_appointments(self):
        """List appointments."""
        self.client.get("/api/appointments/", headers={
            "Authorization": f"Bearer {self.token}"
        }, name="/api/appointments/")
    
    @task(1)
    def list_reviews(self):
        """List reviews."""
        self.client.get("/api/reviews/", headers={
            "Authorization": f"Bearer {self.token}"
        }, name="/api/reviews/")
    
    @task(1)
    def health_check(self):
        """Health check (for monitoring)."""
        self.client.get("/health/", name="/health/")


class AdminUser(HttpUser):
    """Simulates an admin user with heavier operations."""
    
    wait_time = between(2, 5)
    
    def on_start(self):
        """Admin login."""
        response = self.client.post("/api/auth/login/", json={
            "email": "admin@example.com",
            "password": "adminpassword123456"
        }, name="/api/auth/login (admin)")
        
        if response.status_code == 200:
            self.token = response.json().get("access")
        else:
            self.token = "mock-admin-token"
    
    @task(3)
    def view_audit_logs(self):
        """View audit logs."""
        self.client.get("/api/audit/logs/", headers={
            "Authorization": f"Bearer {self.token}"
        }, name="/api/audit/logs/")
    
    @task(2)
    def view_acts(self):
        """View all acts."""
        self.client.get("/api/acts/", headers={
            "Authorization": f"Bearer {self.token}"
        }, name="/api/acts/ (admin)")
    
    @task(1)
    def view_documents(self):
        """View documents for an act."""
        act_id = "123e4567-e89b-12d3-a456-426614174001"
        
        self.client.get(f"/api/documents/acts/{act_id}/documents/", headers={
            "Authorization": f"Bearer {self.token}"
        }, name="/api/documents/acts/{id}/documents/")

