export function cleanTrailingCommas(jsonString: string): string {
    // Remove trailing commas in objects and arrays
    return jsonString
        // Remove trailing commas in objects
        .replace(/,(\s*[}\]])/g, '$1')
        // Remove trailing commas in arrays
        .replace(/,(\s*])/g, '$1')
        // Remove trailing commas after property values
        .replace(/,(\s*})/g, '$1');
}

/**
 * Strips comments from a JSON string
 * @param jsonString - The JSON string that may contain comments
 * @returns JSON string with comments removed
 */
export function stripComments(jsonString: string): string {
    // Remove single line comments
    let stripped = jsonString.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments
    stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove trailing commas before closing braces/brackets
    stripped = stripped.replace(/,(\s*[}\]])/g, '$1');
    
    return stripped;
  }