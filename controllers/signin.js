const jwt = require("jsonwebtoken");
const redis = require("redis");

// Setup Redis:
console.log("redis sessions:", process.env.REDIS_URI);
const redisClient = redis.createClient(process.env.REDIS_URI);

const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return Promise.reject("incorrect form submission");
  }

  return db
    .select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);

      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then(user => user[0])
          .catch(() => Promise.reject("unable to get user"));
      } else {
        Promise.reject("wrong credentials");
      }
    })
    .catch(() => Promise.reject("wrong credentials"));
};

const getAuthTokenId = (req, res) => {
  const { authorization } = req.headers;

  return redisClient.get(authorization, (err, reply) => {
    if (err || !reply) {
      return res.status(400).json("Unauthorized");
    }

    return res.json({ userId: reply });
  });
};

const signToken = email => {
  const jwtPayload = { email };

  return jwt.sign(jwtPayload, "JWT_SECRET", { expiresIn: "2 days" });
};

const setToken = (key, value) => Promise.resolve(redisClient.set(key, value));

const createSessions = user => {
  // JWT token, return user data
  const { id, email } = user;
  const token = signToken(email);

  return setToken(token, id)
    .then(() => ({ success: true, userId: id, token }))
    .catch(err => console.log(err));
};

const authentication = (db, bcrypt) => (req, res) => {
  const { authorization } = req.headers;

  return authorization
    ? getAuthTokenId(req, res)
    : handleSignin(db, bcrypt, req, res)
        .then(data =>
          data.id && data.email ? createSessions(data) : Promise.reject(data)
        )
        .then(session => res.json(session))
        .catch(err => res.status(400).json(err));
};

module.exports = {
  authentication,
  redisClient
};
