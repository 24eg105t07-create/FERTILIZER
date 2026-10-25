/**
 * AgriWise: Chart.js Visualizations Manager
 */

const AgriCharts = {
  /**
   * Render NPK Comparison Bar Chart
   */
  renderNPKChart(canvasId, params) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return null;

    const n = params?.nitrogen || 0;
    const p = params?.phosphorus || 0;
    const k = params?.potassium || 0;

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)'],
        datasets: [
          {
            label: 'Your Soil (kg/ha)',
            data: [n, p, k],
            backgroundColor: [
              n < 280 ? 'rgba(217, 4, 41, 0.75)' : 'rgba(42, 157, 143, 0.75)',
              p < 23 ? 'rgba(217, 4, 41, 0.75)' : 'rgba(42, 157, 143, 0.75)',
              k < 145 ? 'rgba(217, 4, 41, 0.75)' : 'rgba(42, 157, 143, 0.75)'
            ],
            borderColor: [
              n < 280 ? '#d90429' : '#2a9d8f',
              p < 23 ? '#d90429' : '#2a9d8f',
              k < 145 ? '#d90429' : '#2a9d8f'
            ],
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: 'Optimal Threshold (Target)',
            data: [280, 23, 145],
            type: 'line',
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            pointBackgroundColor: '#f59e0b',
            borderWidth: 2,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              afterBody: function(context) {
                const idx = context[0].dataIndex;
                if (idx === 0) return 'Benchmark: <280 Low | 280-560 Medium | >560 High';
                if (idx === 1) return 'Benchmark: <23 Low | 23-56 Medium | >56 High';
                if (idx === 2) return 'Benchmark: <145 Low | 145-335 Medium | >335 High';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Nutrient Value (kg/ha)' },
            grid: { color: 'rgba(0, 0, 0, 0.04)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  },

  /**
   * Render Multi-Test Soil Trend Line Chart
   */
  renderSoilHistoryTrend(canvasId, tests) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined' || !tests || tests.length === 0) return null;

    const labels = tests.map(t => `${t.sample_id} (${t.test_date})`);
    const nData = tests.map(t => t.nitrogen || 0);
    const pData = tests.map(t => t.phosphorus || 0);
    const kData = tests.map(t => t.potassium || 0);
    const ocData = tests.map(t => (t.organic_carbon || 0) * 100); // scaled for display

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Nitrogen (kg/ha)',
            data: nData,
            borderColor: '#2d6a4f',
            backgroundColor: 'rgba(45, 106, 79, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Phosphorus (kg/ha)',
            data: pData,
            borderColor: '#e76f51',
            tension: 0.3
          },
          {
            label: 'Potassium (kg/ha)',
            data: kData,
            borderColor: '#3a86ff',
            tension: 0.3
          },
          {
            label: 'Organic Carbon (x100 %)',
            data: ocData,
            borderColor: '#7f4f24',
            borderDash: [4, 4],
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } }
        }
      }
    });
  },

  /**
   * Render Deficiencies Breakdown for Admin
   */
  renderDeficienciesChart(canvasId, defMap) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return null;

    const labels = Object.keys(defMap);
    const data = Object.values(defMap);

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#8b5cf6', '#10b981'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  },

  /**
   * Render Crop Distribution for Admin
   */
  renderCropDistribution(canvasId, crops) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return null;

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: crops.map(c => c.crop),
        datasets: [{
          label: 'Total Fields Registered',
          data: crops.map(c => c.count),
          backgroundColor: '#40916c',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }
};

window.AgriCharts = AgriCharts;
