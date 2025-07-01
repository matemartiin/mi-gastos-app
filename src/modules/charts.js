export class ChartManager {
  constructor() {
    this.expensesChart = null;
    this.trendChart = null;
  }

  updateExpensesChart(data) {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) return;

    if (this.expensesChart) {
      this.expensesChart.destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = this.generateColors(labels.length);

    this.expensesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: $${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  updateTrendChart(data) {
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const labels = data.map(item => item.label);
    const values = data.map(item => item.total);

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Gastos Mensuales',
          data: values,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#6366f1',
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                return `Gastos: $${context.raw.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                size: 12
              },
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  generateColors(count) {
    const colors = [
      '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981',
      '#6b7280', '#9ca3af', '#f97316', '#06b6d4', '#84cc16'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    
    return result;
  }

  destroy() {
    if (this.expensesChart) {
      this.expensesChart.destroy();
    }
    if (this.trendChart) {
      this.trendChart.destroy();
    }
  }
}