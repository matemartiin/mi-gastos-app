export class ReportManager {
  generate(data) {
    const container = document.getElementById('report-content');
    container.innerHTML = '';

    // Summary section
    const summarySection = this.createSection('Resumen del Mes', [
      { label: 'Ingresos Totales', value: this.formatCurrency(data.balance.totalIncome) },
      { label: 'Gastos Totales', value: this.formatCurrency(data.balance.totalExpenses) },
      { label: 'Balance', value: this.formatCurrency(data.balance.available) },
      { label: 'Cuotas Activas', value: data.balance.installments }
    ]);
    container.appendChild(summarySection);

    // Category breakdown
    const categorySection = this.createCategorySection('Gastos por Categoría', data.byCategory);
    container.appendChild(categorySection);

    // Recommendations
    if (data.recommendations.length > 0) {
      const recommendationsSection = this.createRecommendationsSection(data.recommendations);
      container.appendChild(recommendationsSection);
    }

    // Setup download functionality
    this.setupDownload(data);
  }

  createSection(title, items) {
    const section = document.createElement('div');
    section.className = 'report-section';
    
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    
    const grid = document.createElement('div');
    grid.className = 'report-grid';
    
    items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'report-item';
      itemElement.innerHTML = `
        <div class="report-item-label">${item.label}</div>
        <div class="report-item-value">${item.value}</div>
      `;
      grid.appendChild(itemElement);
    });
    
    section.appendChild(grid);
    return section;
  }

  createCategorySection(title, categories) {
    const section = document.createElement('div');
    section.className = 'report-section';
    
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    
    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
    
    Object.entries(categories).forEach(([category, amount]) => {
      const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
      
      const item = document.createElement('div');
      item.className = 'report-item';
      item.innerHTML = `
        <div class="report-item-label">${category}</div>
        <div class="report-item-value">${this.formatCurrency(amount)} (${percentage}%)</div>
      `;
      section.appendChild(item);
    });
    
    return section;
  }

  createRecommendationsSection(recommendations) {
    const section = document.createElement('div');
    section.className = 'report-section';
    
    const recommendations_div = document.createElement('div');
    recommendations_div.className = 'report-recommendations';
    
    const heading = document.createElement('h4');
    heading.textContent = 'Recomendaciones';
    recommendations_div.appendChild(heading);
    
    const list = document.createElement('ul');
    recommendations.forEach(rec => {
      const item = document.createElement('li');
      item.textContent = rec;
      list.appendChild(item);
    });
    
    recommendations_div.appendChild(list);
    section.appendChild(recommendations_div);
    
    return section;
  }

  setupDownload(data) {
    const downloadBtn = document.getElementById('download-report-btn');
    downloadBtn.onclick = () => this.downloadReport(data);
  }

  downloadReport(data) {
    let content = `Informe Financiero - ${data.month}\n\n`;
    
    content += `RESUMEN\n`;
    content += `Ingresos Totales: ${this.formatCurrency(data.balance.totalIncome)}\n`;
    content += `Gastos Totales: ${this.formatCurrency(data.balance.totalExpenses)}\n`;
    content += `Balance: ${this.formatCurrency(data.balance.available)}\n`;
    content += `Cuotas Activas: ${data.balance.installments}\n\n`;
    
    content += `GASTOS POR CATEGORÍA\n`;
    const total = Object.values(data.byCategory).reduce((sum, amount) => sum + amount, 0);
    Object.entries(data.byCategory).forEach(([category, amount]) => {
      const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
      content += `${category}: ${this.formatCurrency(amount)} (${percentage}%)\n`;
    });
    
    if (data.recommendations.length > 0) {
      content += `\nRECOMENDACIONES\n`;
      data.recommendations.forEach(rec => {
        content += `• ${rec}\n`;
      });
    }
    
    this.downloadFile(content, `informe-${data.month}.txt`, 'text/plain');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}