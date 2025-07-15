const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function migrate() {
  const db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE classrooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL
    );

    CREATE TABLE announcements (
        id TEXT PRIMARY KEY,
        message TEXT NOT NULL,
        starts_at DATETIME NOT NULL,
        ends_at DATETIME NOT NULL
    );

    CREATE TABLE class_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        course TEXT NOT NULL,
        classroom_id TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        days_of_week TEXT NOT NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id)
    );

    CREATE TABLE event_reservations (
        id TEXT PRIMARY KEY,
        event_name TEXT NOT NULL,
        classroom_id TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id)
    );
    
    CREATE TABLE recurring_reservations (
        id TEXT PRIMARY KEY,
        event_name TEXT NOT NULL,
        classroom_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        days_of_week TEXT NOT NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id)
    );
  `);

  console.log("Database schema migrated");
}

migrate();
