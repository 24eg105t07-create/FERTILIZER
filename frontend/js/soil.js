/**
 * AgriWise: Soil Testing & Soil Details Helper Logic
 */

const AgriSoil = {
  interpretParameter(name, val) {
    const v = parseFloat(val);
    if (isNaN(v)) return { status: 'NOT TESTED', cls: 'secondary' };

    switch (name.toLowerCase()) {
      case 'nitrogen':
        if (v < 280) return { status: 'LOW', cls: 'danger', tip: 'Deficient. Split nitrogen dressing required.' };
        if (v <= 560) return { status: 'OPTIMAL', cls: 'success', tip: 'Adequate available nitrogen.' };
        return { status: 'HIGH', cls: 'primary', tip: 'Elevated. Reduce basal nitrogen.' };

      case 'phosphorus':
        if (v < 23) return { status: 'LOW', cls: 'danger', tip: 'Deficient. Early root growth and tillering at risk.' };
        if (v <= 56) return { status: 'OPTIMAL', cls: 'success', tip: 'Optimal available phosphorus.' };
        return { status: 'HIGH', cls: 'primary', tip: 'High reserve.' };

      case 'potassium':
        if (v < 145) return { status: 'LOW', cls: 'danger', tip: 'Deficient. Weak stems and disease susceptibility.' };
        if (v <= 335) return { status: 'OPTIMAL', cls: 'success', tip: 'Favorable potassium buffer.' };
        return { status: 'HIGH', cls: 'primary', tip: 'Abundant available potassium.' };

      case 'ph':
        if (v < 6.5) return { status: 'ACIDIC', cls: 'warning', tip: 'May fix phosphorus and reduce molybdenum.' };
        if (v <= 7.5) return { status: 'OPTIMAL', cls: 'success', tip: 'Ideal neutral reaction.' };
        return { status: 'ALKALINE', cls: 'info', tip: 'Alkaline. May reduce zinc and iron availability.' };

      case 'ec':
        if (v < 1.0) return { status: 'NORMAL', cls: 'success', tip: 'Safe non-saline condition.' };
        if (v <= 2.0) return { status: 'ELEVATED', cls: 'warning', tip: 'Critical salinity threshold.' };
        return { status: 'HIGH', cls: 'danger', tip: 'Saline risk.' };

      case 'organic_carbon':
        if (v < 0.50) return { status: 'LOW', cls: 'danger', tip: 'Severely depleted organic humus.' };
        if (v <= 0.75) return { status: 'MEDIUM', cls: 'warning', tip: 'Moderate organic carbon.' };
        return { status: 'HIGH', cls: 'success', tip: 'Rich biological soil health.' };

      default:
        return { status: 'RECORDED', cls: 'secondary' };
    }
  },

  async initSoilHistory() {
    if (!AgriAuth.guard('farmer')) return;
    AgriAuth.initUI();

    const res = await AgriAuth.fetch('/api/farmer/soil-history');
    const tableBody = document.getElementById('soil-history-table');
    if (!tableBody) return;

    if (!res.success || !res.history || res.history.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No historical soil tests found. Submit multiple tests over time to compare soil health trends.</td></tr>';
      return;
    }

    tableBody.innerHTML = res.history.map(h => `
      <tr>
        <td class="fw-bold">${h.sample_id}</td>
        <td>${new Date(h.test_date).toLocaleDateString()}</td>
        <td>${h.farm_name} &bull; ${h.field_name}</td>
        <td>${h.current_crop || 'Wheat'}</td>
        <td><span class="badge ${h.nitrogen_status === 'LOW' ? 'badge-low' : 'badge-optimal'}">${h.nitrogen || '-'} (${h.nitrogen_status || 'N/A'})</span></td>
        <td><span class="badge ${h.phosphorus_status === 'LOW' ? 'badge-low' : 'badge-optimal'}">${h.phosphorus || '-'} (${h.phosphorus_status || 'N/A'})</span></td>
        <td><span class="badge ${h.potassium_status === 'LOW' ? 'badge-low' : 'badge-optimal'}">${h.potassium || '-'} (${h.potassium_status || 'N/A'})</span></td>
        <td><span class="badge ${h.ph_status === 'OPTIMAL' ? 'badge-optimal' : 'badge-alkaline'}">${h.ph || '-'}</span></td>
        <td><span class="badge ${h.organic_carbon_status === 'LOW' ? 'badge-low' : 'badge-optimal'}">${h.organic_carbon || '-'}%</span></td>
      </tr>
    `).join('');

    // Render trend chart
    if (document.getElementById('soil-history-trend-chart')) {
      AgriCharts.renderSoilHistoryTrend('soil-history-trend-chart', res.history);
    }
  }
};

window.AgriSoil = AgriSoil;
