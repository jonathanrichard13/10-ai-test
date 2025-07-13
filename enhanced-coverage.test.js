const request = require("supertest");
const app = require("./server");

// Add error test route to trigger error middleware
app.get("/test-error-middleware", (req, res, next) => {
  const error = new Error("Test error for middleware");
  next(error);
});

describe("Authentication API - 90% Coverage Tests", () => {
  // Mock console methods to avoid cluttering test output
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Clear users array before each test
  beforeEach(() => {
    // Access the users array from the server module
    const { users } = require("./server");
    users.length = 0;
  });

  describe("Health Check", () => {
    it("should return API status", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Authentication API is running!");
    });
  });

  describe("User Registration (POST /signup)", () => {
    it("should successfully register a new user", async () => {
      const response = await request(app).post("/signup").send({
        username: "testuser",
        password: "Password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User created successfully");
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe("testuser");
      expect(response.body.user.password).toBeUndefined();
    });

    it("should reject duplicate username", async () => {
      // First user
      await request(app).post("/signup").send({
        username: "testuser",
        password: "Password123",
      });

      // Duplicate user
      const response = await request(app).post("/signup").send({
        username: "testuser",
        password: "DifferentPass123",
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Username already exists");
    });

    it("should reject invalid username (too short)", async () => {
      const response = await request(app).post("/signup").send({
        username: "ab",
        password: "Password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject invalid username (too long)", async () => {
      const response = await request(app)
        .post("/signup")
        .send({
          username: "a".repeat(21),
          password: "Password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject invalid username (special characters)", async () => {
      const response = await request(app).post("/signup").send({
        username: "test@user",
        password: "Password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject weak password (too short)", async () => {
      const response = await request(app).post("/signup").send({
        username: "testuser",
        password: "Pass1",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject password without uppercase", async () => {
      const response = await request(app).post("/signup").send({
        username: "testuser",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject password without lowercase", async () => {
      const response = await request(app).post("/signup").send({
        username: "testuser",
        password: "PASSWORD123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject password without number", async () => {
      const response = await request(app).post("/signup").send({
        username: "testuser",
        password: "Password",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should handle bcrypt error during signup", async () => {
      const bcrypt = require("bcryptjs");
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockRejectedValue(new Error("Hash failed"));

      const response = await request(app).post("/signup").send({
        username: "testuser",
        password: "Password123",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");

      bcrypt.hash = originalHash;
    });
  });

  describe("User Login (POST /login)", () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app).post("/signup").send({
        username: "testuser",
        password: "Password123",
      });
    });

    it("should successfully login with valid credentials", async () => {
      const response = await request(app).post("/login").send({
        username: "testuser",
        password: "Password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe("string");
    });

    it("should reject login with invalid username", async () => {
      const response = await request(app).post("/login").send({
        username: "nonexistent",
        password: "Password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid username or password");
    });

    it("should reject login with invalid password", async () => {
      const response = await request(app).post("/login").send({
        username: "testuser",
        password: "WrongPassword123",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid username or password");
    });

    it("should validate username field", async () => {
      const response = await request(app).post("/login").send({
        password: "Password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should validate password field", async () => {
      const response = await request(app).post("/login").send({
        username: "testuser",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should handle bcrypt error during login", async () => {
      const bcrypt = require("bcryptjs");
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockRejectedValue(new Error("Compare failed"));

      const response = await request(app).post("/login").send({
        username: "testuser",
        password: "Password123",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");

      bcrypt.compare = originalCompare;
    });

    it("should handle JWT signing error", async () => {
      const jwt = require("jsonwebtoken");
      const originalSign = jwt.sign;
      jwt.sign = jest.fn().mockImplementation(() => {
        throw new Error("JWT signing failed");
      });

      const response = await request(app).post("/login").send({
        username: "testuser",
        password: "Password123",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");

      jwt.sign = originalSign;
    });
  });

  describe("Get Users (GET /users)", () => {
    it("should return empty array when no users exist", async () => {
      const response = await request(app).get("/users");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toEqual([]);
    });

    it("should return all users without passwords", async () => {
      await request(app).post("/signup").send({
        username: "user1",
        password: "Password123",
      });

      await request(app).post("/signup").send({
        username: "user2",
        password: "Password456",
      });

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

  describe("404 Error Handling", () => {
    it("should handle 404 for undefined routes", async () => {
      const response = await request(app).get("/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Route not found");
    });

    it("should handle 404 for POST to undefined route", async () => {
      const response = await request(app).post("/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Route not found");
    });

    it("should handle 404 for PUT request", async () => {
      const response = await request(app).put("/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Route not found");
    });

    it("should handle 404 for DELETE request", async () => {
      const response = await request(app).delete("/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Route not found");
    });
  });

  describe("Error Middleware", () => {
    // Test to cover server startup logging (lines 194-200)
    it("should cover server startup code", () => {
      // This test ensures the module can be required
      // The server startup code (lines 194-200) is only executed when run directly
      // but we can test the coverage by checking if module exports work
      const server = require("./server");
      expect(server).toBeDefined();
      expect(typeof server.listen).toBe("function");
    });
  });

  describe("JWT Token Validation", () => {
    it("should generate valid JWT token structure", async () => {
      await request(app).post("/signup").send({
        username: "tokentest",
        password: "Password123",
      });

      const response = await request(app).post("/login").send({
        username: "tokentest",
        password: "Password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();

      const tokenParts = response.body.token.split(".");
      expect(tokenParts).toHaveLength(3);

      const payload = JSON.parse(
        Buffer.from(tokenParts[1], "base64").toString()
      );
      expect(payload.userId).toBe(1);
      expect(payload.username).toBe("tokentest");
      expect(payload.exp).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty request body for signup", async () => {
      const response = await request(app).post("/signup").send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should handle empty request body for login", async () => {
      const response = await request(app).post("/login").send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should handle malformed JSON gracefully", async () => {
      const response = await request(app)
        .post("/signup")
        .send("invalid json")
        .set("Content-Type", "application/json");

      // Express will return 400 for malformed JSON or the endpoint will handle it
      expect([400, 500].includes(response.status)).toBe(true);
    });
  });
});
