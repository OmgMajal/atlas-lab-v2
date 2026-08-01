(function () {
  function xml(value) {
    return String(value == null ? '' : value).replace(/[<>&"']/g, function (char) {
      return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char];
    });
  }

  function colName(index) {
    var name = '';
    var n = index + 1;
    while (n > 0) {
      var mod = (n - 1) % 26;
      name = String.fromCharCode(65 + mod) + name;
      n = Math.floor((n - mod) / 26);
    }
    return name;
  }

  function cell(value, row, column) {
    var ref = colName(column) + row;
    if (typeof value === 'number' && isFinite(value)) return '<c r="' + ref + '"><v>' + value + '</v></c>';
    return '<c r="' + ref + '" t="inlineStr"><is><t>' + xml(value) + '</t></is></c>';
  }

  function sheetXml(sheet) {
    var rows = sheet.rows || [];
    var maxCols = rows.reduce(function (max, row) { return Math.max(max, row.length); }, 1);
    var cols = '<cols>';
    for (var c = 0; c < maxCols; c += 1) cols += '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + Math.max(12, Math.min(34, sheet.widths && sheet.widths[c] || 18)) + '" customWidth="1"/>';
    cols += '</cols>';
    var body = rows.map(function (row, rowIndex) {
      var r = rowIndex + 1;
      return '<row r="' + r + '">' + row.map(function (value, columnIndex) {
        return cell(value, r, columnIndex);
      }).join('') + '</row>';
    }).join('');
    var dimension = 'A1:' + colName(maxCols - 1) + Math.max(rows.length, 1);
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<dimension ref="' + dimension + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      cols + '<sheetData>' + body + '</sheetData><autoFilter ref="' + dimension + '"/></worksheet>';
  }

  function utf8(text) {
    return new TextEncoder().encode(text);
  }

  function crc32(bytes) {
    var table = crc32.table || (crc32.table = Array.from({ length: 256 }, function (_, n) {
      var c = n;
      for (var k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c >>> 0;
    }));
    var crc = -1;
    for (var i = 0; i < bytes.length; i += 1) crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xff];
    return (crc ^ -1) >>> 0;
  }

  function u16(value) {
    return [value & 255, (value >>> 8) & 255];
  }

  function u32(value) {
    return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
  }

  function flatten(parts) {
    var total = parts.reduce(function (sum, part) { return sum + part.length; }, 0);
    var out = new Uint8Array(total);
    var offset = 0;
    parts.forEach(function (part) {
      out.set(part, offset);
      offset += part.length;
    });
    return out;
  }

  function zip(files) {
    var localParts = [];
    var centralParts = [];
    var offset = 0;
    files.forEach(function (file) {
      var nameBytes = utf8(file.name);
      var data = utf8(file.content);
      var crc = crc32(data);
      var local = flatten([
        new Uint8Array([80, 75, 3, 4].concat(u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0))),
        nameBytes,
        data
      ]);
      localParts.push(local);
      centralParts.push(flatten([
        new Uint8Array([80, 75, 1, 2].concat(u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))),
        nameBytes
      ]));
      offset += local.length;
    });
    var central = flatten(centralParts);
    var end = new Uint8Array([80, 75, 5, 6].concat(u16(0), u16(0), u16(files.length), u16(files.length), u32(central.length), u32(offset), u16(0)));
    return new Blob([flatten(localParts), central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function workbook(sheets) {
    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      sheets.map(function (_, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') +
      '</Types>';
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    var workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map(function (_, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
      '</Relationships>';
    var workbookXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheets.map(function (sheet, i) { return '<sheet name="' + xml(sheet.name).slice(0, 31) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') +
      '</sheets></workbook>';
    var files = [
      { name: '[Content_Types].xml', content: contentTypes },
      { name: '_rels/.rels', content: rels },
      { name: 'xl/workbook.xml', content: workbookXml },
      { name: 'xl/_rels/workbook.xml.rels', content: workbookRels }
    ];
    sheets.forEach(function (sheet, i) {
      files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', content: sheetXml(sheet) });
    });
    return zip(files);
  }

  window.AtlasXlsxService = { workbook: workbook };
})();
