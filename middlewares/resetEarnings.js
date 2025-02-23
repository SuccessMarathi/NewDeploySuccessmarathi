import cron from "node-cron";
import User from "../models/User.js";

// Daily cron job to reset earnings.today to 0
export const resetEarnings = () => {
    // Schedule the job to run at midnight every day
    cron.schedule("0 0 * * *", async () => {
      console.log("Running daily earnings reset...");
  
      try {
        const result = await User.updateMany({}, { $set: { "earnings.today": 0 } });
        console.log(`Successfully reset daily earnings for ${result.modifiedCount} users.`);
      } catch (error) {
        console.error("Error resetting daily earnings:", error);
      }
    });
  
    console.log("Daily earnings reset job scheduled to run at midnight.");
  };