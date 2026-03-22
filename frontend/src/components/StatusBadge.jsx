import React from "react";


export default function StatusBadge({ status }) {
const map = {
Submitted: "bg-gray-100 text-gray-800",
"Under Review": "bg-blue-100 text-blue-800",
Accepted: "bg-green-100 text-green-800",
Rejected: "bg-red-100 text-red-800",
Pending: "bg-gray-100 text-gray-800",
SubmittedReview: "bg-green-100 text-green-800",
};


return (
<span
className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
map[status] || "bg-gray-100 text-gray-800"
}`}
>
{status}
</span>
);
}