const mongoose = require("mongoose");

module.exports = async () => {
  const mongoUri =
    "mongodb+srv://jackshukla786:NXQp59j5qb94dDgd@cluster0.6mre1yr.mongodb.net/?retryWrites=true&w=majority";
  try {
    mongoose.connect(
      mongoUri,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      () => {
        console.log("mongodb connected ");
      }
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
