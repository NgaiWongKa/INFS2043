const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated() && req.user.type === 'staff') {
        return next(); // User is authenticated and is staff
    }
    return res.status(403).json({ message: "Access denied" }); // Forbidden
};

module.exports = isAuthenticated;