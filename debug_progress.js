import { calculateGlobalProgress } from './src/services/pathwayService.js';
import dotenv from 'dotenv';
dotenv.config();
async function test() {
    const progress = await calculateGlobalProgress(47);
    console.log("Calculated progress:", progress);
}
test();
