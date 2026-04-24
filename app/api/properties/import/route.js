import { inflateRawSync } from "zlib";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ownerFromRequest } from "../../../../lib/adminAuth";
import {
  categoryLabelToValue,
  normalizeProperty,
  normalizePropertyCategory,
  readProperties,
  writeProperties
} from "../../../../lib/properties";

const fields = [
  "id",
  "title",
  "area",
  "building",
  "inventory_type",
  "property_type",
  "bedrooms",
  "size",
  "price",
  "view",
  "furnishing",
  "status",
  "short_description",
  "notes",
  "image_url",
  "featured",
  "whatsapp_link",
  "owner"
];

const requiredFields = ["id", "title", "area", "building", "price", "inventory_type"];
const validCategories = new Set(["ready", "off-plan", "resale-off-plan"]);
const validTypes = new Set(["apartment", "villa", "townhouse", "penthouse"]);

const columnAliases = {
  id: ["id", "property id", "ref", "reference", "property ref"],
  title: ["title", "property", "property title", "unit", "unit type", "bed-room", "bedroom type", "bedrooms type"],
  area: ["area", "location", "district", "community"],
  building: ["building", "project", "building/project", "building name", "project name"],
  inventory_type: ["inventory_type", "inventory type", "inventory", "listing type", "inventory category"],
  category: ["category", "status category", "ready/off-plan", "ready off-plan"],
  property_type: ["property_type", "property type", "type", "unit category"],
  bedrooms: ["bedrooms", "bedroom", "beds", "bed", "br", "bed-room", "bed room"],
  size: ["size", "size sqft", "size(sqft)", "sqft", "built up area", "bua"],
  price: ["price", "asking price", "selling price", "amount"],
  view: ["view", "views", "unit view"],
  furnishing: ["furnishing", "furnished", "furniture"],
  status: ["status", "availability", "occupancy"],
  short_description: ["short_description", "short description", "description", "summary"],
  notes: ["notes", "note", "remarks", "comment", "comments"],
  image_url: ["image_url", "image url", "image", "photo", "photo url"],
  featured: ["featured", "show on homepage", "homepage"],
  whatsapp_link: ["whatsapp_link", "whatsapp link", "whatsapp"],
  owner: ["owner", "advisor"]
};

function forbidden() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function revalidateInventoryPaths(owner) {
  const basePaths = owner === "negin"
    ? [
        "/negin",
        "/negin/ready-properties",
        "/negin/listings",
        "/negin/resale-off-plan",
        "/negin/off-plan"
      ]
    : [
        "/",
        "/ready-properties",
        "/listings",
        "/resale-off-plan",
        "/off-plan-projects"
      ];

  basePaths.forEach((path) => revalidatePath(path));
}

function parseBoolean(value) {
  return ["true", "yes", "1", "featured"].includes(String(value || "").trim().toLowerCase());
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
}

function schemaFieldForHeader(header) {
  const normalized = normalizeHeader(header);
  return Object.entries(columnAliases).find(([, aliases]) => aliases.map(normalizeHeader).includes(normalized))?.[0] || normalized;
}

function logImportDebug(enabled, label, payload) {
  if (!enabled) return;
  const text = JSON.stringify(payload, null, 2);
  console.log(`[property-import:${label}] ${text.slice(0, 4000)}`);
}

function extractNumber(value) {
  const match = String(value || "").match(/\d+(?:\.\d+)?/);
  return match ? match[0] : "";
}

function normalizePropertyType(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text.includes("town")) return "townhouse";
  if (text.includes("villa")) return "villa";
  if (text.includes("pent")) return "penthouse";
  if (text.includes("apt") || text.includes("flat") || text.includes("residence") || text.includes("bed")) return "apartment";
  return text || "apartment";
}

function applyDerivedFields(row) {
  const next = { ...row };

  if (next.bedrooms) next.bedrooms = extractNumber(next.bedrooms) || next.bedrooms;
  if (!next.bedrooms && next.title) next.bedrooms = extractNumber(next.title);
  if (next.property_type) next.property_type = normalizePropertyType(next.property_type);
  if (!next.property_type) next.property_type = normalizePropertyType(next.title);
  if (!next.notes && next.size) next.notes = `Size: ${next.size}`;

  return next;
}

function mapRowToSchema(row) {
  const mapped = {};

  Object.entries(row || {}).forEach(([header, value]) => {
    const field = schemaFieldForHeader(header);
    if (!field) return;
    mapped[field] = value;
  });

  return applyDerivedFields(mapped);
}

function buildHeaderEntries(headers = []) {
  return headers
    .map((header, index) => {
      const cleanHeader = String(header ?? "").trim();
      return cleanHeader ? { header: cleanHeader, index } : null;
    })
    .filter(Boolean);
}

function rowObjectFromHeaderEntries(headerEntries, cells = []) {
  const row = {};

  headerEntries.forEach(({ header, index }) => {
    row[header] = cells[index] ?? "";
  });

  return row;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function crc32(buffer) {
  let crc = -1;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function zipStore(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach(({ name, content }) => {
    const nameBuffer = Buffer.from(name);
    const data = Buffer.from(content);
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(0, 10);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuffer, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(0, 12);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuffer);

    offset += local.length + nameBuffer.length + data.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeXlsxTemplate() {
  const rows = [
    fields,
    [
      "sample-palm-2br",
      "2 Bedroom",
      "Palm Jumeirah",
      "Golden Mile",
      "Resale Off-Plan",
      "apartment",
      "2",
      "1800 sqft",
      "AED 4,100,000",
      "Partial Sea View",
      "Fully furnished",
      "Vacant",
      "Curated ready home with strong lifestyle appeal.",
      "Add any private notes here",
      "",
      "false",
      "",
      "ali"
    ]
  ];
  const sheetRows = rows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map((cell, cellIndex) => `<c r="${String.fromCharCode(65 + cellIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`)
          .join("")}</row>`
    )
    .join("");
  const sheet = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;

  return zipStore([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Properties" sheetId="1" r:id="rId1"/></sheets></workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`
    },
    { name: "xl/worksheets/sheet1.xml", content: sheet }
  ]);
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function parseCsv(text, debug = false) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  const headerEntries = buildHeaderEntries(headers);
  if (!headerEntries.length) throw new Error("No valid header row found. Please keep row 1 as the column header row.");
  const rawRows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return rowObjectFromHeaderEntries(headerEntries, cells);
  });

  logImportDebug(debug, "csv", {
    headers,
    normalizedHeaders: headerEntries.map(({ header }) => [header, schemaFieldForHeader(header)]),
    firstRawRow: rawRows[0] || null,
    firstMappedRow: rawRows[0] ? mapRowToSchema(rawRows[0]) : null
  });

  return rawRows;
}

function parseAttributes(value = "") {
  return Object.fromEntries(
    [...String(value).matchAll(/([A-Za-z_:][\w:.-]*)="([^"]*)"/g)].map(([, key, attrValue]) => [key, decodeXml(attrValue)])
  );
}

function textNodes(xml = "") {
  return [...String(xml).matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1])).join("");
}

function firstWorksheetName(entries) {
  const workbook = entries["xl/workbook.xml"] || "";
  const rels = entries["xl/_rels/workbook.xml.rels"] || "";
  const firstSheetMatch = workbook.match(/<sheet\b([^>]*)\/?>/);
  const sheetAttributes = parseAttributes(firstSheetMatch?.[1] || "");
  const relationshipId = sheetAttributes["r:id"];

  if (relationshipId && rels) {
    const relationshipMatch = [...rels.matchAll(/<Relationship\b([^>]*)\/?>/g)]
      .map(([, attrs]) => parseAttributes(attrs))
      .find((attrs) => attrs.Id === relationshipId);
    const target = relationshipMatch?.Target || "";
    if (target) {
      const normalizedTarget = target.startsWith("/") ? target.slice(1) : `xl/${target}`.replace(/\/[^/]+\/\.\.\//g, "/");
      if (entries[normalizedTarget]) return normalizedTarget;
    }
  }

  return Object.keys(entries).find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
}

function readUInt32(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

function readUInt16(buffer, offset) {
  return buffer.readUInt16LE(offset);
}

function unzipEntries(buffer) {
  const entries = {};
  const endSignature = 0x06054b50;
  let endOffset = -1;

  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (readUInt32(buffer, index) === endSignature) {
      endOffset = index;
      break;
    }
  }

  if (endOffset === -1) throw new Error("Invalid XLSX file.");

  const centralDirectorySize = readUInt32(buffer, endOffset + 12);
  const centralDirectoryOffset = readUInt32(buffer, endOffset + 16);
  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  while (offset < end) {
    if (readUInt32(buffer, offset) !== 0x02014b50) break;

    const compression = readUInt16(buffer, offset + 10);
    const compressedSize = readUInt32(buffer, offset + 20);
    const nameLength = readUInt16(buffer, offset + 28);
    const extraLength = readUInt16(buffer, offset + 30);
    const commentLength = readUInt16(buffer, offset + 32);
    const localHeaderOffset = readUInt32(buffer, offset + 42);
    const name = buffer.slice(offset + 46, offset + 46 + nameLength).toString("utf8");
    const localNameLength = readUInt16(buffer, localHeaderOffset + 26);
    const localExtraLength = readUInt16(buffer, localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.slice(dataOffset, dataOffset + compressedSize);

    entries[name] = compression === 8 ? inflateRawSync(compressed).toString("utf8") : compressed.toString("utf8");
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function columnIndex(cellRef) {
  const letters = String(cellRef || "").replace(/\d+/g, "");
  return letters.split("").reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseSharedStrings(xml = "") {
  return [...xml.matchAll(/<si[\s\S]*?<\/si>/g)].map(([item]) =>
    textNodes(item)
  );
}

function parseXlsx(buffer, debug = false) {
  const entries = unzipEntries(buffer);
  const sheetName = firstWorksheetName(entries);
  if (!sheetName) throw new Error("Could not find the first worksheet.");
  const sheetXml = entries[sheetName];
  if (!sheetXml) throw new Error("Could not read the first worksheet data.");

  const sharedStrings = parseSharedStrings(entries["xl/sharedStrings.xml"]);
  const rows = [...sheetXml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)].map(([, rowAttrs, rowBody], rowOrder) => {
    const rowNumber = Number(parseAttributes(rowAttrs).r || rowOrder + 1);
    const cells = [];
    for (const [, attrsText, cellBody] of rowBody.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = parseAttributes(attrsText);
      const ref = attrs.r;
      const type = attrs.t || "";
      const raw = cellBody.match(/<v>([\s\S]*?)<\/v>/)?.[1] || "";
      let value = "";

      if (type === "s") {
        value = sharedStrings[Number(raw)] || "";
      } else if (type === "inlineStr") {
        value = textNodes(cellBody);
      } else if (type === "b") {
        value = raw === "1" ? "true" : "false";
      } else {
        value = decodeXml(raw || textNodes(cellBody));
      }

      if (ref) cells[columnIndex(ref)] = value;
    }
    return { rowNumber, cells };
  }).sort((a, b) => a.rowNumber - b.rowNumber);

  const headerIndex = rows.findIndex((row) => row.cells.some((cell) => String(cell || "").trim()));
  if (headerIndex === -1) throw new Error("No valid header row found. Please keep row 1 as the column header row.");
  const headers = (rows[headerIndex]?.cells || []).map((header) => String(header || "").trim());
  const headerEntries = buildHeaderEntries(headers);
  if (!headerEntries.length) throw new Error("No valid header columns found. Please check the XLSX header row.");
  const rawRows = rows
    .slice(headerIndex + 1)
    .map((row) => rowObjectFromHeaderEntries(headerEntries, row.cells))
    .filter((row) => Object.values(row).some((cell) => String(cell || "").trim()));

  logImportDebug(debug, "xlsx", {
    sheetName,
    parsedHeaders: headers,
    normalizedHeaders: headerEntries.map(({ header }) => [header, schemaFieldForHeader(header)]),
    firstRawRow: rawRows[0] || null,
    firstMappedRow: rawRows[0] ? mapRowToSchema(rawRows[0]) : null
  });

  return rawRows;
}

function normalizeRow(row, adminOwner) {
  const mappedRow = mapRowToSchema(row);

  return normalizeProperty(
    {
      ...mappedRow,
      owner: adminOwner,
      inventory_type: String(mappedRow.inventory_type || "").trim(),
      category: normalizePropertyCategory(mappedRow.inventory_type || mappedRow.category),
      property_type: normalizePropertyType(mappedRow.property_type),
      bedrooms: extractNumber(mappedRow.bedrooms) || mappedRow.bedrooms,
      featured: parseBoolean(mappedRow.featured)
    },
    mappedRow.id
  );
}

function validateRows(rows, existingProperties, adminOwner, updateExisting = false) {
  const existingById = new Map(existingProperties.map((property) => [property.id, normalizeProperty(property, property.id)]));
  const seenIds = new Set();

  return rows.map((row, index) => {
    const property = normalizeRow(row, adminOwner);
    const errors = [];

    requiredFields.forEach((field) => {
      if (!String(property[field] || "").trim()) errors.push(`${field} is required`);
    });

    if (!String(row.inventory_type || row.category || "").trim()) {
      errors.push("inventory_type is required");
    } else if (!categoryLabelToValue(row.inventory_type || row.category)) {
      errors.push("inventory_type must be exactly Ready, Off-plan, or Resale Off-Plan");
    }

    if (!validCategories.has(property.category)) errors.push("category must map to ready, off-plan, or resale-off-plan");
    if (!validTypes.has(property.property_type)) errors.push("property_type must be apartment, villa, townhouse, or penthouse");
    const existing = existingById.get(property.id);
    if (seenIds.has(property.id)) errors.push("duplicate id inside uploaded file");
    if (existing?.owner && existing.owner !== adminOwner) errors.push("duplicate id belongs to another admin");
    if (existing?.owner === adminOwner && !updateExisting) errors.push("duplicate id already exists");

    seenIds.add(property.id);

    return {
      rowNumber: index + 2,
      property,
      errors
    };
  });
}

async function parseUploadedFile(file, debug = false) {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".csv")) return parseCsv(buffer.toString("utf8"), debug);
  if (name.endsWith(".xlsx")) return parseXlsx(buffer, debug);

  throw new Error("Unsupported file type. Please upload CSV or XLSX.");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("format") === "xlsx") {
    return new NextResponse(makeXlsxTemplate(), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": 'attachment; filename="property-import-template.xlsx"'
      }
    });
  }

  const sample = [
    fields.join(","),
    [
      "sample-palm-2br",
      "2 Bedroom",
      "Palm Jumeirah",
      "Golden Mile",
      "Resale Off-Plan",
      "apartment",
      "2",
      "1800 sqft",
      "AED 4,100,000",
      "Partial Sea View",
      "Fully furnished",
      "Vacant",
      "Curated ready home with strong lifestyle appeal.",
      "Add any private notes here",
      "",
      "false",
      "",
      "ali"
    ]
      .map(csvEscape)
      .join(",")
  ].join("\n");

  return new NextResponse(`${sample}\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="property-import-template.csv"'
    }
  });
}

export async function POST(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "preview";
  const updateExisting = searchParams.get("updateExisting") === "true";
  const debug = searchParams.get("debug") === "1" || searchParams.get("debugImport") === "1";
  const existingProperties = await readProperties();

  if (mode === "commit") {
    try {
      const payload = await request.json();
      const validation = validateRows(payload.rows || [], existingProperties, adminOwner, updateExisting);
      const validRows = validation.filter((item) => !item.errors.length).map((item) => item.property);
      const nextProperties = [...existingProperties];
      let imported = 0;
      let updated = 0;

      validRows.forEach((property) => {
        const index = nextProperties.findIndex((item) => item.id === property.id && normalizeProperty(item, item.id).owner === adminOwner);
        if (index >= 0 && updateExisting) {
          nextProperties[index] = property;
          updated += 1;
        } else if (index === -1) {
          nextProperties.push(property);
          imported += 1;
        }
      });

      if (!validRows.length) {
        return NextResponse.json(
          {
            error: "There are no valid rows to import.",
            failed: validation.filter((item) => item.errors.length).length,
            errors: validation.filter((item) => item.errors.length)
          },
          { status: 400 }
        );
      }

      await writeProperties(nextProperties);
      const savedProperties = await readProperties();
      const savedCount = savedProperties.filter((property) => normalizeProperty(property, property.id).owner === adminOwner).length;

      revalidateInventoryPaths(adminOwner);

      return NextResponse.json({
        imported,
        updated,
        failed: validation.filter((item) => item.errors.length).length,
        errors: validation.filter((item) => item.errors.length),
        savedCount
      });
    } catch (error) {
      console.error("[property-import:commit]", error);
      return NextResponse.json(
        { error: error.message || "Import failed while saving properties." },
        { status: 500 }
      );
    }
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing upload file" }, { status: 400 });
    }

    const rows = await parseUploadedFile(file, debug);
    const validation = validateRows(rows, existingProperties, adminOwner, updateExisting);

    return NextResponse.json({
      fields,
      rows: validation,
      validRows: validation.filter((item) => !item.errors.length).map((item) => item.property),
      total: validation.length,
      valid: validation.filter((item) => !item.errors.length).length,
      failed: validation.filter((item) => item.errors.length).length
    });
  } catch (error) {
    console.error("[property-import:preview]", error);
    return NextResponse.json({ error: error.message || "Import preview failed." }, { status: 400 });
  }
}
