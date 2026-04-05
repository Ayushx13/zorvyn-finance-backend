// Serializes an array of transaction objects to a CSV string
const csvExport = (transactions) => {
    const headers = ["ID", "Amount", "Type", "Category", "Date", "Description", "Tags", "Created By", "Created At"];

    const rows = transactions.map((t) => [
        t._id,
        t.amount,
        t.type,
        t.category,
        t.date ? new Date(t.date).toISOString().split("T")[0] : "",
        `"${(t.description || "").replace(/"/g, '""')}"`,
        `"${(t.tags || []).join(", ")}"`,
        t.createdBy,
        t.createdAt ? new Date(t.createdAt).toISOString() : "",
    ]);

    const csv = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
    ].join("\n");

    return csv;
};

export default csvExport;
