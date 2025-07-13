const request = require("supertest");

// Import the actual server module
const app = require("./server");

describe("Authentication API Coverage Tests", () => {
  // Mock console.error to avoid cluttering test output
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
    // Access the users array through module internals
    if (serverModule.users) {
      serverModule.users.length = 0;
    }
  });

  describe("GET /", () => {
    it("should return API status", async () => {
      const response = await request(app).get("/");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Authentication API is running!");
    });
  });

  describe("POST /signup", () => {
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

      // Create first user
      await request(app).post("/signup").send(userData);

      // Try to create user with same username
      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Username already exists");
    });

    it("should reject username that is too short", async () => {
      const userData = {
        username: "ab",
        password: "Password123",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it("should reject username that is too long", async () => {
      const userData = {
        username: "a".repeat(21), // 21 characters
        password: "Password123",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject username with invalid characters", async () => {
      const userData = {
        username: "test@user!",
        password: "Password123",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject password that is too short", async () => {
      const userData = {
        username: "testuser",
        password: "12345",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject password without uppercase letter", async () => {
      const userData = {
        username: "testuser",
        password: "password123",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject password without lowercase letter", async () => {
      const userData = {
        username: "testuser",
        password: "PASSWORD123",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject password without number", async () => {
      const userData = {
        username: "testuser",
        password: "PasswordABC",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject empty username", async () => {
      const userData = {
        username: "",
        password: "Password123",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject missing username", async () => {
      const userData = {
        password: "Password123",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject missing password", async () => {
      const userData = {
        username: "testuser",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should handle server errors during signup", async () => {
      // Mock bcrypt.hash to throw an error
      const bcrypt = require("bcryptjs");
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockRejectedValue(new Error("Hashing failed"));

      const userData = {
        username: "testuser",
        password: "Password123",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Internal server error");

      // Restore original function
      bcrypt.hash = originalHash;
    });
  });

  describe("POST /login", () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post("/signup").send({
        username: "testuser",
        password: "Password123",
      });
    });

    it("should login with valid credentials", async () => {
      const response = await request(app).post("/login").send({
        username: "testuser",
        password: "Password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe("testuser");
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.createdAt).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it("should reject invalid username", async () => {
      const response = await request(app).post("/login").send({
        username: "wronguser",
        password: "Password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid username or password");
      expect(response.body.token).toBeUndefined();
    });

    it("should reject invalid password", async () => {
      const response = await request(app).post("/login").send({
        username: "testuser",
        password: "WrongPassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid username or password");
      expect(response.body.token).toBeUndefined();
    });

    it("should reject empty username", async () => {
      const response = await request(app).post("/login").send({
        username: "",
        password: "Password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject empty password", async () => {
      const response = await request(app).post("/login").send({
        username: "testuser",
        password: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject missing username", async () => {
      const response = await request(app).post("/login").send({
        password: "Password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject missing password", async () => {
      const response = await request(app).post("/login").send({
        username: "testuser",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should reject empty credentials", async () => {
      const response = await request(app).post("/login").send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should handle server errors during login", async () => {
      // Mock bcrypt.compare to throw an error
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

      // Restore original function
      bcrypt.compare = originalCompare;
    });
  });

  describe("GET /users", () => {
    it("should return empty array when no users exist", async () => {
      const response = await request(app).get("/users");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toEqual([]);
    });

    it("should return all users without passwords", async () => {
      // Create test users
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
      expect(response.body.users[0].id).toBeDefined();
      expect(response.body.users[1].id).toBeDefined();
      expect(response.body.users[0].createdAt).toBeDefined();
      expect(response.body.users[1].createdAt).toBeDefined();
    });
  });

  describe("Error handling", () => {
    it("should handle 404 for non-existent routes", async () => {
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

    it("should handle express errors with error middleware", async () => {
      // Create a route that will trigger the error middleware
      const express = require("express");
      const testApp = express();

      testApp.use(express.json());

      testApp.get("/test-error", (req, res, next) => {
        const err = new Error("Test error");
        next(err);
      });

      // Use the same error middleware as the main app
      testApp.use((err, req, res, next) => {
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
      });

      const response = await request(testApp).get("/test-error");
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Something went wrong!");
    });

    it("should handle express errors with error middleware using real app", async () => {
      // Mock the findUserByUsername to throw an error
      const originalModule = require("./server");

      // We need to create a scenario where the error middleware is triggered
      // Let's mock bcrypt.hash to throw a synchronous error
      const bcrypt = require("bcryptjs");
      const originalHash = bcrypt.hash;

      // Create a mock that throws synchronously
      bcrypt.hash = () => {
        throw new Error("Synchronous error");
      };

      const userData = {
        username: "errortest",
        password: "Password123",
      };

      const response = await request(app).post("/signup").send(userData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Something went wrong!");

      // Restore original function
      bcrypt.hash = originalHash;
    });
  });

  describe("JWT Token validation", () => {
    it("should generate a valid JWT token on login", async () => {
      // Create a user first
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

      // Verify token structure (JWT has 3 parts separated by dots)
      const tokenParts = response.body.token.split(".");
      expect(tokenParts).toHaveLength(3);

      // Decode token payload to verify content
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], "base64").toString()
      );
      expect(payload.userId).toBe(1);
      expect(payload.username).toBe("tokentest");
      expect(payload.exp).toBeDefined(); // expiration time
    });
  });
});
