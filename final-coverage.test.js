const request = require("supertest");

// Import the actual server module
const app = require("./server");

describe("Authentication API - Comprehensive Coverage", () => {
  // Mock console methods to avoid cluttering test output
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  beforeEach(() => {
    // Clear users array from the actual server
    const serverModule = require("./server");
    if (serverModule.users) {
      serverModule.users.length = 0;
    }
  });

  describe("GET / - Health Check", () => {
    it("should return API status", async () => {
      const response = await request(app).get("/");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Authentication API is running!");
    });
  });

  describe("POST /signup - User Registration", () => {
    it("should create a new user with valid data", async () => {
      const userData = {
        username: "testuser",
        password: "Password123",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User created successfully");
      expect(response.body.user.username).toBe("testuser");
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.createdAt).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it("should reject duplicate username", async () => {
      const userData = {
        username: "testuser",
        password: "Password123",
      };

      await request(app).post("/signup").send(userData);
      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Username already exists");
    });

    it("should reject username that is too short", async () => {
      const response = await request(app)
        .post("/signup")
        .send({ username: "ab", password: "Password123" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("should reject username that is too long", async () => {
      const response = await request(app)
        .post("/signup")
        .send({ username: "a".repeat(21), password: "Password123" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject username with invalid characters", async () => {
      const response = await request(app)
        .post("/signup")
        .send({ username: "test@user!", password: "Password123" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject password that is too short", async () => {
      const response = await request(app)
        .post("/signup")
        .send({ username: "testuser", password: "12345" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject password without uppercase letter", async () => {
      const response = await request(app)
        .post("/signup")
        .send({ username: "testuser", password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject password without lowercase letter", async () => {
      const response = await request(app)
        .post("/signup")
        .send({ username: "testuser", password: "PASSWORD123" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject password without number", async () => {
      const response = await request(app)
        .post("/signup")
        .send({ username: "testuser", password: "PasswordABC" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject empty username", async () => {
      const response = await request(app)
        .post("/signup")
        .send({ username: "", password: "Password123" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject missing username", async () => {
      const response = await request(app)
        .post("/signup")
        .send({ password: "Password123" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject missing password", async () => {
      const response = await request(app)
        .post("/signup")
        .send({ username: "testuser" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should handle server errors during signup", async () => {
      const bcrypt = require("bcryptjs");
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockRejectedValue(new Error("Hashing failed"));

      const response = await request(app)
        .post("/signup")
        .send({ username: "testuser", password: "Password123" });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");

      bcrypt.hash = originalHash;
    });
  });

  describe("POST /login - User Authentication", () => {
    beforeEach(async () => {
      await request(app)
        .post("/signup")
        .send({ username: "testuser", password: "Password123" });
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/login")
        .send({ username: "testuser", password: "Password123" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe("testuser");
      expect(response.body.user.password).toBeUndefined();
    });

    it("should reject invalid username", async () => {
      const response = await request(app)
        .post("/login")
        .send({ username: "wronguser", password: "Password123" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid username or password");
    });

    it("should reject invalid password", async () => {
      const response = await request(app)
        .post("/login")
        .send({ username: "testuser", password: "WrongPassword" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid username or password");
    });

    it("should reject empty username", async () => {
      const response = await request(app)
        .post("/login")
        .send({ username: "", password: "Password123" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject empty password", async () => {
      const response = await request(app)
        .post("/login")
        .send({ username: "testuser", password: "" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject missing username", async () => {
      const response = await request(app)
        .post("/login")
        .send({ password: "Password123" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject missing password", async () => {
      const response = await request(app)
        .post("/login")
        .send({ username: "testuser" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject empty credentials", async () => {
      const response = await request(app).post("/login").send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should handle server errors during login", async () => {
      const bcrypt = require("bcryptjs");
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockRejectedValue(new Error("Compare failed"));

      const response = await request(app)
        .post("/login")
        .send({ username: "testuser", password: "Password123" });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");

      bcrypt.compare = originalCompare;
    });
  });

  describe("GET /users - User Listing", () => {
    it("should return empty array when no users exist", async () => {
      const response = await request(app).get("/users");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toEqual([]);
    });

    it("should return all users without passwords", async () => {
      await request(app)
        .post("/signup")
        .send({ username: "user1", password: "Password123" });

      await request(app)
        .post("/signup")
        .send({ username: "user2", password: "Password456" });

      const response = await request(app).get("/users");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.users[0].username).toBe("user1");
      expect(response.body.users[1].username).toBe("user2");
      expect(response.body.users[0].password).toBeUndefined();
      expect(response.body.users[1].password).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for GET non-existent routes", async () => {
      const response = await request(app).get("/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Route not found");
    });

    it("should handle 404 for POST to non-existent routes", async () => {
      const response = await request(app)
        .post("/nonexistent")
        .send({ test: "data" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Route not found");
    });

    it("should handle 404 for PUT to non-existent routes", async () => {
      const response = await request(app)
        .put("/nonexistent")
        .send({ test: "data" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Route not found");
    });

    it("should handle 404 for DELETE to non-existent routes", async () => {
      const response = await request(app).delete("/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Route not found");
    });
  });

  describe("JWT Token Validation", () => {
    it("should generate a valid JWT token on login", async () => {
      await request(app)
        .post("/signup")
        .send({ username: "tokentest", password: "Password123" });

      const response = await request(app)
        .post("/login")
        .send({ username: "tokentest", password: "Password123" });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();

      // Verify token structure (JWT has 3 parts separated by dots)
      const tokenParts = response.body.token.split(".");
      expect(tokenParts).toHaveLength(3);

      // Decode token payload to verify content
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], "base64").toString()
      );
      expect(payload.userId).toBe(1);
      expect(payload.username).toBe("tokentest");
      expect(payload.exp).toBeDefined();
    });
  });
});
