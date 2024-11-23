const express = require("express");
const mongoose = require("mongoose");
const redis = require("redis");
const dotenv = require("dotenv");

// Загрузка переменных окружения из .env файла
dotenv.config();

const app = express();
app.use(express.json());

// Подключение к MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is not defined in .env");
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connect to MongoDB successfully");
  } catch (error) {
    console.error("Connect failed: " + error.message);
  }
};
connectDB();

// Создание клиента Redis
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client
  .connect()
  .then(() => {
    console.log("Connected to Redis");
  })
  .catch((err) => console.error("Redis connection error:", err));

// Модель книги
const BookModel = require("./models/book.model");

// Функция для получения кэшированных данных или выполнения запроса
const getCachedData = async (key) => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, data) => {
      if (err) return reject(err);
      if (data) {
        return resolve(JSON.parse(data));
      }
      return resolve(null);
    });
  });
};

const cacheData = async (key, data) => {
  client.setex(key, 300, JSON.stringify(data)); // Кэшируем на 5 минут
};

// Пагинация и запрос книг
app.get("/api/v1/books", async (req, res) => {
  const {
    limit = 5,
    orderBy = "name",
    sortBy = "asc",
    keyword,
    page = 1,
  } = req.query;
  const skip = (page - 1) * +limit;

  const query = {};
  if (keyword) query.name = { $regex: keyword, $options: "i" }; // Фильтрация по имени

  const cacheKey = `books-${page}-${limit}-${orderBy}-${sortBy}-${keyword}`;

  try {
    // Пробуем получить данные из кэша
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData); // Возвращаем кэшированные данные
    }

    // Запрос в базу данных
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

    // Кэшируем полученные данные
    await cacheData(cacheKey, response);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      msg: "Ошибка при получении данных",
      error: error.message,
    });
  }
});

// Запрос книги по ID
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

// Добавление новой книги
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

// Обновление книги
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

// Удаление книги
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

// Настройка порта
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
