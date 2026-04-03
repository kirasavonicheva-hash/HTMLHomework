import sqlite3
from flask import Flask, render_template, request, redirect, url_for
app = Flask(__name__)
def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT NOT NULL,
            cloud_type TEXT NOT NULL,
            observation_date TEXT NOT NULL,
            description TEXT,
            photographer TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
init_db()
def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row  
    return conn
@app.route('/')
def index():
    cloud_filter = request.args.get('type', '').strip()
    conn = get_db_connection()
    if cloud_filter:
        observations = conn.execute(
            'SELECT * FROM observations WHERE cloud_type = ? ORDER BY created_at DESC',
            (cloud_filter,)
        ).fetchall()
    else:
        observations = conn.execute(
            'SELECT * FROM observations ORDER BY created_at DESC'
        ).fetchall()
    conn.close()
    cloud_types = ['undulatus', 'mammatus', 'lenticularis', 'asperitas', 'arcus', 'other']
    return render_template('index.html', observations=observations, cloud_types=cloud_types, current_filter=cloud_filter)
@app.route('/add', methods=['GET', 'POST'])
def add_observation():
    error = None
    cloud_types = ['undulatus', 'mammatus', 'lenticularis', 'asperitas', 'arcus', 'other']
    if request.method == 'POST':
        location = request.form.get('location', '').strip()
        cloud_type = request.form.get('cloud_type', '').strip()
        observation_date = request.form.get('observation_date', '').strip()
        description = request.form.get('description', '').strip()
        photographer = request.form.get('photographer', '').strip()
        if not location:
            error = 'Место наблюдения обязательно для заполнения.'
        elif not cloud_type:
            error = 'Тип облака обязателен для выбора.'
        elif not observation_date:
            error = 'Дата наблюдения обязательна для заполнения.'
        elif not photographer:
            error = 'Имя наблюдателя обязательно для заполнения.'
        elif cloud_type not in cloud_types:
            error = 'Выбран некорректный тип облака.'
        if error is None:
            conn = get_db_connection()
            conn.execute('''
                INSERT INTO observations (location, cloud_type, observation_date, description, photographer)
                VALUES (?, ?, ?, ?, ?)
            ''', (location, cloud_type, observation_date, description, photographer))
            conn.commit()
            conn.close()
            return redirect(url_for('index'))
    return render_template('add.html', cloud_types=cloud_types, error=error)
if __name__ == '__main__':
    app.run(debug=True)
