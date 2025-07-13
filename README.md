# FastAPI User Management API

A modern, robust FastAPI application for user management with comprehensive validation, testing, and documentation.

## 📋 Overview

This FastAPI application provides a simple user management system with username validation. It demonstrates best practices for:

- Input validation with Pydantic models
- RESTful API design
- Comprehensive testing with pytest
- Code coverage reporting
- Error handling and HTTP status codes

## 🚀 Features

- **User Registration**: Add users with validated usernames
- **User Listing**: Retrieve all registered users
- **Random User Selection**: Select and remove a random user
- **Input Validation**: Strict username validation rules
- **Comprehensive Testing**: 94% test coverage
- **Interactive Documentation**: Auto-generated Swagger UI

## 📊 Test Coverage Report

```
Name                 Stmts   Miss  Cover   Missing
--------------------------------------------------
main.py                 33      0   100%
models.py                5      5     0%   1-7
tests\test_main.py      49      0   100%
--------------------------------------------------
TOTAL                   87      5    94%
```

**Latest Test Results**: ✅ 8 passed, 0 failed

## 🛠️ API Endpoints

| Method | Endpoint        | Description                   | Status Codes  |
| ------ | --------------- | ----------------------------- | ------------- |
| `POST` | `/users`        | Add a new user                | 200, 400, 422 |
| `GET`  | `/users`        | Get all users                 | 200           |
| `POST` | `/users/random` | Select and delete random user | 200, 404      |

## 📝 Username Validation Rules

- Must not be empty
- Must start with an alphabetic character
- Must contain only alphanumeric characters (no special characters)
- Examples:
  - ✅ Valid: `Alice123`, `User1`, `TestUser`
  - ❌ Invalid: `1Alice`, `User_123`, ``, `Alice@123`

## 🏗️ Project Structure

```
fastapi-template/
├── main.py              # FastAPI application and endpoints
├── models.py            # Data models (currently unused)
├── tests/
│   └── test_main.py     # Comprehensive test suite
├── requirements.txt     # Production dependencies
├── dev-requirements.txt # Development dependencies
├── pyproject.toml       # Project configuration
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd fastapi-template
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   pip install -r dev-requirements.txt  # For development
   ```

### Running the Application

1. **Start the server**

   ```bash
   uvicorn main:app --reload
   ```

2. **Access the application**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

### Running Tests

1. **Run all tests**

   ```bash
   pytest
   ```

2. **Run with coverage**

   ```bash
   pytest --cov=. --cov-report=term-missing
   ```

3. **Generate HTML coverage report**

   ```bash
   pytest --cov=. --cov-report=html
   # Open htmlcov/index.html in your browser for detailed coverage report
   ```

4. **Run with verbose output**
   ```bash
   pytest -v
   ```

## 🔧 Development Setup (VS Code)

### Recommended Extensions

- [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
- [Python Debugger](https://marketplace.visualstudio.com/items?itemName=ms-python.debugpy)
- [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance)
- [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

### Recommended Settings

Enable these settings in VS Code (`Ctrl+,`):

- Python > Analysis > **Type Checking Mode**: `basic`
- Python > Analysis > Inlay Hints: **Function Return Types**: `enable`
- Python > Analysis > Inlay Hints: **Variable Types**: `enable`

### Dev Container Support

This project supports VS Code Dev Containers:

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Install [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. Open Command Palette (`Ctrl+Shift+P`) → "Dev Container: Reopen in Container"

## 📚 API Usage Examples

### Add a User

```bash
curl -X POST "http://localhost:8000/users" \
     -H "Content-Type: application/json" \
     -d '{"username": "Alice123"}'
```

Response:

```json
{
  "message": "User added",
  "username": "Alice123"
}
```

### Get All Users

```bash
curl -X GET "http://localhost:8000/users"
```

Response:

```json
{
  "users": ["Alice123", "Bob456"]
}
```

### Select Random User

```bash
curl -X POST "http://localhost:8000/users/random"
```

Response:

```json
{
  "selected_user": "Alice123"
}
```

## 🧪 Testing

The application includes comprehensive tests covering:

- ✅ Successful user creation
- ✅ Duplicate username handling
- ✅ Username validation (empty, invalid start, non-alphanumeric)
- ✅ User listing functionality
- ✅ Random user selection (with and without users)
- ✅ Error handling and status codes

### Test Isolation

Tests use pytest fixtures to ensure proper isolation between test runs, preventing state leakage.

## 🔍 Code Quality

- **Code Coverage**: 94% overall, 100% for main application logic
- **Style Guide**: Follows PEP 8 Python style guidelines
- **Type Hints**: Comprehensive type annotations
- **Error Handling**: Proper HTTP status codes and error messages

## 🐛 Known Issues

- `models.py` file is currently unused (0% coverage)
- Pydantic V1 style `@validator` decorator should be migrated to V2 `@field_validator`

## 📖 Further Reading

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [FastAPI Tutorial on VS Code](https://code.visualstudio.com/docs/python/tutorial-fastapi)
- [PEP 8 Style Guide](https://peps.python.org/pep-0008/)
- [pytest Documentation](https://docs.pytest.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
