import React from "react";
import { Link } from "react-router-dom";


export default function NotFound() {
return (
<div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
<div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
<div className="text-2xl font-semibold">404 - Page Not Found</div>
<p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
<Link
to="/"
className="mt-4 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-white text-sm"
>
Go Home
</Link>
</div>
</div>
);
}