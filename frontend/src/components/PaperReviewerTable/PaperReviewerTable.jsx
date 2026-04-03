// src/components/PaperReviewerTable/PaperReviewerTable.jsx

import React, { useEffect, useState } from "react";
import { fetchTableData } from "../../services/api";
import TableRow from "./TableRow";
import Pagination from "./Pagination";

const PaperReviewerTable = () => {
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    useEffect(() => {
        fetchTableData().then(setData);
    }, []);

    const indexOfLast = currentPage * rowsPerPage;
    const indexOfFirst = indexOfLast - rowsPerPage;
    const currentRows = data.slice(indexOfFirst, indexOfLast);

    return (
        <div style={{ padding: "20px" }}>
            <h2>Paper - Reviewer Mapping</h2>

            {/* Rows per page selector */}
            <select
                value={rowsPerPage}
                onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                }}
            >
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
            </select>

            <table border="1" width="100%" style={{ marginTop: "10px" }}>
                <thead>
                    <tr>
                        <th>Paper ID</th>
                        <th>Researcher ID</th>
                    </tr>
                </thead>

                <tbody>
                    {currentRows.map((row, index) => (
                        <TableRow key={index} row={row} />
                    ))}
                </tbody>
            </table>

            <Pagination
                totalRows={data.length}
                rowsPerPage={rowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
        </div>
    );
};

export default PaperReviewerTable;