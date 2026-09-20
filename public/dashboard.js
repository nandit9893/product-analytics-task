(() => {
  const chartData = window.productDashboardCharts;
  if (!chartData || typeof Chart === 'undefined') return;

  const categoryCanvas = document.querySelector('#products-by-category');
  const countryCanvas = document.querySelector('#products-by-country');

  if (categoryCanvas) {
    new Chart(categoryCanvas, {
      type: 'bar',
      data: {
        labels: chartData.categories.labels,
        datasets: [{
          label: 'Products',
          data: chartData.categories.values,
          backgroundColor: '#f9df56',
          borderColor: '#1e1e1e',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  if (countryCanvas) {
    new Chart(countryCanvas, {
      type: 'pie',
      data: {
        labels: chartData.countries.labels,
        datasets: [{
          data: chartData.countries.values,
          backgroundColor: ['#f9df56', '#1e1e1e', '#6f8f72', '#d98c5f', '#8ca3b8', '#c7b8d6'],
          borderColor: '#ffffff',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }
})();
