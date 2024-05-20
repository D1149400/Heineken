var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sqlite3 = require('sqlite3').verbose(); // 引入sqlite3模組

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 修改部分開始
var db = new sqlite3.Database(path.join(__dirname, 'db', 'sqlite.db'), (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.'); // 成功打開資料庫時輸出訊息
        db.run(`CREATE TABLE IF NOT EXISTS HeiPrice (
          Date TEXT,
          Open REAL,
          High REAL,
          Low REAL,
          Close REAL,
          Adj_Close REAL,
          Volume INTEGER,
          Product TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating HeiPrice table:', err.message);
            } else {
                console.log('HeiPrice table created successfully.'); // 表創建成功時輸出訊息
            }
        });
    }
});

app.use((req, res, next) => {
    req.db = db; // 將資料庫對象添加到Express的請求對象中
    next();
});
// 修改部分結束

app.use('/', indexRouter);
app.use('/users', usersRouter);

// 新增 /api/price 路由
app.get('/api/price', (req, res, next) => {
    const db = req.db;
    db.all('SELECT * FROM HeiPrice ORDER BY Date', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ prices: rows });
    });
});

// 新增 get/api 路由，用於查詢特定日期的所有數據
app.get('/api', (req, res, next) => {
    const db = req.db;
    const date = req.query.Date; // 從查詢參數中獲取日期

    if (!date) {
        res.status(400).json({ error: "Date query parameter is required" });
        return;
    }

    db.all('SELECT * FROM HeiPrice WHERE Date = ?', [date], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// 新增 post/api 路由，用於查詢特定日期的所有數據
app.post('/api', (req, res, next) => {
    const db = req.db;
    const date = req.body.Date; // 從查詢參數中獲取日期

    if (!date) {
        res.status(400).json({ error: "Date query parameter is required" });
        return;
    }

    db.all('SELECT * FROM HeiPrice WHERE Date = ?', [date], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// // 新增 /api/insert 路由，用於插入新的海尼根價格資料 (只有 Date 和 Open 是必填項)
// app.post('/api/insert', (req, res, next) => {
//     const db = req.db;
//     const { date, open } = req.body; // 從查詢參數中獲取日期和開盤價
//
//     if (!date || !open) {
//         res.status(400).json({ error: "Date and Open query parameters are required" });
//         return;
//     }
//
//     db.run(
//         'INSERT INTO HeiPrice (Date, Open) VALUES (?, ?)',
//         [date, open],
//         function(err) {
//             if (err) {
//                 res.status(500).json({ error: err.message });
//                 return;
//             }
//             res.send({ message: "Record inserted successfully", id: this.lastID });
//         }
//     );
// });

// // 新增 /api/delete 路由，用於刪除特定日期和開盤價的數據
// app.get('/api/delete', (req, res, next) => {
//     const db = req.db;
//     const date = req.query.Date; // 從查詢參數中獲取日期
//     const open = req.query.Open; // 從查詢參數中獲取開盤價
//
//     if (!date || !open) {
//         res.status(400).json({ error: "Date and Open query parameters are required" });
//         return;
//     }
//
//     db.run('DELETE FROM HeiPrice WHERE Date = ? AND Open = ?', [date, open], function(err) {
//         if (err) {
//             res.status(500).json({ error: err.message });
//             return;
//         }
//         res.json({ message: "Record deleted successfully", changes: this.changes });
//     });
// });

// 新增 /api/query 路由，用於查詢特定日期的數據，使用 POST 請求
app.post('/api/query', (req, res, next) => {
    const db = req.db;
    const date = req.body.Date; // 從請求正文中獲取日期

    if (!date) {
        res.status(400).json({ error: "Date query parameter is required" });
        return;
    }

    db.all('SELECT * FROM HeiPrice WHERE Date = ?', [date], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;

//撰寫 get /api/insert 路由，使用 SQLite 新增一筆HeiPrice資料 (Date, Open, High, Low, Close, Adj_Close, Volume, Product )，用 send 回傳 ID