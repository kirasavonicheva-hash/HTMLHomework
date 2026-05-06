from flask import Flask, render_template, request, redirect, url_for
import sqlite3
import os
app = Flask(__name__)
DATABASE = 'database.db'
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn
def init_db():
    if not os.path.exists(DATABASE):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location TEXT NOT NULL,
                cloud_type TEXT NOT NULL,
                date DATE NOT NULL,
                time TIME NOT NULL,
                description TEXT,
                observer_name TEXT NOT NULL,
                photo_url TEXT
            )
        ''')
        conn.commit()
        conn.close()
        print("База данных успешно создана!")
@app.route('/')
def index():
    cloud_filter = request.args.get('type', '')
    conn = get_db()
    cursor = conn.cursor()
    if cloud_filter and cloud_filter != 'all':
        cursor.execute('''
            SELECT * FROM observations 
            WHERE cloud_type = ? 
            ORDER BY date DESC, time DESC
        ''', (cloud_filter,))
    else:
        cursor.execute('SELECT * FROM observations ORDER BY date DESC, time DESC')
    observations = cursor.fetchall()
    conn.close()
    cloud_types = [
        ('undulatus', 'Волнистые'),
        ('figurative', 'Образные'),
        ('lenticularis', 'Линзовидные'),
        ('asperitas', 'Шероховатые'),
        ('arcus', 'Дуговые'),
        ('other', 'Другое')
    ]
    return render_template('index.html', 
                         observations=observations, 
                         cloud_types=cloud_types,
                         current_filter=cloud_filter)
@app.route('/add', methods=['GET', 'POST'])
def add():
    if request.method == 'POST':
        location = request.form.get('location', '').strip()
        cloud_type = request.form.get('cloud_type', '')
        date = request.form.get('date', '')
        time = request.form.get('time', '')
        description = request.form.get('description', '').strip()
        observer_name = request.form.get('observer_name', '').strip()
        photo_url = request.form.get('photo_url', '').strip()
        errors = []
        if not location:
            errors.append('Место наблюдения обязательно для заполнения')
        if not cloud_type:
            errors.append('Тип облака обязателен для выбора')
        if not date:
            errors.append('Дата обязательна для заполнения')
        if not time:
            errors.append('Время обязательно для заполнения')
        if not observer_name:
            errors.append('Имя наблюдателя обязательно для заполнения')
        if errors:
            cloud_types = [
                ('undulatus', 'Волнистые'),
                ('figurative', 'Образные'),
                ('lenticularis', 'Линзовидные'),
                ('asperitas', 'Шероховатые'),
                ('arcus', 'Дуговые'),
                ('other', 'Другое')
            ]
            return render_template('add.html', errors=errors, 
                                 form_data=request.form,
                                 cloud_types=cloud_types)
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO observations (location, cloud_type, date, time, 
                                    description, observer_name, photo_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (location, cloud_type, date, time, description, observer_name, photo_url))
        conn.commit()
        conn.close()
        return redirect(url_for('index'))
    cloud_types = [
        ('undulatus', 'Волнистые'),
        ('figurative', 'Образные'),
        ('lenticularis', 'Линзовидные'),
        ('asperitas', 'Шероховатые'),
        ('arcus', 'Дуговые'),
        ('other', 'Другое')
    ]
    return render_template('add.html', cloud_types=cloud_types, errors=None, form_data={})
if __name__ == '__main__':
    init_db() 
    app.run(debug=True, port=5000)