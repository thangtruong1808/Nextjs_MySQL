import mysql from "mysql2/promise";
import bcrypt from 'bcrypt';

// At the top of your route.ts file
const dbHost = process.env.DB_HOST?.trim();
const dbUser = process.env.DB_USER?.trim();
const dbPassword = process.env.DB_PASSWORD?.trim();
const dbName = process.env.DB_NAME?.trim();

// Function to hash a password
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Function to verify a password against a hash
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

const connection = await mysql.createConnection({
  host: dbHost,
  port: 3306,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  connectTimeout: 10000, // Increase connection timeout
  ssl: {
    rejectUnauthorized: true, // For Hostinger's SSL connection
  },
});

// Seed Roles table
async function seedRoles() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_name VARCHAR(255) NOT NULL,
      permissions JSON
    );
  `);

  const roles = [
    { role_name: 'Admin', permissions: '{"create_post": true, "edit_post": true, "delete_post": true, "manage_users": true}' },
    { role_name: 'Editor', permissions: '{"create_post": true, "edit_post": true, "delete_post": false, "manage_users": false}' },
    { role_name: 'User', permissions: '{"create_post": false, "edit_post": false, "delete_post": false, "manage_users": false}' },
  ];

  const insertedRoles = await Promise.all(
    roles.map(async (role) => {
      return connection.execute(
        `
        INSERT INTO roles (role_name, permissions)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
        [role.role_name, role.permissions]
      );
    })
  );

  return insertedRoles;
}

// Seed Users table
async function seedUsers() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    );
  `);

  const users = [
    { name: 'John Doe', email: 'johndoe@example.com', password: 'password123', role_id: 1 },
    { name: 'Jane Doe', email: 'janedoe@example.com', password: 'password123', role_id: 2 },
    { name: 'Admin User', email: 'admin@example.com', password: 'password123', role_id: 1 },
    { name: 'Alice Smith', email: 'alice@example.com', password: 'password123', role_id: 2 },
    { name: 'Bob Johnson', email: 'bob@example.com', password: 'password123', role_id: 3 },
    { name: 'Charlie Brown', email: 'charlie@example.com', password: 'password123', role_id: 3 },
    { name: 'David Williams', email: 'david@example.com', password: 'password123', role_id: 2 },
    { name: 'Eve Davis', email: 'eve@example.com', password: 'password123', role_id: 1 },
    { name: 'Frank Miller', email: 'frank@example.com', password: 'password123', role_id: 2 },
    { name: 'Grace Wilson', email: 'grace@example.com', password: 'password123', role_id: 1 },
  ];

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await hashPassword(user.password);
      return connection.execute(
        `
        INSERT INTO users (id, name, email, password, role_id)
        VALUES (UUID(), ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
        [user.name, user.email, hashedPassword, user.role_id]
      );
    })
  );

  return insertedUsers;
}

// Seed Posts table
async function seedPosts() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_published BOOLEAN DEFAULT TRUE
    );
  `);

  const posts = [
    { user_id: 'UUID-1', title: 'Post 1', content: 'Content of post 1', category_id: 1 },
    { user_id: 'UUID-2', title: 'Post 2', content: 'Content of post 2', category_id: 2 },
    { user_id: 'UUID-3', title: 'Post 3', content: 'Content of post 3', category_id: 3 },
    { user_id: 'UUID-4', title: 'Post 4', content: 'Content of post 4', category_id: 1 },
    { user_id: 'UUID-5', title: 'Post 5', content: 'Content of post 5', category_id: 2 },
    { user_id: 'UUID-6', title: 'Post 6', content: 'Content of post 6', category_id: 3 },
    { user_id: 'UUID-7', title: 'Post 7', content: 'Content of post 7', category_id: 1 },
    { user_id: 'UUID-8', title: 'Post 8', content: 'Content of post 8', category_id: 2 },
    { user_id: 'UUID-9', title: 'Post 9', content: 'Content of post 9', category_id: 3 },
    { user_id: 'UUID-10', title: 'Post 10', content: 'Content of post 10', category_id: 1 },
  ];

  const insertedPosts = await Promise.all(
    posts.map(async (post) => {
      return connection.execute(
        `
        INSERT INTO posts (id, user_id, title, content, category_id)
        VALUES (UUID(), ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
        [post.user_id, post.title, post.content, post.category_id]
      );
    })
  );

  return insertedPosts;
}

// Seed Categories table
async function seedCategories() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT
    );
  `);

  const categories = [
    { name: 'Technology', description: 'Posts about technology' },
    { name: 'Lifestyle', description: 'Posts about lifestyle' },
    { name: 'Business', description: 'Posts about business' },
    { name: 'Health', description: 'Posts about health' },
    { name: 'Travel', description: 'Posts about travel' },
    { name: 'Education', description: 'Posts about education' },
    { name: 'Food', description: 'Posts about food' },
    { name: 'Finance', description: 'Posts about finance' },
    { name: 'Sports', description: 'Posts about sports' },
    { name: 'Entertainment', description: 'Posts about entertainment' },
  ];

  const insertedCategories = await Promise.all(
    categories.map(async (category) => {
      return connection.execute(
        `
        INSERT INTO categories (name, description)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
        [category.name, category.description]
      );
    })
  );

  return insertedCategories;
}

// Seed Comments table
async function seedComments() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      post_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const comments = [
    { user_id: 'UUID-1', post_id: 'UUID-1', content: 'Great post!' },
    { user_id: 'UUID-2', post_id: 'UUID-2', content: 'Very informative!' },
    { user_id: 'UUID-3', post_id: 'UUID-3', content: 'I agree with this.' },
    { user_id: 'UUID-4', post_id: 'UUID-4', content: 'This is awesome!' },
    { user_id: 'UUID-5', post_id: 'UUID-5', content: 'I learned a lot, thanks!' },
    { user_id: 'UUID-6', post_id: 'UUID-6', content: 'Good read!' },
    { user_id: 'UUID-7', post_id: 'UUID-7', content: 'Interesting perspective!' },
    { user_id: 'UUID-8', post_id: 'UUID-8', content: 'Nice article!' },
    { user_id: 'UUID-9', post_id: 'UUID-9', content: 'Keep up the good work!' },
    { user_id: 'UUID-10', post_id: 'UUID-10', content: 'This was insightful!' },
  ];

  const insertedComments = await Promise.all(
    comments.map(async (comment) => {
      return connection.execute(
        `
        INSERT INTO comments (id, user_id, post_id, content)
        VALUES (UUID(), ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
        [comment.user_id, comment.post_id, comment.content]
      );
    })
  );

  return insertedComments;
}

// Seed Media table
async function seedMedia() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS media (
      id VARCHAR(36) PRIMARY KEY,
      post_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      media_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const media = [
    { post_id: 'UUID-1', user_id: 'UUID-1', media_url: 'https://example.com/media1.jpg' },
    { post_id: 'UUID-2', user_id: 'UUID-2', media_url: 'https://example.com/media2.jpg' },
    { post_id: 'UUID-3', user_id: 'UUID-3', media_url: 'https://example.com/media3.jpg' },
    { post_id: 'UUID-4', user_id: 'UUID-4', media_url: 'https://example.com/media4.jpg' },
    { post_id: 'UUID-5', user_id: 'UUID-5', media_url: 'https://example.com/media5.jpg' },
    { post_id: 'UUID-6', user_id: 'UUID-6', media_url: 'https://example.com/media6.jpg' },
    { post_id: 'UUID-7', user_id: 'UUID-7', media_url: 'https://example.com/media7.jpg' },
    { post_id: 'UUID-8', user_id: 'UUID-8', media_url: 'https://example.com/media8.jpg' },
    { post_id: 'UUID-9', user_id: 'UUID-9', media_url: 'https://example.com/media9.jpg' },
    { post_id: 'UUID-10', user_id: 'UUID-10', media_url: 'https://example.com/media10.jpg' },
  ];

  const insertedMedia = await Promise.all(
    media.map(async (mediaItem) => {
      return connection.execute(
        `
        INSERT INTO media (id, post_id, user_id, media_url)
        VALUES (UUID(), ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
        [mediaItem.post_id, mediaItem.user_id, mediaItem.media_url]
      );
    })
  );

  return insertedMedia;
}

// Seed Activity Log table
async function seedActivityLog() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      activity_type VARCHAR(255) NOT NULL,
      activity_description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const activities = [
    { user_id: 'UUID-1', activity_type: 'Post Created', activity_description: 'Created a new post.' },
    { user_id: 'UUID-2', activity_type: 'Post Edited', activity_description: 'Edited post 2.' },
    { user_id: 'UUID-3', activity_type: 'Comment Added', activity_description: 'Added a comment on post 3.' },
    { user_id: 'UUID-4', activity_type: 'Media Uploaded', activity_description: 'Uploaded an image to post 4.' },
    { user_id: 'UUID-5', activity_type: 'Post Deleted', activity_description: 'Deleted post 5.' },
    { user_id: 'UUID-6', activity_type: 'Post Liked', activity_description: 'Liked post 6.' },
    { user_id: 'UUID-7', activity_type: 'Permission Updated', activity_description: 'Updated permissions for user 7.' },
    { user_id: 'UUID-8', activity_type: 'Profile Updated', activity_description: 'Updated profile picture.' },
    { user_id: 'UUID-9', activity_type: 'Post Published', activity_description: 'Published post 9.' },
    { user_id: 'UUID-10', activity_type: 'Login', activity_description: 'User logged in.' },
  ];

  const insertedActivities = await Promise.all(
    activities.map(async (activity) => {
      return connection.execute(
        `
        INSERT INTO activity_log (id, user_id, activity_type, activity_description)
        VALUES (UUID(), ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
        [activity.user_id, activity.activity_type, activity.activity_description]
      );
    })
  );

  return insertedActivities;
}

// Seed Permissions table
async function seedPermissions() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_id INT NOT NULL,
      permission_name VARCHAR(255) NOT NULL,
      permission_value BOOLEAN NOT NULL
    );
  `);

  const permissions = [
    { role_id: 1, permission_name: 'create_post', permission_value: true },
    { role_id: 1, permission_name: 'edit_post', permission_value: true },
    { role_id: 1, permission_name: 'delete_post', permission_value: true },
    { role_id: 2, permission_name: 'create_post', permission_value: true },
    { role_id: 2, permission_name: 'edit_post', permission_value: true },
    { role_id: 2, permission_name: 'delete_post', permission_value: false },
    { role_id: 3, permission_name: 'create_post', permission_value: false },
    { role_id: 3, permission_name: 'edit_post', permission_value: false },
    { role_id: 3, permission_name: 'delete_post', permission_value: false },
  ];

  const insertedPermissions = await Promise.all(
    permissions.map(async (permission) => {
      return connection.execute(
        `
        INSERT INTO permissions (role_id, permission_name, permission_value)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
        [permission.role_id, permission.permission_name, permission.permission_value]
      );
    })
  );

  return insertedPermissions;
}

export async function GET() {
  try {
    // Call seed functions for each table
    await seedRoles();
    await seedUsers();
    await seedCategories();
    await seedPosts();
    await seedComments();
    await seedMedia();
    await seedActivityLog();
    await seedPermissions();

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Error seeding database:", error);
    return Response.json({ error }, { status: 500 });
  } finally {
    // Close the connection after all operations are done
    await connection.end();
  }
}
