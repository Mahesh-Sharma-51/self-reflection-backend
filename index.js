const express = require('express');
const cors = require('cors'); // Import CORS
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Use CORS middleware
app.use(cors());

// Use Body Parser
app.use(bodyParser.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'groot',
    database: 'self_reflection'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

// Registration Route
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.query(query, [email, hashedPassword], (err) => {
        if (err) return res.status(500).send('Error registering user');
        res.status(201).send('User registered!');
    });
});

// Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).send('Database error');
        if (results.length === 0) return res.status(401).send('Invalid email or password');

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).send('Invalid email or password');

        const token = jwt.sign({ id: user.id }, 'secretkey');
        res.json({ token });
    });
});

// Save Entries Route
app.post('/entries', (req, res) => {
    const { entries } = req.body;
    const userId = 1; // Assuming a static user for now; replace with actual user ID from JWT

    // Delete existing entries for the user
    const deleteQuery = 'DELETE FROM entries WHERE user_id = ?';
    db.query(deleteQuery, [userId], (deleteErr) => {
        if (deleteErr) return res.status(500).json({ message: 'Failed to delete old entries' });

        // Insert new entries
        const insertQuery = 'INSERT INTO entries (title, content, mood, date, user_id) VALUES ?';
        const values = entries.map(entry => [entry.title, entry.content, entry.mood, entry.date, userId]);

        db.query(insertQuery, [values], (insertErr) => {
            if (insertErr) return res.status(500).json({ message: 'Failed to save entries' });
            res.json({ message: 'Entries saved successfully' });
        });
    });
});

// Get All Entries Route
app.get('/entries', (req, res) => {
    const userId = 1; // Assuming a static user for now; replace with actual user ID from JWT

    const query = 'SELECT * FROM entries WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).send('Database error');
        res.json(results);
    });
});

// Search Entries Route
app.get('/entries/search', (req, res) => {
    const { keyword } = req.query;
    const userId = 1; // Assuming a static user for now; replace with actual user ID from JWT

    const query = 'SELECT * FROM entries WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)';
    const likeKeyword = `%${keyword}%`;
    db.query(query, [userId, likeKeyword, likeKeyword], (err, results) => {
        if (err) return res.status(500).send('Database error');
        res.json(results);
    });
});

// Filter Entries by Date Route
app.get('/entries/date', (req, res) => {
    const { date } = req.query;
    const userId = 1; // Assuming a static user for now; replace with actual user ID from JWT

    const query = 'SELECT * FROM entries WHERE user_id = ? AND date = ?';
    db.query(query, [userId, date], (err, results) => {
        if (err) return res.status(500).send('Database error');
        res.json(results);
    });
});

// Start the Server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
