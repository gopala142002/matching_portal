// src/components/PaperReviewerTable/Pagination.jsx

import React from "react";

const Pagination = ({ totalRows, rowsPerPage, currentPage, setCurrentPage }) => {
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    return (
        <div style={{ marginTop: "15px" }}>
            <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Prev
            </button>

            <span style={{ margin: "0 10px" }}>
                Page {currentPage} of {totalPages}
            </span>

            <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;