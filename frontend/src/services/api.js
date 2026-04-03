export const fetchTableData = async () => {
    const res = await fetch("http://localhost:8000/api/table/");
    return res.json();
};