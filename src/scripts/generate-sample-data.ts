import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

interface SampleDataConfig {
  sourceDir: string;
  outputDir: string;
  maxItems: number;
}

/**
 * Recursively find all JSON files in a directory
 */
function findJsonFiles(dir: string): string[] {
  const jsonFiles: string[] = [];

  const processDirectory = (currentDir: string) => {
    try {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip .git directory
          if (item !== ".git") {
            processDirectory(fullPath);
          }
        } else if (item.endsWith(".json")) {
          jsonFiles.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(
        `⚠️  Warning: Could not read directory ${currentDir}:`,
        error
      );
    }
  };

  processDirectory(dir);
  return jsonFiles;
}

/**
 * Extract sample data from JSON object
 */
function extractSampleData(data: unknown, maxItems: number): unknown {
  // Handle different data structures
  if (Array.isArray(data)) {
    // If it's an array, take the first N items
    return data.slice(0, maxItems);
  } else if (typeof data === "object" && data !== null) {
    // If it's an object, check if it has array properties
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(
      data as Record<string, unknown>
    )) {
      if (Array.isArray(value)) {
        // If the value is an array, take the first N items
        result[key] = value.slice(0, maxItems);
      } else if (typeof value === "object" && value !== null) {
        // If the value is an object, recursively process it
        result[key] = extractSampleData(value, maxItems);
      } else {
        // Keep primitive values as-is
        result[key] = value;
      }
    }

    return result;
  } else {
    // Return primitive values as-is
    return data;
  }
}

/**
 * Process a single JSON file
 */
function processJsonFile(
  filePath: string,
  sourceDir: string,
  outputDir: string,
  maxItems: number
): void {
  try {
    // Read the JSON file
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    // Extract sample data
    const sampleData = extractSampleData(data, maxItems);

    // Calculate relative path from source directory
    const relativePath = path.relative(sourceDir, filePath);
    const outputPath = path.join(outputDir, relativePath);

    // Create output directory if it doesn't exist
    const outputDirPath = path.dirname(outputPath);
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }

    // Write sample data to output file
    fs.writeFileSync(outputPath, JSON.stringify(sampleData, null, 2), "utf-8");
  } catch (error) {
    throw new Error(`Failed to process ${filePath}: ${error}`);
  }
}

/**
 * Main function to generate sample data
 */
function generateSampleData(config: SampleDataConfig): void {
  console.log("🚀 Starting sample data generation...");
  console.log(`📁 Source directory: ${config.sourceDir}`);
  console.log(`📁 Output directory: ${config.outputDir}`);
  console.log(`📊 Max items per file: ${config.maxItems}`);

  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
      console.log(`✅ Created output directory: ${config.outputDir}`);
    }

    // Find all JSON files recursively
    const jsonFiles = findJsonFiles(config.sourceDir);
    console.log(`📄 Found ${jsonFiles.length} JSON files to process`);

    // Process each JSON file
    let processedCount = 0;
    let errorCount = 0;

    for (const filePath of jsonFiles) {
      try {
        processJsonFile(
          filePath,
          config.sourceDir,
          config.outputDir,
          config.maxItems
        );
        processedCount++;
        console.log(
          `✅ Processed: ${path.relative(config.sourceDir, filePath)}`
        );
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${filePath}:`, error);
      }
    }

    console.log("\n🎉 Sample data generation completed!");
    console.log(`✅ Successfully processed: ${processedCount} files`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} files`);
    }
  } catch (error) {
    console.error("💥 Fatal error during sample data generation:", error);
    throw error;
  }
}

/**
 * Main execution function
 */
function main(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const config: SampleDataConfig = {
    sourceDir: path.resolve(__dirname, "../../../BitCraft_GameData"),
    outputDir: path.resolve(__dirname, "../../data/sample"),
    maxItems: 10,
  };

  generateSampleData(config);
}

// Run the script if it's executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { generateSampleData };
export type { SampleDataConfig };
