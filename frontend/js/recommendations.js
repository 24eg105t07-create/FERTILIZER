/**
 * AgriWise: Farmer Recommendation Detail View Logic
 */

const AgriRecommendations = {
  async initDetailView() {
    if (!AgriAuth.guard('farmer')) return;
    AgriAuth.initUI();

    const urlParams = new URLSearchParams(window.location.search);
    const recId = urlParams.get('id');

    if (!recId) {
      window.location.href = '/farmer/recommendations.html';
      return;
    }

    const res = await AgriAuth.fetch(`/api/farmer/recommendations/${recId}`);
    if (!res.success || !res.recommendation) {
      AgriAuth.toast(res.message || 'Recommendation not found or pending approval.', 'error');
      setTimeout(() => { window.location.href = '/farmer/recommendations.html'; }, 1500);
      return;
    }

    const r = res.recommendation;
    const p = r.parameters || {};
    const a = r.analysis || {};
    const schedules = r.schedules || [];

    // Header Meta
    document.getElementById('rec-field-title').textContent = `${r.field_name} (${r.farm_name})`;
    document.getElementById('rec-crop-badge').textContent = `Target Crop: ${r.current_crop || 'Field Crop'}`;
    document.getElementById('rec-sample-id').textContent = r.sample_id;
    document.getElementById('rec-test-date').textContent = new Date(r.test_date).toLocaleDateString();
    document.getElementById('rec-agronomist').textContent = r.agronomist_name || 'AgriWise Expert Panel';

    // Nutrient Visual Cards
    this.renderNutrientCards(p, a);

    // Soil Attention Summary
    const attentionBox = document.getElementById('soil-attention-box');
    if (attentionBox && a.analysis_text) {
      attentionBox.innerHTML = `
        <div class="soil-attention-banner">
          <div class="soil-attention-title">
            <i class="bi bi-exclamation-triangle-fill"></i> Your Soil Needs Attention
          </div>
          <p class="soil-attention-body">${a.analysis_text}</p>
        </div>
      `;
    }

    // Recommendation Plan Card
    document.getElementById('rec-priority-nutrient').textContent = r.priority_nutrient;
    document.getElementById('rec-fertilizer-name').textContent = r.fertilizer_name;
    document.getElementById('rec-plan-text').textContent = r.recommendation_text;
    document.getElementById('rec-timing-text').textContent = r.application_timing || 'Basal at sowing + Split top dressing';
    document.getElementById('rec-method-text').textContent = r.application_method || 'Band placement below seed row';

    // Explainability Box ("WHY THIS RECOMMENDATION")
    const explainBox = document.getElementById('rec-explain-box');
    if (explainBox) {
      explainBox.textContent = r.explanation || 'Specific interpretation should be validated using appropriate regional agronomic guidance.';
    }

    // Soil Improvement Suggestions
    const improveBox = document.getElementById('rec-improvement-box');
    if (improveBox) {
      improveBox.textContent = r.soil_improvement_suggestions || 'Maintain regular additions of farmyard manure to sustain microbial life.';
    }

    // Warnings Box
    const warningBox = document.getElementById('rec-warning-box');
    if (warningBox) {
      warningBox.textContent = r.warnings || 'Demo Rule / Simulated Recommendation — Specific fertilizer rate requires validated local agronomic guidance.';
    }

    // Render 6-Stage Schedule Timeline
    const timelineContainer = document.getElementById('schedule-timeline-container');
    if (timelineContainer) {
      if (schedules.length === 0) {
        timelineContainer.innerHTML = '<p class="text-muted small">No specific schedule stages configured.</p>';
      } else {
        timelineContainer.innerHTML = schedules.map(stg => `
          <div class="schedule-stage-card">
            <div class="schedule-stage-dot"></div>
            <div class="stage-title">
              <span>Stage ${stg.stage_order}: ${stg.stage.replace(/_/g, ' ')}</span>
              <span class="stage-category-chip">${stg.fertilizer_category || 'General Amendment'}</span>
            </div>
            <div class="stage-meta">
              <div class="stage-meta-item">
                <strong>Focus Nutrient:</strong> ${stg.nutrient || 'Balanced Nutrition'}
              </div>
              <div class="stage-meta-item">
                <strong>Application Timing:</strong> ${stg.timing || 'As per crop cycle'}
              </div>
              <div class="stage-meta-item">
                <strong>Application Method:</strong> ${stg.method || 'Standard Application'}
              </div>
              <div class="stage-meta-item">
                <strong>Status:</strong> <span class="badge ${stg.status === 'Completed' ? 'bg-success' : 'bg-primary'}">${stg.status}</span>
              </div>
            </div>
            ${stg.notes ? `<p class="mt-2 mb-0 small text-secondary" style="line-height: 1.4;">${stg.notes}</p>` : ''}
          </div>
        `).join('');
      }
    }
  },

  renderNutrientCards(p, a) {
    const container = document.getElementById('nutrient-cards-container');
    if (!container) return;

    const cards = [
      {
        sym: 'N',
        name: 'Nitrogen',
        val: p.nitrogen !== null && p.nitrogen !== undefined ? `${p.nitrogen}` : 'N/A',
        unit: 'kg/ha',
        status: a.nitrogen_status || 'MEDIUM',
        cls: (a.nitrogen_status || 'medium').toLowerCase()
      },
      {
        sym: 'P',
        name: 'Phosphorus',
        val: p.phosphorus !== null && p.phosphorus !== undefined ? `${p.phosphorus}` : 'N/A',
        unit: 'kg/ha',
        status: a.phosphorus_status || 'MEDIUM',
        cls: (a.phosphorus_status || 'medium').toLowerCase()
      },
      {
        sym: 'K',
        name: 'Potassium',
        val: p.potassium !== null && p.potassium !== undefined ? `${p.potassium}` : 'N/A',
        unit: 'kg/ha',
        status: a.potassium_status || 'OPTIMAL',
        cls: (a.potassium_status || 'optimal').toLowerCase()
      },
      {
        sym: 'pH',
        name: 'Soil Reaction',
        val: p.ph !== null && p.ph !== undefined ? `${p.ph}` : 'N/A',
        unit: 'Scale',
        status: a.ph_status || 'OPTIMAL',
        cls: (a.ph_status || 'optimal').toLowerCase()
      },
      {
        sym: 'EC',
        name: 'Conductivity',
        val: p.ec !== null && p.ec !== undefined ? `${p.ec}` : 'N/A',
        unit: 'dS/m',
        status: a.ec_status || 'NORMAL',
        cls: (a.ec_status === 'NORMAL' ? 'optimal' : 'medium').toLowerCase()
      },
      {
        sym: 'OC',
        name: 'Organic Carbon',
        val: p.organic_carbon !== null && p.organic_carbon !== undefined ? `${p.organic_carbon}%` : 'N/A',
        unit: 'Weight %',
        status: a.organic_carbon_status || 'LOW',
        cls: (a.organic_carbon_status || 'low').toLowerCase()
      }
    ];

    container.innerHTML = cards.map(c => `
      <div class="nutrient-card status-${c.cls}">
        <div class="nutrient-symbol">${c.sym}</div>
        <div class="nutrient-name">${c.name}</div>
        <div class="nutrient-value">${c.val} <span class="nutrient-unit">${c.unit}</span></div>
        <div class="nutrient-badge badge-${c.cls}">${c.status}</div>
      </div>
    `).join('');
  },

  printReport() {
    window.print();
  }
};

window.AgriRecommendations = AgriRecommendations;
