const userModel = require("../models/userModel");
const bookModel = require("../models/bookModel");
const { isValid, checkISBN, checkDate } = require("../validation/validator");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

//===============================createBook========================================//

async function createBook(req, res) {
  try {
    const data = req.body;

    let requiredKeys = [
      "title",
      "excerpt",
      "userId",
      "ISBN",
      "category",
      "subcategory",
      "releasedAt",
    ];
    for (field of requiredKeys) {
      if (!data.hasOwnProperty(field)) {
        return res
          .status(400)
          .send({ status: false, message: `${field} is required` });
      }
    }

    const requiredFields = [
      "title",
      "excerpt",
      "userId",
      "ISBN",
      "category",
      "subcategory",
      "releasedAt",
    ];
    for (field of requiredFields) {
      if (!isValid(data[field])) {
        return res
          .status(400)
          .send({ status: false, message: `${field} is invalid` });
      }
    }

    const document = await bookModel.findOne({ title: data.title });
    if (document) {
      return res
        .status(400)
        .send({ status: false, message: "title is already exists" });
    }

    if (!checkISBN(data.ISBN)) {
      return res.status(400).send({ status: false, message: "invalid ISBN" });
    }

    const bookDocument = await bookModel.findOne({ ISBN: data.ISBN });
    if (bookDocument) {
      return res
        .status(400)
        .send({ status: false, message: "ISBN is already exists" });
    }

    if (!checkDate(data.releasedAt)) {
      return res
        .status(400)
        .send({ status: false, message: "Date format must be in YYYY-MM-DD" });
    }

    const savedData = await bookModel.create(data);
    return res
      .status(201)
      .send({ status: true, msg: "success", data: savedData });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
}
//===============================fetchbooks========================================//

let fetchbooks = async function (req, res) {
  try {
    let data = req.query;
    // if (Object.keys(data).length == 0) {
    //   return res
    //     .status(400)
    //     .send({ status: false, message: "required alteast one query" });
    // }

    const requiredFields = ["userId", "category", "subcategory"];
    for (key in data) {
      if (!requiredFields.includes(key)) {
        return res.status(400).send({
          status: false,
          message: `filters must be among ${requiredFields.join(", ")}`,
        });
      }
    }
    data.isDeleted = false;

    let getDocs = await bookModel.find(data).select({
      _id: 1,
      title: 1,
      excerpt: 1,
      userId: 1,
      category: 1,
      releasedAt: 1,
      reviews: 1,
    });
    getDocs.sort((a, b) =>
      a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    );
    if (getDocs.length == 0) {
      return res
        .status(404)
        .send({ status: false, message: "No documents founded" });
    }
    return res
      .status(200)
      .send({ status: true, msg: "Books list", data: getDocs });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

//===============================getBooks========================================//

const getBooks = async function (req, res) {
  try {
    let id = req.params.bookId;
    if (id === ":bookId") {
      return res
        .status(400)
        .send({ status: false, message: "bookId is required" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ status: false, message: "invalid bookId" });
    }

    let savedData = await bookModel.findOne({ _id: id }).lean();
    if (!savedData) {
      return res
        .status(404)
        .send({ status: false, message: "No documents founded" });
    }
    savedData.reviewsData = [];
    return res
      .status(200)
      .send({ status: true, msg: "Books list", data: savedData });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

//===============================updateBook========================================//

async function updateBook(req, res) {
  try {
    const Id = req.params.bookId;
    const data = req.body;
    if (Object.keys(data).length == 0) {
      return res.status(400).send({ status: false, message: "require data" });
    }
    const requiredFields = ["title", "excerpt", "releasedAt", "ISBN"];
    for (field of requiredFields) {
      if (data.hasOwnProperty(field)) {
        if (field === "releasedAt") {
          if (!checkDate(data.releasedAt)) {
            return res.status(400).send({
              status: false,
              message: "Date format must be in YYYY-MM-DD",
            });
          }
        }
        if (field === "ISBN") {
          if (!checkISBN(data.ISBN)) {
            return res
              .status(400)
              .send({ status: false, message: "invalid ISBN" });
          }
        }
        const emp = {};
        emp[field] = data[field];
        const document = await bookModel.findOne(emp);
        if (document) {
          return res
            .status(400)
            .send({ status: false, message: `${field} is already exists` });
        }
      }
    }
    const updateBook = await bookModel.findByIdAndUpdate(
      { _id: Id, isDeleted: false },
      data,
      {
        new: true,
      }
    );
    if (!updateBook) {
      return res
        .status(404)
        .send({ status: false, message: "No documents founded or deleted" });
    }
    return res
      .status(200)
      .send({ status: true, msg: "Books list", data: updateBook });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
}

//===========================deleteBook======================================//

const deleteBook = async function (req, res) {
  try {
    const Id = req.params.bookId;
    await bookModel.findByIdAndUpdate(
      { _id: Id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    return res
      .status(200)
      .send({ status: true, message: " deleted successfully" });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

module.exports = { createBook, fetchbooks, getBooks, updateBook, deleteBook };