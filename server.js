const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const rootDir = __dirname;
const database = new DatabaseSync(path.join(rootDir, "portfolio.db"));

database.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    description TEXT NOT NULL,
    detail TEXT NOT NULL,
    technologies TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'layers',
    accent TEXT NOT NULL DEFAULT 'blue',
	image_url TEXT NOT NULL DEFAULT '',
	project_url TEXT NOT NULL DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  )
`);

const projectColumns = database.prepare("PRAGMA table_info(projects)").all();
if (!projectColumns.some((column) => column.name === "image_url")) {
	database.exec("ALTER TABLE projects ADD COLUMN image_url TEXT NOT NULL DEFAULT ''");
}
if (!projectColumns.some((column) => column.name === "project_url")) {
	database.exec("ALTER TABLE projects ADD COLUMN project_url TEXT NOT NULL DEFAULT ''");
}

const projectCount = database.prepare("SELECT COUNT(*) AS count FROM projects").get().count;
if (projectCount === 0) {
	const insertProject = database.prepare(`
    INSERT INTO projects (slug, title, category, category_label, description, detail, technologies, icon, accent, featured, sort_order)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
	const projects = [
		[
			"iot-earthquake",
			"IoT Earthquake Early Warning System",
			"iot",
			"IoT & Mobile Integration",
			"An integrated seismic detection early-warning solution combining Arduino hardware sensors with a mobile interface built on MIT App Inventor for rapid alert distribution.",
			"A hardware-software early warning solution designed to detect seismic micro-vibrations in real time. Sensor readings are transmitted to a mobile application via Bluetooth or Wi-Fi to trigger instant audible alerts and notify local users.",
			["Arduino C++", "Piezo Vibration Sensor", "MIT App Inventor", "Bluetooth Serial Protocol"],
			"activity",
			"blue",
			"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
			"",
			1,
			1,
		],
		[
			"lynore-ops",
			"Lynore Brand & Supply Infrastructure",
			"biz",
			"E-Commerce & Logistics",
			"End-to-end brand identity establishment, wholesale procurement pipelines, and precision custom packaging operations for high-demand hair accessories.",
			"This operational case covers direct manufacturer sourcing, quality control workflows, custom branded packaging engineering, and sales fulfillment channel management for Lynore.",
			["Supply Chain Logistics", "Brand Identity", "Product Sourcing", "E-Commerce Retail"],
			"package",
			"purple",
			"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
			"",
			1,
			2,
		],
		[
			"backend-api",
			"Scalable Microservices REST API",
			"backend",
			"Back-End Architecture",
			"High-concurrency Node.js RESTful API suite deployed on AWS infrastructure, implementing secure authentication, database indexing, and rate limiting.",
			"A high-performance microservice framework built on Node.js and Express with JWT authentication, rate limiting middleware, structured logging, and AWS cloud deployment configuration.",
			["Node.js", "Express", "AWS EC2 / S3", "PostgreSQL / MongoDB", "JWT"],
			"database",
			"emerald",
			"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
			"",
			1,
			3,
		],
		[
			"ios-fleet",
			"iOS Fleet Management Companion",
			"iot",
			"Mobile & iOS",
			"Swift-based mobile application prototype designed for real-time tracking, route optimization, and operational status monitoring.",
			"A native iOS application for tracking real-time asset locations, monitoring task status, and providing streamlined communication channels between dispatchers and field personnel.",
			["Swift", "UIKit", "CoreLocation", "REST API Integration"],
			"shield-check",
			"amber",
			"https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
			"",
			1,
			4,
		],
	];
	for (const project of projects) {
		insertProject.run(project[0], project[1], project[2], project[3], project[4], project[5], JSON.stringify(project[6]), project[7], project[8], project[9], project[10], project[11], project[12]);
	}
}

const projectImages = {
	"iot-earthquake": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
	"lynore-ops": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
	"backend-api": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
	"ios-fleet": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
};
const updateProjectImage = database.prepare("UPDATE projects SET image_url = ? WHERE slug = ? AND (image_url = '' OR image_url IS NULL)");
for (const [slug, imageUrl] of Object.entries(projectImages)) {
	updateProjectImage.run(imageUrl, slug);
}

function getProjects() {
	return database
		.prepare("SELECT * FROM projects ORDER BY sort_order ASC")
		.all()
		.map((project) => ({
			...project,
			featured: Boolean(project.featured),
			technologies: JSON.parse(project.technologies),
		}));
}

function serveFile(response, fileName, contentType) {
	fs.readFile(path.join(rootDir, fileName), (error, content) => {
		if (error) {
			response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
			response.end("Not found");
			return;
		}
		response.writeHead(200, { "Content-Type": contentType });
		response.end(content);
	});
}

const server = http.createServer((request, response) => {
	const requestPath = new URL(request.url, "http://localhost").pathname;
	if (requestPath === "/api/projects") {
		response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
		response.end(JSON.stringify(getProjects()));
		return;
	}
	if (requestPath === "/" || requestPath === "/home.html") {
		serveFile(response, "home.html", "text/html; charset=utf-8");
		return;
	}
	if (requestPath === "/portfolio.html") {
		serveFile(response, "portfolio.html", "text/html; charset=utf-8");
		return;
	}
	if (requestPath === "/profile.jpeg") {
		serveFile(response, "profile.jpeg", "image/jpeg");
		return;
	}
	response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
	response.end("Not found");
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => {
	console.log(`Portfolio running at http://localhost:${port}`);
});
