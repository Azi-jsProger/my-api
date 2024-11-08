const express = require("express");
const app = express();

require("dotenv").config();
app.use(express.json());

const connectDB = require("./connectMongo");
connectDB();

const BookModel = require("./models/book.model");

app.get("/api/v1/books", async (req, res) => {
  const { limit = 5, orderBy = "name", sortBy = "asc", keyword } = req.query;
  let page = +req.query?.page;

  if (!page || page <= 0) page = 1;
  const skip = (page - 1) * +limit;
  const query = {};

  if (keyword) query.name = { $regex: keyword, $options: "i" };

  try {
    // Запрос данных из MongoDB
    const data = await BookModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ [orderBy]: sortBy });
    const totalItems = await BookModel.countDocuments(query);

    const response = {
      msg: "Ok",
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      limit: +limit,
      currentPage: page,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      msg: "Ошибка при получении данных",
      error: error.message,
    });
  }
});

app.get("/api/v1/books/:id", async (req, res) => {
  try {
    const data = await BookModel.findById(req.params.id);

    if (data) {
      return res.status(200).json({
        msg: "Ok",
        data,
      });
    }

    return res.status(404).json({
      msg: "Книга не найдена",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Ошибка при получении книги",
      error: error.message,
    });
  }
});

app.post("/api/v1/books", async (req, res) => {
  try {
    const { name, author, price, description } = req.body;
    const book = new BookModel({
      name,
      author,
      price,
      description,
    });
    const data = await book.save();

    return res.status(200).json({
      msg: "Книга успешно добавлена",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Ошибка при добавлении книги",
      error: error.message,
    });
  }
});

app.put("/api/v1/books/:id", async (req, res) => {
  try {
    const { name, author, price, description } = req.body;
    const { id } = req.params;

    const data = await BookModel.findByIdAndUpdate(
      id,
      { name, author, price, description },
      { new: true }
    );

    return res.status(200).json({
      msg: "Книга успешно обновлена",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Ошибка при обновлении книги",
      error: error.message,
    });
  }
});

app.delete("/api/v1/books/:id", async (req, res) => {
  try {
    await BookModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      msg: "Книга успешно удалена",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Ошибка при удалении книги",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
