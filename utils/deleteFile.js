const fs = require('fs');

module.exports = function (fileName) {
  file.unlink(`${__dirname}/public/img/tours/${fileName}`, (err) => {
    if (err) {
      console.error(`Fail to delete file on path: ${fileName}`);
    }
  });
};
