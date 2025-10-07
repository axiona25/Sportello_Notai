from django.urls import path
from .views import AppointmentListCreateView, AppointmentDetailView

urlpatterns = [
    path('', AppointmentListCreateView.as_view(), name='appointment-list'),
    path('<uuid:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
]

