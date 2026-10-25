/**
 * AgriWise: Farmer Dashboard & Portal Logic
 */

const AgriFarmer = {
  async initDashboard() {
    if (!AgriAuth.guard('farmer')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/farmer/dashboard');
    if (!res.success) {
      AgriAuth.toast(res.message || 'Failed to load dashboard data', 'error');
      return;
    }

    const { stats, latestRecommendation, recentActivity, latestParameters } = res;

    // Populate KPIs
    document.getElementById('stat-total-farms').textContent = stats.totalFarms || 0;
    document.getElementById('stat-total-fields').textContent = stats.totalFields || 0;
    document.getElementById('stat-active-crops').textContent = stats.activeCrops || 0;
    document.getElementById('stat-pending-tests').textContent = stats.pendingTests || 0;
    document.getElementById('stat-completed-tests').textContent = stats.completedTests || 0;
    document.getElementById('stat-unread-messages').textContent = stats.unreadMessages || 0;

    // Unread notification badge
    const badge = document.querySelector('.notif-counter');
    if (badge) {
      const count = (stats.unreadNotifications || 0) + (stats.unreadMessages || 0);
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    // Render Latest Recommendation Card
    const recContainer = document.getElementById('latest-rec-card');
    if (recContainer) {
      if (latestRecommendation) {
        recContainer.innerHTML = `
          <div class="d-flex align-items-center justify-content-between mb-3">
            <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-semibold">
              <i class="bi bi-check2-circle me-1"></i> Fertilizer Plan Ready
            </span>
            <small class="text-muted"><i class="bi bi-clock me-1"></i> ${new Date(latestRecommendation.created_at).toLocaleDateString()}</small>
          </div>
          <h5 class="fw-bold text-dark mb-1">${latestRecommendation.farm_name} &bull; ${latestRecommendation.field_name}</h5>
          <p class="text-secondary small mb-3">Target Crop: <strong>${latestRecommendation.current_crop || 'Field Crop'}</strong> | Priority: <span class="badge bg-warning-subtle text-warning-emphasis">${latestRecommendation.priority_nutrient}</span></p>
          <div class="p-3 bg-light rounded-3 mb-3 border">
            <p class="mb-0 text-dark small" style="line-height: 1.5;">${latestRecommendation.recommendation_text.substring(0, 160)}...</p>
          </div>
          <a href="/farmer/recommendation.html?id=${latestRecommendation.id}" class="btn btn-agri btn-sm w-100">
            <i class="bi bi-file-earmark-text me-1"></i> View Full Fertilizer Plan &amp; Schedule
          </a>
        `;
      } else {
        recContainer.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="bi bi-clipboard2-check text-secondary" style="font-size: 2.5rem;"></i>
            <p class="mt-2 mb-2 fw-medium">No completed recommendations yet.</p>
            <p class="small text-secondary mb-3">Submit a soil test request for your fields to receive an agronomist-approved fertilizer plan.</p>
            <a href="/farmer/soil-test.html" class="btn btn-agri btn-sm">
              <i class="bi bi-plus-circle me-1"></i> Request Soil Test
            </a>
          </div>
        `;
      }
    }

    // Render Recent Activities
    const actContainer = document.getElementById('recent-activity-list');
    if (actContainer) {
      let html = '';
      if (recentActivity?.latestTest) {
        html += `
          <div class="d-flex align-items-center gap-3 p-2 border-bottom">
            <div class="kpi-icon-container kpi-green" style="width: 38px; height: 38px; font-size: 1.1rem;">
              <i class="bi bi-eyedropper"></i>
            </div>
            <div class="flex-grow-1">
              <div class="fw-semibold small">${recentActivity.latestTest.sample_id}</div>
              <div class="text-muted" style="font-size: 0.75rem;">${recentActivity.latestTest.farm_name} - ${recentActivity.latestTest.field_name}</div>
            </div>
            <span class="badge bg-secondary-subtle text-secondary small">${recentActivity.latestTest.status}</span>
          </div>
        `;
      }
      if (recentActivity?.latestMessage) {
        html += `
          <div class="d-flex align-items-center gap-3 p-2">
            <div class="kpi-icon-container kpi-blue" style="width: 38px; height: 38px; font-size: 1.1rem;">
              <i class="bi bi-envelope"></i>
            </div>
            <div class="flex-grow-1">
              <div class="fw-semibold small">${recentActivity.latestMessage.subject}</div>
              <div class="text-muted" style="font-size: 0.75rem;">${recentActivity.latestMessage.message.substring(0, 45)}...</div>
            </div>
            <a href="/farmer/messages.html" class="btn btn-link btn-sm p-0 text-decoration-none">View</a>
          </div>
        `;
      }
      if (!html) {
        html = '<p class="text-muted small text-center py-3 mb-0">No recent activities recorded.</p>';
      }
      actContainer.innerHTML = html;
    }

    // Render NPK Chart
    if (latestParameters && document.getElementById('dashboard-npk-chart')) {
      AgriCharts.renderNPKChart('dashboard-npk-chart', latestParameters);
    }
  },

  // ===================== FARMS =====================

  async initFarms() {
    if (!AgriAuth.guard('farmer')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/farmer/farms');
    const container = document.getElementById('farms-table-body');
    if (!container) return;

    if (!res.success || !res.farms || res.farms.length === 0) {
      container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No farms registered yet. Click "Add New Farm" to get started!</td></tr>`;
      return;
    }

    container.innerHTML = res.farms.map(f => `
      <tr>
        <td class="fw-bold text-dark">${f.farm_name}</td>
        <td>${f.state}, ${f.district}</td>
        <td><span class="badge bg-light text-dark border">${f.area} Acres</span></td>
        <td>${f.ownership_type || 'Owned'}</td>
        <td><span class="badge bg-success-subtle text-success">${f.fields_count || 0} Fields</span></td>
        <td>${f.irrigation || 'Canal'}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="AgriFarmer.deleteFarm(${f.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  async handleAddFarm(event) {
    event.preventDefault();
    const form = event.target;
    const body = {
      farm_name: form.farm_name.value,
      country: form.country.value || 'India',
      state: form.state.value,
      district: form.district.value,
      village: form.village.value,
      area: form.area.value,
      ownership_type: form.ownership_type.value,
      irrigation: form.irrigation.value,
      water_source: form.water_source.value,
      farming_type: form.farming_type.value
    };

    const res = await AgriAuth.fetch('/api/farmer/farms', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (res.success) {
      AgriAuth.toast('Farm added successfully!', 'success');
      form.reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById('addFarmModal'));
      if (modal) modal.hide();
      this.initFarms();
    } else {
      AgriAuth.toast(res.message || 'Error adding farm', 'error');
    }
  },

  async deleteFarm(id) {
    if (!confirm('Are you sure you want to delete this farm? All associated fields and records will be removed.')) return;
    const res = await AgriAuth.fetch(`/api/farmer/farms/${id}`, { method: 'DELETE' });
    if (res.success) {
      AgriAuth.toast('Farm deleted successfully.', 'success');
      this.initFarms();
    } else {
      AgriAuth.toast(res.message || 'Error deleting farm', 'error');
    }
  },

  // ===================== FIELDS =====================

  async initFields() {
    if (!AgriAuth.guard('farmer')) return;
    AgriAuth.initUI();

    // Populate Farm select options in modal
    const farmSelect = document.getElementById('field-farm-select');
    if (farmSelect) {
      const farmsRes = await AgriAuth.fetch('/api/farmer/farms');
      if (farmsRes.success && farmsRes.farms) {
        farmSelect.innerHTML = '<option value="">-- Choose Farm --</option>' +
          farmsRes.farms.map(f => `<option value="${f.id}">${f.farm_name} (${f.district})</option>`).join('');
      }
    }

    const res = await AgriAuth.fetch('/api/farmer/fields');
    const container = document.getElementById('fields-table-body');
    if (!container) return;

    if (!res.success || !res.fields || res.fields.length === 0) {
      container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No fields added yet. Choose a farm and add your field plots!</td></tr>`;
      return;
    }

    container.innerHTML = res.fields.map(fd => `
      <tr>
        <td class="fw-bold text-dark">${fd.field_name}</td>
        <td>${fd.farm_name}</td>
        <td><span class="badge bg-light text-dark border">${fd.area} Acres</span></td>
        <td><span class="badge bg-secondary-subtle text-secondary">${fd.soil_type}</span></td>
        <td><span class="fw-semibold text-success">${fd.current_crop || 'None'}</span></td>
        <td>${fd.previous_crop || '-'}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="AgriFarmer.deleteField(${fd.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  async handleAddField(event) {
    event.preventDefault();
    const form = event.target;
    const body = {
      farm_id: form.farm_id.value,
      field_name: form.field_name.value,
      area: form.area.value,
      soil_type: form.soil_type.value,
      irrigation_type: form.irrigation_type.value,
      drainage: form.drainage.value,
      current_crop: form.current_crop.value,
      previous_crop: form.previous_crop.value,
      sowing_date: form.sowing_date.value,
      harvest_date: form.harvest_date.value,
      farming_method: form.farming_method.value,
      topography: form.topography.value
    };

    const res = await AgriAuth.fetch('/api/farmer/fields', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (res.success) {
      AgriAuth.toast('Field plot registered successfully!', 'success');
      form.reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById('addFieldModal'));
      if (modal) modal.hide();
      this.initFields();
    } else {
      AgriAuth.toast(res.message || 'Error adding field', 'error');
    }
  },

  async deleteField(id) {
    if (!confirm('Are you sure you want to delete this field plot?')) return;
    const res = await AgriAuth.fetch(`/api/farmer/fields/${id}`, { method: 'DELETE' });
    if (res.success) {
      AgriAuth.toast('Field deleted successfully.', 'success');
      this.initFields();
    } else {
      AgriAuth.toast(res.message || 'Error deleting field', 'error');
    }
  },

  // ===================== SOIL TEST SUBMISSION =====================

  async initSoilTestForm() {
    if (!AgriAuth.guard('farmer')) return;
    AgriAuth.initUI();

    const farmSelect = document.getElementById('test-farm-select');
    const fieldSelect = document.getElementById('test-field-select');

    if (!farmSelect || !fieldSelect) return;

    const farmsRes = await AgriAuth.fetch('/api/farmer/farms');
    if (farmsRes.success && farmsRes.farms) {
      farmSelect.innerHTML = '<option value="">-- Choose Farm --</option>' +
        farmsRes.farms.map(f => `<option value="${f.id}">${f.farm_name} (${f.state})</option>`).join('');
    }

    farmSelect.addEventListener('change', async () => {
      const farmId = farmSelect.value;
      if (!farmId) {
        fieldSelect.innerHTML = '<option value="">-- Select Farm First --</option>';
        return;
      }
      const fieldsRes = await AgriAuth.fetch(`/api/farmer/fields?farm_id=${farmId}`);
      if (fieldsRes.success && fieldsRes.fields) {
        fieldSelect.innerHTML = '<option value="">-- Choose Field Plot --</option>' +
          fieldsRes.fields.map(fd => `<option value="${fd.id}">${fd.field_name} (Crop: ${fd.current_crop || 'None'})</option>`).join('');
      }
    });

    // Handle form submit with file upload
    const form = document.getElementById('soil-test-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting Test...';

        const res = await AgriAuth.fetch('/api/farmer/soil-tests', {
          method: 'POST',
          body: formData
        });

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-cloud-arrow-up me-2"></i> Submit Soil Test';

        if (res.success) {
          AgriAuth.toast('Soil test submitted successfully! Forwarded to Agronomist.', 'success');
          setTimeout(() => {
            window.location.href = '/farmer/soil-results.html';
          }, 1000);
        } else {
          AgriAuth.toast(res.message || 'Error submitting test', 'error');
        }
      });
    }
  },

  // ===================== SOIL TEST RESULTS =====================

  async initSoilResults() {
    if (!AgriAuth.guard('farmer')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/farmer/soil-tests');
    const container = document.getElementById('soil-results-table');
    if (!container) return;

    if (!res.success || !res.tests || res.tests.length === 0) {
      container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No soil tests submitted yet. Click "Submit New Soil Test" above.</td></tr>`;
      return;
    }

    container.innerHTML = res.tests.map(t => {
      let statusBadge = '<span class="badge bg-secondary">PENDING</span>';
      if (t.status === 'REVIEW_REQUIRED') statusBadge = '<span class="badge bg-warning-subtle text-warning-emphasis">IN REVIEW</span>';
      if (t.status === 'APPROVED' || t.status === 'COMPLETED') statusBadge = '<span class="badge bg-success-subtle text-success">APPROVED</span>';

      return `
        <tr>
          <td class="fw-bold text-dark">${t.sample_id}</td>
          <td>${new Date(t.test_date).toLocaleDateString()}</td>
          <td>${t.farm_name} - ${t.field_name}</td>
          <td>${t.current_crop || 'Field Crop'}</td>
          <td>${statusBadge}</td>
          <td>
            ${t.rec_available > 0 
              ? '<span class="text-success small fw-semibold"><i class="bi bi-check-circle-fill me-1"></i> Recommendation Ready</span>'
              : '<span class="text-muted small">Pending Review</span>'}
          </td>
          <td class="text-end">
            ${t.rec_available > 0
              ? `<a href="/farmer/recommendations.html" class="btn btn-sm btn-agri">View Plan</a>`
              : `<span class="badge bg-light text-secondary border">Awaiting Review</span>`}
          </td>
        </tr>
      `;
    }).join('');
  }
};

window.AgriFarmer = AgriFarmer;
