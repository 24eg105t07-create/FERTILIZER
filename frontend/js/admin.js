/**
 * AgriWise: Admin / Lead Agronomist Dashboard & Workflow Logic
 */

const AgriAdmin = {
  async initDashboard() {
    if (!AgriAuth.guard('admin')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/admin/dashboard');
    if (!res.success) {
      AgriAuth.toast(res.message || 'Failed to load admin dashboard', 'error');
      return;
    }

    const { stats, charts, pendingTests } = res;

    // KPIs
    document.getElementById('stat-total-farmers').textContent = stats.totalFarmers || 0;
    document.getElementById('stat-total-farms').textContent = stats.totalFarms || 0;
    document.getElementById('stat-total-fields').textContent = stats.totalFields || 0;
    document.getElementById('stat-pending-tests').textContent = stats.pendingTests || 0;
    document.getElementById('stat-pending-reviews').textContent = stats.pendingReviews || 0;
    document.getElementById('stat-completed-tests').textContent = stats.completedTests || 0;
    document.getElementById('stat-total-recs').textContent = stats.totalRecommendations || 0;
    document.getElementById('stat-sent-recs').textContent = stats.sentRecommendations || 0;

    // Deficiencies Doughnut Chart
    if (charts?.deficiencies && document.getElementById('admin-deficiency-chart')) {
      AgriCharts.renderDeficienciesChart('admin-deficiency-chart', charts.deficiencies);
    }

    // Crop Distribution Chart
    if (charts?.cropDistribution && document.getElementById('admin-crops-chart')) {
      AgriCharts.renderCropDistribution('admin-crops-chart', charts.cropDistribution);
    }

    // Pending Soil Tests Table
    const tableBody = document.getElementById('admin-pending-tests-table');
    if (tableBody) {
      if (!pendingTests || pendingTests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No pending tests awaiting review.</td></tr>';
      } else {
        tableBody.innerHTML = pendingTests.map(t => `
          <tr>
            <td class="fw-bold">${t.sample_id}</td>
            <td>${t.farmer_name}</td>
            <td>${t.farm_name} - ${t.field_name}</td>
            <td>${t.current_crop || 'Field Crop'}</td>
            <td><span class="badge ${t.status === 'PENDING' ? 'bg-secondary' : 'bg-warning-subtle text-warning-emphasis'}">${t.status}</span></td>
            <td class="text-end">
              <a href="/admin/soil-tests.html?id=${t.id}" class="btn btn-sm btn-agri">
                <i class="bi bi-search me-1"></i> Review &amp; Analyze
              </a>
            </td>
          </tr>
        `).join('');
      }
    }
  },

  // ===================== SOIL TESTS MANAGEMENT =====================

  async initSoilTests() {
    if (!AgriAuth.guard('admin')) return;
    AgriAuth.initUI();

    const urlParams = new URLSearchParams(window.location.search);
    const testIdFilter = urlParams.get('id');

    const res = await AgriAuth.fetch('/api/admin/soil-tests');
    const container = document.getElementById('admin-tests-table');
    if (!container) return;

    if (!res.success || !res.tests || res.tests.length === 0) {
      container.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No soil tests found in the database.</td></tr>';
      return;
    }

    container.innerHTML = res.tests.map(t => {
      let statusBadge = '<span class="admin-status-pill pill-pending">PENDING</span>';
      if (t.status === 'REVIEW_REQUIRED') statusBadge = '<span class="admin-status-pill pill-review">REVIEW REQUIRED</span>';
      if (t.status === 'APPROVED' || t.status === 'COMPLETED') statusBadge = '<span class="admin-status-pill pill-approved">APPROVED</span>';

      return `
        <tr ${testIdFilter && t.id == testIdFilter ? 'class="table-warning"' : ''}>
          <td class="fw-bold text-dark">${t.sample_id}</td>
          <td>${t.farmer_name} <br><small class="text-muted">${t.farmer_email}</small></td>
          <td>${t.farm_name} &bull; ${t.field_name}</td>
          <td><span class="badge bg-light text-dark border">${t.current_crop || 'Wheat'}</span></td>
          <td>${new Date(t.test_date).toLocaleDateString()}</td>
          <td>${statusBadge}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-agri-outline me-1" onclick="AgriAdmin.inspectSoilTest(${t.id})">
              <i class="bi bi-eye"></i> Details
            </button>
            <button class="btn btn-sm btn-agri" onclick="AgriAdmin.analyzeSoilTest(${t.id})">
              <i class="bi bi-cpu"></i> Analyze
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // If specific test passed in URL, auto-open inspection
    if (testIdFilter) {
      this.inspectSoilTest(testIdFilter);
    }
  },

  async inspectSoilTest(testId) {
    const res = await AgriAuth.fetch(`/api/admin/soil-tests/${testId}`);
    if (!res.success || !res.test) {
      AgriAuth.toast(res.message || 'Error fetching test details', 'error');
      return;
    }

    const t = res.test;
    const p = t.parameters || {};
    const a = t.analysis || {};

    const modalBody = document.getElementById('soilTestModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <p class="mb-1"><strong>Farmer:</strong> ${t.farmer_name} (${t.farmer_email})</p>
          <p class="mb-1"><strong>Farm:</strong> ${t.farm_name} (${t.state}, ${t.district})</p>
          <p class="mb-1"><strong>Field Plot:</strong> ${t.field_name} (Area: ${t.field_area} Acres)</p>
        </div>
        <div class="col-md-6">
          <p class="mb-1"><strong>Sample ID:</strong> <span class="badge bg-dark">${t.sample_id}</span></p>
          <p class="mb-1"><strong>Test Date:</strong> ${new Date(t.test_date).toLocaleDateString()}</p>
          <p class="mb-1"><strong>Current Status:</strong> <span class="badge bg-primary">${t.status}</span></p>
          <p class="mb-1"><strong>Laboratory:</strong> ${t.lab_name || 'Standard Regional Lab'}</p>
        </div>
      </div>

      <h6 class="fw-bold border-bottom pb-2 text-success"><i class="bi bi-sliders me-1"></i> Recorded Soil Parameters</h6>
      <div class="table-responsive mb-3">
        <table class="table table-sm table-bordered">
          <thead class="table-light">
            <tr>
              <th>Nitrogen (N)</th>
              <th>Phosphorus (P)</th>
              <th>Potassium (K)</th>
              <th>pH</th>
              <th>EC (dS/m)</th>
              <th>Organic Carbon</th>
              <th>Zinc</th>
              <th>Sulfur</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${p.nitrogen !== null ? p.nitrogen + ' kg/ha' : 'N/A'}</strong></td>
              <td><strong>${p.phosphorus !== null ? p.phosphorus + ' kg/ha' : 'N/A'}</strong></td>
              <td><strong>${p.potassium !== null ? p.potassium + ' kg/ha' : 'N/A'}</strong></td>
              <td><strong>${p.ph !== null ? p.ph : 'N/A'}</strong></td>
              <td><strong>${p.ec !== null ? p.ec : 'N/A'}</strong></td>
              <td><strong>${p.organic_carbon !== null ? p.organic_carbon + '%' : 'N/A'}</strong></td>
              <td>${p.zinc !== null ? p.zinc + ' ppm' : '-'}</td>
              <td>${p.sulfur !== null ? p.sulfur + ' ppm' : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${a.nitrogen_status ? `
        <div class="p-3 bg-light rounded-3 border mb-3">
          <h6 class="fw-bold text-dark mb-2"><i class="bi bi-clipboard2-pulse me-1"></i> Current Rule-Based Soil Classification</h6>
          <div class="d-flex flex-wrap gap-2 mb-2">
            <span class="badge ${a.nitrogen_status === 'LOW' ? 'badge-low' : 'badge-optimal'}">N: ${a.nitrogen_status}</span>
            <span class="badge ${a.phosphorus_status === 'LOW' ? 'badge-low' : 'badge-optimal'}">P: ${a.phosphorus_status}</span>
            <span class="badge ${a.potassium_status === 'LOW' ? 'badge-low' : 'badge-optimal'}">K: ${a.potassium_status}</span>
            <span class="badge ${a.ph_status === 'OPTIMAL' ? 'badge-optimal' : 'badge-alkaline'}">pH: ${a.ph_status}</span>
            <span class="badge ${a.organic_carbon_status === 'LOW' ? 'badge-low' : 'badge-optimal'}">OC: ${a.organic_carbon_status}</span>
          </div>
          <p class="small text-secondary mb-0">${a.analysis_text || ''}</p>
        </div>
      ` : '<div class="alert alert-secondary small">Parameters recorded but soil classification has not yet been executed. Click "Run Soil Analysis" below.</div>'}

      <div class="d-flex justify-content-end gap-2 pt-2">
        <button class="btn btn-outline-success btn-sm" onclick="AgriAdmin.analyzeSoilTest(${t.id})">
          <i class="bi bi-cpu me-1"></i> Run Soil Analysis
        </button>
        <button class="btn btn-agri btn-sm" onclick="AgriAdmin.generateRecommendationForTest(${t.id})">
          <i class="bi bi-magic me-1"></i> Generate Recommendation Plan
        </button>
      </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('soilTestModal'));
    modal.show();
  },

  async analyzeSoilTest(testId) {
    const res = await AgriAuth.fetch(`/api/admin/soil-tests/${testId}/analyze`, { method: 'POST' });
    if (res.success) {
      AgriAuth.toast('Soil parameters evaluated and classified successfully!', 'success');
      this.initSoilTests();
      this.inspectSoilTest(testId);
    } else {
      AgriAuth.toast(res.message || 'Analysis error', 'error');
    }
  },

  async generateRecommendationForTest(testId) {
    const res = await AgriAuth.fetch('/api/admin/recommendations/generate', {
      method: 'POST',
      body: JSON.stringify({ soil_test_id: testId })
    });

    if (res.success) {
      AgriAuth.toast('Fertilizer Recommendation Plan Generated! Redirecting to workflow review...', 'success');
      setTimeout(() => {
        window.location.href = `/admin/recommendations.html?id=${res.recommendation.recommendationId}`;
      }, 1000);
    } else {
      AgriAuth.toast(res.message || 'Error generating recommendation', 'error');
    }
  },

  // ===================== RECOMMENDATIONS WORKFLOW =====================

  async initRecommendations() {
    if (!AgriAuth.guard('admin')) return;
    AgriAuth.initUI();

    const urlParams = new URLSearchParams(window.location.search);
    const targetRecId = urlParams.get('id');

    const res = await AgriAuth.fetch('/api/admin/recommendations');
    const container = document.getElementById('admin-recs-table');
    if (!container) return;

    if (!res.success || !res.recommendations || res.recommendations.length === 0) {
      container.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No recommendations generated yet.</td></tr>';
      return;
    }

    container.innerHTML = res.recommendations.map(r => {
      let pillClass = 'pill-draft';
      if (r.status === 'APPROVED') pillClass = 'pill-approved';
      if (r.status === 'SENT') pillClass = 'pill-sent';
      if (r.status === 'READ') pillClass = 'pill-read';

      return `
        <tr ${targetRecId && r.id == targetRecId ? 'class="table-success"' : ''}>
          <td class="fw-bold">#REC-${r.id}</td>
          <td>${r.farmer_name}</td>
          <td>${r.farm_name} &bull; ${r.field_name}</td>
          <td><span class="badge bg-warning-subtle text-warning-emphasis">${r.priority_nutrient}</span></td>
          <td><span class="admin-status-pill ${pillClass}">${r.status}</span></td>
          <td>${new Date(r.created_at).toLocaleDateString()}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-agri" onclick="AgriAdmin.openRecommendationReview(${r.id})">
              <i class="bi bi-pencil-square me-1"></i> Review &amp; Dispatch
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (targetRecId) {
      this.openRecommendationReview(targetRecId);
    }
  },

  async openRecommendationReview(recId) {
    const res = await AgriAuth.fetch(`/api/admin/recommendations/${recId}`);
    if (!res.success || !res.recommendation) {
      AgriAuth.toast('Failed to load recommendation details.', 'error');
      return;
    }

    const r = res.recommendation;
    const modalBody = document.getElementById('reviewModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div class="admin-action-bar">
        <div>
          <span class="text-muted small">Recommendation Status:</span>
          <span class="admin-status-pill ${r.status === 'APPROVED' ? 'pill-approved' : r.status === 'SENT' ? 'pill-sent' : 'pill-draft'} ms-2">
            ${r.status}
          </span>
        </div>
        <div class="d-flex gap-2">
          ${r.status === 'DRAFT' || r.status === 'PENDING_REVIEW' ? `
            <button class="btn btn-outline-success btn-sm" onclick="AgriAdmin.approveRecommendation(${r.id})">
              <i class="bi bi-check-lg me-1"></i> Approve Recommendation
            </button>
          ` : ''}
          ${r.status === 'APPROVED' ? `
            <button class="btn btn-agri btn-sm" onclick="AgriAdmin.sendToFarmer(${r.id})">
              <i class="bi bi-send-fill me-1"></i> Send to Farmer
            </button>
          ` : ''}
          ${r.status === 'SENT' || r.status === 'READ' ? `
            <span class="badge bg-success-subtle text-success p-2"><i class="bi bi-check2-all me-1"></i> Dispatched to Farmer</span>
          ` : ''}
        </div>
      </div>

      <form id="rec-review-form" onsubmit="AgriAdmin.saveDraftRecommendation(event, ${r.id})">
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="form-label">Priority Nutrients</label>
            <input type="text" name="priority_nutrient" class="form-control" value="${r.priority_nutrient || ''}" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Recommended Fertilizer Source</label>
            <input type="text" name="fertilizer_name" class="form-control" value="${r.fertilizer_name || ''}" required>
          </div>
          <div class="col-12">
            <label class="form-label">Recommendation Plan Text</label>
            <textarea name="recommendation_text" class="form-control" rows="3" required>${r.recommendation_text || ''}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">Application Timing</label>
            <input type="text" name="application_timing" class="form-control" value="${r.application_timing || ''}">
          </div>
          <div class="col-md-6">
            <label class="form-label">Application Method</label>
            <input type="text" name="application_method" class="form-control" value="${r.application_method || ''}">
          </div>
          <div class="col-12">
            <label class="form-label">Explainability ("WHY THIS PLAN")</label>
            <textarea name="explanation" class="form-control" rows="3">${r.explanation || ''}</textarea>
          </div>
          <div class="col-12">
            <label class="form-label">Agronomist Comments &amp; Soil Conditioning</label>
            <textarea name="admin_comments" class="form-control" rows="2">${r.admin_comments || ''}</textarea>
          </div>
        </div>

        <div class="d-flex justify-content-between border-top pt-3">
          <button type="submit" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-save me-1"></i> Save Edits (Draft)
          </button>
          ${r.status === 'APPROVED' ? `
            <button type="button" class="btn btn-agri btn-sm" onclick="AgriAdmin.sendToFarmer(${r.id})">
              <i class="bi bi-send-fill me-1"></i> Send to Farmer
            </button>
          ` : ''}
        </div>
      </form>
    `;

    const modal = new bootstrap.Modal(document.getElementById('recReviewModal'));
    modal.show();
  },

  async saveDraftRecommendation(e, recId) {
    e.preventDefault();
    const form = e.target;
    const body = {
      priority_nutrient: form.priority_nutrient.value,
      fertilizer_name: form.fertilizer_name.value,
      recommendation_text: form.recommendation_text.value,
      application_timing: form.application_timing.value,
      application_method: form.application_method.value,
      explanation: form.explanation.value,
      admin_comments: form.admin_comments.value
    };

    const res = await AgriAuth.fetch(`/api/admin/recommendations/${recId}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    if (res.success) {
      AgriAuth.toast('Recommendation draft saved.', 'success');
      this.initRecommendations();
    } else {
      AgriAuth.toast(res.message || 'Error saving draft', 'error');
    }
  },

  async approveRecommendation(recId) {
    const res = await AgriAuth.fetch(`/api/admin/recommendations/${recId}/approve`, { method: 'POST' });
    if (res.success) {
      AgriAuth.toast('Recommendation APPROVED! Ready to dispatch to farmer.', 'success');
      this.initRecommendations();
      this.openRecommendationReview(recId);
    } else {
      AgriAuth.toast(res.message || 'Error approving', 'error');
    }
  },

  async sendToFarmer(recId) {
    const res = await AgriAuth.fetch(`/api/admin/recommendations/${recId}/send`, { method: 'POST' });
    if (res.success) {
      AgriAuth.toast('Recommendation DISPATCHED to farmer! Message & notification created.', 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('recReviewModal'));
      if (modal) modal.hide();
      this.initRecommendations();
    } else {
      AgriAuth.toast(res.message || 'Error sending to farmer', 'error');
    }
  },

  // ===================== CROPS CATALOGUE =====================

  async initCrops() {
    if (!AgriAuth.guard('admin')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/admin/crops');
    const container = document.getElementById('crops-table');
    if (!container) return;

    if (!res.success || !res.crops || res.crops.length === 0) {
      container.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No crops in catalogue.</td></tr>';
      return;
    }

    container.innerHTML = res.crops.map(c => `
      <tr>
        <td class="fw-bold">${c.name}</td>
        <td>${c.variety || '-'}</td>
        <td><span class="badge bg-light text-dark border">${c.season || 'All'}</span></td>
        <td>${c.growth_duration ? c.growth_duration + ' days' : '-'}</td>
        <td>${c.target_yield ? c.target_yield + ' q/ha' : '-'}</td>
        <td><small class="text-muted">${c.nutrient_requirements || '-'}</small></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary me-1" onclick="AgriAdmin.openCropModal(${c.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="AgriAdmin.deleteCrop(${c.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  async openCropModal(cropId = null) {
    let crop = { name: '', variety: '', season: 'Kharif', growth_duration: 120, target_yield: 25, nutrient_requirements: '', description: '' };
    if (cropId) {
      const res = await AgriAuth.fetch('/api/admin/crops');
      if (res.success && res.crops) {
        crop = res.crops.find(c => c.id == cropId) || crop;
      }
    }

    const modalBody = document.getElementById('cropModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="crop-form" onsubmit="AgriAdmin.saveCrop(event, ${cropId || 'null'})">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Crop Name *</label>
            <input type="text" name="name" class="form-control" value="${crop.name || ''}" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Variety</label>
            <input type="text" name="variety" class="form-control" value="${crop.variety || ''}">
          </div>
          <div class="col-md-4">
            <label class="form-label">Season</label>
            <select name="season" class="form-select">
              <option value="Kharif" ${crop.season === 'Kharif' ? 'selected' : ''}>Kharif (Monsoon)</option>
              <option value="Rabi" ${crop.season === 'Rabi' ? 'selected' : ''}>Rabi (Winter)</option>
              <option value="Zaid" ${crop.season === 'Zaid' ? 'selected' : ''}>Zaid (Summer)</option>
              <option value="Year-round" ${crop.season === 'Year-round' ? 'selected' : ''}>Year-round</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Duration (Days)</label>
            <input type="number" name="growth_duration" class="form-control" value="${crop.growth_duration || 120}">
          </div>
          <div class="col-md-4">
            <label class="form-label">Target Yield (q/ha)</label>
            <input type="number" step="0.1" name="target_yield" class="form-control" value="${crop.target_yield || 25}">
          </div>
          <div class="col-12">
            <label class="form-label">Standard Nutrient Requirements</label>
            <input type="text" name="nutrient_requirements" class="form-control" placeholder="e.g., N: 120 kg/ha, P2O5: 60 kg/ha, K2O: 40 kg/ha" value="${crop.nutrient_requirements || ''}">
          </div>
          <div class="col-12">
            <label class="form-label">Agronomic Description</label>
            <textarea name="description" class="form-control" rows="2">${crop.description || ''}</textarea>
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-agri btn-sm"><i class="bi bi-save me-1"></i> Save Crop</button>
        </div>
      </form>
    `;

    const modal = new bootstrap.Modal(document.getElementById('cropModal'));
    modal.show();
  },

  async saveCrop(e, cropId) {
    e.preventDefault();
    const form = e.target;
    const body = {
      name: form.name.value,
      variety: form.variety.value,
      season: form.season.value,
      growth_duration: parseInt(form.growth_duration.value, 10),
      target_yield: parseFloat(form.target_yield.value),
      nutrient_requirements: form.nutrient_requirements.value,
      description: form.description.value
    };

    const method = cropId ? 'PUT' : 'POST';
    const url = cropId ? `/api/admin/crops/${cropId}` : '/api/admin/crops';

    const res = await AgriAuth.fetch(url, { method, body: JSON.stringify(body) });
    if (res.success) {
      AgriAuth.toast(cropId ? 'Crop updated.' : 'Crop added.', 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('cropModal'));
      if (modal) modal.hide();
      this.initCrops();
    } else {
      AgriAuth.toast(res.message || 'Error saving crop', 'error');
    }
  },

  async deleteCrop(cropId) {
    if (!confirm('Are you sure you want to remove this crop from the catalogue?')) return;
    const res = await AgriAuth.fetch(`/api/admin/crops/${cropId}`, { method: 'DELETE' });
    if (res.success) {
      AgriAuth.toast('Crop removed.', 'success');
      this.initCrops();
    } else {
      AgriAuth.toast(res.message || 'Error deleting crop', 'error');
    }
  },

  // ===================== FERTILIZERS CATALOGUE =====================

  async initFertilizers() {
    if (!AgriAuth.guard('admin')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/admin/fertilizers');
    const container = document.getElementById('fertilizers-table');
    if (!container) return;

    if (!res.success || !res.fertilizers || res.fertilizers.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No fertilizers in catalogue.</td></tr>';
      return;
    }

    container.innerHTML = res.fertilizers.map(f => `
      <tr>
        <td class="fw-bold">${f.name}</td>
        <td><span class="badge bg-secondary-subtle text-secondary-emphasis">${f.type}</span></td>
        <td><code>${f.nutrient_composition}</code></td>
        <td><small>${f.suitable_crops || 'All Crops'}</small></td>
        <td><small class="text-muted">${f.application_method_default || 'Basal'}</small></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary me-1" onclick="AgriAdmin.openFertilizerModal(${f.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="AgriAdmin.deleteFertilizer(${f.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  async openFertilizerModal(fertId = null) {
    let f = { name: '', type: 'Nitrogen', nutrient_composition: '', description: '', suitable_crops: 'All Major Crops', application_method_default: 'Basal or Split Top Dress' };
    if (fertId) {
      const res = await AgriAuth.fetch('/api/admin/fertilizers');
      if (res.success && res.fertilizers) {
        f = res.fertilizers.find(x => x.id == fertId) || f;
      }
    }

    const modalBody = document.getElementById('fertModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="fert-form" onsubmit="AgriAdmin.saveFertilizer(event, ${fertId || 'null'})">
        <div class="row g-3">
          <div class="col-md-7">
            <label class="form-label">Fertilizer Commercial Name *</label>
            <input type="text" name="name" class="form-control" value="${f.name || ''}" required>
          </div>
          <div class="col-md-5">
            <label class="form-label">Type / Category *</label>
            <select name="type" class="form-select">
              <option value="Nitrogen" ${f.type === 'Nitrogen' ? 'selected' : ''}>Nitrogen (N)</option>
              <option value="Phosphorus" ${f.type === 'Phosphorus' ? 'selected' : ''}>Phosphorus (P)</option>
              <option value="Potassium" ${f.type === 'Potassium' ? 'selected' : ''}>Potassium (K)</option>
              <option value="Compound" ${f.type === 'Compound' ? 'selected' : ''}>Compound (NPK)</option>
              <option value="Organic" ${f.type === 'Organic' ? 'selected' : ''}>Organic Manure</option>
              <option value="Micronutrient" ${f.type === 'Micronutrient' ? 'selected' : ''}>Micronutrient</option>
              <option value="Biofertilizer" ${f.type === 'Biofertilizer' ? 'selected' : ''}>Biofertilizer</option>
            </select>
          </div>
          <div class="col-12">
            <label class="form-label">Nutrient Composition Formulation *</label>
            <input type="text" name="nutrient_composition" class="form-control" placeholder="e.g., 46% N or 18% N, 46% P2O5" value="${f.nutrient_composition || ''}" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Suitable Crops</label>
            <input type="text" name="suitable_crops" class="form-control" value="${f.suitable_crops || ''}">
          </div>
          <div class="col-md-6">
            <label class="form-label">Default Application Method</label>
            <input type="text" name="application_method_default" class="form-control" value="${f.application_method_default || ''}">
          </div>
          <div class="col-12">
            <label class="form-label">Agronomic Notes &amp; Behavior</label>
            <textarea name="description" class="form-control" rows="2">${f.description || ''}</textarea>
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-agri btn-sm"><i class="bi bi-save me-1"></i> Save Fertilizer</button>
        </div>
      </form>
    `;

    const modal = new bootstrap.Modal(document.getElementById('fertModal'));
    modal.show();
  },

  async saveFertilizer(e, fertId) {
    e.preventDefault();
    const form = e.target;
    const body = {
      name: form.name.value,
      type: form.type.value,
      nutrient_composition: form.nutrient_composition.value,
      suitable_crops: form.suitable_crops.value,
      application_method_default: form.application_method_default.value,
      description: form.description.value
    };

    const method = fertId ? 'PUT' : 'POST';
    const url = fertId ? `/api/admin/fertilizers/${fertId}` : '/api/admin/fertilizers';

    const res = await AgriAuth.fetch(url, { method, body: JSON.stringify(body) });
    if (res.success) {
      AgriAuth.toast(fertId ? 'Fertilizer updated.' : 'Fertilizer added.', 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('fertModal'));
      if (modal) modal.hide();
      this.initFertilizers();
    } else {
      AgriAuth.toast(res.message || 'Error saving fertilizer', 'error');
    }
  },

  async deleteFertilizer(fertId) {
    if (!confirm('Are you sure you want to remove this fertilizer?')) return;
    const res = await AgriAuth.fetch(`/api/admin/fertilizers/${fertId}`, { method: 'DELETE' });
    if (res.success) {
      AgriAuth.toast('Fertilizer removed.', 'success');
      this.initFertilizers();
    } else {
      AgriAuth.toast(res.message || 'Error deleting fertilizer', 'error');
    }
  },

  // ===================== ANALYTICS =====================

  async initAnalytics() {
    if (!AgriAuth.guard('admin')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/admin/analytics');
    if (!res.success) {
      AgriAuth.toast('Failed to load analytics data', 'error');
      return;
    }

    const { summary, nutrientStats, cropStats, soilStats, recStats } = res;

    // Summary counts
    if (document.getElementById('an-farmers')) document.getElementById('an-farmers').textContent = summary.totalFarmers || 0;
    if (document.getElementById('an-fields')) document.getElementById('an-fields').textContent = summary.totalFields || 0;
    if (document.getElementById('an-tests')) document.getElementById('an-tests').textContent = summary.totalTests || 0;
    if (document.getElementById('an-recs')) document.getElementById('an-recs').textContent = summary.totalRecs || 0;

    // Chart 1: NPK Status comparison
    if (document.getElementById('chart-npk-comparison')) {
      new Chart(document.getElementById('chart-npk-comparison'), {
        type: 'bar',
        data: {
          labels: ['Low / Deficient', 'Medium', 'Optimal / Adequate', 'High'],
          datasets: [
            { label: 'Nitrogen (N)', data: [nutrientStats.n.LOW, nutrientStats.n.MEDIUM, nutrientStats.n.OPTIMAL, nutrientStats.n.HIGH], backgroundColor: '#ef4444' },
            { label: 'Phosphorus (P)', data: [nutrientStats.p.LOW, nutrientStats.p.MEDIUM, nutrientStats.p.OPTIMAL, nutrientStats.p.HIGH], backgroundColor: '#f59e0b' },
            { label: 'Potassium (K)', data: [nutrientStats.k.LOW, nutrientStats.k.MEDIUM, nutrientStats.k.OPTIMAL, nutrientStats.k.HIGH], backgroundColor: '#10b981' }
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
      });
    }

    // Chart 2: Soil pH Distribution
    if (document.getElementById('chart-ph-dist')) {
      new Chart(document.getElementById('chart-ph-dist'), {
        type: 'doughnut',
        data: {
          labels: ['Acidic (<6.5)', 'Optimal (6.5-7.5)', 'Alkaline (>7.8)'],
          datasets: [{
            data: [nutrientStats.ph.ACIDIC || 0, nutrientStats.ph.OPTIMAL || 0, nutrientStats.ph.ALKALINE || 1],
            backgroundColor: ['#ef4444', '#10b981', '#3b82f6']
          }]
        },
        options: { responsive: true }
      });
    }

    // Chart 3: Recommendation Status Pipeline
    if (document.getElementById('chart-rec-status')) {
      const labels = recStats.map(s => s.status);
      const data = recStats.map(s => s.count);
      new Chart(document.getElementById('chart-rec-status'), {
        type: 'pie',
        data: {
          labels: labels.length ? labels : ['DRAFT', 'APPROVED', 'SENT'],
          datasets: [{
            data: data.length ? data : [0, 0, 1],
            backgroundColor: ['#94a3b8', '#3b82f6', '#10b981', '#059669']
          }]
        },
        options: { responsive: true }
      });
    }

    // Chart 4: Top Crops Grown
    if (document.getElementById('chart-top-crops')) {
      new Chart(document.getElementById('chart-top-crops'), {
        type: 'bar',
        data: {
          labels: cropStats.map(c => c.crop),
          datasets: [{
            label: 'Fields Count',
            data: cropStats.map(c => c.count),
            backgroundColor: '#2d6a4f'
          }]
        },
        options: { responsive: true, indexAxis: 'y' }
      });
    }
  },

  // ===================== REPORTS =====================

  async initReports() {
    if (!AgriAuth.guard('admin')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/admin/reports');
    if (!res.success) {
      AgriAuth.toast('Failed to load reports', 'error');
      return;
    }

    const { tests, recommendations } = res;

    // Soil tests report table
    const testsTbody = document.getElementById('rep-tests-tbody');
    if (testsTbody) {
      testsTbody.innerHTML = (tests || []).map(t => `
        <tr>
          <td>${t.sample_id}</td>
          <td>${t.farmer_name}</td>
          <td>${t.farm_name} &bull; ${t.field_name}</td>
          <td>${t.current_crop || '-'}</td>
          <td>${new Date(t.test_date).toLocaleDateString()}</td>
          <td><span class="badge bg-secondary">${t.status}</span></td>
        </tr>
      `).join('');
    }

    // Recommendations report table
    const recsTbody = document.getElementById('rep-recs-tbody');
    if (recsTbody) {
      recsTbody.innerHTML = (recommendations || []).map(r => `
        <tr>
          <td>#REC-${r.id}</td>
          <td>${r.farmer_name}</td>
          <td>${r.farm_name} &bull; ${r.field_name}</td>
          <td>${r.priority_nutrient}</td>
          <td><span class="badge bg-success-subtle text-success">${r.status}</span></td>
          <td>${new Date(r.created_at).toLocaleDateString()}</td>
        </tr>
      `).join('');
    }
  },

  // ===================== SETTINGS & RULES =====================

  async initSettings() {
    if (!AgriAuth.guard('admin')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/admin/rules');
    const container = document.getElementById('rules-table');
    if (!container) return;

    if (!res.success || !res.rules || res.rules.length === 0) {
      container.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No threshold rules configured.</td></tr>';
      return;
    }

    container.innerHTML = res.rules.map(r => `
      <tr>
        <td class="fw-bold text-capitalize">${r.parameter}</td>
        <td><code>${r.unit}</code></td>
        <td><span class="badge bg-danger-subtle text-danger">&lt; ${r.low_threshold}</span></td>
        <td><span class="badge bg-success-subtle text-success">${r.optimal_min} - ${r.optimal_max}</span></td>
        <td><span class="badge bg-primary-subtle text-primary">&gt; ${r.high_threshold}</span></td>
        <td><small class="text-muted">${r.guidance_text || '-'}</small></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary" onclick="AgriAdmin.openRuleModal(${r.id})">
            <i class="bi bi-pencil me-1"></i> Edit Rule
          </button>
        </td>
      </tr>
    `).join('');
  },

  async openRuleModal(ruleId) {
    const res = await AgriAuth.fetch('/api/admin/rules');
    if (!res.success || !res.rules) return;
    const r = res.rules.find(x => x.id == ruleId);
    if (!r) return;

    const modalBody = document.getElementById('ruleModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="rule-form" onsubmit="AgriAdmin.saveRule(event, ${r.id})">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Parameter Name</label>
            <input type="text" class="form-control" value="${r.parameter}" disabled>
          </div>
          <div class="col-md-6">
            <label class="form-label">Unit of Measurement</label>
            <input type="text" class="form-control" value="${r.unit}" disabled>
          </div>
          <div class="col-md-3">
            <label class="form-label">Low Threshold (&lt;)</label>
            <input type="number" step="0.01" name="low_threshold" class="form-control" value="${r.low_threshold}" required>
          </div>
          <div class="col-md-3">
            <label class="form-label">Optimal Min</label>
            <input type="number" step="0.01" name="optimal_min" class="form-control" value="${r.optimal_min}" required>
          </div>
          <div class="col-md-3">
            <label class="form-label">Optimal Max</label>
            <input type="number" step="0.01" name="optimal_max" class="form-control" value="${r.optimal_max}" required>
          </div>
          <div class="col-md-3">
            <label class="form-label">High Threshold (&gt;)</label>
            <input type="number" step="0.01" name="high_threshold" class="form-control" value="${r.high_threshold}" required>
          </div>
          <div class="col-12">
            <label class="form-label">Scientific Guidance &amp; 4R Best Practice Phrasing</label>
            <textarea name="guidance_text" class="form-control" rows="3">${r.guidance_text || ''}</textarea>
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-agri btn-sm"><i class="bi bi-save me-1"></i> Update Rule</button>
        </div>
      </form>
    `;

    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    modal.show();
  },

  async saveRule(e, ruleId) {
    e.preventDefault();
    const form = e.target;
    const body = {
      low_threshold: parseFloat(form.low_threshold.value),
      optimal_min: parseFloat(form.optimal_min.value),
      optimal_max: parseFloat(form.optimal_max.value),
      high_threshold: parseFloat(form.high_threshold.value),
      guidance_text: form.guidance_text.value
    };

    const res = await AgriAuth.fetch(`/api/admin/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    if (res.success) {
      AgriAuth.toast('Recommendation rule updated.', 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('ruleModal'));
      if (modal) modal.hide();
      this.initSettings();
    } else {
      AgriAuth.toast(res.message || 'Error updating rule', 'error');
    }
  }
};

window.AgriAdmin = AgriAdmin;
