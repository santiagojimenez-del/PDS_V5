import fs from "fs";
import path from "path";
import crypto from "crypto";

// Configuration
const API_URL = "http://localhost:3005"; // Adjust port if needed
const COOKIE = process.env.SESSION_COOKIE || "pds_session=YOUR_COOKIE_HERE"; // Pass cookie via env var or edit here if auto-login fails
const TEST_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const TEST_FILE_PATH = "./temp_test_file.bin";

async function main() {
    console.log("🚀 Starting Upload System Test...");

    // 1. Create a dummy large file
    console.log(`\n📦 Creating dummy file of ${(TEST_FILE_SIZE / 1024 / 1024).toFixed(2)} MB...`);
    const buffer = crypto.randomBytes(TEST_FILE_SIZE);
    fs.writeFileSync(TEST_FILE_PATH, buffer);
    const fileHash = crypto.createHash("md5").update(buffer).digest("hex");
    console.log(`   File created: ${TEST_FILE_PATH} (MD5: ${fileHash})`);

    try {
        // 2. Initiate Upload
        console.log("\n📡 Step 1: Initiating Upload...");
        const initRes = await fetch(`${API_URL}/api/upload/initiate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": COOKIE,
            },
            body: JSON.stringify({
                fileName: "test_upload_V5.bin",
                fileSize: TEST_FILE_SIZE,
                mimeType: "application/octet-stream",
                chunkSize: CHUNK_SIZE,
                metadata: {
                    test: "true",
                    project: "System Verify"
                }
            }),
        });

        if (!initRes.ok) throw new Error(`Init failed: ${initRes.status} ${await initRes.text()}`);
        const initData = await initRes.json();

        if (!initData.success) throw new Error(`Init API Error: ${JSON.stringify(initData)}`);

        const { uploadId, totalChunks } = initData.data;
        console.log(`   ✅ Upload Initiated! ID: ${uploadId} | Total Chunks: ${totalChunks}`);

        // 3. Upload Chunks
        console.log(`\n📤 Step 2: Uploading ${totalChunks} chunks...`);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, TEST_FILE_SIZE);
            const chunkBuffer = buffer.subarray(start, end);

            // Calculate chunk checksum
            const chunkHash = crypto.createHash("md5").update(chunkBuffer).digest("hex");

            const formData = new FormData();
            formData.append("uploadId", uploadId);
            formData.append("chunkIndex", i.toString());
            formData.append("checksum", chunkHash);

            // Create Blob/File for FormData
            const blob = new Blob([chunkBuffer]);
            formData.append("chunk", blob, "chunk.bin");

            process.stdout.write(`   Uploading chunk ${i + 1}/${totalChunks}... `);

            const chunkRes = await fetch(`${API_URL}/api/upload/chunk`, {
                method: "POST",
                headers: {
                    "Cookie": COOKIE,
                },
                body: formData,
            });

            if (!chunkRes.ok) {
                console.log("❌ Failed");
                throw new Error(`Chunk ${i} upload failed: ${await chunkRes.text()}`);
            }

            const chunkJson = await chunkRes.json();
            console.log(`✅ OK (Progress: ${chunkJson.data.progress.toFixed(1)}%)`);
        }

        // 4. Complete Upload
        console.log("\n💾 Step 3: Completing Upload...");
        const completeRes = await fetch(`${API_URL}/api/upload/complete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": COOKIE,
            },
            body: JSON.stringify({ uploadId }),
        });

        if (!completeRes.ok) throw new Error(`Complete failed: ${await completeRes.text()}`);
        const completeData = await completeRes.json();

        console.log("   ✅ Upload Completed Successfully!");
        console.log("   Response Data:", completeData.data);

        // 5. Verify file exists on server (Simulated check as we are local)
        // In a real remote test, we would rely on the API response.
        // Since we are running locally, we can check the file system.

        if (completeData.data.finalPath && fs.existsSync(completeData.data.finalPath)) {
            console.log(`\n✨ VERIFICATION PASSED: File exists at ${completeData.data.finalPath}`);
        } else {
            console.warn(`\n⚠️ WARNING: Could not verify file existence at ${completeData.data.finalPath}`);
        }

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
    } finally {
        // Cleanup local test file
        try {
            if (fs.existsSync(TEST_FILE_PATH)) fs.unlinkSync(TEST_FILE_PATH);
        } catch { }
        console.log("\n🧹 Cleanup done.");
    }
}

main();
