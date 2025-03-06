
import chai from "chai";
import mongoose from "mongoose";
import supertest from "supertest";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const expect = chai.expect;
const requester = supertest("http://localhost:8080");

describe("Rutas de Task (Crear, Obtener, Editar, Eliminar)", function () {
  let user = {};
  let token = "";
  let taskId = "";

  before(async () => {
    try {
      await mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("DB is connected");

      // ✅ Registramos y logueamos un usuario de prueba
      const newUser = {
        first_name: "Task",
        last_name: "Tester",
        email: `task${crypto.randomBytes(5).toString("hex")}@test.com`,
        password: "password",
        age: 25,
      };

      await requester.post("/api/auth/register").send(newUser);
      const loginResponse = await requester
        .post("/api/auth/login")
        .send({ email: newUser.email, password: newUser.password });

      expect(loginResponse.statusCode).to.equal(200);
      token = loginResponse.body.token;
      user = newUser;

    } catch (e) {
      console.error("Error al conectarme a DB:", e);
    }
  });

  after(async () => {
    await mongoose.disconnect();
  });

  it("Ruta: POST /api/tasks - Debería crear una tarea", async () => {
    const newTask = {
      title: "Tarea de prueba",
      category: "Trabajo",
      priority: "Alta",
    };

    const { statusCode, body } = await requester
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send(newTask);

    expect(statusCode).to.equal(201);
    expect(body).to.have.property("title", newTask.title);
    expect(body).to.have.property("category", newTask.category);
    expect(body).to.have.property("priority", newTask.priority);
    expect(body).to.have.property("completed", false);

    taskId = body._id; // Guardamos el taskId para siguientes pruebas
  });

  it("Ruta: GET /api/tasks/:taskId - Debería obtener una tarea por su ID", async () => {
    const { statusCode, body } = await requester
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(statusCode).to.equal(200);
    expect(body).to.have.property("_id", taskId);
    expect(body).to.have.property("title");
    expect(body).to.have.property("category");
  });

  it("Ruta: PUT /api/tasks/:taskId - Debería editar una tarea", async () => {
    const updatedTask = { completed: true };

    const { statusCode, body } = await requester
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedTask);

    expect(statusCode).to.equal(200);
    expect(body).to.have.property("completed", true);
  });

  it("Ruta: GET /api/tasks - Debería obtener las tareas del usuario autenticado", async () => {
    const { statusCode, body } = await requester
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(statusCode).to.equal(200);
    expect(body).to.be.an("array");
    expect(body.length).to.be.greaterThan(0);
  });

  it("Ruta: DELETE /api/tasks/:taskId - Debería eliminar una tarea", async () => {
    const { statusCode, body } = await requester
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(statusCode).to.equal(200);
    expect(body).to.have.property("message", "Tarea eliminada correctamente");
  });

  it("Ruta: GET /api/tasks/:taskId - Debería devolver 404 si la tarea no existe", async () => {
    const { statusCode, body } = await requester
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(statusCode).to.equal(404);
    expect(body).to.have.property("message", "Tarea no encontrada");
  });
});
