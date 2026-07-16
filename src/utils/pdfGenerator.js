import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateReceiptPDF = (movement, settings) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200] // Formato ticket de caja 80mm de ancho, altura dinámica
  });

  const companyName = settings?.company_name || 'InvPro';
  
  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 40, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Recibo de Venta', 40, 22, { align: 'center' });
  doc.text('----------------------------------', 40, 27, { align: 'center' });

  // Info
  doc.setFontSize(9);
  doc.text(`Fecha: ${new Date(movement.date).toLocaleString()}`, 5, 33);
  doc.text(`Cliente: ${movement.customerName || 'Consumidor Final'}`, 5, 38);
  
  doc.text('----------------------------------', 40, 43, { align: 'center' });

  // Details Table
  doc.autoTable({
    startY: 46,
    margin: { left: 5, right: 5 },
    head: [['Cant.', 'Descripción', 'Total']],
    body: [
      [
        movement.quantity, 
        movement.productName, 
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(movement.quantity * movement.unitPrice)
      ]
    ],
    theme: 'plain',
    headStyles: { fontStyle: 'bold', fontSize: 9, halign: 'center' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 35 },
      2: { halign: 'right', cellWidth: 20 }
    }
  });

  const finalY = doc.lastAutoTable.finalY || 60;

  doc.text('----------------------------------', 40, finalY + 5, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const totalStr = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(movement.quantity * movement.unitPrice);
  doc.text(`TOTAL: ${totalStr}`, 75, finalY + 12, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('¡Gracias por su compra!', 40, finalY + 22, { align: 'center' });

  doc.save(`Recibo_${movement.id}.pdf`);
};
