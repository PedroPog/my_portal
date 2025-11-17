from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from models import db, User, Project, Score
from datetime import datetime
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'mude_isso_para_uma_chave_forte_aqui_123!'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)


# ==============================
# SEED DE JOGOS (só roda uma vez)
# ==============================
def seed_games():
    if Project.query.first():
        print("Jogos já existem no banco. Seed ignorado.")
        return

    if not os.path.exists('games.json'):
        print("games.json não encontrado. Pulando seed.")
        return

    try:
        with open('games.json', 'r', encoding='utf-8') as f:
            games = json.load(f)

        for game in games:
            new_game = Project(
                name=game['name'],
                description=game['description'],
                url=game['url'],
                code=game.get('code')  # pode não ter code
            )
            db.session.add(new_game)
        db.session.commit()
        print(f"{len(games)} jogos criados via seed!")
    except Exception as e:
        print(f"Erro no seed: {e}")


# ==============================
# CRIA BANCO + SUPER USER + SEED
# ==============================
with app.app_context():
    db.create_all()
    seed_games()

    if not User.query.filter_by(username='super').first():
        super_user = User(username='super', is_super=True)
        super_user.set_password('123456')
        db.session.add(super_user)
        db.session.commit()
        print("Usuário super criado: super / 123456")


# ==============================
# ROTAS BÁSICAS
# ==============================
@app.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['is_super'] = user.is_super
            return redirect(url_for('dashboard'))
        flash('Usuário ou senha incorretos')
    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']

        if User.query.filter_by(username=username).first():
            flash('Este usuário já existe!')
            return redirect(url_for('register'))

        new_user = User(username=username, is_super=False)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        flash('Cadastro realizado! Faça login.')
        return redirect(url_for('login'))
    return render_template('register.html')


@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    projects = Project.query.all()
    total_users = User.query.count()

    if session.get('is_super'):
        return render_template('admin.html', projects=projects, total_users=total_users)
    return render_template('dashboard.html', projects=projects)


# ==============================
# ADMIN: ADICIONAR PROJETO (com code opcional)
# ==============================
@app.route('/add_project', methods=['POST'])
def add_project():
    if not session.get('is_super'):
        return redirect(url_for('login'))

    name = request.form['name'].strip()
    description = request.form['description'].strip()
    url = request.form['url'].strip()
    code = request.form.get('code', '').strip() or None

    if not name or not description:
        flash('Nome e descrição são obrigatórios!')
        return redirect(url_for('dashboard'))

    # Validação: code único
    if code and Project.query.filter_by(code=code).first():
        flash(f'O código "{code}" já está em uso!')
        return redirect(url_for('dashboard'))

    new_project = Project(name=name, description=description, url=url, code=code)
    db.session.add(new_project)
    db.session.commit()
    flash('Projeto adicionado com sucesso!')
    return redirect(url_for('dashboard'))


@app.route('/delete_project/<int:project_id>')
def delete_project(project_id):
    if not session.get('is_super'):
        return redirect(url_for('login'))

    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    flash('Projeto excluído.')
    return redirect(url_for('dashboard'))


# ==============================
# JOGAR (aceita code OU id)
# ==============================
@app.route('/play/<identifier>')
def play_project(identifier):
    if 'user_id' not in session:
        return redirect(url_for('login'))

    project = None
    # Primeiro tenta pelo code
    if not identifier.isdigit():
        project = Project.query.filter_by(code=identifier).first()

    # Se não achou ou for número, tenta pelo ID
    if not project and identifier.isdigit():
        project = Project.query.get(int(identifier))

    if not project:
        flash('Jogo não encontrado!')
        return redirect(url_for('dashboard'))

    return render_template('game_fullscreen.html', project=project)


# ==============================
# ENVIAR PONTUAÇÃO (só se tiver code)
# ==============================
@app.route('/submit_score/<identifier>', methods=['POST'])
def submit_score(identifier):
    if 'user_id' not in session:
        return jsonify({'error': 'Não autorizado'}), 401

    project = None
    if not identifier.isdigit():
        project = Project.query.filter_by(code=identifier).first()
    if not project and identifier.isdigit():
        project = Project.query.get(int(identifier))

    if not project or not project.code:
        return jsonify({'error': 'Este jogo não tem ranking'}), 400

    data = request.get_json() or {}
    score = int(data.get('score', 0))

    new_score = Score(user_id=session['user_id'], project_id=project.id, score=score)
    db.session.add(new_score)
    db.session.commit()

    return jsonify({'status': 'ok', 'score': score})


# ==============================
# LEADERBOARD (só jogos com code)
# ==============================
@app.route('/leaderboard/<identifier>')
def leaderboard(identifier):
    if 'user_id' not in session:
        return redirect(url_for('login'))

    project = None
    if not identifier.isdigit():
        project = Project.query.filter_by(code=identifier).first()
    if not project and identifier.isdigit():
        project = Project.query.get(int(identifier))

    if not project or not project.code:
        flash('Este projeto não tem ranking.')
        return redirect(url_for('dashboard'))

    scores = Score.query.filter_by(project_id=project.id) \
                        .order_by(Score.score.desc()) \
                        .limit(15).all()

    return render_template('leaderboard.html', project=project, scores=scores)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 4200))
    app.run(host='0.0.0.0', port=port, debug=False)