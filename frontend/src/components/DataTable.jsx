import React from "react";


export default function DataTable({ columns, rows, rowKey }) {
return (
<div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
<table className="min-w-full text-left text-sm">
<thead className="bg-gray-50 text-gray-600">
<tr>
{columns.map((c) => (
<th key={c.key} className="px-4 py-3 font-medium">
{c.header}
</th>
))}
</tr>
</thead>
<tbody>
{rows.map((r) => (
<tr key={r[rowKey]} className="border-t">
{columns.map((c) => (
<td key={c.key} className="px-4 py-3">
{c.render ? c.render(r) : r[c.key]}
</td>
))}
</tr>
))}
</tbody>
</table>
</div>
);
}