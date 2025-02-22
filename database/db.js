// import mongoose from "mongoose";

// export const connectDb = async () => {
//   try {
//     const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/successMarathi";

//     await mongoose.connect(mongoUri); // No need for `useNewUrlParser` and `useUnifiedTopology`

//     console.log("Database Connected");
//   } catch (error) {
//     console.error("Database connection failed:", error.message);
//     process.exit(1); // Exit the process if the connection fails
//   }
// };


import mongoose from "mongoose";



export const connectDb = async () => {
  console.log("database call");
  try {
    
    await mongoose.connect("mongodb+srv://akashrathod782304:SuccessMarathi@successmarathi.us4cy.mongodb.net/successMarathi?retryWrites=true&w=majority&appName=successMarathi");
    console.log("Database Connected");
  } catch (error) {
    console.log("database call");
    console.log(error);
  }
};