import bcrypt from 'bcrypt';


async function authenticateUser(email: string, password: string, connection: string) {
    // Get the user from the database
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    const user = users[0];
    if (!user) {
      return null; // User not found
    }
    
    // Verify the password
    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      return null; // Password doesn't match
    }
    
    return user; // Authentication successful
  }
  