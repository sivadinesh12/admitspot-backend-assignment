# Contact Management API

A RESTful API built using Node.js, Express, and SQLite for managing contacts with features such as user registration, email verification, authentication, contact creation, filtering, and updates.

## Table of Contents
- Project Setup
- Running the Server
- Database Schema (ER Diagram)
- API Documentation
- Database Setup and Migrations
- Additional Information

## Project Setup
### 1. Clone the repository:

``` bash
git clone https://github.com/yourusername/contact-management-api.git
```
### 2. Install dependencies:

``` bash
npm install express cors bcryptjs nodemailer moment-timezone jsonwebtoken sqlite sqlite3
npm install -g nodemon
```
### 3. Database Setup:

- The SQLite database will automatically be created as contact.db in the root folder during runtime.



## Running the Server:

``` bash
nodemon server.js
```
By Default the server will runt on HTTP://localhost:5000


## Databasr Schema (ER Diagram)
Below is the entity Relationship (ER) Diagram representing database schema 
``` bash
+-----------------+          +---------------+
|     user        |          |   contact     |
+-----------------+          +---------------+
| id (PK)         |--------->| userId (FK)   |
| email (unique)  |          | id (PK)       |
| password        |          | name          |
| isVerified      |          | email (unique)|
| verificationCode|          | phoneNumber   |
+-----------------+          | address       |
                             | timeZone      |
                             +---------------+
```
- user:
  - Stores information about registered users with columns for email, password, verification status, and verification code.

- contact:
  - Stores each user's contact data, including name, email, phone number, address, and timezone.


## API Documentation
### 1. Register User
- Endpoint: /register
- Method: POST
- Description: Registers a new user and sends a verification email.
- Body:
```bash
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 2. Verify Email
- Endpoint: /verify/:code
- Method: GET
- Description: Verifies the user’s email address.
- Parameters:
  - code - Verification code from email link.

### 3. Login User
- Endpoint: /login
- Method: POST
- Description: Logs in the user and returns a JWT token.
- Body:
``` bash
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 4. Create Contact
- Endpoint: /create-contact/:id
- Method: POST
- Description: Creates a new contact for the authenticated user.
- Body:
``` bash 
{
  "name": "John Doe",
  "phoneNumber": "1234567890",
  "address": "123 Elm Street"
}
```

### 5. Filter Contact
- Endpoint: /filter-contact/:filter
- Method: GET
- Description: Filters contacts by name, email, or timezone.
- Parameters:
  - filter - The filter criterion (name, email, or timezone).

### 6. Update Contact
- Endpoint: /update-contact/:id
- Method: PUT
- Description: Updates contact information for a specified contact.
- Body:
``` bash
{
  "name": "Jane Doe",
  "phoneNumber": "0987654321",
  "address": "456 Oak Street"
}
```
Note: You can import the API endpoints into Postman by creating a new collection and manually adding each endpoint or generating a Swagger specification.



## Database Setup and Migrations
SQLite doesn't have native migration tools, but this API will automatically initialize the required tables if they do not exist.

1. The database is created as contact.db.
2. Two tables, user and contact, are initialized when the API server runs for the first time.
3. Database tables are created on the server side using the initializeDatabase function in index.js.

## Additional Information
- Authentication: JWT tokens are used to protect routes. Add the JWT token in the Authorization header as Bearer <token>.
- Email Verification: The app uses Gmail’s SMTP server for sending emails. For Gmail, ensure you use App Passwords if 2FA is enabled.
- Timezone: The API automatically detects the user’s timezone when a contact is created.

