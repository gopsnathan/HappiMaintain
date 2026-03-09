import * as XLSX from "xlsx";
import { Expense } from "@/types";

export function exportExpensesToExcel(expenses: Expense[], filename = "expenses.xlsx") {
  const rows = expenses.map((e) => ({
    Title: e.title,
    Amount: e.amount,
    Category: e.category_name,
    "Created By": e.created_by_name,
    Date: new Date(e.date).toLocaleDateString(),
    Notes: e.notes,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  XLSX.writeFile(wb, filename);
}

export async function exportChartAsPng(elementId: string, filename = "chart.png") {
  const html2canvas = (await import("html2canvas")).default;
  const element = document.getElementById(elementId);
  if (!element) return;
  const canvas = await html2canvas(element);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
