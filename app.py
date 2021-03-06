from flask import Flask
from flask import render_template, send_from_directory
import os
app = Flask(__name__)
app.config["CACHE_TYPE"] = "null"

@app.route('/')
def mass_spring():
    return render_template('/index.html')

@app.route('/taichi.js')
def taichi_js():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'taichi.js')

@app.route('/mass_spring.js')
def ms_js():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'mass_spring.js')

@app.route('/create_robot.js')
def robot():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'create_robot.js')

@app.route('/chart.js')
def creat_chart():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'chart.js')

@app.route('/compiled.js')
def compiled():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'compiled.js', cache_timeout=0)

@app.route('/app.wasm')
def wasm():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'app.wasm', cache_timeout=0)