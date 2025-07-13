const request = require('supertest');

// Mock the users array to ensure clean state for tests
let users = [];

// Create a fresh app instance for testing
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const createTestApp = () => {
  const app = express();
  const JWT_SECRET = 'test-secret-key';

  app.use(express.json());

  // Test-specific utility functions
  const findUserByUsername = (username) => {
    return users.find(user => user.username === username);
  };

  // Validation middleware
  const signupValidation = [
    body('username')
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ];

  const loginValidation = [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ];

  // Routes
  app.get('/', (req, res) => {
    res.json({ message: 'Authentication API is running!' });
  });

  app.post('/signup', signupValidation, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      const existingUser = findUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = {
        id: users.length + 1,
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);

      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: userWithoutPassword
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  app.post('/login', loginValidation, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      const user = findUserByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  app.get('/users', (req, res) => {
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json({
      success: true,
      users: usersWithoutPasswords
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  });

  // Handle 404 routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });

  return app;
};

describe('Authentication API', () => {
  let app;
  
  beforeEach(() => {
    // Clear users array before each test
    users.length = 0;
    app = createTestApp();
  });

  describe('GET /', () => {
    it('should return API status', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Authentication API is running!');
    });
  });

  describe('POST /signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        username: 'testuser',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.id).toBe(1);
      expect(response.body.user.createdAt).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject duplicate username', async () => {
      const userData = {
        username: 'testuser',
        password: 'Password123'
      };

      // Create first user
      await request(app).post('/signup').send(userData);

      // Try to create user with same username
      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already exists');
    });

    it('should reject username that is too short', async () => {
      const userData = {
        username: 'ab',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should reject username that is too long', async () => {
      const userData = {
        username: 'a'.repeat(21), // 21 characters
        password: 'Password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject username with invalid characters', async () => {
      const userData = {
        username: 'test@user!',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject password that is too short', async () => {
      const userData = {
        username: 'testuser',
        password: '12345'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject password without uppercase letter', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject password without lowercase letter', async () => {
      const userData = {
        username: 'testuser',
        password: 'PASSWORD123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject password without number', async () => {
      const userData = {
        username: 'testuser',
        password: 'PasswordABC'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject empty username', async () => {
      const userData = {
        username: '',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject missing username', async () => {
      const userData = {
        password: 'Password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject missing password', async () => {
      const userData = {
        username: 'testuser'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/signup')
        .set('Content-Type', 'application/json')
        .send('{"username": "test"'); // Invalid JSON

      expect(response.status).toBe(400);
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/signup')
        .send({
          username: 'testuser',
          password: 'Password123'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'Password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.createdAt).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject invalid username', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'wronguser',
          password: 'Password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid username or password');
      expect(response.body.token).toBeUndefined();
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid username or password');
      expect(response.body.token).toBeUndefined();
    });

    it('should reject empty username', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: '',
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject empty password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject missing username', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject empty credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toEqual([]);
    });

    it('should return all users without passwords', async () => {
      // Create test users
      await request(app)
        .post('/signup')
        .send({ username: 'user1', password: 'Password123' });
      
      await request(app)
        .post('/signup')
        .send({ username: 'user2', password: 'Password456' });

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.users[0].username).toBe('user1');
      expect(response.body.users[1].username).toBe('user2');
      expect(response.body.users[0].password).toBeUndefined();
      expect(response.body.users[1].password).toBeUndefined();
      expect(response.body.users[0].id).toBeDefined();
      expect(response.body.users[1].id).toBeDefined();
      expect(response.body.users[0].createdAt).toBeDefined();
      expect(response.body.users[1].createdAt).toBeDefined();
    });

    it('should return users in correct order', async () => {
      // Create users in specific order
      await request(app)
        .post('/signup')
        .send({ username: 'firstuser', password: 'Password123' });
      
      await request(app)
        .post('/signup')
        .send({ username: 'seconduser', password: 'Password456' });

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body.users[0].username).toBe('firstuser');
      expect(response.body.users[1].username).toBe('seconduser');
      expect(response.body.users[0].id).toBe(1);
      expect(response.body.users[1].id).toBe(2);
    });
  });

  describe('Error handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });

    it('should handle 404 for POST to non-existent routes', async () => {
      const response = await request(app)
        .post('/nonexistent')
        .send({ test: 'data' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });

    it('should handle 404 for PUT to non-existent routes', async () => {
      const response = await request(app)
        .put('/nonexistent')
        .send({ test: 'data' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });

    it('should handle 404 for DELETE to non-existent routes', async () => {
      const response = await request(app).delete('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });
  });

  describe('Content-Type handling', () => {
    it('should handle requests without Content-Type header', async () => {
      const response = await request(app)
        .post('/signup')
        .send('username=test&password=Password123');

      // Should fail because it's not JSON
      expect(response.status).toBe(400);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/signup')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('JWT Token validation', () => {
    it('should generate a valid JWT token on login', async () => {
      // Create a user first
      await request(app)
        .post('/signup')
        .send({
          username: 'tokentest',
          password: 'Password123'
        });

      const response = await request(app)
        .post('/login')
        .send({
          username: 'tokentest',
          password: 'Password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      
      // Verify token structure (JWT has 3 parts separated by dots)
      const tokenParts = response.body.token.split('.');
      expect(tokenParts).toHaveLength(3);
      
      // Decode token payload to verify content
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      expect(payload.userId).toBe(1);
      expect(payload.username).toBe('tokentest');
      expect(payload.exp).toBeDefined(); // expiration time
    });
  });
});

  describe('GET /', () => {
    it('should return API status', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Authentication API is running!');
    });
  });

  describe('POST /signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        username: 'testuser',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject duplicate username', async () => {
      const userData = {
        username: 'testuser',
        password: 'Password123'
      };

      // Create first user
      await request(app).post('/signup').send(userData);

      // Try to create user with same username
      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already exists');
    });

    it('should reject invalid username', async () => {
      const userData = {
        username: 'ab', // Too short
        password: 'Password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const userData = {
        username: 'testuser',
        password: '123' // Too weak
      };

      const response = await request(app)
        .post('/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/signup')
        .send({
          username: 'testuser',
          password: 'Password123'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'Password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
    });

    it('should reject invalid username', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'wronguser',
          password: 'Password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid username or password');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid username or password');
    });

    it('should reject empty credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /users', () => {
    it('should return all users without passwords', async () => {
      // Create test users
      await request(app)
        .post('/signup')
        .send({ username: 'user1', password: 'Password123' });
      
      await request(app)
        .post('/signup')
        .send({ username: 'user2', password: 'Password456' });

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.users[0].password).toBeUndefined();
      expect(response.body.users[1].password).toBeUndefined();
    });
  });
});
