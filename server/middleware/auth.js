const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Formato de token inválido.' });
  }

  try {
    const decoded = jwt.verify(token, 'wg_secret_key_2024');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = auth;
