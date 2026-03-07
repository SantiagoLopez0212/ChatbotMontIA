module.exports = (req, res, next) => {
  if (!req.body.message) {
    return res.status(400).json({ error: "Mensaje no proporcionado" });
  }
  next();
};
