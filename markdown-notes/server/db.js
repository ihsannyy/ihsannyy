import { JSONFilePreset } from 'lowdb/node';

// Define the default structure for our database file
const defaultData = { notes: [] };

// Initialize db.json preset
const db = await JSONFilePreset('db.json', defaultData);

export default db;
