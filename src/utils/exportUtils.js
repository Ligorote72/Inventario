/**
 * Converts an array of objects to a CSV string and triggers a download.
 * @param {object[]} data - Array of objects to export.
 * @param {string} filename - The filename for the downloaded CSV.
 */
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(';'), // Use semicolon for Excel compatibility in Spanish locale
    ...data.map(row =>
      headers.map(header => {
        const val = row[header] == null ? '' : row[header];
        // Wrap in quotes if it contains semicolons, quotes, or newlines
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(';')
    )
  ];

  const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for Excel UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats inventory data into a flat, clean object for CSV export.
 */
export function formatInventoryForExport(inventory) {
  return inventory.map(item => ({
    'SKU': item.sku || 'N/A',
    'Nombre': item.name,
    'Categoría': item.category || 'Sin categoría',
    'Stock Actual': item.quantity,
    'Stock Mínimo': item.minStock || 0,
    'Precio Costo (COP)': item.costPrice || item.price || 0,
    'Precio Venta (COP)': item.salePrice || item.price || 0,
    'Ganancia c/u (COP)': (item.salePrice || item.price || 0) - (item.costPrice || item.price || 0),
    'Valor en Inventario (COP)': item.quantity * (item.costPrice || item.price || 0),
    'Fecha Registro': item.dateAdded ? new Date(item.dateAdded).toLocaleDateString('es-CO') : 'N/A',
  }));
}

/**
 * Formats movements data into a flat, clean object for CSV export.
 */
export function formatMovementsForExport(movements) {
  return movements.map(m => ({
    'Fecha': new Date(m.date).toLocaleString('es-CO'),
    'Tipo': m.type === 'buy' ? 'Compra / Entrada' : 'Venta / Salida',
    'Producto': m.productName,
    'SKU': m.sku || 'N/A',
    'Cantidad': m.quantity,
    'Precio Unitario (COP)': m.unitPrice,
    'Total Movimiento (COP)': m.quantity * m.unitPrice,
  }));
}
