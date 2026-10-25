/**
 * AgriWise: Messages & Notifications Center
 */

const AgriMessages = {
  async initMessages() {
    if (!AgriAuth.guard('farmer')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/farmer/messages');
    const container = document.getElementById('messages-list-container');
    if (!container) return;

    if (!res.success || !res.messages || res.messages.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="bi bi-chat-left-dots text-secondary" style="font-size: 2.5rem;"></i>
          <p class="mt-3 fw-medium">Your inbox is empty.</p>
          <p class="small text-secondary">All recommendation notices, lab updates, and agronomist advisories will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = res.messages.map(m => {
      const isUnread = !m.is_read;
      const isRecAlert = m.subject.toLowerCase().includes('recommendation');

      return `
        <div class="card mb-3 border ${isUnread ? 'border-success shadow-sm' : ''}" style="${isUnread ? 'background-color: #f0fdf4;' : ''}">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div class="d-flex align-items-center gap-2">
                ${isRecAlert ? '<span class="badge bg-success"><i class="bi bi-bell-fill me-1"></i> RECOMMENDATION READY</span>' : '<span class="badge bg-secondary">ADVISORY</span>'}
                ${isUnread ? '<span class="badge bg-danger">NEW</span>' : ''}
              </div>
              <small class="text-muted"><i class="bi bi-clock me-1"></i> ${new Date(m.created_at).toLocaleString()}</small>
            </div>
            <h5 class="card-title fw-bold text-dark">${m.subject}</h5>
            <p class="card-text text-secondary mb-3" style="line-height: 1.6;">${m.message}</p>
            <div class="d-flex align-items-center justify-content-between">
              <div>
                ${m.recommendation_id ? `
                  <a href="/farmer/recommendation.html?id=${m.recommendation_id}" class="btn btn-agri btn-sm" onclick="AgriMessages.markRead(${m.id})">
                    <i class="bi bi-file-earmark-check me-1"></i> View Recommendation Plan
                  </a>
                ` : ''}
              </div>
              ${isUnread ? `
                <button class="btn btn-outline-secondary btn-sm" onclick="AgriMessages.markRead(${m.id})">
                  <i class="bi bi-check2 me-1"></i> Mark as Read
                </button>
              ` : '<span class="text-muted small"><i class="bi bi-check2-all me-1"></i> Read</span>'}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async markRead(messageId) {
    await AgriAuth.fetch(`/api/farmer/messages/${messageId}/read`, { method: 'PUT' });
    this.initMessages();
  }
};

window.AgriMessages = AgriMessages;
