const dotenv = require('dotenv');
const mongoose = require(`mongoose`);
const fs = require(`fs`);
const Tour = require(`./../../models/tourModel`);
const Review = require(`./../../models/reviewModel`);
const User = require(`./../../models/userModel`);

const tours = fs.readFileSync(`${__dirname}/tours.json`, `utf-8`);
const users = fs.readFileSync(`${__dirname}/users.json`, `utf-8`);
const reviews = fs.readFileSync(`${__dirname}/reviews.json`, `utf-8`);

dotenv.config({ path: `./config.env` });

mongoose.connect(process.env.DATABASE);

const importData = async () => {
  try {
    await Tour.deleteMany();
    await Tour.create(JSON.parse(tours));
    await Review.deleteMany();
    await Review.create(JSON.parse(reviews));
    await User.deleteMany();
    await User.create(JSON.parse(users));
    console.log('Data has been created successfully');
    process.exit();
  } catch (error) {
    console.error(error);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await Review.deleteMany();
    console.log(`Data has been deleted successfully`);
    process.exit();
  } catch (error) {
    console.error(error);
  }
};

if (process.argv[2] === `--import`) {
  importData();
} else if (process.argv[2] === `--delete`) {
  deleteData();
}
console.log(process.argv);
