
// test/Users/UsersSupertest.test.js
import chai from "chai"
import mongoose from "mongoose"
import supertest from "supertest"
import dotenv from "dotenv"
import crypto from "crypto"

dotenv.config()

const expect = chai.expect

// ✅ Corregido el host
const requester = supertest("http://localhost:8080")

describe("Rutas de sesión de usuario (Register, Login, Profile)", function () {
  let user = {}
  let token = ""

  // ✅ Conexión a la base de datos antes de ejecutar las pruebas
  before(async () => {
    try {
      const mongoURL = process.env.MONGO_URL
      await mongoose.connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      console.log("DB is connected")
    } catch (e) {
      console.error("Error al conectarme a DB:", e)
    }
  })

  // ✅ Desconectar después de todas las pruebas
  after(async () => {
    await mongoose.disconnect()
  })

  it("Ruta: POST /api/auth/register - Debería registrar un usuario", async () => {
    const newUser = {
      first_name: "Martino",
      last_name: "Pereziano",
      email: `martiiiin${crypto.randomBytes(5).toString("hex")}@pepe.com`,
      password: "coder",
      age: 20,
    }

    const { statusCode, body } = await requester
      .post("/api/auth/register")
      .send(newUser)

    user = newUser // Guardamos el usuario para el login

    expect(statusCode).to.equal(201) // Usualmente 201 para creación exitosa
    expect(body).to.have.property("message", "User registered successfully")
  })

  it("Ruta: POST /api/auth/login - Debería autenticar al usuario y devolver un token", async () => {
    const { statusCode, body } = await requester
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password })

    expect(statusCode).to.equal(200)
    expect(body).to.have.property("token")

    token = body.token // Guardamos el token para la siguiente prueba
  })

  it("Ruta: GET /api/auth/profile - Debería devolver el perfil del usuario autenticado", async () => {
    const { statusCode, body } = await requester
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`) // Enviar el token como encabezado

    expect(statusCode).to.equal(200)
    expect(body).to.have.property("email", user.email)
    expect(body).to.have.property("first_name", user.first_name)
    expect(body).to.have.property("last_name", user.last_name)
  })
})
