require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ Connection error:", err));


const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
});

const studentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  fullName: String,
  group: String
});

const partnerSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  companyName: String,
  inn: String
});



const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  timestamp: { type: Date, default: Date.now },
  status: String,
  distance: Number,
  locationName: String // Опционально: для адреса
});

const User = mongoose.model('User', userSchema, 'users');
const Student = mongoose.model('Student', studentSchema, 'students');
const Partner = mongoose.model('Partner', partnerSchema, 'partners');


app.get('/api/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email не указан" });

    const user = await User.findOne({ email: email.toLowerCase() });
    res.json({ exists: !!user }); // Вернет true, если юзер найден
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});




app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role, details } = req.body;
    const normalizedEmail = email.toLowerCase(); // Приводим к одному регистру один раз


    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: "Пользователь с таким email уже зарегистрирован" });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const newUser = new User({ 
        email: normalizedEmail, 
        password: hashedPassword, 
        role 
    });
    const savedUser = await newUser.save();


    if (role === 'student') {
      await Student.create({ userId: savedUser._id, ...details });
    } else if (role === 'partner') {
      await Partner.create({ userId: savedUser._id, ...details });
    }

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;


    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Пользователь с таким email не найден" });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Неверный пароль" });
    }


    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET, 
      { expiresIn: '24h' } 
    );

  
    let profileData = null;
    if (user.role === 'student') {
      profileData = await Student.findOne({ userId: user._id });
    } else if (user.role === 'partner') {
      profileData = await Partner.findOne({ userId: user._id });
    }


    res.json({
      message: "Вход успешно выполнен!",
      token: token, 
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      profile: profileData
    });

  } catch (error) {
    console.error("Ошибка при логине:", error);
    res.status(500).json({ error: "Ошибка сервера при входе" });
  }
});



app.get('/api/verify-token', async (req, res) => {
  try {

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Токен отсутствует" });
    }

  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

  
    res.json({
      valid: true,
      role: decoded.role,
      userId: decoded.userId
    });

  } catch (error) {

    res.status(403).json({ error: "Токен невалиден или просрочен" });
  }
});




const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendance');


app.post('/api/attendance/log', async (req, res) => {
  try {
    const { studentProfileId, distance, status } = req.body;
    const entry = new Attendance({
      studentId: studentProfileId,
      distance: Math.round(distance),
      status: 'pending' 
    });
    await entry.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Ошибка сохранения" });
  }
});


app.patch('/api/attendance/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    await Attendance.findByIdAndUpdate(id, { status });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Ошибка обновления статуса" });
  }
});


app.get('/api/attendance/all', async (req, res) => {
  try {
    const logs = await Attendance.find({})
      .populate('studentId') 
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Ошибка загрузки списка" });
  }
});


app.get('/api/admin/users', async (req, res) => {
    try {
        const { page = 1, limit = 5, role, search } = req.query;
        
        let query = {};


        if (role) {
            query.role = role; 
        }


        if (search) {
            query.email = { $regex: search, $options: 'i' };
        }

        const users = await User.find(query)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .sort({ _id: -1 }); 

        const total = await User.countDocuments(query);

        res.json({
            users,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            serverTime: new Date()
        });
    } catch (e) {
        console.error("Ошибка в эндпоинте пользователей:", e);
        res.status(500).send();
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Server running on: http://localhost:${PORT}`);
});