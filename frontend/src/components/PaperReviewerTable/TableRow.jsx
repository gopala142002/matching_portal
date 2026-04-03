// src/components/PaperReviewerTable/TableRow.jsx

import React from "react";

const TableRow = ({ row }) => {
    return (
        <tr>
            <td>{row.paper_id}</td>
            <td>{row.researcher_id}</td>
        </tr>
    );
};

export default TableRow;