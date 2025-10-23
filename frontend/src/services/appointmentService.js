/**
 * Service for managing appointments
 */
import apiClient from './apiClient'

class AppointmentService {
  /**
   * Get available time slots for a notary
   * @param {string} notaryId - Notary UUID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {number} duration - Duration in minutes (default: 30)
   * @param {string} excludeAppointmentId - ID dell'appuntamento da escludere dal calcolo (opzionale)
   * @returns {Promise} Available slots
   */
  async getAvailableSlots(notaryId, startDate, endDate, duration = 30, excludeAppointmentId = null) {
    try {
      let url = `/notaries/${notaryId}/slots/?start_date=${startDate}&end_date=${endDate}&duration=${duration}`
      
      // Se stiamo modificando un appuntamento, escludi il suo slot dal calcolo
      if (excludeAppointmentId) {
        url += `&exclude_appointment_id=${excludeAppointmentId}`
      }
      
      const response = await apiClient.request(url, { method: 'GET' })
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Book a new appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise} Created appointment
   */
  async createAppointment(appointmentData) {
    try {
      const response = await apiClient.request('/notaries/appointments/create/', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
      })
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get list of appointments
   * @param {Object} filters - Filters (status, appointment_type, etc.)
   * @returns {Promise} List of appointments
   */
  async getAppointments(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const url = `/notaries/appointments/${queryParams ? '?' + queryParams : ''}`
      
      const response = await apiClient.request(url, { method: 'GET' })
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get appointments for current notary
   * @returns {Promise} List of notary's appointments
   */
  async getNotaryAppointments() {
    try {
      const response = await apiClient.request('/appointments/gestione-appuntamenti/', { method: 'GET' })
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get appointment details
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise} Appointment details
   */
  async getAppointment(appointmentId) {
    try {
      const response = await apiClient.request(`/notaries/appointments/${appointmentId}/`, {
        method: 'GET'
      })
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Update appointment (for notary: change status; for client: cancel only)
   * @param {string} appointmentId - Appointment UUID
   * @param {Object} updates - Updates to apply
   * @returns {Promise} Updated appointment
   */
  async updateAppointment(appointmentId, updates) {
    try {
      const response = await apiClient.request(`/notaries/appointments/${appointmentId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Accept an appointment (notary only)
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise} Updated appointment
   */
  async acceptAppointment(appointmentId) {
    try {
      const response = await apiClient.request(`/notaries/appointments/${appointmentId}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action: 'accept' })
      })
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Reject an appointment (notary only)
   * @param {string} appointmentId - Appointment UUID
   * @param {string} reason - Rejection reason
   * @returns {Promise} Updated appointment
   */
  async rejectAppointment(appointmentId, reason = '') {
    try {
      const response = await apiClient.request(`/notaries/appointments/${appointmentId}/action/`, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'reject',
          rejection_reason: reason
        })
      })
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Cancel an appointment (client only)
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise} Updated appointment
   */
  async cancelAppointment(appointmentId) {
    return this.updateAppointment(appointmentId, { status: 'cancelled' })
  }
}

export default new AppointmentService()

