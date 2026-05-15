window.App = window.App || {};
window.App.Services = window.App.Services || {};

App.Services.PDF = (() => {
  const { Format } = App.Utils;

  function getJsPDF() {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    if (window.jsPDF) return window.jsPDF;
    throw new Error('jsPDF не завантажено');
  }

  async function generate(projectId, { from, to, includePhotos = true } = {}) {
    const jsPDF = getJsPDF();
    const [project, sessions, travel, allPhotos, settings] = await Promise.all([
      App.DB.projects.getById(projectId),
      from && to ? App.DB.workSessions.getByProjectAndRange(projectId, from, to) : App.DB.workSessions.getByProject(projectId),
      from && to ? App.DB.travelRecords.getByProjectAndRange(projectId, from, to) : App.DB.travelRecords.getByProject(projectId),
      App.DB.photos.getByProject(projectId),
      App.DB.settings.get(),
    ]);

    sessions.sort((a, b) => a.date.localeCompare(b.date));
    travel.sort((a, b) => a.date.localeCompare(b.date));

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const PW = 210, PH = 297;
    const ML = 14, MR = 14, MT = 14;
    const CW = PW - ML - MR;
    let y = MT;

    const primary = [37, 99, 235];
    const textDark = [15, 23, 42];
    const textMuted = [100, 116, 139];
    const border = [226, 232, 240];
    const successBg = [240, 253, 244];
    const successBorder = [187, 247, 208];

    function checkPage(need = 20) {
      if (y + need > PH - 14) { doc.addPage(); y = MT; }
    }

    function hline(color = border) {
      doc.setDrawColor(...color);
      doc.setLineWidth(0.3);
      doc.line(ML, y, PW - MR, y);
      y += 3;
    }

    /* ── Header ── */
    doc.setFillColor(...primary);
    doc.rect(0, 0, PW, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Звіт про виконані роботи', ML, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (settings.workerName) doc.text(settings.workerName, ML, 24);
    if (settings.workerPhone) doc.text(settings.workerPhone, ML, 30);

    const periodLabel = from && to ? `${Format.date(from)} — ${Format.date(to)}` : 'Весь час';
    doc.text('Період: ' + periodLabel, PW - MR, 24, { align: 'right' });
    const genDate = Format.date(Format.todayISO());
    doc.text('Дата формування: ' + genDate, PW - MR, 30, { align: 'right' });

    y = 44;

    /* ── Project info ── */
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(ML, y, CW, 28, 2, 2, 'F');
    doc.setTextColor(...textDark);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(project.name || 'Без назви', ML + 4, y + 8);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    if (project.clientName) { doc.text('Клієнт: ' + project.clientName, ML + 4, y + 16); }
    if (project.address)    { doc.text('Адреса: ' + project.address,    ML + 4, y + 22); }
    y += 34;

    /* ── Work sessions table ── */
    const totalHours  = sessions.reduce((s, r) => s + (r.durationHours || 0), 0);
    const totalWork   = sessions.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const totalKm     = travel.reduce((s, r) => s + (r.kilometers || 0), 0);
    const totalTravel = travel.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const grandTotal  = totalWork + totalTravel;

    if (sessions.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('Робочі сесії', ML, y);
      y += 5;

      const sessionRows = sessions.map((s, i) => [
        i + 1,
        Format.date(s.date),
        s.description || '—',
        (s.durationHours || 0).toFixed(2),
        '€' + (s.hourlyRate || 0).toFixed(2),
        '€' + (s.totalAmount || 0).toFixed(2),
      ]);
      sessionRows.push(['', '', 'Разом', totalHours.toFixed(2) + ' год', '', '€' + totalWork.toFixed(2)]);

      doc.autoTable({
        startY: y,
        head: [['№', 'Дата', 'Опис робіт', 'Годин', 'Ставка', 'Сума']],
        body: sessionRows,
        margin: { left: ML, right: MR },
        styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: border, lineWidth: 0.2 },
        headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: 8 },
        footStyles: { fillColor: [241, 245, 249], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 22 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 20, halign: 'right' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell(data) {
          if (data.row.index === sessionRows.length - 1) {
            data.cell.styles.fillColor = [241, 245, 249];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    /* ── Travel table ── */
    if (travel.length > 0) {
      checkPage(30);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('Кілометраж', ML, y);
      y += 5;

      const travelRows = travel.map((t, i) => [
        i + 1,
        Format.date(t.date),
        [t.fromAddress, t.toAddress].filter(Boolean).join(' → ') || '—',
        (t.kilometers || 0).toFixed(1),
        '€' + (t.ratePerKm || 0).toFixed(2),
        '€' + (t.totalAmount || 0).toFixed(2),
      ]);
      travelRows.push(['', '', 'Разом', totalKm.toFixed(1) + ' км', '', '€' + totalTravel.toFixed(2)]);

      doc.autoTable({
        startY: y,
        head: [['№', 'Дата', 'Маршрут', 'КМ', 'Ставка', 'Сума']],
        body: travelRows,
        margin: { left: ML, right: MR },
        styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: border, lineWidth: 0.2 },
        headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 22 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 18, halign: 'right' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell(data) {
          if (data.row.index === travelRows.length - 1) {
            data.cell.styles.fillColor = [255, 251, 235];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    /* ── Summary ── */
    checkPage(40);
    doc.setFillColor(...successBg);
    doc.setDrawColor(...successBorder);
    doc.setLineWidth(0.4);
    doc.roundedRect(ML, y, CW, 36, 2, 2, 'FD');

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);

    const rows = [
      ['Разом годин:', Format.duration(totalHours)],
      ['Сума за роботу:', '€' + totalWork.toFixed(2)],
      ['Разом км:', Format.km(totalKm)],
      ['Сума за дорогу:', '€' + totalTravel.toFixed(2)],
    ];
    rows.forEach(([label, val], i) => {
      doc.text(label, ML + 4, y + 8 + i * 6);
      doc.text(val, PW - MR - 4, y + 8 + i * 6, { align: 'right' });
    });

    doc.setDrawColor(...successBorder);
    doc.setLineWidth(0.4);
    doc.line(ML + 4, y + 29, PW - MR - 4, y + 29);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text('РАЗОМ ДО ОПЛАТИ:', ML + 4, y + 35);
    doc.text('€' + grandTotal.toFixed(2), PW - MR - 4, y + 35, { align: 'right' });
    y += 44;

    /* ── Photos ── */
    if (includePhotos && allPhotos.length > 0) {
      doc.addPage();
      y = MT;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('Фотоматеріали', ML, y);
      y += 6;
      hline(primary);

      const photoW = (CW - 8) / 2;
      const photoH = photoW * 0.75;
      let col = 0;

      for (const photo of allPhotos) {
        checkPage(photoH + 12);
        const x = ML + col * (photoW + 8);
        try {
          doc.addImage(photo.dataUrl, 'JPEG', x, y, photoW, photoH);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...textMuted);
          const caption = [photo.caption, photo.takenAt ? Format.date(photo.takenAt.slice(0, 10)) : ''].filter(Boolean).join(' — ');
          doc.text(caption || photo.filename, x, y + photoH + 4, { maxWidth: photoW });
        } catch { /* skip corrupt photo */ }

        col++;
        if (col === 2) { col = 0; y += photoH + 12; }
      }
    }

    /* ── Footer on each page ── */
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textMuted);
      doc.text(`Сторінка ${i} / ${pageCount}`, PW / 2, PH - 8, { align: 'center' });
      if (settings.workerName) doc.text(settings.workerName, ML, PH - 8);
    }

    const filename = `Звіт_${(project.name || 'Проект').replace(/\s+/g, '_')}_${from || Format.todayISO()}.pdf`;
    doc.save(filename);
    return filename;
  }

  return { generate };
})();
