import fs from "fs"
import path from "path"
import { clientRootDirPath } from "../utils/path.js"
import { cleanTrailingCommas } from "../utils/jsonFile.js"

/**
 * Fixes JSON files by adding double quotes to keys and removing trailing commas
 * @param filePath - Optional custom path to the JSON file to fix
 */
export async function fixConfigFile(filePath?: string): Promise<void> {
  // Default to nbk.config.json if no path is provided
  const configPath = filePath
    ? path.resolve(filePath)
    : path.join(clientRootDirPath, "nbk.config.json")

  // Check if the JSON file exists
  if (!fs.existsSync(configPath)) {
    console.error(`File not found: ${configPath}`)
    return
  }

  try {
    // Read the config file
    const configContent = fs.readFileSync(configPath, "utf8")

    // Fix unquoted keys and trailing commas
    const fixedContent = fixJsonString(configContent)

    // Write the fixed content back to the file
    fs.writeFileSync(configPath, fixedContent)

    // Verify the fixed JSON is valid
    try {
      JSON.parse(fixedContent)
      console.log(`Successfully fixed: ${configPath}`)
    } catch (parseError) {
      console.warn(
        `Warning: The fixed JSON might still have issues. Manual review recommended.`
      )
      console.log(`Applied automatic fixes to: ${configPath}`)
    }
  } catch (error) {
    console.error(`Failed to fix ${configPath}:`, error)
  }
}

/**
 * Comprehensive fixing of JSON string issues
 * @param jsonString - The potentially malformed JSON string
 * @returns Fixed JSON string
 */
function fixJsonString(jsonString: string): string {
  // Step 1: Strip comments (using existing utility)
  let fixedJson = jsonString

  // Step 2: Add double quotes to unquoted keys
  // This regex handles various cases of unquoted keys
  fixedJson = fixedJson.replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3')

  // Step 3: Fix single-quoted keys to double-quoted keys
  fixedJson = fixedJson.replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3')

  // Step 4: Remove trailing commas
  fixedJson = cleanTrailingCommas(fixedJson)

  // Step 5: Add missing commas between properties
  fixedJson = fixedJson.replace(
    /("[^"]+"\s*:\s*[^,{[\s][^,{[}]*[^,\s])\s*("[^"]+"\s*:)/g,
    "$1,$2"
  )

  // Step 6: Ensure properly formatted JSON
  fixedJson = formatJson(fixedJson)

  return fixedJson
}

/**
 * Attempts to format the JSON string with proper indentation
 * @param jsonString - The JSON string to format
 * @returns Formatted JSON string
 */
function formatJson(jsonString: string): string {
  try {
    // Try to parse and format the JSON
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    // If parsing fails, return the original string with basic fixes
    return jsonString
  }
}
