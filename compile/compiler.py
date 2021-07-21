#!/usr/bin/env python3
import subprocess
import shutil
import sys
import os


docker_image = 'compiler'


def do_compile(target, source=None, extra=[]):
    if source is None:
        source = target

    envs = 'TI_ACTION_RECORD='

    print('Generating action record...')
    try:
        container = subprocess.check_output(['docker', 'create', '-a', 'STDOUT', '-a', 'STDERR',
                '-e', 'TI_ACTION_RECORD=/app/main.py.yml', '-e', 'TI_ARCH=cc',
                docker_image, 'python', 'main.py']).decode().strip()
        subprocess.check_call(['docker', 'cp', source, container + ':/app/main.py'])
        subprocess.check_call(['docker', 'cp', extra, container + ':/app/' + os.path.basename(extra)])
        try:
            output = subprocess.check_output(['docker', 'start', '-a', container], stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            print('Error while generating action record:')
            print(e.output)
            print('(END)')
            return e.output, 'failure'
        except subprocess.TimeoutExpired as e:
            print('Timeout while generating action record:')
            print(e.output)
            print('(END)')
            return e.output, 'timeout'

        print('The program output was:')
        print(output.decode())
        print('(END)')
        subprocess.check_call(['docker', 'cp', container + ':/app/main.py.yml', f'{source}.yml'])
    except Exception as e:
        raise e
    finally:
        subprocess.call(['docker', 'rm', container])

    print('Composing C file...')
    subprocess.check_call([sys.executable, '-m', 'taichi', 'cc_compose',
        '-e', f'{source}.yml', f'{source}.c', f'{source}.h'])

    with open(f'{source}.c', "r") as c_file:
        lines = c_file.readlines()
    with open(f'{source}.c', "w") as c_file:
        for line in lines:
            if "printf" not in line or "=" in line:
                c_file.write(line)

    print('Compiling via Emscripten...')
    subprocess.check_call(['emcc', '-O3', f'{source}.c', '-o', f'{target}.js', '-s', 'INITIAL_MEMORY=33554432'])

    with open(f'{target}.js') as f:
        s = f.read()
    # https://stackoverflow.com/questions/38769103/document-currentscript-is-null
    # AJAX loaded Javascript doesn't seems support document.currentScript.src,
    # which is being used in Emscripten generated JS stub.
    # So we do a quick hack to make AJAX happy:
    s = s.replace('compiled.wasm', 'app.wasm', 1)
    with open(f'{target}.js', 'w') as f:
        f.write(s)

    return output, 'success'


def start_compile():
    path = os.path.dirname(os.path.abspath(__file__))
    dst = os.path.join(path, 'compiled')

    script = f'/compiled.js'

    src = os.path.join(path, 'app/main.py')
    path = os.path.dirname(os.path.abspath(path))
    ext = os.path.join(path, 'static/hub.py')

    print('compiling', src, 'to', dst)
    output, status = do_compile(dst, src, ext)
    print('done with', src, 'to', dst)

    output = output.decode()
    ret = {'status': status, 'output': output}
    if status == 'success':
        ret['script'] = script
    return ret

if __name__ == '__main__':
    start_compile()
