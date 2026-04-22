import * as XLSX from "xlsx";

export interface ItemRow {
  name: string;
  description: string;
  price: number;
  stock_quota: number | null;
}

export interface OrderExportRow {
  No: number;
  Nama: string;
  "No WA": string;
  Alamat: string;
  Items: string;
  Total: string;
  Status: string;
  Waktu: string;
  "No Antrian": number;
}

export function generateItemTemplate(): Blob {
  const wb = XLSX.utils.book_new();
  const data = [
    ["name", "description", "price", "stock_quota"],
    ["Contoh Produk", "Deskripsi produk", 50000, 100],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Items");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function parseItemsXlsx(buffer: ArrayBuffer): ItemRow[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  return rows
    .filter((r) => r.name)
    .map((r) => ({
      name: String(r.name || ""),
      description: String(r.description || ""),
      price: Number(r.price) || 0,
      stock_quota: r.stock_quota != null ? Number(r.stock_quota) : null,
    }));
}

export function exportOrdersXlsx(orders: OrderExportRow[]): Blob {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(orders);
  XLSX.utils.book_append_sheet(wb, ws, "Pesanan");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
