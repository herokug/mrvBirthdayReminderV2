import cron from "node-cron";
import { launch, executablePath } from 'puppeteer';
import cheerio from "cheerio";
import http from "http";
import dotenv from 'dotenv';

dotenv.config();

function extractMessage(html) {
    const $ = cheerio.load(html);
    return $('body').text().trim();
}

// Function to run the task
async function runTask() {
    try {
        // Launch Puppeteer browser
        const browser = await launch({
            args: [
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--single-process",
                "--no-zygote",
            ],
            executablePath:
                process.env.NODE_ENV === "production"
                    ? process.env.PUPPETEER_EXECUTABLE_PATH || executablePath()
                    : executablePath(),
        });

        const page = await browser.newPage();

        // Navigate to the page
        await page.goto('http://mrvdatabase.rf.gd/bdayreminder.php', { waitUntil: 'networkidle2', timeout: 30000 }); // Adjusted for network conditions

        // Get the content of the page
        const content = await page.content();
        const message = extractMessage(content);

        // Close the browser
        await browser.close();
        
        console.log('Script executed1:', message);

    } catch (error) {
        console.error('Error executing the script or logging status:', error);
    }
}

console.log('Scheduling cron...');
// Schedule the task to run at midnight every day
cron.schedule('40 1 * * *', async () => {
    await runTask();
}, {
    timezone: "Asia/Colombo" // Set the timezone to Sri Lanka
});

// Function to test if the task works
async function testTask() {
    console.log('Testing task...');
    await runTask();
}

// Test the task immediately
testTask();

// Create an HTTP server to serve the running status
const server = http.createServer((req, res) => {
    const runningStatus = cron.validate('0 0 * * *') ? 'true' : 'false';
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(runningStatus);
});

// Define the port to listen on
const PORT = process.env.PORT || 8000; // Use environment variable for port

// Listen on the defined port
server.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
    console.log('Ready to go');
});
