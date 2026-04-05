// Builds a MongoDB filter object from query params for transactions
const buildFilter = (query = {}) => {
    const filter = {};

    // Filter by type (income / expense)
    if (query.type) {
        filter.type = query.type.toLowerCase();
    }

    // Filter by category
    if (query.category) {
        filter.category = query.category.toLowerCase();
    }

    // Date range filter
    if (query.startDate || query.endDate) {
        filter.date = {};
        if (query.startDate) filter.date.$gte = new Date(query.startDate);
        if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }

    // Full-text search on description and tags (case-insensitive regex)
    if (query.search) {
        const regex = new RegExp(query.search, "i");
        filter.$or = [
            { description: regex },
            { tags: regex },
        ];
    }

    // Filter by tags (comma-separated)
    if (query.tags) {
        const tagsArray = query.tags.split(",").map((t) => t.trim().toLowerCase());
        filter.tags = { $all: tagsArray };
    }

    return filter;
};

export default buildFilter;
