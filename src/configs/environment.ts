import dotenv from "dotenv";
dotenv.config();

/**
 * Environment configuration for pbk
 */

// Flag to determine if the current user is Adarsh (for restricted operations)
export const isDeveloperAdarsh = process.env.DEVELOPER_NAME === 'adarsh';



