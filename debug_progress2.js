import dotenv from 'dotenv';
dotenv.config();
const { calculateGlobalProgress } = await import('./src/services/pathwayService.js');

async function test() {
    const progress = await calculateGlobalProgress(47);
    console.log("Calculated progress:", progress);
}
test();
